"use server";

import { db } from "@/db";
import { users, eventTypes, bookings, availabilityRules, availabilityBreaks, auditLogs } from "@/db/schema";
import { eq, and, gt, gte, lt, desc } from "drizzle-orm";

// 1. Fetch Event and User details for the public page
export async function getPublicEventDetails(username: string, eventSlug: string) {
  // Get User
  const userList = await db
    .select({ id: users.id, name: users.firstName, username: users.username })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (userList.length === 0) return null;
  const user = userList[0];

  // Get Event
  const eventList = await db
    .select()
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.userId, user.id),
        eq(eventTypes.slug, eventSlug),
        eq(eventTypes.isActive, true)
      )
    )
    .limit(1);

  if (eventList.length === 0) return null;
  
  return {
    user,
    event: eventList[0]
  };
}

// 2. Calculate available slots for a specific date
export async function getAvailableSlots(userId: string, eventTypeId: string, dateStr: string) {
  // dateStr format: YYYY-MM-DD
  const date = new Date(dateStr);
  const dayOfWeekIndex = date.getDay(); // 0 (Sun) to 6 (Sat)
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const dayOfWeek = days[dayOfWeekIndex];

  // Fetch event details to get duration
  const eventList = await db.select({ duration: eventTypes.durationMinutes }).from(eventTypes).where(eq(eventTypes.id, eventTypeId)).limit(1);
  if (eventList.length === 0) return [];
  const duration = eventList[0].duration;

  // Fetch availability rule for this day
  const ruleList = await db
    .select()
    .from(availabilityRules)
    .where(
      and(
        eq(availabilityRules.userId, userId),
        eq(availabilityRules.dayOfWeek, dayOfWeek),
        eq(availabilityRules.isEnabled, true)
      )
    )
    .limit(1);

  if (ruleList.length === 0) return []; // Not working this day
  
  const rule = ruleList[0];
  
  // Parse start/end times
  const [startHour, startMin] = rule.startTime.split(":").map(Number);
  const [endHour, endMin] = rule.endTime.split(":").map(Number);
  
  const slots: string[] = [];
  
  // Generate slots every {duration} minutes
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin + duration <= endMin)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    slots.push(timeString);
    
    currentMin += duration;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  // TODO: In a real app, query `bookings` and `calendarConnections` here to remove booked slots.
  
  return slots;
}

import { getCalendarEvents, createCalendarEvent } from "@/lib/microsoft-graph";
import { calendarConnections } from "@/db/schema";
import { sendBookingConfirmationEmail, sendBookingRequestEmail } from "@/lib/email";

// 3. Create the booking
export async function createBooking(formData: FormData) {
  try {
    const eventTypeId = formData.get("eventTypeId") as string;
    let hostUserId = formData.get("hostUserId") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const guestName = formData.get("guestName") as string;
    const guestEmail = formData.get("guestEmail") as string;
    const guestNotes = (formData.get("guestNotes") as string) || null;
    const guestTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (!eventTypeId || !hostUserId || !date || !time || !guestName || !guestEmail) {
      return { error: "Missing required fields" };
    }

    // 1. Fetch Event Type
    const eventList = await db
      .select()
      .from(eventTypes)
      .where(and(eq(eventTypes.id, eventTypeId), eq(eventTypes.isActive, true)))
      .limit(1);

    if (eventList.length === 0) return { error: "Event type not found or inactive." };
    const eventType = eventList[0];

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + eventType.durationMinutes * 60000);

    let assignedMemberId = null;

    if (eventType.teamId) {
      // It's a team event. The hostUserId passed from the form is actually the teamId.
      const teamId = hostUserId;
      const { teamMembers } = await import("@/db/schema");
      
      const members = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.isEligible, true)));

      if (members.length === 0) {
        return { error: "No eligible team members found for this team." };
      }

      // For round robin, we'll just pick a random available member for now.
      // In a real app, we would query the API or do the availability check here.
      // We will pick the first member that doesn't have a conflict.
      let selectedMemberId = null;
      for (const m of members) {
        const existingBookings = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(
            and(
              eq(bookings.hostUserId, m.userId),
              eq(bookings.status, "confirmed"),
              lt(bookings.startTime, endTime),
              gt(bookings.endTime, startTime)
            )
          )
          .limit(1);
        if (existingBookings.length === 0) {
          selectedMemberId = m.userId;
          break;
        }
      }

      if (!selectedMemberId) {
        return { error: "No team members are available at this time." };
      }

      hostUserId = selectedMemberId;
      assignedMemberId = selectedMemberId;
    }

    // 2. Final Conflict Check: THREAD Bookings
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.hostUserId, hostUserId),
          eq(bookings.status, "confirmed"),
          lt(bookings.startTime, endTime),
          gt(bookings.endTime, startTime)
        )
      );

    if (existingBookings.length > 0) {
      return { error: "This time slot is no longer available." };
    }

    // 3. Final Conflict Check: Outlook Events
    const connectionResult = await db
      .select()
      .from(calendarConnections)
      .where(and(eq(calendarConnections.userId, hostUserId), eq(calendarConnections.provider, "microsoft")))
      .limit(1);

    if (connectionResult.length > 0 && connectionResult[0].isActive) {
      try {
        const msEvents = await getCalendarEvents(connectionResult[0].id, startTime.toISOString(), endTime.toISOString());
        const hasConflict = msEvents.some((e: any) => e.showAs === "busy" || e.showAs === "oof" || e.showAs === "tentative");
        if (hasConflict) {
          return { error: "The host's calendar was just updated. This time is no longer available." };
        }
      } catch (err) {
        console.error("Failed to verify Outlook conflicts during booking:", err);
      }
    }

    // 4. Create Booking in THREAD
    const newBooking = await db.insert(bookings).values({
      eventTypeId,
      hostUserId,
      assignedMemberId,
      guestName,
      guestEmail,
      guestNotes,
      startTime,
      endTime,
      timeZone: guestTz,
      status: eventType.requiresApproval ? "pending" : "confirmed",
    }).returning();

    if (eventType.requiresApproval) {
      // Send Request Email
      await sendBookingRequestEmail(guestEmail, guestName, eventType.title, startTime);

      // Audit Log for request
      await db.insert(auditLogs).values({
        actorUserId: hostUserId,
        action: "booking_requested",
        targetType: "booking",
        targetId: newBooking[0].id,
        metadata: { guestName, guestEmail }
      });

      return { success: true, bookingId: newBooking[0].id, pending: true };
    }

    // 5. Create Outlook Event (Only if confirmed)
    if (connectionResult.length > 0 && connectionResult[0].isActive) {
      try {
        const outlookEvent = await createCalendarEvent(connectionResult[0].id, {
          subject: `${eventType.title} with ${guestName}`,
          body: {
            contentType: "HTML",
            content: `<b>THREAD Meeting</b><br/><br/>Guest: ${guestName} (${guestEmail})<br/><br/>Notes: ${guestNotes || "None"}`,
          },
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "UTC"
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "UTC"
          },
          attendees: [
            {
              emailAddress: {
                address: guestEmail,
                name: guestName
              },
              type: "required"
            }
          ]
        });

        if (outlookEvent && outlookEvent.id) {
          await db
            .update(bookings)
            .set({ calendarEventId: outlookEvent.id })
            .where(eq(bookings.id, newBooking[0].id));
        }
      } catch (err) {
        console.error("Failed to create Outlook event. Booking was saved in THREAD though.", err);
      }
    }

    // 6. Send Email Confirmation
    await sendBookingConfirmationEmail(guestEmail, guestName, eventType.title, startTime);

    // 7. Audit Log
    await db.insert(auditLogs).values({
      actorUserId: hostUserId, // In this case, guest action, but assigned to host for tracking
      action: "booking_created",
      targetType: "booking",
      targetId: newBooking[0].id,
      metadata: { guestName, guestEmail }
    });

    return { success: true, bookingId: newBooking[0].id };
  } catch (error) {
    console.error("Booking failed", error);
    return { error: "Failed to book meeting." };
  }
}

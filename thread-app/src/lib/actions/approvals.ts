"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bookings, eventTypes, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function getPendingApprovals() {
  const clerkUserId = await requireAuth();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (userResult.length === 0) throw new Error("User not found");
  const userId = userResult[0].id;

  const pendingBookings = await db
    .select({
      id: bookings.id,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      eventType: eventTypes.title,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(
      and(
        eq(bookings.hostUserId, userId),
        eq(bookings.status, "pending")
      )
    );

  return pendingBookings;
}

export async function approveBooking(bookingId: string) {
  try {
    const clerkUserId = await requireAuth();
    
    // Verify ownership and get booking details
    const userResult = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (userResult.length === 0) return { error: "Unauthorized" };
    const hostId = userResult[0].id;

    const bookingList = await db
      .select({
        booking: bookings,
        eventType: eventTypes
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.hostUserId, hostId)
        )
      )
      .limit(1);

    if (bookingList.length === 0) return { error: "Booking not found or unauthorized" };
    
    const { booking, eventType } = bookingList[0];

    // Check Outlook conflicts again
    const { calendarConnections } = await import("@/db/schema");
    const { getCalendarEvents, createCalendarEvent } = await import("@/lib/microsoft-graph");
    
    const connectionResult = await db
      .select()
      .from(calendarConnections)
      .where(and(eq(calendarConnections.userId, hostId), eq(calendarConnections.provider, "microsoft")))
      .limit(1);

    if (connectionResult.length > 0 && connectionResult[0].isActive) {
      try {
        const msEvents = await getCalendarEvents(connectionResult[0].id, booking.startTime.toISOString(), booking.endTime.toISOString());
        const hasConflict = msEvents.some((e: any) => e.showAs === "busy" || e.showAs === "oof" || e.showAs === "tentative");
        if (hasConflict) {
          return { error: "The host's calendar was recently updated. This time is no longer available. Please reject and ask to reschedule." };
        }
      } catch (err) {
        console.error("Failed to verify Outlook conflicts during approval:", err);
      }
    }

    // Update status to confirmed
    await db
      .update(bookings)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));

    // Create Outlook Event
    if (connectionResult.length > 0 && connectionResult[0].isActive) {
      try {
        const outlookEvent = await createCalendarEvent(connectionResult[0].id, {
          subject: `${eventType.title} with ${booking.guestName}`,
          body: {
            contentType: "HTML",
            content: `<b>THREAD Meeting</b><br/><br/>Guest: ${booking.guestName} (${booking.guestEmail})<br/><br/>Notes: ${booking.guestNotes || "None"}`,
          },
          start: {
            dateTime: booking.startTime.toISOString(),
            timeZone: "UTC"
          },
          end: {
            dateTime: booking.endTime.toISOString(),
            timeZone: "UTC"
          },
          attendees: [
            {
              emailAddress: {
                address: booking.guestEmail,
                name: booking.guestName
              },
              type: "required"
            }
          ]
        });

        if (outlookEvent && outlookEvent.id) {
          await db
            .update(bookings)
            .set({ calendarEventId: outlookEvent.id })
            .where(eq(bookings.id, bookingId));
        }
      } catch (err) {
        console.error("Failed to create Outlook event during approval.", err);
      }
    }

    // Send Email
    const { sendBookingConfirmationEmail } = await import("@/lib/email");
    await sendBookingConfirmationEmail(booking.guestEmail, booking.guestName, eventType.title, booking.startTime);

    // Audit Log
    const { auditLogs } = await import("@/db/schema");
    await db.insert(auditLogs).values({
      actorUserId: hostId,
      action: "booking_approved",
      targetType: "booking",
      targetId: bookingId,
      metadata: { guestName: booking.guestName }
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/bookings");
    return { success: true };
  } catch (error) {
    console.error("Error approving booking:", error);
    return { error: "Failed to approve booking" };
  }
}

export async function rejectBooking(bookingId: string) {
  try {
    const clerkUserId = await requireAuth();
    
    const userResult = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (userResult.length === 0) return { error: "Unauthorized" };
    const hostId = userResult[0].id;

    const bookingList = await db
      .select({
        booking: bookings,
        eventType: eventTypes
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.hostUserId, hostId)
        )
      )
      .limit(1);

    if (bookingList.length === 0) return { error: "Booking not found or unauthorized" };
    
    const { booking, eventType } = bookingList[0];

    await db
      .update(bookings)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));

    // Send Rejection Email
    const { sendBookingCancellationEmail } = await import("@/lib/email");
    await sendBookingCancellationEmail(booking.guestEmail, booking.guestName, eventType.title);

    // Audit Log
    const { auditLogs } = await import("@/db/schema");
    await db.insert(auditLogs).values({
      actorUserId: hostId,
      action: "booking_rejected",
      targetType: "booking",
      targetId: bookingId,
      metadata: { guestName: booking.guestName }
    });

    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting booking:", error);
    return { error: "Failed to reject booking" };
  }
}

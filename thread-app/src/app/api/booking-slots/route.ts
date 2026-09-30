import { NextResponse } from "next/server";
import { db } from "@/db";
import { eventTypes, availabilityRules, availabilityBreaks, bookings, calendarConnections, teamMembers } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getCalendarEvents } from "@/lib/microsoft-graph";
import { addMinutes, parse, format, isBefore, isAfter, startOfDay, endOfDay, differenceInDays } from "date-fns";

async function getUserAvailableSlots(userId: string, requestedDate: Date, eventType: any) {
  const now = new Date();
  if (isBefore(requestedDate, startOfDay(now))) return [];
  if (differenceInDays(requestedDate, now) > eventType.maximumFutureDays) return [];

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayName = days[requestedDate.getUTCDay()];

  const rules = await db
    .select()
    .from(availabilityRules)
    .where(and(eq(availabilityRules.userId, userId), eq(availabilityRules.dayOfWeek, dayName as any), eq(availabilityRules.isEnabled, true)))
    .limit(1);

  if (rules.length === 0) return [];

  const rule = rules[0];
  const breaks = await db
    .select()
    .from(availabilityBreaks)
    .where(eq(availabilityBreaks.availabilityRuleId, rule.id));

  const slots: { start: Date; end: Date }[] = [];
  const baseDateStr = format(requestedDate, "yyyy-MM-dd");
  
  let currentSlotStart = parse(`${baseDateStr} ${rule.startTime}`, "yyyy-MM-dd HH:mm", new Date());
  const dayEnd = parse(`${baseDateStr} ${rule.endTime}`, "yyyy-MM-dd HH:mm", new Date());

  while (isBefore(addMinutes(currentSlotStart, eventType.durationMinutes), dayEnd) || currentSlotStart.getTime() === dayEnd.getTime() - eventType.durationMinutes * 60000) {
    const currentSlotEnd = addMinutes(currentSlotStart, eventType.durationMinutes);
    if (isAfter(currentSlotStart, addMinutes(now, eventType.minimumNoticeMinutes))) {
      slots.push({ start: currentSlotStart, end: currentSlotEnd });
    }
    currentSlotStart = addMinutes(currentSlotStart, 30);
  }

  const validSlots = slots.filter(slot => {
    for (const b of breaks) {
      const breakStart = parse(`${baseDateStr} ${b.startTime}`, "yyyy-MM-dd HH:mm", new Date());
      const breakEnd = parse(`${baseDateStr} ${b.endTime}`, "yyyy-MM-dd HH:mm", new Date());
      if ((isAfter(slot.start, breakStart) || slot.start.getTime() === breakStart.getTime()) && isBefore(slot.start, breakEnd)) return false;
      if (isAfter(slot.end, breakStart) && (isBefore(slot.end, breakEnd) || slot.end.getTime() === breakEnd.getTime())) return false;
      if ((isBefore(slot.start, breakStart) || slot.start.getTime() === breakStart.getTime()) && (isAfter(slot.end, breakEnd) || slot.end.getTime() === breakEnd.getTime())) return false;
    }
    return true;
  });

  const dayStartBoundary = startOfDay(requestedDate);
  const dayEndBoundary = endOfDay(requestedDate);

  const existingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.hostUserId, userId),
        eq(bookings.status, "confirmed"),
        gte(bookings.startTime, dayStartBoundary),
        lte(bookings.startTime, dayEndBoundary)
      )
    );

  let externalEvents: any[] = [];
  const connectionResult = await db
    .select()
    .from(calendarConnections)
    .where(and(eq(calendarConnections.userId, userId), eq(calendarConnections.provider, "microsoft")))
    .limit(1);

  if (connectionResult.length > 0 && connectionResult[0].isActive) {
    try {
      const msEvents = await getCalendarEvents(connectionResult[0].id, dayStartBoundary.toISOString(), dayEndBoundary.toISOString());
      externalEvents = msEvents.map((e: any) => ({
        start: new Date(e.start.dateTime + "Z"),
        end: new Date(e.end.dateTime + "Z"),
        showAs: e.showAs
      })).filter((e: any) => e.showAs === "busy" || e.showAs === "oof" || e.showAs === "tentative");
    } catch (err) {
      console.error("Failed to fetch Outlook events for conflicts:", err);
    }
  }

  const availableSlots = validSlots.filter(slot => {
    const slotStartWithBuffer = addMinutes(slot.start, -eventType.bufferBeforeMinutes);
    const slotEndWithBuffer = addMinutes(slot.end, eventType.bufferAfterMinutes);

    for (const b of existingBookings) {
      if ((isAfter(slotStartWithBuffer, b.startTime) || slotStartWithBuffer.getTime() === b.startTime.getTime()) && isBefore(slotStartWithBuffer, b.endTime)) return false;
      if (isAfter(slotEndWithBuffer, b.startTime) && (isBefore(slotEndWithBuffer, b.endTime) || slotEndWithBuffer.getTime() === b.endTime.getTime())) return false;
      if ((isBefore(slotStartWithBuffer, b.startTime) || slotStartWithBuffer.getTime() === b.startTime.getTime()) && (isAfter(slotEndWithBuffer, b.endTime) || slotEndWithBuffer.getTime() === b.endTime.getTime())) return false;
    }

    for (const e of externalEvents) {
      if ((isAfter(slotStartWithBuffer, e.start) || slotStartWithBuffer.getTime() === e.start.getTime()) && isBefore(slotStartWithBuffer, e.end)) return false;
      if (isAfter(slotEndWithBuffer, e.start) && (isBefore(slotEndWithBuffer, e.end) || slotEndWithBuffer.getTime() === e.end.getTime())) return false;
      if ((isBefore(slotStartWithBuffer, e.start) || slotStartWithBuffer.getTime() === e.start.getTime()) && (isAfter(slotEndWithBuffer, e.end) || slotEndWithBuffer.getTime() === e.end.getTime())) return false;
    }
    return true;
  });

  return availableSlots;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventTypeId = url.searchParams.get("eventTypeId");
    const dateParam = url.searchParams.get("date"); // YYYY-MM-DD
    const tzParam = url.searchParams.get("timeZone") || "UTC"; // Guest timezone

    if (!eventTypeId || !dateParam) {
      return NextResponse.json({ error: "Missing eventTypeId or date" }, { status: 400 });
    }

    const eventTypeResult = await db
      .select()
      .from(eventTypes)
      .where(and(eq(eventTypes.id, eventTypeId), eq(eventTypes.isActive, true)))
      .limit(1);

    if (eventTypeResult.length === 0) {
      return NextResponse.json({ error: "Event type not found or inactive" }, { status: 404 });
    }

    const eventType = eventTypeResult[0];
    const requestedDate = new Date(dateParam);
    
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    let allAvailableSlots: { start: Date; end: Date }[] = [];

    if (eventType.teamId) {
      // Team Scheduling
      const members = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, eventType.teamId), eq(teamMembers.isEligible, true)));

      if (eventType.routingStrategy === "round_robin") {
        // Round Robin: Combine all slots where at least one person is available
        const allMemberSlots = await Promise.all(members.map(m => getUserAvailableSlots(m.userId, requestedDate, eventType)));
        
        // Deduplicate slots based on start time
        const uniqueSlotsMap = new Map<number, { start: Date; end: Date }>();
        allMemberSlots.flat().forEach(slot => {
          uniqueSlotsMap.set(slot.start.getTime(), slot);
        });
        
        allAvailableSlots = Array.from(uniqueSlotsMap.values());
      } else if (eventType.routingStrategy === "manual") {
        // Manual / Collective: Only slots where ALL members are available
        const allMemberSlots = await Promise.all(members.map(m => getUserAvailableSlots(m.userId, requestedDate, eventType)));
        
        if (allMemberSlots.length > 0) {
          const firstMemberSlots = allMemberSlots[0];
          allAvailableSlots = firstMemberSlots.filter(slot => {
            return allMemberSlots.every(memberSlots => 
              memberSlots.some(mSlot => mSlot.start.getTime() === slot.start.getTime())
            );
          });
        }
      } else {
        // Fallback for fixed routing (needs a specific host, but we'll default to round robin for now)
        const allMemberSlots = await Promise.all(members.map(m => getUserAvailableSlots(m.userId, requestedDate, eventType)));
        const uniqueSlotsMap = new Map<number, { start: Date; end: Date }>();
        allMemberSlots.flat().forEach(slot => {
          uniqueSlotsMap.set(slot.start.getTime(), slot);
        });
        allAvailableSlots = Array.from(uniqueSlotsMap.values());
      }
      
    } else {
      // Personal Scheduling
      allAvailableSlots = await getUserAvailableSlots(eventType.userId, requestedDate, eventType);
    }

    // Sort slots chronologically
    allAvailableSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

    const formattedSlots = allAvailableSlots.map(s => ({
      start: s.start.toISOString(),
      end: s.end.toISOString()
    }));

    return NextResponse.json({ slots: formattedSlots });

  } catch (error: any) {
    console.error("Booking slots error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

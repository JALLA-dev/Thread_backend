import { NextResponse } from "next/server";
import { db } from "@/db";
import { eventTypes, availabilityRules, availabilityBreaks, bookings, calendarConnections, teamMembers } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getCalendarEvents } from "@/lib/microsoft-graph";
import { addMinutes, parse, format, isBefore, isAfter, startOfDay, endOfDay, differenceInDays } from "date-fns";

async function getMonthlyAvailability(userId: string, startDate: Date, endDate: Date, eventType: any, durationMinutes: number) {
  const now = new Date();
  const maxFutureDate = addMinutes(now, eventType.maximumFutureDays * 24 * 60);

  // 1. Fetch rules and breaks
  const rules = await db.select().from(availabilityRules).where(and(eq(availabilityRules.userId, userId), eq(availabilityRules.isEnabled, true)));
  const ruleIds = rules.map(r => r.id);
  
  let breaks: any[] = [];
  if (ruleIds.length > 0) {
    // We have to query breaks in chunks or loops if ruleIds is large, but usually it's small (7 days)
    for (const rid of ruleIds) {
      const dayBreaks = await db.select().from(availabilityBreaks).where(eq(availabilityBreaks.availabilityRuleId, rid));
      breaks.push(...dayBreaks);
    }
  }

  // 2. Fetch all THREAD bookings in range
  const existingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.hostUserId, userId),
        eq(bookings.status, "confirmed"),
        gte(bookings.startTime, startDate),
        lte(bookings.startTime, endDate)
      )
    );

  // 3. Fetch all Outlook Events in range (ONE API CALL)
  let externalEvents: any[] = [];
  const connectionResult = await db
    .select()
    .from(calendarConnections)
    .where(and(eq(calendarConnections.userId, userId), eq(calendarConnections.provider, "microsoft")))
    .limit(1);

  if (connectionResult.length > 0 && connectionResult[0].isActive) {
    try {
      const msEvents = await getCalendarEvents(connectionResult[0].id, startDate.toISOString(), endDate.toISOString());
      externalEvents = msEvents.map((e: any) => ({
        start: new Date(e.start.dateTime + "Z"),
        end: new Date(e.end.dateTime + "Z"),
        showAs: e.showAs
      })).filter((e: any) => e.showAs === "busy" || e.showAs === "oof" || e.showAs === "tentative");
    } catch (err) {
      console.error("Failed to fetch Outlook events for conflicts:", err);
    }
  }

  const daysList = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const availabilityMap: Record<string, { start: Date; end: Date }[]> = {};

  // Loop through each day in the requested range
  let currentDate = startOfDay(startDate);
  while (currentDate <= endDate) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const dayName = daysList[currentDate.getUTCDay()];

    if (isBefore(currentDate, startOfDay(now)) || isAfter(currentDate, maxFutureDate)) {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      continue;
    }

    const rule = rules.find(r => r.dayOfWeek === dayName);
    if (!rule) {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      continue;
    }

    const dayBreaks = breaks.filter(b => b.availabilityRuleId === rule.id);
    const slots: { start: Date; end: Date }[] = [];
    
    let currentSlotStart = parse(`${dateStr} ${rule.startTime}`, "yyyy-MM-dd HH:mm", new Date());
    const dayEnd = parse(`${dateStr} ${rule.endTime}`, "yyyy-MM-dd HH:mm", new Date());

    while (isBefore(addMinutes(currentSlotStart, durationMinutes), dayEnd) || currentSlotStart.getTime() === dayEnd.getTime() - durationMinutes * 60000) {
      const currentSlotEnd = addMinutes(currentSlotStart, durationMinutes);
      
      // Minimum notice check
      if (isAfter(currentSlotStart, addMinutes(now, eventType.minimumNoticeMinutes))) {
        slots.push({ start: currentSlotStart, end: currentSlotEnd });
      }
      currentSlotStart = addMinutes(currentSlotStart, 30);
    }

    // Filter slots
    const validSlots = slots.filter(slot => {
      // Check breaks
      for (const b of dayBreaks) {
        const breakStart = parse(`${dateStr} ${b.startTime}`, "yyyy-MM-dd HH:mm", new Date());
        const breakEnd = parse(`${dateStr} ${b.endTime}`, "yyyy-MM-dd HH:mm", new Date());
        if ((isAfter(slot.start, breakStart) || slot.start.getTime() === breakStart.getTime()) && isBefore(slot.start, breakEnd)) return false;
        if (isAfter(slot.end, breakStart) && (isBefore(slot.end, breakEnd) || slot.end.getTime() === breakEnd.getTime())) return false;
        if ((isBefore(slot.start, breakStart) || slot.start.getTime() === breakStart.getTime()) && (isAfter(slot.end, breakEnd) || slot.end.getTime() === breakEnd.getTime())) return false;
      }

      const slotStartWithBuffer = addMinutes(slot.start, -eventType.bufferBeforeMinutes);
      const slotEndWithBuffer = addMinutes(slot.end, eventType.bufferAfterMinutes);

      // Check THREAD bookings
      for (const b of existingBookings) {
        if ((isAfter(slotStartWithBuffer, b.startTime) || slotStartWithBuffer.getTime() === b.startTime.getTime()) && isBefore(slotStartWithBuffer, b.endTime)) return false;
        if (isAfter(slotEndWithBuffer, b.startTime) && (isBefore(slotEndWithBuffer, b.endTime) || slotEndWithBuffer.getTime() === b.endTime.getTime())) return false;
        if ((isBefore(slotStartWithBuffer, b.startTime) || slotStartWithBuffer.getTime() === b.startTime.getTime()) && (isAfter(slotEndWithBuffer, b.endTime) || slotEndWithBuffer.getTime() === b.endTime.getTime())) return false;
      }

      // Check Outlook events
      for (const e of externalEvents) {
        if ((isAfter(slotStartWithBuffer, e.start) || slotStartWithBuffer.getTime() === e.start.getTime()) && isBefore(slotStartWithBuffer, e.end)) return false;
        if (isAfter(slotEndWithBuffer, e.start) && (isBefore(slotEndWithBuffer, e.end) || slotEndWithBuffer.getTime() === e.end.getTime())) return false;
        if ((isBefore(slotStartWithBuffer, e.start) || slotStartWithBuffer.getTime() === e.start.getTime()) && (isAfter(slotEndWithBuffer, e.end) || slotEndWithBuffer.getTime() === e.end.getTime())) return false;
      }

      return true;
    });

    if (validSlots.length > 0) {
      availabilityMap[dateStr] = validSlots;
    }

    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return availabilityMap;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventTypeId = url.searchParams.get("eventTypeId");
    const startDateParam = url.searchParams.get("startDate"); // YYYY-MM-DD
    const endDateParam = url.searchParams.get("endDate"); // YYYY-MM-DD
    const durationParam = url.searchParams.get("duration");

    if (!eventTypeId || !startDateParam || !endDateParam) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
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
    const requestedDuration = durationParam ? parseInt(durationParam, 10) : eventType.durationMinutes;
    
    const startDate = new Date(startDateParam);
    const endDate = endOfDay(new Date(endDateParam));

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    let availabilityMap: Record<string, { start: Date; end: Date }[]> = {};

    if (eventType.teamId) {
      // For team, we just default to the first available member for now or combine
      const members = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, eventType.teamId), eq(teamMembers.isEligible, true)));
      
      const maps = await Promise.all(members.map(m => getMonthlyAvailability(m.userId, startDate, endDate, eventType, requestedDuration)));
      
      // Merge maps (union for round robin)
      for (const map of maps) {
        for (const [date, slots] of Object.entries(map)) {
          if (!availabilityMap[date]) {
            availabilityMap[date] = [];
          }
          // Merge and deduplicate
          const uniqueStarts = new Set(availabilityMap[date].map(s => s.start.getTime()));
          for (const s of slots) {
            if (!uniqueStarts.has(s.start.getTime())) {
              availabilityMap[date].push(s);
              uniqueStarts.add(s.start.getTime());
            }
          }
        }
      }
    } else {
      availabilityMap = await getMonthlyAvailability(eventType.userId, startDate, endDate, eventType, requestedDuration);
    }

    // Sort slots within each day
    for (const date in availabilityMap) {
      availabilityMap[date].sort((a, b) => a.start.getTime() - b.start.getTime());
    }

    // Format output
    const formattedMap: Record<string, { start: string; end: string }[]> = {};
    for (const [date, slots] of Object.entries(availabilityMap)) {
      formattedMap[date] = slots.map(s => ({ start: s.start.toISOString(), end: s.end.toISOString() }));
    }

    return NextResponse.json({ days: formattedMap });

  } catch (error: any) {
    console.error("Booking calendar error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

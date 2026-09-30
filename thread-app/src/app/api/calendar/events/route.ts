import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { bookings, calendarConnections } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { getCalendarEvents } from "@/lib/microsoft-graph";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");

    if (!startParam || !endParam) {
      return NextResponse.json({ error: "Missing start or end parameters" }, { status: 400 });
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    // 1. Fetch internal THREAD bookings
    const internalBookings = await db
      .select({
        id: bookings.id,
        title: bookings.guestName, // We'll map this to title
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        eventTypeId: bookings.eventTypeId,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.hostUserId, user.id),
          gte(bookings.startTime, startDate),
          lte(bookings.startTime, endDate),
          eq(bookings.status, "confirmed")
        )
      );

    const formattedInternalEvents = internalBookings.map((b) => ({
      id: b.id,
      title: `Meeting with ${b.title}`,
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(),
      type: "thread",
      status: b.status,
    }));

    // 2. Fetch external Outlook events if connected
    let externalEvents: any[] = [];
    const connectionResult = await db
      .select()
      .from(calendarConnections)
      .where(and(eq(calendarConnections.userId, user.id), eq(calendarConnections.provider, "microsoft")))
      .limit(1);

    const connection = connectionResult[0];

    if (connection && connection.isActive) {
      try {
        const msEvents = await getCalendarEvents(connection.id, startDate.toISOString(), endDate.toISOString());
        
        externalEvents = msEvents.map((e: any) => ({
          id: e.id,
          title: e.subject || "Busy",
          start: new Date(e.start.dateTime + "Z").toISOString(), // Graph returns UTC when header is set
          end: new Date(e.end.dateTime + "Z").toISOString(),
          isAllDay: e.isAllDay,
          showAs: e.showAs,
          type: "outlook",
        }));
      } catch (err) {
        console.error("Failed to fetch Microsoft events:", err);
        // We don't fail the entire request, just return internal events + a warning flag
        return NextResponse.json({ 
          events: formattedInternalEvents, 
          outlookError: "Failed to fetch Outlook events. Connection might be expired." 
        });
      }
    }

    // Combine and return
    const allEvents = [...formattedInternalEvents, ...externalEvents];
    return NextResponse.json({ events: allEvents });

  } catch (error: any) {
    console.error("Calendar events error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

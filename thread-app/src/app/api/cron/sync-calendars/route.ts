import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, calendarConnections, eventTypes } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { createCalendarEvent, updateCalendarEvent } from "@/lib/microsoft-graph";

// This cron job runs every 5 minutes (configured in vercel.json)
// It ensures that all confirmed Thread bookings are synced to Microsoft Outlook.
// This acts as a self-healing mechanism in case the initial push failed.

export async function GET(request: Request) {
  try {
    // 1. Verify this is a valid cron request (Vercel adds a header)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow bypass in development
      if (process.env.NODE_ENV !== "development") {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const now = new Date();
    
    // Find all confirmed bookings in the future that need syncing
    // 1. Bookings that don't have a calendarEventId (initial sync failed)
    const missingSyncBookings = await db
      .select({
        booking: bookings,
        eventType: eventTypes
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gt(bookings.startTime, now),
          isNull(bookings.calendarEventId)
        )
      );

    let syncedCount = 0;

    for (const { booking, eventType } of missingSyncBookings) {
      // Find the host's active calendar connection
      const connectionResult = await db
        .select()
        .from(calendarConnections)
        .where(
          and(
            eq(calendarConnections.userId, booking.hostUserId),
            eq(calendarConnections.provider, "microsoft"),
            eq(calendarConnections.isActive, true)
          )
        )
        .limit(1);

      if (connectionResult.length > 0) {
        const connection = connectionResult[0];
        try {
          const outlookEvent = await createCalendarEvent(connection.id, {
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
              .where(eq(bookings.id, booking.id));
            syncedCount++;
          }
        } catch (err) {
          console.error(`Cron Sync Failed for booking ${booking.id}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, syncedCount, message: "Calendar sync completed successfully." });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Failed to sync calendars" }, { status: 500 });
  }
}

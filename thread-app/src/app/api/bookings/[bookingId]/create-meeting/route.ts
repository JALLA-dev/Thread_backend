import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { bookings, eventTypes, users, calendarConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createCalendarEvent } from "@/lib/microsoft-graph";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the booking — must belong to the current user
    const bookingRows = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.hostUserId, currentUser.id)))
      .limit(1);

    if (bookingRows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingRows[0];

    // If already has a join URL, just return it
    if (booking.conferenceLink) {
      return NextResponse.json({ conferenceLink: booking.conferenceLink });
    }

    // Fetch event type for title
    const eventTypeRows = await db
      .select({ title: eventTypes.title })
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .limit(1);

    const eventTitle = eventTypeRows[0]?.title ?? "Meeting";

    // Fetch Outlook connection
    const connectionResult = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.userId, currentUser.id),
          eq(calendarConnections.provider, "microsoft"),
          eq(calendarConnections.isActive, true)
        )
      )
      .limit(1);

    if (connectionResult.length === 0) {
      return NextResponse.json(
        { error: "No active Microsoft calendar connection found. Please connect your Outlook account in Integrations." },
        { status: 400 }
      );
    }

    // Create the Outlook event with Teams meeting
    const outlookEvent = await createCalendarEvent(connectionResult[0].id, {
      subject: `${eventTitle} with ${booking.guestName}`,
      body: {
        contentType: "HTML",
        content: `<b>THREAD Meeting</b><br/><br/>Guest: ${booking.guestName} (${booking.guestEmail})<br/><br/>Notes: ${booking.guestNotes || "None"}`,
      },
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
      start: {
        dateTime: booking.startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: booking.endTime.toISOString(),
        timeZone: "UTC",
      },
      attendees: [
        {
          emailAddress: {
            address: booking.guestEmail,
            name: booking.guestName,
          },
          type: "required",
        },
      ],
    });

    if (!outlookEvent?.id) {
      return NextResponse.json({ error: "Failed to create Outlook event" }, { status: 500 });
    }

    const joinUrl: string | null = outlookEvent.onlineMeeting?.joinUrl ?? null;

    // Persist the event ID and join URL
    await db
      .update(bookings)
      .set({
        calendarEventId: outlookEvent.id,
        ...(joinUrl ? { conferenceLink: joinUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    if (!joinUrl) {
      return NextResponse.json(
        { error: "Outlook event created, but Teams meeting link was not generated. Your Microsoft account may not have Teams for Business enabled." },
        { status: 400 }
      );
    }

    return NextResponse.json({ conferenceLink: joinUrl });
  } catch (error) {
    console.error("Create meeting error:", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}

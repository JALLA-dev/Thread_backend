"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bookings, eventTypes, users, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getBookingDetails(bookingId: string) {
  const bookingList = await db
    .select({
      booking: bookings,
      eventType: eventTypes,
      host: { name: users.firstName, username: users.username },
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .innerJoin(users, eq(bookings.hostUserId, users.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (bookingList.length === 0) return null;

  return bookingList[0];
}

import { getCalendarEvents, deleteCalendarEvent, updateCalendarEvent, createCalendarEvent } from "@/lib/microsoft-graph";
import { calendarConnections } from "@/db/schema";
import { sendBookingCancellationEmail, sendBookingConfirmationEmail } from "@/lib/email";

export async function cancelBooking(bookingId: string, reason: string) {
  try {
    const bookingDetails = await getBookingDetails(bookingId);
    if (!bookingDetails) return { error: "Booking not found" };

    const result = await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancellationReason: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Trigger Notification
    await sendBookingCancellationEmail(
      bookingDetails.booking.guestEmail, 
      bookingDetails.booking.guestName, 
      bookingDetails.eventType.title
    );

    // Delete calendar event from Outlook if connected
    const connectionResult = await db
      .select()
      .from(calendarConnections)
      .where(and(eq(calendarConnections.userId, bookingDetails.booking.hostUserId), eq(calendarConnections.provider, "microsoft")))
      .limit(1);

    if (connectionResult.length > 0 && connectionResult[0].isActive && bookingDetails.booking.calendarEventId) {
      try {
        await deleteCalendarEvent(connectionResult[0].id, bookingDetails.booking.calendarEventId);
      } catch (err) {
        console.error("Failed to delete Outlook event during cancellation:", err);
      }
    }

    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath(`/dashboard/bookings`);
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return { error: "Failed to cancel booking" };
  }
}

export async function rescheduleBooking(bookingId: string, dateStr: string, timeStr: string) {
  try {
    const bookingDetails = await getBookingDetails(bookingId);
    if (!bookingDetails) return { error: "Booking not found" };

    const startTime = new Date(`${dateStr}T${timeStr}:00`);
    const duration = bookingDetails.eventType.durationMinutes;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const result = await db
      .update(bookings)
      .set({
        startTime,
        endTime,
        status: "rescheduled",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Trigger Notification
    await sendBookingConfirmationEmail(
      bookingDetails.booking.guestEmail, 
      bookingDetails.booking.guestName, 
      `Rescheduled: ${bookingDetails.eventType.title}`, 
      startTime
    );

    // Update Outlook event
    const connectionResult = await db
      .select()
      .from(calendarConnections)
      .where(and(eq(calendarConnections.userId, bookingDetails.booking.hostUserId), eq(calendarConnections.provider, "microsoft")))
      .limit(1);

    if (connectionResult.length > 0 && connectionResult[0].isActive && bookingDetails.booking.calendarEventId) {
      try {
        await updateCalendarEvent(connectionResult[0].id, bookingDetails.booking.calendarEventId, {
          start: { dateTime: startTime.toISOString(), timeZone: "UTC" },
          end: { dateTime: endTime.toISOString(), timeZone: "UTC" }
        });
      } catch (err) {
        console.error("Failed to update Outlook event during reschedule:", err);
      }
    }

    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath(`/dashboard/bookings`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reschedule booking:", error);
    return { error: "Failed to reschedule booking" };
  }
}

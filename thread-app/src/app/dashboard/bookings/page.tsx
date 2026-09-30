import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { bookings, eventTypes } from "@/db/schema";
import { eq, and, desc, asc, gte, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, User, Mail, Link as LinkIcon, MoreVertical } from "lucide-react";
import Link from "next/link";
import { format, isPast, isFuture } from "date-fns";

export const metadata = {
  title: "Bookings",
};

export default async function BookingsPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const currentTab = searchParams.tab || "upcoming";

  // Fetch all bookings for this host
  const allBookings = await db
    .select({
      id: bookings.id,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      timeZone: bookings.timeZone,
      createdAt: bookings.createdAt,
      eventTitle: eventTypes.title,
      eventDuration: eventTypes.durationMinutes,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(eq(bookings.hostUserId, user.id))
    .orderBy(desc(bookings.startTime));

  const now = new Date();

  // Filter based on tabs
  const upcoming = allBookings.filter(b => b.status === "confirmed" && b.startTime >= now).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
  const past = allBookings.filter(b => b.status === "confirmed" && b.startTime < now);
  const cancelled = allBookings.filter(b => b.status === "cancelled");
  const pending = allBookings.filter(b => b.status === "pending");

  let displayedBookings = upcoming;
  if (currentTab === "past") displayedBookings = past;
  if (currentTab === "cancelled") displayedBookings = cancelled;
  if (currentTab === "pending") displayedBookings = pending;

  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length },
    { id: "pending", label: "Pending", count: pending.length },
    { id: "past", label: "Past", count: past.length },
    { id: "cancelled", label: "Cancelled", count: cancelled.length },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Bookings
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Manage your schedule and view upcoming meetings.
        </p>
      </div>

      <div className="flex gap-4 border-b border-[var(--border)] overflow-x-auto pb-[1px]">
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={`/dashboard/bookings?tab=${tab.id}`}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              currentTab === tab.id
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label} <span className="ml-2 py-0.5 px-2 rounded-full bg-[var(--background-muted)] text-xs text-[var(--foreground-subtle)]">{tab.count}</span>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {displayedBookings.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <h3 className="text-lg font-medium text-[var(--foreground)]">No {currentTab} bookings</h3>
            <p className="text-sm text-[var(--foreground-muted)] mt-2">
              When people book time with you, it will show up here.
            </p>
          </Card>
        ) : (
          displayedBookings.map(booking => (
            <Card key={booking.id} className="p-0 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 bg-[var(--background-subtle)] p-6 border-b md:border-b-0 md:border-r border-[var(--border)]">
                  <div className="text-sm font-semibold text-[var(--primary)] mb-2 uppercase tracking-wide">
                    {format(booking.startTime, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
                    {format(booking.startTime, "h:mm a")} - {format(booking.endTime, "h:mm a")}
                  </div>
                  <div className="text-sm text-[var(--foreground-muted)]">
                    {booking.timeZone}
                  </div>
                </div>
                <div className="md:w-2/3 p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">{booking.eventTitle}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-[var(--foreground)]">{booking.guestName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                        <Mail className="h-4 w-4" />
                        {booking.guestEmail}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                        <Clock className="h-4 w-4" />
                        {booking.eventDuration} minutes
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                        <LinkIcon className="h-4 w-4" />
                        Web Conferencing Details
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--border)]">
                    <div className="text-xs text-[var(--foreground-subtle)]">
                      Created: {format(booking.createdAt, "MMM d, yyyy")}
                    </div>
                    {currentTab === "upcoming" && (
                      <div className="flex gap-2">
                        <Link href={`/bookings/${booking.id}/reschedule`}>
                          <Button variant="outline" size="sm">Reschedule</Button>
                        </Link>
                        <Link href={`/bookings/${booking.id}/cancel`}>
                          <Button variant="outline" size="sm" className="text-[var(--destructive)] hover:bg-[var(--destructive-light)]">Cancel</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

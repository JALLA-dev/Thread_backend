import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { bookings, eventTypes, users } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Calendar, Clock, Video, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export const metadata = {
  title: "Dashboard",
  description: "Overview of your upcoming meetings and events.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = user;

  // Fetch upcoming bookings
  const now = new Date();
  const upcomingBookings = await db
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
        eq(bookings.hostUserId, dbUser.id),
        gte(bookings.startTime, now),
        eq(bookings.status, "confirmed")
      )
    )
    .orderBy(bookings.startTime)
    .limit(5);

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back, {user.firstName || 'User'}
          </h1>
          <p className="text-[var(--foreground-muted)] mt-1">
            Here's what's happening with your schedule.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${dbUser.username}`} target="_blank">
            <Button variant="outline" leftIcon={<Users className="h-4 w-4" />}>
              View public page
            </Button>
          </Link>
          <Link href="/dashboard/event-types/new">
            <Button variant="primary">
              New Event Type
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Meetings List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Upcoming Meetings</h2>
          
          {upcomingBookings.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="No upcoming meetings"
              description="You don't have any confirmed meetings scheduled in the future."
              action={
                <Link href="/dashboard/event-types">
                  <Button variant="outline">Share an event link</Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[var(--primary)]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] font-medium mb-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(booking.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      <span className="mx-1">•</span>
                      <Clock className="h-4 w-4" />
                      {new Date(booking.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <h3 className="font-semibold text-lg text-[var(--foreground)]">
                      {booking.eventType} with {booking.guestName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" leftIcon={<Video className="h-4 w-4" />}>
                      Join
                    </Button>
                    <Link href={`/bookings/${booking.id}/reschedule`}>
                      <Button variant="outline" size="sm">Reschedule</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Stats sidebar */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <div className="p-6 pt-0 flex flex-col gap-4 border-t border-[var(--border)] mt-4">
              <Link href="/dashboard/event-types" className="group flex items-center justify-between text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors mt-4">
                1. Create an Event Type
                <div className="h-6 w-6 rounded-full bg-[var(--success-light)] text-[var(--success)] flex items-center justify-center">✓</div>
              </Link>
              <Link href="/dashboard/availability" className="group flex items-center justify-between text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                2. Set Availability
                <div className="h-6 w-6 rounded-full bg-[var(--success-light)] text-[var(--success)] flex items-center justify-center">✓</div>
              </Link>
              <Link href="/dashboard/integrations" className="group flex items-center justify-between text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                3. Connect Calendar
                <div className="h-6 w-6 rounded-full bg-[var(--background-muted)] border border-[var(--border)] text-[var(--foreground-muted)] flex items-center justify-center"></div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

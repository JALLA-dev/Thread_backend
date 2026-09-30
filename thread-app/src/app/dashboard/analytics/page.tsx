import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { bookings, eventTypes } from "@/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { BarChart3, Users, CalendarX, TrendingUp, Clock } from "lucide-react";

export const metadata = {
  title: "Analytics - Thread",
};

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Fetch all bookings for the host
  const allBookings = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      startTime: bookings.startTime,
      eventTypeId: bookings.eventTypeId,
      eventDuration: eventTypes.durationMinutes,
      eventTitle: eventTypes.title,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(eq(bookings.hostUserId, user.id));

  const totalBookings = allBookings.length;
  const cancelledBookings = allBookings.filter(b => b.status === "cancelled").length;
  
  const now = new Date();
  const upcomingBookings = allBookings.filter(b => b.status === "confirmed" && b.startTime >= now).length;
  const completedBookings = allBookings.filter(b => b.status === "confirmed" && b.startTime < now).length;

  const totalMinutesBooked = allBookings
    .filter(b => b.status !== "cancelled")
    .reduce((acc, curr) => acc + curr.eventDuration, 0);

  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

  // Group by event type for popularity
  const eventPopularity: Record<string, { title: string; count: number }> = {};
  allBookings.forEach(b => {
    if (b.status !== "cancelled") {
      if (!eventPopularity[b.eventTypeId]) {
        eventPopularity[b.eventTypeId] = { title: b.eventTitle, count: 0 };
      }
      eventPopularity[b.eventTypeId].count++;
    }
  });

  const popularEventsList = Object.values(eventPopularity).sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Analytics & Insights
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Track your meeting performance and scheduling trends.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground-muted)]">Total Meetings</h3>
            <BarChart3 className="h-5 w-5 text-[var(--primary)] opacity-80" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--foreground)]">{totalBookings}</div>
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">All time scheduled events</p>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground-muted)]">Upcoming</h3>
            <Users className="h-5 w-5 text-blue-500 opacity-80" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--foreground)]">{upcomingBookings}</div>
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">Meetings ahead of you</p>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground-muted)]">Time Booked</h3>
            <Clock className="h-5 w-5 text-amber-500 opacity-80" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--foreground)]">{Math.round(totalMinutesBooked / 60)} <span className="text-xl font-medium">hrs</span></div>
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">Total scheduled duration</p>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground-muted)]">Cancellation Rate</h3>
            <CalendarX className="h-5 w-5 text-[var(--destructive)] opacity-80" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--foreground)]">{cancellationRate}%</div>
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">{cancelledBookings} cancelled events</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Most Popular Event Types</h2>
          </div>
          
          {popularEventsList.length === 0 ? (
            <div className="text-center py-8 text-[var(--foreground-muted)]">
              No meetings booked yet.
            </div>
          ) : (
            <div className="space-y-6">
              {popularEventsList.map((event, index) => {
                const maxCount = popularEventsList[0].count;
                const percentage = Math.round((event.count / maxCount) * 100);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[var(--foreground)]">{event.title}</span>
                      <span className="text-[var(--foreground-muted)]">{event.count} bookings</span>
                    </div>
                    <div className="w-full bg-[var(--background-muted)] rounded-full h-2">
                      <div 
                        className="bg-[var(--primary)] h-2 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        
        <Card className="p-6">
           <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Meeting History</h2>
           <div className="flex items-center justify-center h-48 border-2 border-dashed border-[var(--border)] rounded-lg">
             <div className="text-center">
               <p className="text-[var(--foreground-muted)]">Detailed timeline chart</p>
               <p className="text-xs text-[var(--foreground-subtle)] mt-1">(requires historical data)</p>
             </div>
           </div>
        </Card>
      </div>
    </div>
  );
}

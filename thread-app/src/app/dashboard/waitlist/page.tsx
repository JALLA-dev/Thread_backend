import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { waitlistEntries, eventTypes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Clock, User, Mail } from "lucide-react";
import { WaitlistActions } from "./WaitlistActions";
import { format } from "date-fns";

export const metadata = {
  title: "Waitlist - Thread",
};

export default async function WaitlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Fetch active waitlist entries for the host
  const entries = await db
    .select({
      id: waitlistEntries.id,
      guestName: waitlistEntries.guestName,
      guestEmail: waitlistEntries.guestEmail,
      preferredStartTime: waitlistEntries.preferredStartTime,
      createdAt: waitlistEntries.createdAt,
      eventTitle: eventTypes.title,
    })
    .from(waitlistEntries)
    .innerJoin(eventTypes, eq(waitlistEntries.eventTypeId, eventTypes.id))
    .where(and(eq(waitlistEntries.hostUserId, user.id), eq(waitlistEntries.isActive, true)))
    .orderBy(desc(waitlistEntries.createdAt));

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Waitlist
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Manage guests waiting for open slots on your fully booked events.
        </p>
      </div>
      
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <h3 className="text-lg font-medium text-[var(--foreground)]">No one is waiting</h3>
            <p className="text-sm text-[var(--foreground-muted)] mt-2">
              Enable waitlist on your high-demand event types to allow guests to queue up.
            </p>
          </Card>
        ) : (
          entries.map(entry => (
            <Card key={entry.id} className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">{entry.eventTitle}</h3>
                
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-[var(--foreground-muted)]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-[var(--foreground)]">{entry.guestName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {entry.guestEmail}
                  </div>
                  {entry.preferredStartTime && (
                    <div className="flex items-center gap-2 text-[var(--primary)] font-medium">
                      <Clock className="h-4 w-4" />
                      Prefers: {format(entry.preferredStartTime, "MMM d, h:mm a")}
                    </div>
                  )}
                </div>
                <div className="text-xs text-[var(--foreground-subtle)] mt-4">
                  Joined on {format(entry.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
              
              <WaitlistActions entryId={entry.id} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

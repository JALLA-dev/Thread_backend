import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { db } from "@/db";
import { eventTypes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { EventTypeCard } from "./EventTypeCard";

export const metadata = {
  title: "Event Types",
  description: "Manage your meeting types and availability rules.",
};

export default async function EventTypesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const events = await db
    .select()
    .from(eventTypes)
    .where(eq(eventTypes.userId, user.id))
    .orderBy(desc(eventTypes.createdAt));

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Event Types
          </h1>
          <p className="text-[var(--foreground-muted)] mt-1">
            Create and manage different types of meetings you offer.
          </p>
        </div>
        <div>
          <Link href="/dashboard/event-types/new">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              New Event Type
            </Button>
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No event types yet"
          description="Create your first event type to start allowing people to book time with you."
          action={
            <Link href="/dashboard/event-types/new">
              <Button>Create Event Type</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventTypeCard key={event.id} event={event} username={user.username ?? undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

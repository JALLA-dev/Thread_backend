import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventTypeForm } from "./EventTypeForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getTeams } from "@/lib/actions/teams";

export const metadata = {
  title: "New Event Type",
  description: "Create a new event type.",
};

export default async function NewEventTypePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const teams = await getTeams();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <Link 
          href="/dashboard/event-types" 
          className="inline-flex items-center text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Event Types
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Add New Event Type
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Define how invitees can schedule this type of meeting.
        </p>
      </div>

      <EventTypeForm username={user.username ?? undefined} teams={teams} />
    </div>
  );
}

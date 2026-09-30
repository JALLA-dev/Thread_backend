import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateTeamForm } from "./CreateTeamForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "New Team",
  description: "Create a new team.",
};

export default async function NewTeamPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <Link 
          href="/dashboard/teams" 
          className="inline-flex items-center text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Teams
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Create a New Team
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Teams allow you to invite users and create collective Round Robin event types.
        </p>
      </div>

      <CreateTeamForm />
    </div>
  );
}

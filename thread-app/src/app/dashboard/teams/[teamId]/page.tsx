import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTeamDetails } from "@/lib/actions/teams";
import { Card } from "@/components/ui/Card";
import { TeamMembersClient } from "./TeamMembersClient";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Users } from "lucide-react";

export const metadata = {
  title: "Team Details - Thread",
};

export default async function TeamDetailsPage(props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  let data;
  try {
    data = await getTeamDetails(params.teamId);
  } catch (error) {
    redirect("/dashboard/teams");
  }

  const { team, members } = data;
  const isOwnerOrAdmin = members.some(m => m.userId === user.id && (m.role === "owner" || m.role === "admin"));

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-4">
        <div>
          <Link href="/dashboard/teams">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2 -ml-3">
              Back to Teams
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[var(--background-muted)] flex items-center justify-center border border-[var(--border)]">
              {team.imageUrl ? (
                <img src={team.imageUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Users className="w-8 h-8 text-[var(--foreground-muted)]" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                {team.name}
              </h1>
              <p className="text-[var(--foreground-muted)] mt-1">
                thread.com/team/{team.slug}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        <Card padding="lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Team Members</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Manage who is in this team to use for round-robin scheduling.
              </p>
            </div>
          </div>
          
          <TeamMembersClient teamId={team.id} members={members} isOwnerOrAdmin={isOwnerOrAdmin} />
        </Card>
      </div>
    </div>
  );
}

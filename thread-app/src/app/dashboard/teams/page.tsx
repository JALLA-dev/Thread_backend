import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTeams } from "@/lib/actions/teams";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";

export const metadata = {
  title: "Teams",
  description: "Manage your teams and collective scheduling.",
};

export default async function TeamsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const teams = await getTeams();

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Teams
          </h1>
          <p className="text-[var(--foreground-muted)] mt-1">
            Create collective event types and route meetings with Round Robin.
          </p>
        </div>
        <div>
          <Link href="/dashboard/teams/new">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Create Team
            </Button>
          </Link>
        </div>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No teams yet"
          description="Create a team to start pooling availability with your colleagues and set up Round Robin routing."
          action={
            <Link href="/dashboard/teams/new">
              <Button>Create a Team</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} hover padding="sm" className="group flex flex-col">
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--background-muted)] flex items-center justify-center border border-[var(--border)]">
                    {team.imageUrl ? (
                      <img src={team.imageUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Users className="w-6 h-6 text-[var(--foreground-muted)]" />
                    )}
                  </div>
                  <Badge variant="outline">{team.role}</Badge>
                </div>
                <CardTitle className="mb-1 text-xl">{team.name}</CardTitle>
                <CardDescription className="mb-4">
                  thread.com/team/{team.slug}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2 border-t border-[var(--border)] p-4 mt-auto">
                <Link href={`/dashboard/teams/${team.id}`} className="w-full">
                  <Button variant="secondary" size="sm" fullWidth leftIcon={<Settings className="h-4 w-4" />}>
                    Manage Team
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

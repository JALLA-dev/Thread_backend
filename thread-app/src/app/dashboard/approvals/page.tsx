import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPendingApprovals } from "@/lib/actions/approvals";
import { Card } from "@/components/ui/Card";
import { ApprovalActions } from "./ApprovalActions";
import { Calendar, Clock, Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/States";

export const metadata = {
  title: "Approvals",
  description: "Review pending booking requests.",
};

export default async function ApprovalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const pending = await getPendingApprovals();

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Approvals
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Review and confirm meetings that require your approval.
        </p>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="All caught up"
          description="You have no pending booking requests to review."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((booking) => (
            <Card key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 hover:border-[var(--primary)]/30 transition-colors">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--primary-light)] text-[var(--primary-dark)]">
                    {booking.eventType}
                  </span>
                  <span className="text-sm text-[var(--foreground-muted)]">• Requested</span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {booking.guestName}
                </h3>
                <p className="text-sm text-[var(--foreground-muted)] mb-2">
                  {booking.guestEmail}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--foreground)]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[var(--foreground-muted)]" />
                    {new Date(booking.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[var(--foreground-muted)]" />
                    {new Date(booking.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <ApprovalActions bookingId={booking.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

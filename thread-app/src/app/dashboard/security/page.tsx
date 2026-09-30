import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Shield, KeyRound, Activity, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export const metadata = {
  title: "Security & Audit - Thread",
};

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Fetch recent audit logs for the user
  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.actorUserId, user.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Security & Audit
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Manage your account security and monitor account activity.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Authentication</h2>
          </div>
          <p className="text-[var(--foreground-muted)] text-sm mb-6">
            Authentication, passwords, and multi-factor authentication (MFA) are securely managed through Clerk.
          </p>
          <div className="bg-[var(--background-subtle)] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-[var(--foreground-muted)]" />
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Manage Credentials</div>
                <div className="text-xs text-[var(--foreground-subtle)]">Update password or enable 2FA</div>
              </div>
            </div>
            {/* Using standard link to open Clerk profile modal (if configured) or just dashboard */}
            <a href="/dashboard/settings" className="text-sm font-medium text-[var(--primary)] hover:underline">
              Go to Profile
            </a>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-full">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Active Sessions</h2>
          </div>
          <p className="text-[var(--foreground-muted)] text-sm mb-6">
            View devices and browsers that are currently signed into your account.
          </p>
          <div className="bg-[var(--background-subtle)] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-[var(--foreground-muted)]" />
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Current Session</div>
                <div className="text-xs text-[var(--foreground-subtle)]">Windows • Edge</div>
              </div>
            </div>
            <div className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
              Active
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 border-b border-[var(--border)] pb-2">
          Recent Activity (Audit Log)
        </h2>
        
        <Card className="overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-[var(--foreground-muted)]">
              No recent activity found.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--background-subtle)] transition-colors">
                  <div>
                    <div className="text-sm font-medium text-[var(--foreground)] capitalize">
                      {log.action.replace(/_/g, " ")}
                    </div>
                    {log.targetType && (
                      <div className="text-xs text-[var(--foreground-muted)] mt-1">
                        Target: {log.targetType} {log.metadata ? `• Details: ${JSON.stringify(log.metadata)}` : ""}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[var(--foreground-subtle)] whitespace-nowrap sm:text-right">
                    {format(log.createdAt, "MMM d, yyyy h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

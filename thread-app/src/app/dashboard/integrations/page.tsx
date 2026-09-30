import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCalendarConnections } from "@/lib/actions/integrations";
import { OutlookConnection } from "./OutlookConnection";
import { Puzzle } from "lucide-react";

export const metadata = {
  title: "Integrations",
  description: "Connect your calendar and other apps.",
};

export default async function IntegrationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { connections } = await getCalendarConnections();
  
  // Find if they have an active microsoft connection
  const outlookConnection = connections.find(c => c.provider === "microsoft" && c.isActive);

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Integrations
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1 flex items-center gap-2">
          <Puzzle className="h-4 w-4" />
          Connect external calendars and services to supercharge your scheduling.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Calendar Connections
        </h2>
        <Suspense fallback={<div className="h-40 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl"></div>}>
          <OutlookConnection connection={outlookConnection} />
        </Suspense>
      </div>
    </div>
  );
}


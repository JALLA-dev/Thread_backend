import { CalendarClient } from "./CalendarClient";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { calendarConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OutlookConnection } from "../integrations/OutlookConnection";

export const metadata = {
  title: "Calendar",
};

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Fetch Microsoft connection
  const connections = await db
    .select()
    .from(calendarConnections)
    .where(and(eq(calendarConnections.userId, user.id), eq(calendarConnections.provider, "microsoft")))
    .limit(1);
    
  const outlookConnection = connections.length > 0 && connections[0].isActive
    ? { id: connections[0].id, email: connections[0].email }
    : undefined;

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-[1400px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Calendar
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Manage your schedule and view upcoming meetings.
        </p>
      </div>

      {!outlookConnection && (
        <div className="mb-2">
          <OutlookConnection connection={outlookConnection} />
        </div>
      )}
      
      <CalendarClient isConnected={!!outlookConnection} />
    </div>
  );
}

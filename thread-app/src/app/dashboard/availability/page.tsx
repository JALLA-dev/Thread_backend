import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateAvailability } from "@/lib/actions/availability";
import { AvailabilityForm } from "./AvailabilityForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Clock } from "lucide-react";

export const metadata = {
  title: "Availability",
  description: "Set your weekly working hours.",
};

export default async function AvailabilityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // This will get existing rules or create default Mon-Fri 9-5 rules
  const rules = await getOrCreateAvailability();

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Availability
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Set your regular weekly schedule. This applies to all your event types.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--primary)]" />
            <CardTitle>Working Hours</CardTitle>
          </div>
          <CardDescription>
            Define the days and times you are generally available for meetings.
          </CardDescription>
        </CardHeader>
        <div className="p-6 border-t border-[var(--border)]">
          <AvailabilityForm initialRules={rules} />
        </div>
      </Card>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "./SettingsForm";
import { ThemeSettings } from "./ThemeSettings";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export const metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Settings
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Update your personal information and time zone.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 border-t border-[var(--border)] pt-6">
            <SettingsForm user={user} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how Thread looks on your device.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 border-t border-[var(--border)] pt-6">
            <ThemeSettings />
          </div>
        </Card>
      </div>
    </div>
  );
}

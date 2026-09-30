"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { updateProfile } from "@/lib/actions/user";
import { CheckCircle2 } from "lucide-react";

type User = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  timeZone: string;
};

// Common time zones for the select input
const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export function SettingsForm({ user }: { user: User }) {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setIsPending(true);
    setSuccess(false);
    setError(null);

    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    }

    setIsPending(false);
  }

  return (
    <form action={onSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          defaultValue={user.firstName ?? ""}
          required
        />
        <Input
          label="Last Name"
          name="lastName"
          defaultValue={user.lastName ?? ""}
        />
      </div>

      <Input
        label="Email Address"
        name="email"
        type="email"
        defaultValue={user.email}
        disabled
        helper="Your email address is managed through your Clerk account."
      />

      <Select
        label="Time Zone"
        name="timeZone"
        defaultValue={user.timeZone || "UTC"}
        options={TIMEZONES}
        required
        helper="All your meetings and availability will be displayed in this time zone."
      />

      {error && (
        <div className="p-3 rounded-lg bg-[var(--destructive-light)] text-[var(--destructive)] text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--success-light)] text-[var(--success)] text-sm font-medium animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          Profile updated successfully
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

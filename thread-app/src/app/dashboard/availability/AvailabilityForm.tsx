"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateAvailabilityRule } from "@/lib/actions/availability";
import { cn } from "@/lib/utils";

type Rule = {
  id: string;
  dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  isEnabled: boolean;
  startTime: string;
  endTime: string;
};

const DAY_ORDER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

function formatDayName(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function AvailabilityForm({ initialRules }: { initialRules: Rule[] }) {
  // Sort rules Mon -> Sun
  const sortedRules = [...initialRules].sort(
    (a, b) => DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek]
  );

  const [rules, setRules] = useState<Rule[]>(sortedRules);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggle = (id: string) => {
    setRules((current) =>
      current.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
    );
  };

  const handleTimeChange = (id: string, field: "startTime" | "endTime", value: string) => {
    setRules((current) =>
      current.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    setIsPending(true);
    setMessage(null);

    let hasError = false;

    // Save all rules
    for (const rule of rules) {
      const result = await updateAvailabilityRule(
        rule.id,
        rule.isEnabled,
        rule.startTime,
        rule.endTime
      );
      if (result.error) {
        hasError = true;
      }
    }

    if (hasError) {
      setMessage({ type: "error", text: "Failed to save some availability settings." });
    } else {
      setMessage({ type: "success", text: "Availability saved successfully." });
      setTimeout(() => setMessage(null), 3000);
    }

    setIsPending(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-colors",
              rule.isEnabled
                ? "border-[var(--border)] bg-[var(--card)]"
                : "border-[var(--border)] bg-[var(--background-subtle)] opacity-70"
            )}
          >
            <div className="flex items-center gap-3 w-40">
              <input
                type="checkbox"
                id={`toggle-${rule.id}`}
                checked={rule.isEnabled}
                onChange={() => handleToggle(rule.id)}
                className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <label
                htmlFor={`toggle-${rule.id}`}
                className="font-medium text-[var(--foreground)] cursor-pointer select-none"
              >
                {formatDayName(rule.dayOfWeek)}
              </label>
            </div>

            <div className="flex items-center gap-2 flex-1">
              {rule.isEnabled ? (
                <>
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) => handleTimeChange(rule.id, "startTime", e.target.value)}
                    className="rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                  <span className="text-[var(--foreground-muted)]">-</span>
                  <input
                    type="time"
                    value={rule.endTime}
                    onChange={(e) => handleTimeChange(rule.id, "endTime", e.target.value)}
                    className="rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </>
              ) : (
                <span className="text-sm text-[var(--foreground-muted)]">Unavailable</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <div>
          {message && (
            <p
              className={cn(
                "text-sm font-medium animate-fade-in",
                message.type === "success" ? "text-[var(--success)]" : "text-[var(--destructive)]"
              )}
            >
              {message.text}
            </p>
          )}
        </div>
        <Button onClick={handleSave} loading={isPending}>
          Save Availability
        </Button>
      </div>
    </div>
  );
}

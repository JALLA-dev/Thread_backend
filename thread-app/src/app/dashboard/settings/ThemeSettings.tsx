"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      id: "light",
      label: "Light",
      icon: Sun,
      description: "Clean and bright",
    },
    {
      id: "dark",
      label: "Dark",
      icon: Moon,
      description: "Easy on the eyes",
    },
    {
      id: "system",
      label: "System",
      icon: Monitor,
      description: "Matches your device",
    },
  ] as const;

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
              "hover:bg-[var(--background-muted)]",
              theme === option.id
                ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            )}
          >
            <div
              className={cn(
                "p-3 rounded-full flex items-center justify-center",
                theme === option.id
                  ? "bg-[var(--primary)] text-white shadow-md"
                  : "bg-[var(--background-muted)] text-[var(--foreground-muted)]"
              )}
            >
              <option.icon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-semibold">{option.label}</p>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  theme === option.id
                    ? "text-[var(--primary)]/80"
                    : "text-[var(--foreground-muted)]"
                )}
              >
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

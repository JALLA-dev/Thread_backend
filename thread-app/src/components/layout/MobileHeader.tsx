"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  Clock,
  Calendar,
  Users,
  BarChart3,
  Settings,
  CheckSquare,
  List,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Event Types", href: "/dashboard/event-types", icon: CalendarDays },
  { label: "Availability", href: "/dashboard/availability", icon: Clock },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { label: "Bookings", href: "/dashboard/bookings", icon: CheckSquare },
  { label: "Teams", href: "/dashboard/teams", icon: Users },
  { label: "Waitlist", href: "/dashboard/waitlist", icon: List },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Security", href: "/dashboard/security", icon: Shield },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const currentPage = navItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center h-14 px-4 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-md">
        <button
          id="mobile-menu-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
          className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-[var(--background-muted)] transition-colors mr-3"
        >
          <Menu className="h-5 w-5 text-[var(--foreground)]" />
        </button>

        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-auto">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-xs font-bold text-white">T</span>
          </div>
          <span className="font-bold text-[var(--foreground)]">Thread</span>
        </Link>

        {/* Current page name (tablet) */}
        {currentPage && (
          <span className="hidden sm:block text-sm font-medium text-[var(--foreground-muted)] mr-3">
            {currentPage.label}
          </span>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton
            appearance={{
              elements: { avatarBox: "h-8 w-8" },
            }}
          />
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="relative z-10 flex flex-col w-72 max-w-[85vw] h-full bg-[var(--sidebar-bg)] animate-slide-in-l shadow-xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--sidebar-border)]">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg">
                  <span className="text-sm font-bold text-white">T</span>
                </div>
                <span className="text-base font-bold text-white">Thread</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
                className="flex items-center justify-center h-8 w-8 rounded-lg text-[var(--sidebar-fg)] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                          "transition-all duration-200",
                          isActive
                            ? "bg-[var(--sidebar-accent)] text-white shadow-sm"
                            : "text-[var(--sidebar-fg)] hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Drawer Footer */}
            <div className="border-t border-[var(--sidebar-border)] p-4 space-y-3">
              <ThemeToggle
                showLabel
                className="w-full text-[var(--sidebar-fg)] hover:text-white hover:bg-white/10"
              />
              <div className="flex items-center gap-3 px-1">
                <UserButton
                  appearance={{
                    elements: { avatarBox: "h-9 w-9" },
                  }}
                />
                <span className="text-sm text-[var(--sidebar-fg)] opacity-70">
                  My Account
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

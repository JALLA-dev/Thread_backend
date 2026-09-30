"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "main",
  },
  {
    label: "Event Types",
    href: "/dashboard/event-types",
    icon: CalendarDays,
    group: "main",
  },
  {
    label: "Availability",
    href: "/dashboard/availability",
    icon: Clock,
    group: "main",
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    group: "main",
  },
  {
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: CheckSquare,
    group: "main",
  },
  {
    label: "Teams",
    href: "/dashboard/teams",
    icon: Users,
    group: "team",
  },
  {
    label: "Waitlist",
    href: "/dashboard/waitlist",
    icon: List,
    group: "team",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    group: "analytics",
  },
  {
    label: "Security",
    href: "/dashboard/security",
    icon: Shield,
    group: "settings",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    group: "settings",
  },
];

const groups = [
  { id: "main", label: "Scheduling" },
  { id: "team", label: "Team" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Account" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out",
        "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-[var(--sidebar-border)]",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg">
              <span className="text-sm font-bold text-white">T</span>
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Thread
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg">
              <span className="text-sm font-bold text-white">T</span>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "hidden lg:flex items-center justify-center h-6 w-6 rounded",
            "text-[var(--sidebar-fg)] hover:text-white hover:bg-[var(--sidebar-accent)]",
            "transition-colors duration-200",
            collapsed && "absolute right-0 translate-x-1/2 bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)]"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {groups.map((group) => {
          const groupItems = navItems.filter((i) => i.group === group.id);
          return (
            <div key={group.id} className="mb-6">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--sidebar-fg)] opacity-50">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {groupItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                          "transition-all duration-200 group",
                          isActive
                            ? "bg-[var(--sidebar-accent)] text-white shadow-sm"
                            : "text-[var(--sidebar-fg)] hover:bg-white/10 hover:text-white",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "shrink-0 transition-transform duration-200",
                            collapsed ? "h-5 w-5" : "h-4 w-4",
                            !isActive && "group-hover:scale-110"
                          )}
                        />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t border-[var(--sidebar-border)] p-3 space-y-2",
          collapsed && "flex flex-col items-center"
        )}
      >
        <ThemeToggle
          showLabel={!collapsed}
          className="w-full text-[var(--sidebar-fg)] hover:text-white hover:bg-white/10"
        />
        <div
          className={cn(
            "flex items-center gap-3 px-1",
            collapsed && "justify-center"
          )}
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          {!collapsed && (
            <span className="text-xs text-[var(--sidebar-fg)] opacity-70 truncate">
              My Account
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

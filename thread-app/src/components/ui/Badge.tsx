import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "destructive" | "info" | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--background-muted)] text-[var(--foreground-muted)] border border-[var(--border)]",
  primary: "bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20",
  success: "bg-[var(--success-light)] text-[var(--success-foreground)]",
  warning: "bg-[var(--warning-light)] text-[var(--warning-foreground)]",
  destructive: "bg-[var(--destructive-light)] text-[var(--destructive-foreground)]",
  info: "bg-[var(--info-light)] text-[var(--info-foreground)]",
  outline: "bg-transparent text-[var(--foreground)] border border-[var(--border)]",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[var(--foreground-subtle)]",
  primary: "bg-[var(--primary)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  destructive: "bg-[var(--destructive)]",
  info: "bg-[var(--info)]",
  outline: "bg-[var(--foreground-subtle)]",
};

export function Badge({
  variant = "default",
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        "whitespace-nowrap",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Booking status badge
 */
export function BookingStatusBadge({
  status,
}: {
  status: string;
}) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    confirmed: { variant: "success", label: "Confirmed" },
    pending: { variant: "warning", label: "Pending" },
    cancelled: { variant: "destructive", label: "Cancelled" },
    rescheduled: { variant: "info", label: "Rescheduled" },
    completed: { variant: "default", label: "Completed" },
    no_show: { variant: "outline", label: "No Show" },
  };

  const { variant, label } = config[status] ?? { variant: "default", label: status };

  return <Badge variant={variant} dot>{label}</Badge>;
}

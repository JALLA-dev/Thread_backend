import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--background-subtle)] px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-[var(--foreground-muted)]">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  text = "Loading...",
  className,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen ? "fixed inset-0 z-50 bg-[var(--background)]/80 backdrop-blur-sm" : "py-12",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      {text && (
        <p className="text-sm font-medium text-[var(--foreground-muted)] animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

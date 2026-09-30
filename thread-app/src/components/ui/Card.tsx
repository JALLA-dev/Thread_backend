import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
  ...props
}: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm",
        "transition-all duration-200",
        hover &&
          "hover:shadow-md hover:border-[var(--border-strong)] hover:bg-[var(--card-hover)] cursor-pointer",
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-base font-semibold text-[var(--card-foreground)]",
        className
      )}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-[var(--foreground-muted)]", className)}>
      {children}
    </p>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--foreground-muted)] mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-[var(--card-foreground)]">
            {value}
          </p>
          {description && (
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">
              {description}
            </p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium mt-2",
                trend.positive
                  ? "text-[var(--success)]"
                  : "text-[var(--destructive)]"
              )}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

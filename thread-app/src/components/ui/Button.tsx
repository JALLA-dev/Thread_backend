import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--primary)] text-[var(--primary-foreground)]",
    "hover:bg-[var(--primary-hover)]",
    "shadow-sm hover:shadow-md",
    "focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
  ].join(" "),

  secondary: [
    "bg-[var(--background-muted)] text-[var(--foreground)]",
    "hover:bg-[var(--border)]",
    "border border-[var(--border)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
  ].join(" "),

  outline: [
    "bg-transparent text-[var(--primary)]",
    "border border-[var(--primary)]",
    "hover:bg-[var(--primary-light)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
  ].join(" "),

  ghost: [
    "bg-transparent text-[var(--foreground)]",
    "hover:bg-[var(--background-muted)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
  ].join(" "),

  destructive: [
    "bg-[var(--destructive)] text-white",
    "hover:opacity-90",
    "shadow-sm",
    "focus-visible:ring-2 focus-visible:ring-[var(--destructive)] focus-visible:ring-offset-2",
  ].join(" "),

  success: [
    "bg-[var(--success)] text-white",
    "hover:opacity-90",
    "shadow-sm",
    "focus-visible:ring-2 focus-visible:ring-[var(--success)] focus-visible:ring-offset-2",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "select-none whitespace-nowrap",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

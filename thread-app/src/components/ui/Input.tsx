import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--foreground)]"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-[var(--destructive)]" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm",
              "bg-[var(--input-bg)] text-[var(--foreground)]",
              "border-[var(--input-border)]",
              "placeholder:text-[var(--input-placeholder)]",
              "transition-colors duration-200",
              "focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--primary)]/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error &&
                "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
              error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]">
              {rightIcon}
            </div>
          )}
          {error && !rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--destructive)]">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--destructive)]" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-[var(--foreground-subtle)]">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, fullWidth = false, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--foreground)]"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-[var(--destructive)]" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-lg border px-3 py-2.5 text-sm",
            "bg-[var(--input-bg)] text-[var(--foreground)]",
            "border-[var(--input-border)]",
            "placeholder:text-[var(--input-placeholder)]",
            "transition-colors duration-200 resize-y min-h-[80px]",
            "focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--primary)]/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error &&
              "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--destructive)]" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-xs text-[var(--foreground-subtle)]">{helper}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper, fullWidth = false, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--foreground)]"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-[var(--destructive)]" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-lg border px-3 py-2.5 text-sm",
            "bg-[var(--input-bg)] text-[var(--foreground)]",
            "border-[var(--input-border)]",
            "transition-colors duration-200",
            "focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--primary)]/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[var(--destructive)]",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-[var(--destructive)]" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-xs text-[var(--foreground-subtle)]">{helper}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

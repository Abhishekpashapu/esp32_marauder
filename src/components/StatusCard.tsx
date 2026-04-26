import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatusCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "primary" | "secondary" | "warning" | "destructive" | "muted";
  className?: string;
}

const ACCENT_CLASS: Record<NonNullable<StatusCardProps["accent"]>, string> = {
  primary: "border-primary/30 hover:border-primary/60 hover:shadow-glow-primary",
  secondary: "border-secondary/30 hover:border-secondary/60 hover:shadow-glow-secondary",
  warning: "border-warning/30 hover:border-warning/60",
  destructive: "border-destructive/30 hover:border-destructive/60",
  muted: "border-border hover:border-muted-foreground/40",
};

const ACCENT_TEXT: Record<NonNullable<StatusCardProps["accent"]>, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export function StatusCard({
  label,
  value,
  hint,
  icon,
  accent = "primary",
  className,
}: StatusCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-gradient-surface p-4 transition-all duration-300",
        ACCENT_CLASS[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </div>
          <div className={cn("font-mono text-xl font-semibold truncate", ACCENT_TEXT[accent])}>
            {value}
          </div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              "h-9 w-9 rounded-lg border bg-card/40 flex items-center justify-center shrink-0",
              ACCENT_CLASS[accent],
              ACCENT_TEXT[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
    </div>
  );
}

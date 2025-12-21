import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  isLoading,
  disabled,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-card rounded-xl p-6 shadow-soft border border-border",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 shadow-soft border border-border transition-all duration-300 hover:shadow-medium animate-slide-up",
        disabled && "opacity-50",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-semibold text-foreground">
            {disabled ? "-" : value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {disabled ? "Sem dados" : subtitle}
            </p>
          )}
          {trend && !disabled && (
            <p
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "+" : "-"}{trend.value}% este mês
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl shadow-gold",
          disabled ? "bg-muted" : "bg-gradient-gold"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

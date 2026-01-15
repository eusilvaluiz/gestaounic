import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "danger" | "info" | "warning";
  subtitle?: string;
  className?: string;
}

const variantStyles = {
  default: "border-border",
  success: "border-success/30 glow-success",
  danger: "border-destructive/30 glow-danger",
  info: "border-info/30 glow-info",
  warning: "border-warning/30",
};

const iconStyles = {
  default: "text-muted-foreground",
  success: "text-success",
  danger: "text-destructive",
  info: "text-info",
  warning: "text-warning",
};

export const MetricCard = ({ 
  title, 
  value, 
  icon, 
  variant = "default", 
  subtitle,
  className 
}: MetricCardProps) => {
  return (
    <div 
      className={cn(
        "glass-effect rounded-xl p-5 animate-slide-up",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex flex-col">
        {icon && (
          <div className={cn("p-2 rounded-lg bg-accent self-start mb-3", iconStyles[variant])}>
            {icon}
          </div>
        )}
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-lg lg:text-xl xl:text-2xl font-bold tracking-tight",
            variant === "success" && "gradient-text-success",
            variant === "danger" && "gradient-text-danger",
            variant === "info" && "gradient-text-info",
            variant === "default" && "text-foreground",
            variant === "warning" && "text-warning"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

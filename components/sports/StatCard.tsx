import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: "blue" | "emerald" | "amber" | "rose" | "purple";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  accentColor = "blue",
  className,
}: StatCardProps) {
  const colorMap = {
    blue: {
      border: "hover:border-blue-500/50",
      bg: "bg-blue-500/10 text-blue-400",
      glow: "hover:shadow-[0_0_20px_-3px_rgba(59,130,246,0.2)]",
    },
    emerald: {
      border: "hover:border-emerald-500/50",
      bg: "bg-emerald-500/10 text-emerald-400",
      glow: "hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.2)]",
    },
    amber: {
      border: "hover:border-amber-500/50",
      bg: "bg-amber-500/10 text-amber-400",
      glow: "hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]",
    },
    rose: {
      border: "hover:border-rose-500/50",
      bg: "bg-rose-500/10 text-rose-400",
      glow: "hover:shadow-[0_0_20px_-3px_rgba(239,68,68,0.2)]",
    },
    purple: {
      border: "hover:border-purple-500/50",
      bg: "bg-purple-500/10 text-purple-400",
      glow: "hover:shadow-[0_0_20px_-3px_rgba(168,85,247,0.2)]",
    },
  };

  const currentTheme = colorMap[accentColor];

  return (
    <div
      className={cn(
        "sports-card rounded-2xl p-5 border border-slate-800 transition-all duration-300",
        currentTheme.border,
        currentTheme.glow,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={cn("p-2.5 rounded-xl border border-white/5", currentTheme.bg)}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-md",
              trendPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            )}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

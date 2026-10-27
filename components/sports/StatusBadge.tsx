import React from "react";
import { MatchStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: MatchStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const configs: Record<
    MatchStatus,
    { label: string; bg: string; text: string; border: string; pulse?: boolean }
  > = {
    PROGRAMADO: {
      label: "PROGRAMADO",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
    },
    EN_PREPARACION: {
      label: "PREVIA",
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "border-indigo-500/30",
    },
    EN_VIVO: {
      label: "EN VIVO",
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      border: "border-emerald-500/40",
      pulse: true,
    },
    DESCANSO: {
      label: "DESCANSO",
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-amber-500/30",
    },
    FINALIZADO: {
      label: "FINALIZADO",
      bg: "bg-slate-700/30",
      text: "text-slate-400",
      border: "border-slate-600/30",
    },
    SUSPENDIDO: {
      label: "SUSPENDIDO",
      bg: "bg-orange-500/15",
      text: "text-orange-400",
      border: "border-orange-500/30",
    },
    CANCELADO: {
      label: "CANCELADO",
      bg: "bg-rose-500/15",
      text: "text-rose-400",
      border: "border-rose-500/30",
    },
  };

  const config = configs[status] || configs.PROGRAMADO;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-all",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      )}
      {config.label}
    </span>
  );
}

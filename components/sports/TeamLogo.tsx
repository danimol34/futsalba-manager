import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
  team?: {
    name?: string;
    short_name?: string;
    logo_url?: string;
    primary_color?: string;
  };
  name?: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function TeamLogo({
  team,
  name,
  shortName,
  logoUrl,
  primaryColor = "#0066ff",
  size = "md",
  className,
}: TeamLogoProps) {
  const tName = team?.name || name || "Equipo";
  const tShortName = team?.short_name || shortName;
  const tLogoUrl = team?.logo_url || logoUrl;
  const tColor = team?.primary_color || primaryColor;

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px] font-bold",
    sm: "w-8 h-8 text-xs font-bold",
    md: "w-11 h-11 text-sm font-bold",
    lg: "w-16 h-16 text-base font-extrabold",
    xl: "w-24 h-24 text-2xl font-black",
  };

  const initials = tShortName || tName.slice(0, 3).toUpperCase();

  return (
    <div
      className={cn(
        "relative rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-white/10 shadow-md transition-transform hover:scale-105",
        sizeClasses[size],
        className
      )}
      style={{
        background: `radial-gradient(circle, ${tColor}22 0%, #0f172a 100%)`,
        borderColor: `${tColor}44`,
      }}
    >
      {tLogoUrl ? (
        <Image
          src={tLogoUrl}
          alt={`Escudo de ${tName}`}
          fill
          sizes="96px"
          className="object-cover p-1"
          onError={(e) => {
            // fallback gracefully to initials
            (e.currentTarget as HTMLElement).style.display = "none";
          }}
        />
      ) : null}

      {/* Fallback Initials */}
      <span
        className="font-scoreboard tracking-wider"
        style={{ color: tColor || "#ffffff" }}
      >
        {initials}
      </span>
    </div>
  );
}

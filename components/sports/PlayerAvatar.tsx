import React from "react";
import { Player, PlayerPosition } from "@/types";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  player?: Player;
  name?: string;
  jerseyNumber?: number;
  position?: PlayerPosition;
  photoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showNumber?: boolean;
  teamColor?: string;
  className?: string;
}


const positionColors: Record<PlayerPosition, { bg: string; text: string }> = {
  PORTERO: { bg: "bg-amber-500/20", text: "text-amber-400" },
  CIERRE: { bg: "bg-blue-500/20", text: "text-blue-400" },
  ALA: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  PIVOT: { bg: "bg-rose-500/20", text: "text-rose-400" },
  UNIVERSAL: { bg: "bg-purple-500/20", text: "text-purple-400" },
};

export function PlayerAvatar({
  player,
  name,
  jerseyNumber,
  position,
  photoUrl,
  size = "md",
  showNumber = true,
  className,
}: PlayerAvatarProps) {
  const pName = player ? `${player.first_name} ${player.last_name}` : name || "Jugador";
  const pNumber = player?.jersey_number ?? jerseyNumber;
  const pPos = player?.position ?? position;
  const pPhoto = player?.photo_url ?? photoUrl;

  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-24 h-24 text-2xl",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center shrink-0", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center font-bold text-slate-300 shadow-inner",
          sizeStyles[size]
        )}
      >
        {pPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pPhoto}
            alt={pName}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <span>{pName.slice(0, 2).toUpperCase()}</span>
        )}
      </div>

      {showNumber && pNumber !== undefined && (
        <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-slate-900">
          {pNumber}
        </span>
      )}

      {pPos && size === "xl" && (
        <span
          className={cn(
            "absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 uppercase",
            positionColors[pPos].bg,
            positionColors[pPos].text
          )}
        >
          {pPos}
        </span>
      )}
    </div>
  );
}

export function PositionBadge({ position }: { position: PlayerPosition }) {
  const posConfig = positionColors[position] || {
    bg: "bg-slate-700",
    text: "text-slate-300",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-md uppercase border border-white/5",
        posConfig.bg,
        posConfig.text
      )}
    >
      {position}
    </span>
  );
}

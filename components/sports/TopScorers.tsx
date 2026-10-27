"use client";

import React from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import { Flame, Award, ChevronRight } from "lucide-react";

export function TopScorers({ limit = 5 }: { limit?: number }) {
  const { players, teams } = useFutsal();

  const sortedPlayers = [...players]
    .sort((a, b) => {
      const goalsDiff = (b.goals ?? 0) - (a.goals ?? 0);
      if (goalsDiff !== 0) return goalsDiff;
      return (b.assists ?? 0) - (a.assists ?? 0);
    })
    .slice(0, limit);


  return (
    <div className="sports-card rounded-2xl overflow-hidden border border-slate-800">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="font-extrabold text-white text-base tracking-tight">
            Tabla de Goleadores
          </h3>
        </div>
        <Award className="w-4 h-4 text-blue-400" />
      </div>

      <div className="divide-y divide-slate-800/60">
        {sortedPlayers.map((player, index) => {
          const team = teams.find((t) => t.id === player.team_id);
          const isPichichi = index === 0;

          return (
            <div
              key={player.id}
              className={`p-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors ${
                isPichichi ? "bg-amber-500/[0.04]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                    isPichichi
                      ? "bg-amber-400 text-slate-950"
                      : "text-slate-400"
                  }`}
                >
                  {index + 1}
                </span>

                <PlayerAvatar player={player} size="sm" showNumber={false} />

                <div>
                  <Link
                    href={`/dashboard/jugadores/${player.id}`}
                    className="font-bold text-sm text-white hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    {player.first_name} {player.last_name}
                    <span className="text-xs text-slate-400">#{player.jersey_number}</span>
                  </Link>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <TeamLogo
                      name={team?.name || ""}
                      shortName={team?.short_name}
                      logoUrl={team?.logo_url}
                      size="sm"
                      className="w-4 h-4 rounded-sm text-[8px]"
                    />
                    <span>{team?.name}</span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-500">{player.position}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-base font-black text-amber-400">
                  <span>{player.goals}</span>
                  <span className="text-xs">⚽</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {player.assists} asist.
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-900/40 border-t border-slate-800 text-right">
        <Link
          href="/dashboard/estadisticas"
          className="text-xs text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
        >
          Ver todas las estadísticas <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

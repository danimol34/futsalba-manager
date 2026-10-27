"use client";

import React from "react";
import { MatchEvent } from "@/types";
import { useFutsal } from "@/lib/store/futsalStore";
import { TeamLogo } from "../sports/TeamLogo";
import { Trash2 } from "lucide-react";

interface MatchTimelineProps {
  matchId: string;
  allowDelete?: boolean;
}

export function MatchTimeline({ matchId, allowDelete = false }: MatchTimelineProps) {
  const { matchEvents, teams, players, deleteMatchEvent } = useFutsal();

  const events = matchEvents
    .filter((e) => e.match_id === matchId)
    .sort((a, b) => b.minute - a.minute || b.second - a.second);

  const getEventBadge = (type: MatchEvent["event_type"]) => {
    switch (type) {
      case "goal":
      case "penalty":
      case "double_penalty":
        return { icon: "⚽", text: "Gol", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
      case "yellow_card":
        return { icon: "🟨", text: "Tarjeta Amarilla", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
      case "red_card":
        return { icon: "🟥", text: "Tarjeta Roja", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
      case "foul":
        return { icon: "⚠️", text: "Falta", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" };
      case "substitution":
        return { icon: "🔄", text: "Cambio", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
      case "timeout":
        return { icon: "⏱️", text: "Tiempo Muerto", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" };
      case "injury":
        return { icon: "🩹", text: "Atención Médica", color: "text-pink-400 bg-pink-500/10 border-pink-500/30" };
      default:
        return { icon: "📝", text: "Incidencia", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" };
    }
  };

  return (
    <div className="sports-card rounded-2xl p-4 border border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300">
          Cronología del Partido
        </h3>
        <span className="text-[11px] font-semibold text-blue-400">
          {events.length} incidentes
        </span>
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No hay acontecimientos registrados todavía en este partido.
        </div>
      ) : (
        <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {events.map((event) => {
            const team = teams.find((t) => t.id === event.team_id);
            const player = players.find((p) => p.id === event.player_id);
            const secondaryPlayer = players.find((p) => p.id === event.secondary_player_id);
            const badge = getEventBadge(event.event_type);

            return (
              <div
                key={event.id}
                className="group relative flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all text-xs"
              >
                {/* Minute pill */}
                <div className="shrink-0 w-10 text-center">
                  <span className="font-scoreboard font-black text-sm text-blue-400">
                    {event.minute}&apos;
                  </span>
                  <div className="text-[9px] text-slate-500 font-mono">
                    {event.second.toString().padStart(2, "0")}&quot;
                  </div>
                </div>

                {/* Event icon */}
                <div className="text-base select-none shrink-0">{badge.icon}</div>

                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span className="truncate">
                      {player
                        ? `#${player.jersey_number} ${player.first_name} ${player.last_name}`
                        : team?.name}
                    </span>
                    {team && (
                      <TeamLogo
                        name={team.name}
                        logoUrl={team.logo_url}
                        size="sm"
                        className="w-3.5 h-3.5 rounded-sm inline-block"
                      />
                    )}
                  </div>

                  {/* Secondary info (assist or change) */}
                  {secondaryPlayer && event.event_type === "goal" && (
                    <div className="text-[11px] text-slate-400">
                      Asistencia: #{secondaryPlayer.jersey_number} {secondaryPlayer.first_name}{" "}
                      {secondaryPlayer.last_name}
                    </div>
                  )}

                  {secondaryPlayer && event.event_type === "substitution" && (
                    <div className="text-[11px] text-slate-400">
                      Sale: #{secondaryPlayer.jersey_number} {secondaryPlayer.first_name}{" "}
                      {secondaryPlayer.last_name}
                    </div>
                  )}

                  {event.notes && (
                    <div className="text-[11px] text-slate-400 italic mt-0.5 truncate">
                      {event.notes}
                    </div>
                  )}
                </div>

                {/* Delete button if authorized */}
                {allowDelete && (
                  <button
                    onClick={() => deleteMatchEvent(event.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Eliminar evento (corrección)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

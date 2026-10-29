"use client";

import React from "react";
import Link from "next/link";
import { Standing } from "@/types";
import { TeamLogo } from "./TeamLogo";
import { Trophy, ChevronRight } from "lucide-react";

interface StandingsTableProps {
  standings: Standing[];
  compact?: boolean;
  showBreakdown?: boolean;
  isPublic?: boolean;
}

export function StandingsTable({
  standings,
  compact = false,
  showBreakdown = false,
  isPublic = false,
}: StandingsTableProps) {
  if (!standings || standings.length === 0) {
    return (
      <div className="sports-card rounded-2xl p-8 border border-slate-800 text-center">
        <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-white mb-1">Sin datos de clasificación</h4>
        <p className="text-xs text-slate-400">
          No hay registros de partidos oficiales finalizados para calcular la tabla.
        </p>
      </div>
    );
  }

  return (
    <div className="sports-card rounded-2xl overflow-hidden border border-slate-800">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-white text-base tracking-tight">
            Tabla de Posiciones
          </h3>
        </div>
        <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
          Liga Regular 2026
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="py-3 px-3 text-center w-8">#</th>
              <th className="py-3 px-3">Equipo</th>
              <th className="py-3 px-2 text-center" title="Partidos Jugados">
                PJ
              </th>
              <th className="py-3 px-2 text-center" title="Partidos Ganados">
                PG
              </th>
              <th className="py-3 px-2 text-center" title="Partidos Empatados">
                PE
              </th>
              <th className="py-3 px-2 text-center" title="Partidos Perdidos">
                PP
              </th>
              {!compact && (
                <>
                  <th className="py-3 px-2 text-center" title="Goles a Favor">
                    GF
                  </th>
                  <th className="py-3 px-2 text-center" title="Goles en Contra">
                    GC
                  </th>
                  <th className="py-3 px-2 text-center" title="Diferencia de Goles">
                    DG
                  </th>
                  <th className="py-3 px-2 text-center" title="Racha reciente">
                    Forma
                  </th>
                </>
              )}
              {showBreakdown && (
                <>
                  <th
                    className="py-3 px-2 text-center font-bold text-slate-300 bg-slate-800/40"
                    title="Puntos obtenidos exclusivamente en partidos"
                  >
                    Pts Par.
                  </th>
                  <th
                    className="py-3 px-2 text-center font-bold text-amber-300 bg-amber-500/10"
                    title="Ajustes administrativos reglamentarios (+/-)"
                  >
                    Ajuste
                  </th>
                </>
              )}
              <th
                className="py-3 px-3 text-center font-black text-white bg-blue-900/30"
                title="Puntos oficiales reglamentarios = Partidos + Ajustes"
              >
                {showBreakdown ? "PTS OFICIAL" : "PTS"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {standings.map((team, index) => {
              const isFirst = index === 0;
              const isPlayoff = index < 2;
              const teamLink = isPublic
                ? `/equipos/${team.team_id}`
                : `/dashboard/equipos/${team.team_id}`;

              const matchPts =
                team.match_points !== undefined
                  ? team.match_points
                  : team.points - (team.points_adjustment || 0);
              const adjPts = team.points_adjustment || 0;

              return (
                <tr
                  key={team.team_id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isFirst ? "bg-amber-500/[0.03]" : ""
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black ${
                        isFirst
                          ? "bg-amber-400 text-slate-950 font-bold"
                          : isPlayoff
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <Link
                      href={teamLink}
                      className="flex items-center gap-2.5 font-bold text-white hover:text-blue-400 transition-colors group"
                    >
                      <TeamLogo
                        name={team.team_name}
                        shortName={team.team_short}
                        logoUrl={team.logo_url}
                        size="sm"
                      />
                      <div>
                        <span className="truncate max-w-[130px] sm:max-w-none block">
                          {team.team_name}
                        </span>
                        {/* Indicación discreta de ajuste para aficionado o tabla compacta */}
                        {adjPts !== 0 && !showBreakdown && (
                          <span className="text-[10px] text-amber-400/90 font-medium block">
                            Ajuste reglamentario: {adjPts > 0 ? `+${adjPts}` : adjPts} pts
                          </span>
                        )}
                      </div>
                    </Link>
                  </td>

                  <td className="py-3 px-2 text-center font-medium text-slate-300">
                    {team.played}
                  </td>
                  <td className="py-3 px-2 text-center font-medium text-emerald-400">
                    {team.won}
                  </td>
                  <td className="py-3 px-2 text-center font-medium text-amber-400">
                    {team.drawn}
                  </td>
                  <td className="py-3 px-2 text-center font-medium text-rose-400">
                    {team.lost}
                  </td>

                  {!compact && (
                    <>
                      <td className="py-3 px-2 text-center text-slate-300">{team.goals_for}</td>
                      <td className="py-3 px-2 text-center text-slate-300">{team.goals_against}</td>
                      <td className="py-3 px-2 text-center font-semibold text-slate-200">
                        {team.goal_difference > 0
                          ? `+${team.goal_difference}`
                          : team.goal_difference}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {team.form && team.form.length > 0 ? (
                            team.form.slice(0, 3).map((f, i) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                                  f === "W"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : f === "D"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-rose-500/20 text-rose-400"
                                }`}
                              >
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </div>
                      </td>
                    </>
                  )}

                  {showBreakdown && (
                    <>
                      <td className="py-3 px-2 text-center font-mono font-semibold text-slate-300 bg-slate-800/20">
                        {matchPts}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold bg-amber-500/5">
                        {adjPts > 0 ? (
                          <span className="text-emerald-400">+{adjPts}</span>
                        ) : adjPts < 0 ? (
                          <span className="text-rose-400">{adjPts}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </>
                  )}

                  <td className="py-3 px-3 text-center font-black text-sm text-white bg-blue-900/30">
                    {team.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-900/40 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            1° Campeón / Gran Final
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Zona Clasificación Playoff
          </span>
        </div>

        {compact && (
          <Link
            href="/clasificacion"
            className="flex items-center gap-1 text-blue-400 font-semibold hover:underline"
          >
            Ver completa <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}


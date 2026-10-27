"use client";

import React from "react";
import Link from "next/link";
import { Standing } from "@/types";
import { TeamLogo } from "./TeamLogo";
import { Trophy, ChevronRight } from "lucide-react";

interface StandingsTableProps {
  standings: Standing[];
  compact?: boolean;
}

export function StandingsTable({ standings, compact = false }: StandingsTableProps) {
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
              <th className="py-3 px-3 text-center font-bold text-white bg-blue-900/20" title="Puntos">
                PTS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {standings.map((team, index) => {
              const isFirst = index === 0;
              const isPlayoff = index < 2;

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
                      href={`/dashboard/equipos/${team.team_id}`}
                      className="flex items-center gap-2.5 font-bold text-white hover:text-blue-400 transition-colors group"
                    >
                      <TeamLogo
                        name={team.team_name}
                        shortName={team.team_short}
                        logoUrl={team.logo_url}
                        size="sm"
                      />
                      <span className="truncate max-w-[130px] sm:max-w-none">
                        {team.team_name}
                      </span>
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

                  <td className="py-3 px-3 text-center font-black text-sm text-white bg-blue-900/20">
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

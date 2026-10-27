"use client";

import React from "react";
import Link from "next/link";
import { Match } from "@/types";
import { useFutsal } from "@/lib/store/futsalStore";
import { TeamLogo } from "./TeamLogo";
import { StatusBadge } from "./StatusBadge";
import { formatTime } from "@/lib/utils";
import {
  Radio,
  Clock,
  MapPin,
  Tv,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
} from "lucide-react";

interface LiveMatchCardProps {
  match?: Match;
}

export function LiveMatchCard({ match }: LiveMatchCardProps) {
  const { teams, venues, matchdays, logisticsTasks } = useFutsal();

  if (!match) return null;

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);
  const venue = venues.find((v) => v.id === match.venue_id);
  const matchday = matchdays.find((m) => m.id === match.matchday_id);

  // Match logistics statistics
  const matchLogistics = logisticsTasks.filter((t) => t.match_id === match.id);
  const completedTasks = matchLogistics.filter((t) => t.completed).length;
  const totalTasks = matchLogistics.length || 1;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  const isLive = match.status === "EN_VIVO" || match.status === "DESCANSO";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-[#0c162c] via-[#091122] to-[#060b14] p-6 shadow-2xl">
      {/* Decorative dynamic ambient glow */}
      <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -z-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
              {isLive ? "PARTIDO EN VIVO" : "PRÓXIMO PARTIDO ESTELAR"}
            </div>
            <div className="text-sm font-semibold text-slate-300">
              {matchday?.name} • Liga Regular FUTSALBA
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={match.status} size="lg" />
          <Link
            href={`/tv/${match.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 rounded-xl border border-slate-700 transition-colors shadow-sm"
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Modo TV</span>
          </Link>
        </div>
      </div>

      {/* Teams and Big Scoreboard */}
      <div className="py-6 grid grid-cols-1 md:grid-cols-7 items-center gap-6">
        {/* Local Team */}
        <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-4">
          <div className="text-left md:text-right">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {homeTeam?.name}
            </h3>
            <p className="text-xs text-slate-400 font-medium">DT: {homeTeam?.coach_name}</p>
            <div className="mt-1 flex items-center justify-start md:justify-end gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                {match.home_fouls} Faltas
              </span>
              {match.home_fouls >= 5 && (
                <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 animate-pulse">
                  DOBLE PENALTI
                </span>
              )}
            </div>
          </div>
          <TeamLogo
            name={homeTeam?.name || "H"}
            shortName={homeTeam?.short_name}
            logoUrl={homeTeam?.logo_url}
            primaryColor={homeTeam?.primary_color}
            size="lg"
          />
        </div>

        {/* Center Digital Clock & Big Score */}
        <div className="md:col-span-1 flex flex-col items-center justify-center">
          <div className="bg-[#040810] border-2 border-slate-700/80 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-3">
            <span className="text-3xl md:text-4xl font-scoreboard font-black text-white">
              {match.home_score}
            </span>
            <span className="text-slate-600 font-black text-2xl">:</span>
            <span className="text-3xl md:text-4xl font-scoreboard font-black text-white">
              {match.away_score}
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-mono font-bold">
            {isLive ? (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {formatTime(match.match_clock_seconds)} • {String(match.period).replace("_", " ")}
              </span>

            ) : (
              <span className="flex items-center gap-1 text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {match.kickoff_time} hs
              </span>
            )}
          </div>
        </div>

        {/* Visitante Team */}
        <div className="md:col-span-3 flex items-center justify-start gap-4">
          <TeamLogo
            name={awayTeam?.name || "A"}
            shortName={awayTeam?.short_name}
            logoUrl={awayTeam?.logo_url}
            primaryColor={awayTeam?.primary_color}
            size="lg"
          />
          <div className="text-left">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {awayTeam?.name}
            </h3>
            <p className="text-xs text-slate-400 font-medium">DT: {awayTeam?.coach_name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                {match.away_fouls} Faltas
              </span>
              {match.away_fouls >= 5 && (
                <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 animate-pulse">
                  DOBLE PENALTI
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Match Logistics & Progress Card */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-900/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              LOGÍSTICA DEL PARTIDO
            </span>
            <span className="font-bold text-blue-400">{progressPercent}% COMPLETADO</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {venue?.name}
            </span>
            <span>•</span>
            <span>
              {completedTasks} de {totalTasks} tareas listas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Link
            href={`/dashboard/partidos/${match.id}/logistica`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Checklist
          </Link>

          <Link
            href={`/dashboard/partidos/${match.id}/live`}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Radio className="w-4 h-4" />
            Entrar a Mesa Técnica
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

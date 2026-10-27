"use client";

import React from "react";
import Link from "next/link";
import { Match } from "@/types";
import { useFutsal } from "@/lib/store/futsalStore";
import { TeamLogo } from "./TeamLogo";
import { StatusBadge } from "./StatusBadge";
import { formatTime } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  Tv,
  Radio,
  FileText,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

interface MatchCardProps {
  match: Match;
  compact?: boolean;
}

export function MatchCard({ match, compact = false }: MatchCardProps) {
  const { teams, venues, matchdays } = useFutsal();

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);
  const venue = venues.find((v) => v.id === match.venue_id);
  const matchday = matchdays.find((m) => m.id === match.matchday_id);

  const isLive = match.status === "EN_VIVO" || match.status === "DESCANSO";
  const isFinished = match.status === "FINALIZADO";

  return (
    <div
      className={`sports-card rounded-2xl p-5 transition-all duration-300 hover:border-blue-500/40 ${
        isLive ? "sports-card-live" : "hover:sports-card-glow"
      }`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">{matchday?.name || "Jornada"}</span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            {match.match_date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            {match.kickoff_time} hs
          </span>
        </div>
        <StatusBadge status={match.status} size="sm" />
      </div>

      {/* Main Scoreboard area */}
      <div className="py-4 grid grid-cols-7 items-center gap-2">
        {/* Home Team */}
        <div className="col-span-3 flex items-center justify-end gap-3 text-right">
          <div>
            <div className="font-bold text-white text-base md:text-lg group-hover:text-blue-400 transition-colors">
              {homeTeam?.name || "Local"}
            </div>
            <div className="text-xs text-slate-400">{homeTeam?.city}</div>
          </div>
          <TeamLogo
            name={homeTeam?.name || "H"}
            shortName={homeTeam?.short_name}
            logoUrl={homeTeam?.logo_url}
            primaryColor={homeTeam?.primary_color}
            size="md"
          />
        </div>

        {/* Center Score / Time */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          {isFinished || isLive ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/60 px-3 py-1 rounded-xl shadow-inner font-scoreboard text-2xl font-black tracking-tight text-white">
                <span className={isLive && match.home_score > match.away_score ? "text-emerald-400" : ""}>
                  {match.home_score}
                </span>
                <span className="text-slate-500 font-normal">:</span>
                <span className={isLive && match.away_score > match.home_score ? "text-emerald-400" : ""}>
                  {match.away_score}
                </span>
              </div>
              {isLive && (
                <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {formatTime(match.match_clock_seconds)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-sm font-black text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                VS
              </div>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-3 flex items-center justify-start gap-3 text-left">
          <TeamLogo
            name={awayTeam?.name || "A"}
            shortName={awayTeam?.short_name}
            logoUrl={awayTeam?.logo_url}
            primaryColor={awayTeam?.primary_color}
            size="md"
          />
          <div>
            <div className="font-bold text-white text-base md:text-lg">
              {awayTeam?.name || "Visitante"}
            </div>
            <div className="text-xs text-slate-400">{awayTeam?.city}</div>
          </div>
        </div>
      </div>

      {/* Venue & Fouls Indicator */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[200px]">{venue?.name || "Cancha Central"}</span>
        </div>

        {isLive && (
          <div className="flex items-center gap-3 font-semibold">
            <span className={match.home_fouls >= 5 ? "text-rose-400" : "text-slate-300"}>
              Faltas L: {match.home_fouls}
            </span>
            <span className="text-slate-600">|</span>
            <span className={match.away_fouls >= 5 ? "text-rose-400" : "text-slate-300"}>
              Faltas V: {match.away_fouls}
            </span>
          </div>
        )}

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {isLive ? (
            <Link
              href={`/dashboard/partidos/${match.id}/live`}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs shadow-md transition-all animate-pulse"
            >
              <Radio className="w-3.5 h-3.5" />
              Mesa en Vivo
            </Link>
          ) : (
            <Link
              href={`/dashboard/partidos/${match.id}/live`}
              className="inline-flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-semibold px-2.5 py-1 rounded-lg text-xs border border-blue-500/30 transition-all"
            >
              Iniciar
            </Link>
          )}

          <Link
            href={`/dashboard/partidos/${match.id}/logistica`}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Logística del partido"
          >
            <ClipboardList className="w-3.5 h-3.5" />
          </Link>

          <Link
            href={`/tv/${match.id}`}
            target="_blank"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Ver marcador para TV"
          >
            <Tv className="w-3.5 h-3.5 text-blue-400" />
          </Link>

          <Link
            href={`/partidos/${match.id}`}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Página pública del partido"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Play,
  Eye,
  Edit2,
  Trash2,
  MoreHorizontal,
  ClipboardList,
} from "lucide-react";

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  onEdit?: (match: Match) => void;
  onDelete?: (match: Match) => void;
}

export const MatchCard = memo(function MatchCard({
  match,
  compact = false,
  onEdit,
  onDelete,
}: MatchCardProps) {
  const pathname = usePathname();
  const { teams, venues, matchdays, matchEvents, sanctions, currentUserRole } =
    useFutsal();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);
  const venue = venues.find((v) => v.id === match.venue_id);
  const matchday = matchdays.find((m) => m.id === match.matchday_id);

  const isLive = match.status === "EN_VIVO" || match.status === "DESCANSO";
  const isFinished = match.status === "FINALIZADO";
  const isScheduled = match.status === "PROGRAMADO";

  const isDashboard = pathname?.startsWith("/dashboard");
  const fromOrigin = pathname?.startsWith("/dashboard/jornadas")
    ? "jornadas"
    : pathname?.startsWith("/dashboard/partidos")
    ? "partidos"
    : undefined;

  const detailHref = fromOrigin
    ? `/partidos/${match.id}?from=${fromOrigin}`
    : `/partidos/${match.id}`;

  const canStartOrManageLive =
    isDashboard &&
    [
      "SUPER_ADMIN",
      "PRESIDENTE",
      "ADMINISTRADOR",
      "MESA_TECNICA",
      "ARBITRO",
    ].includes(currentUserRole);

  const canEditMatch =
    isDashboard &&
    ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR", "MESA_TECNICA"].includes(
      currentUserRole
    );

  const canDeleteMatch =
    isDashboard &&
    ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR"].includes(currentUserRole);

  const hasOfficialData =
    !isScheduled ||
    (match.home_score ?? 0) > 0 ||
    (match.away_score ?? 0) > 0 ||
    (match.home_fouls ?? 0) > 0 ||
    (match.away_fouls ?? 0) > 0 ||
    matchEvents.some((e) => e.match_id === match.id) ||
    sanctions.some((s) => s.match_id === match.id);

  const isDeletableScheduled = isScheduled && !hasOfficialData;

  return (
    <div
      className={`sports-card rounded-2xl p-5 transition-all duration-300 hover:border-blue-500/40 ${
        isLive ? "sports-card-live" : "hover:sports-card-glow"
      }`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-300">
            {matchday?.name || "Jornada"}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            {match.match_date}
          </span>
          {match.kickoff_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              {match.kickoff_time.slice(0, 5)} hs
            </span>
          )}
        </div>
        <StatusBadge status={match.status} size="sm" />
      </div>

      {/* Main Scoreboard area */}
      <div className="py-4 grid grid-cols-7 items-center gap-2">
        {/* Home Team */}
        <div className="col-span-3 flex items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <div className="font-bold text-white text-sm sm:text-base md:text-lg truncate">
              {homeTeam?.name || "Local"}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {homeTeam?.city}
            </div>
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
                <span
                  className={
                    isLive && match.home_score > match.away_score
                      ? "text-emerald-400"
                      : ""
                  }
                >
                  {match.home_score}
                </span>
                <span className="text-slate-500 font-normal">:</span>
                <span
                  className={
                    isLive && match.away_score > match.home_score
                      ? "text-emerald-400"
                      : ""
                  }
                >
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
          <div className="min-w-0">
            <div className="font-bold text-white text-sm sm:text-base md:text-lg truncate">
              {awayTeam?.name || "Visitante"}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {awayTeam?.city}
            </div>
          </div>
        </div>
      </div>

      {/* Venue & Actions Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate max-w-[180px]">
            {venue?.name || "Sede por confirmar"}
          </span>
        </div>

        {isLive && (
          <div className="flex items-center gap-3 font-semibold">
            <span
              className={
                match.home_fouls >= 5 ? "text-rose-400" : "text-slate-300"
              }
            >
              Faltas L: {match.home_fouls}
            </span>
            <span className="text-slate-600">|</span>
            <span
              className={
                match.away_fouls >= 5 ? "text-rose-400" : "text-slate-300"
              }
            >
              Faltas V: {match.away_fouls}
            </span>
          </div>
        )}

        {/* Action buttons: INICIAR | VER | EDITAR | ⋯ */}
        <div className="flex items-center gap-1.5 ml-auto">
          {canStartOrManageLive &&
            (isLive ? (
              <Link
                href={`/dashboard/partidos/${match.id}/live`}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] uppercase tracking-wide shadow-md transition-all animate-pulse"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>EN VIVO</span>
              </Link>
            ) : match.status !== "CANCELADO" ? (
              <Link
                href={`/dashboard/partidos/${match.id}/live`}
                className="inline-flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] uppercase tracking-wide border border-blue-500/30 transition-all"
              >
                <Play className="w-3 h-3" />
                <span>INICIAR</span>
              </Link>
            ) : null)}

          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-[11px] uppercase tracking-wide border border-slate-700/70 transition-colors"
            title="Ver detalle del partido"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>VER</span>
          </Link>

          {canEditMatch && isScheduled && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(match)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 font-bold text-[11px] uppercase tracking-wide border border-slate-700/70 transition-colors"
              title="Editar partido programado"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>EDITAR</span>
            </button>
          )}

          {isDashboard && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Más opciones del partido"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/70 transition-colors touch-manipulation"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 bottom-full mb-1.5 w-48 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-30 text-xs">
                  {canEditMatch && isScheduled && onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(match);
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar partido</span>
                    </button>
                  )}

                  {canDeleteMatch && onDelete && (isDeletableScheduled || !isScheduled || hasOfficialData) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(match);
                      }}
                      className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {isDeletableScheduled
                          ? "Eliminar partido"
                          : "Eliminar / Suspender"}
                      </span>
                    </button>
                  )}

                  <Link
                    href={`/dashboard/partidos/${match.id}/logistica`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2 font-medium"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                    <span>Logística de cancha</span>
                  </Link>

                  <Link
                    href={`/tv/${match.id}`}
                    target="_blank"
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2 font-medium"
                  >
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Marcador para TV</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

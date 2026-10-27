"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { StatusBadge } from "@/components/sports/StatusBadge";
import { EventModal } from "@/components/match/EventModal";
import { MatchTimeline } from "@/components/match/MatchTimeline";
import { MatchEventType, MatchPeriod } from "@/types";
import { formatTime } from "@/lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Flag,
  Tv,
  ExternalLink,
  ClipboardList,
  FileText,
  AlertTriangle,
  Clock,
  Flame,
  Plus,
  Minus,
} from "lucide-react";

export default function LiveMatchCenterPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;

  const {
    matches,
    teams,
    venues,
    leagueSettings,
    updateMatchClock,
    adjustFouls,
    adjustTimeouts,
    changeMatchPeriod,
    changeMatchStatus,
  } = useFutsal();

  const match = matches.find((m) => m.id === matchId) || matches[0];
  const homeTeam = teams.find((t) => t.id === match?.home_team_id);
  const awayTeam = teams.find((t) => t.id === match?.away_team_id);
  const venue = venues.find((v) => v.id === match?.venue_id);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeEventType, setActiveEventType] = useState<MatchEventType | null>(null);

  if (!match) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-400">
          Partido no encontrado.
        </div>
      </DashboardLayout>
    );
  }

  // Calculate current elapsed minute from total seconds
  const totalSecondsInPeriod = leagueSettings.period_duration_minutes * 60;
  const elapsedSeconds = totalSecondsInPeriod - match.match_clock_seconds;
  const currentMinute = Math.max(
    1,
    Math.floor(elapsedSeconds / 60) +
      (match.period === "SEGUNDO_TIEMPO" ? leagueSettings.period_duration_minutes : 0)
  );

  const handleOpenEvent = (eventType: MatchEventType) => {
    setActiveEventType(eventType);
    setModalOpen(true);
  };

  const handleToggleTimer = () => {
    if (match.status !== "EN_VIVO") {
      changeMatchStatus(match.id, "EN_VIVO");
    }
    updateMatchClock(match.id, match.match_clock_seconds, !match.is_clock_running);
  };

  const handleResetTimer = () => {
    updateMatchClock(
      match.id,
      leagueSettings.period_duration_minutes * 60,
      false
    );
  };

  const handleAdvancePeriod = () => {
    if (match.period === "PREVIO") {
      changeMatchPeriod(match.id, "PRIMER_TIEMPO");
      changeMatchStatus(match.id, "EN_VIVO");
    } else if (match.period === "PRIMER_TIEMPO") {
      changeMatchPeriod(match.id, "DESCANSO");
      changeMatchStatus(match.id, "DESCANSO");
    } else if (match.period === "DESCANSO") {
      changeMatchPeriod(match.id, "SEGUNDO_TIEMPO");
      changeMatchStatus(match.id, "EN_VIVO");
    } else if (match.period === "SEGUNDO_TIEMPO") {
      changeMatchPeriod(match.id, "FINALIZADO");
      changeMatchStatus(match.id, "FINALIZADO");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-live-pulse" />
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                CENTRO DE PARTIDO EN VIVO
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  MESA TÉCNICA
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {venue?.name} • Control oficial de cronómetro, faltas y acontecimientos
              </p>
            </div>
          </div>

          {/* Quick External Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/partidos/${match.id}/acta`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              Acta Oficial
            </Link>

            <Link
              href={`/dashboard/partidos/${match.id}/logistica`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ClipboardList className="w-4 h-4 text-blue-400" />
              Logística
            </Link>

            <Link
              href={`/tv/${match.id}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Tv className="w-4 h-4" />
              Pantalla TV
            </Link>

            <Link
              href={`/partidos/${match.id}`}
              target="_blank"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Público
            </Link>
          </div>
        </div>

        {/* Big Interactive Arena Scoreboard */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-blue-500/40 shadow-2xl relative overflow-hidden">
          {/* Period selector tabs */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto">
              {(["PRIMER_TIEMPO", "DESCANSO", "SEGUNDO_TIEMPO", "FINALIZADO"] as MatchPeriod[]).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => changeMatchPeriod(match.id, p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all ${
                      match.period === p
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {p.replace("_", " ")}
                  </button>
                )
              )}
            </div>

            <StatusBadge status={match.status} size="md" />
          </div>

          {/* Teams & Scores Big Display */}
          <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-6">
            {/* Home Team */}
            <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-5">
              <div className="text-left md:text-right">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {homeTeam?.name}
                </h2>
                <div className="text-xs text-slate-400 font-semibold">{homeTeam?.city}</div>

                {/* Home Timeouts */}
                <div className="mt-2 flex items-center justify-start md:justify-end gap-1.5 text-xs text-slate-400">
                  <span className="text-[11px] font-bold">Tiempo Muerto:</span>
                  <span
                    className={`w-3 h-3 rounded-full border ${
                      match.home_timeouts >= 1
                        ? "bg-amber-400 border-amber-300"
                        : "bg-slate-800 border-slate-700"
                    }`}
                    title={match.home_timeouts >= 1 ? "Utilizado" : "Disponible"}
                  />
                  <button
                    onClick={() => adjustTimeouts(match.id, "home", match.home_timeouts >= 1 ? -1 : 1)}
                    className="text-[10px] text-blue-400 hover:underline ml-1"
                  >
                    {match.home_timeouts >= 1 ? "Liberar" : "Gastar"}
                  </button>
                </div>
              </div>

              <TeamLogo
                name={homeTeam?.name || ""}
                logoUrl={homeTeam?.logo_url}
                primaryColor={homeTeam?.primary_color}
                size="lg"
                className="w-20 h-20 text-xl"
              />
            </div>

            {/* Central Scoreboard Digit Display */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className="bg-[#030712] border-2 border-blue-500/50 rounded-2xl px-6 py-3 shadow-[0_0_35px_rgba(0,102,255,0.25)] flex items-center gap-3 font-scoreboard">
                <span className="text-4xl md:text-5xl font-black text-white">
                  {match.home_score}
                </span>
                <span className="text-slate-600 text-3xl font-black">:</span>
                <span className="text-4xl md:text-5xl font-black text-white">
                  {match.away_score}
                </span>
              </div>

              {/* Digital Timer */}
              <div className="mt-3 flex flex-col items-center">
                <div className="text-2xl md:text-3xl font-mono font-black tracking-wider text-emerald-400 bg-emerald-500/10 px-4 py-1 rounded-xl border border-emerald-500/30">
                  {formatTime(match.match_clock_seconds)}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                  Minuto de juego: {currentMinute}&apos;
                </div>
              </div>
            </div>

            {/* Away Team */}
            <div className="md:col-span-3 flex items-center justify-start gap-5">
              <TeamLogo
                name={awayTeam?.name || ""}
                logoUrl={awayTeam?.logo_url}
                primaryColor={awayTeam?.primary_color}
                size="lg"
                className="w-20 h-20 text-xl"
              />
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {awayTeam?.name}
                </h2>
                <div className="text-xs text-slate-400 font-semibold">{awayTeam?.city}</div>

                {/* Away Timeouts */}
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-[11px] font-bold">Tiempo Muerto:</span>
                  <span
                    className={`w-3 h-3 rounded-full border ${
                      match.away_timeouts >= 1
                        ? "bg-amber-400 border-amber-300"
                        : "bg-slate-800 border-slate-700"
                    }`}
                    title={match.away_timeouts >= 1 ? "Utilizado" : "Disponible"}
                  />
                  <button
                    onClick={() => adjustTimeouts(match.id, "away", match.away_timeouts >= 1 ? -1 : 1)}
                    className="text-[10px] text-blue-400 hover:underline ml-1"
                  >
                    {match.away_timeouts >= 1 ? "Liberar" : "Gastar"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Futsal Fouls Control Bar (Critical Requirement 21) */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Fouls */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  FALTAS ACUMULADAS ({homeTeam?.short_name})
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-black text-white font-scoreboard">
                    {match.home_fouls} / 5
                  </span>
                  {match.home_fouls >= 5 && (
                    <span className="text-[11px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30 animate-pulse">
                      ¡DOBLE PENALTI ACTIVO!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustFouls(match.id, "home", -1)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                  title="Restar falta (corrección)"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustFouls(match.id, "home", 1)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  + FALTA LOCAL
                </button>
              </div>
            </div>

            {/* Away Fouls */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  FALTAS ACUMULADAS ({awayTeam?.short_name})
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-black text-white font-scoreboard">
                    {match.away_fouls} / 5
                  </span>
                  {match.away_fouls >= 5 && (
                    <span className="text-[11px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30 animate-pulse">
                      ¡DOBLE PENALTI ACTIVO!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustFouls(match.id, "away", -1)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                  title="Restar falta (corrección)"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustFouls(match.id, "away", 1)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  + FALTA VISITANTE
                </button>
              </div>
            </div>
          </div>

          {/* Clock Operations Buttons (Big, touch-friendly) */}
          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleToggleTimer}
              className={`px-8 py-3.5 rounded-2xl text-sm font-black tracking-wider flex items-center gap-2.5 shadow-xl transition-all ${
                match.is_clock_running
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
              }`}
            >
              {match.is_clock_running ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  PAUSAR CRONÓMETRO
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  INICIAR / REANUDAR
                </>
              )}
            </button>

            <button
              onClick={handleAdvancePeriod}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <FastForward className="w-4 h-4 text-blue-400" />
              AVANZAR PERIODO
            </button>

            <button
              onClick={handleResetTimer}
              className="px-4 py-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Reiniciar a 20 minutos"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Tiempo
            </button>

            <button
              onClick={() => {
                changeMatchStatus(match.id, "FINALIZADO");
                changeMatchPeriod(match.id, "FINALIZADO");
              }}
              className="px-6 py-3.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 transition-all"
            >
              <Flag className="w-4 h-4" />
              FINALIZAR PARTIDO
            </button>
          </div>
        </div>

        {/* Event Buttons & Timeline Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action Buttons Grid (Requirements 19) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sports-card rounded-3xl p-6 border border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  PANEL DE ACONTECIMIENTOS Y ACCIONES RÁPIDAS
                </h3>
                <span className="text-xs text-slate-400">Tocar para registrar</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                {/* GOL */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("goal")}
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 border border-emerald-500/50 hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all text-center group shadow-lg shadow-emerald-950/40"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">⚽</div>
                  <div className="mt-2 text-sm font-black text-white">GOL</div>
                  <div className="text-[10px] text-emerald-400">+1 en marcador</div>
                </button>

                {/* ASISTENCIA */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("assist")}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">👟</div>
                  <div className="mt-2 text-sm font-black text-white">ASISTENCIA</div>
                  <div className="text-[10px] text-slate-400">Pase clave</div>
                </button>

                {/* TARJETA AMARILLA */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("yellow_card")}
                  className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">🟨</div>
                  <div className="mt-2 text-sm font-black text-white">AMARILLA</div>
                  <div className="text-[10px] text-amber-400">Amonestación</div>
                </button>

                {/* TARJETA ROJA */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("red_card")}
                  className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 hover:border-rose-400 hover:scale-105 active:scale-95 transition-all text-center group shadow-lg shadow-rose-950/40"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">🟥</div>
                  <div className="mt-2 text-sm font-black text-white">TARJETA ROJA</div>
                  <div className="text-[10px] text-rose-400">Expulsión directa</div>
                </button>

                {/* FALTA */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("foul")}
                  className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 hover:border-orange-400 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">⚠️</div>
                  <div className="mt-2 text-sm font-black text-white">FALTA</div>
                  <div className="text-[10px] text-orange-400">Infracción</div>
                </button>

                {/* PENALTI */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("penalty")}
                  className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-400 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">🎯</div>
                  <div className="mt-2 text-sm font-black text-white">PENALTI</div>
                  <div className="text-[10px] text-purple-400">Desde 6 metros</div>
                </button>

                {/* DOBLE PENALTI */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("double_penalty")}
                  className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-400 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">⚡</div>
                  <div className="mt-2 text-sm font-black text-white">DOBLE PENALTI</div>
                  <div className="text-[10px] text-yellow-400">Tiro libre 10m</div>
                </button>

                {/* CAMBIO */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("substitution")}
                  className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">🔄</div>
                  <div className="mt-2 text-sm font-black text-white">CAMBIO</div>
                  <div className="text-[10px] text-cyan-400">Sustitución</div>
                </button>

                {/* TIEMPO MUERTO */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("timeout")}
                  className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-400 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">⏱️</div>
                  <div className="mt-2 text-sm font-black text-white">TIEMPO MUERTO</div>
                  <div className="text-[10px] text-indigo-400">1 min de receso</div>
                </button>

                {/* LESIÓN */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("injury")}
                  className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-400 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">🩹</div>
                  <div className="mt-2 text-sm font-black text-white">LESIÓN</div>
                  <div className="text-[10px] text-rose-400">Atención médica</div>
                </button>

                {/* NOTA */}
                <button
                  type="button"
                  onClick={() => handleOpenEvent("note")}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-slate-500 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">📝</div>
                  <div className="mt-2 text-sm font-black text-white">NOTA</div>
                  <div className="text-[10px] text-slate-400">Incidencia arbitral</div>
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Column */}
          <div className="lg:col-span-1">
            <MatchTimeline matchId={match.id} allowDelete={true} />
          </div>
        </div>
      </div>

      {/* Interactive Modal for Events */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        match={match}
        eventType={activeEventType}
        currentMinute={currentMinute}
      />
    </DashboardLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useFutsal } from "@/lib/store/futsalStore";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { formatTime } from "@/lib/utils";
import { Maximize2, Minimize2, Radio, Trophy, Shield } from "lucide-react";

export default function TvScoreboardPage() {
  const params = useParams();
  const matchId = params?.matchId as string;

  const { matches, teams, matchdays, matchEvents } = useFutsal();

  const match = matches.find((m) => m.id === matchId) || matches[0];
  const homeTeam = teams.find((t) => t.id === match?.home_team_id);
  const awayTeam = teams.find((t) => t.id === match?.away_team_id);
  const matchday = matchdays.find((m) => m.id === match?.matchday_id);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Extract recent cards for both teams
  const homeCards = matchEvents.filter(
    (e) =>
      e.match_id === match?.id &&
      e.team_id === match?.home_team_id &&
      (e.event_type === "yellow_card" || e.event_type === "red_card")
  );

  const awayCards = matchEvents.filter(
    (e) =>
      e.match_id === match?.id &&
      e.team_id === match?.away_team_id &&
      (e.event_type === "yellow_card" || e.event_type === "red_card")
  );

  if (!match) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-bold">
        Cargando marcador oficial...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between p-6 md:p-12 selection:bg-none select-none overflow-hidden relative">
      {/* Background ambient sports lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-600/20">
            F
          </div>
          <div>
            <div className="font-black text-2xl md:text-3xl tracking-widest text-white flex items-center gap-2">
              FUTSALBA
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                OFICIAL
              </span>
            </div>
            <div className="text-xs md:text-sm font-bold text-slate-400 tracking-wider">
              {matchday?.name} • LIGA REGULAR 2026
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-sm tracking-wider animate-pulse">
            <Radio className="w-4 h-4" />
            EN VIVO
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 shadow-md"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Center Scoreboard Area */}
      <main className="my-auto py-8 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-7 items-center gap-8 md:gap-12">
          {/* HOME TEAM */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-end text-center lg:text-right">
            <TeamLogo
              name={homeTeam?.name || "H"}
              shortName={homeTeam?.short_name}
              logoUrl={homeTeam?.logo_url}
              primaryColor={homeTeam?.primary_color}
              size="xl"
              className="w-32 h-32 md:w-44 md:h-44 rounded-3xl shadow-2xl border-2 border-white/20 mb-4"
            />
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
              {homeTeam?.name}
            </h1>
            <div className="text-sm md:text-base font-bold text-slate-400 mt-1">
              {homeTeam?.city}
            </div>

            {/* Home Fouls & Cards on TV */}
            <div className="mt-5 flex items-center justify-center lg:justify-end gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">FALTAS:</span>
                <span className={`text-xl font-scoreboard font-black ${match.home_fouls >= 5 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                  {match.home_fouls} / 5
                </span>
              </div>

              {homeCards.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
                  {homeCards.map((c, i) => (
                    <span key={i} className="text-sm">
                      {c.event_type === "yellow_card" ? "🟨" : "🟥"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CENTER DIGITAL SCORE & CLOCK */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center">
            {/* LED Big Score */}
            <div className="bg-[#050b17] border-4 border-blue-500/60 rounded-3xl px-8 py-5 shadow-[0_0_50px_rgba(0,102,255,0.35)] flex items-center gap-4 font-scoreboard">
              <span className="text-6xl md:text-8xl font-black text-white">
                {match.home_score}
              </span>
              <span className="text-4xl md:text-6xl font-black text-slate-600">:</span>
              <span className="text-6xl md:text-8xl font-black text-white">
                {match.away_score}
              </span>
            </div>

            {/* LED Clock */}
            <div className="mt-6 flex flex-col items-center">
              <div className="text-3xl md:text-5xl font-scoreboard font-black tracking-wider text-emerald-400 bg-emerald-500/10 px-6 py-2 rounded-2xl border-2 border-emerald-500/40 shadow-lg">
                {formatTime(match.match_clock_seconds)}
              </div>
              <div className="mt-2 text-xs md:text-sm font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                {String(match.period).replace("_", " ")}
              </div>

            </div>
          </div>

          {/* AWAY TEAM */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left">
            <TeamLogo
              name={awayTeam?.name || "A"}
              shortName={awayTeam?.short_name}
              logoUrl={awayTeam?.logo_url}
              primaryColor={awayTeam?.primary_color}
              size="xl"
              className="w-32 h-32 md:w-44 md:h-44 rounded-3xl shadow-2xl border-2 border-white/20 mb-4"
            />
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
              {awayTeam?.name}
            </h1>
            <div className="text-sm md:text-base font-bold text-slate-400 mt-1">
              {awayTeam?.city}
            </div>

            {/* Away Fouls & Cards on TV */}
            <div className="mt-5 flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">FALTAS:</span>
                <span className={`text-xl font-scoreboard font-black ${match.away_fouls >= 5 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                  {match.away_fouls} / 5
                </span>
              </div>

              {awayCards.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
                  {awayCards.map((c, i) => (
                    <span key={i} className="text-sm">
                      {c.event_type === "yellow_card" ? "🟨" : "🟥"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Double Penalty Banner if 5 fouls reached */}
        {(match.home_fouls >= 5 || match.away_fouls >= 5) && (
          <div className="mt-8 max-w-xl mx-auto p-3 rounded-2xl bg-rose-500/20 border border-rose-500 text-center animate-pulse">
            <span className="text-sm font-black text-rose-300 tracking-wider">
              ⚠️ ATENCIÓN: PRÓXIMA FALTA TIRO LIBRE SIN BARRERA DESDE LOS 10 METROS (DOBLE PENALTI)
            </span>
          </div>
        )}
      </main>

      {/* Bottom Footer Info */}
      <footer className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 relative z-10 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-200">SEÑAL DE PANTALLA OFICIAL</span>
          <span>•</span>
          <span>SISTEMA DE TRANSMISIÓN FUTSALBA REALTIME</span>
        </div>
        <div className="font-mono text-slate-500">
          ACTUALIZACIÓN AUTOMÁTICA EN TIEMPO REAL
        </div>
      </footer>
    </div>
  );
}

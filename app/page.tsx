"use client";

import React from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { StatusBadge } from "@/components/sports/StatusBadge";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { TopScorers } from "@/components/sports/TopScorers";
import { MatchCard } from "@/components/sports/MatchCard";
import { formatTime } from "@/lib/utils";
import {
  Trophy,
  Calendar,
  Flame,
  Tv,
  Radio,
  ChevronRight,
  Shield,
  Users,
  Activity,
  ArrowRight,
  LogIn,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  const { matches, teams, standings, players, isAuthenticated, currentUserRole } = useFutsal();

  const liveMatch = matches.find((m) => m.status === "EN_VIVO" || m.status === "DESCANSO") || matches[4];
  const homeTeam = teams.find((t) => t.id === liveMatch?.home_team_id);
  const awayTeam = teams.find((t) => t.id === liveMatch?.away_team_id);

  const upcomingMatches = matches.filter((m) => m.status === "PROGRAMADO");
  const recentResults = matches.filter((m) => m.status === "FINALIZADO");

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Ticker Bar */}
      <div className="bg-[#03060d] border-b border-slate-800/80 px-4 py-2 text-xs overflow-x-auto whitespace-nowrap flex items-center justify-between">
        <div className="flex items-center gap-6 animate-none">
          <span className="flex items-center gap-1.5 font-black text-blue-400 uppercase tracking-widest text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            MARCADORES EN DIRECTO:
          </span>

          {matches.map((m) => {
            const h = teams.find((t) => t.id === m.home_team_id);
            const a = teams.find((t) => t.id === m.away_team_id);
            return (
              <Link
                key={m.id}
                href={`/partidos/${m.id}`}
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <span className="font-bold">{h?.short_name}</span>
                <span className="font-scoreboard font-black text-blue-400">
                  {m.home_score}-{m.away_score}
                </span>
                <span className="font-bold">{a?.short_name}</span>
                {m.status === "EN_VIVO" && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE
                  </span>
                )}
                <span className="text-slate-700 ml-2">•</span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/login"
          className="hidden md:flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-blue-400 transition-colors ml-4 shrink-0"
        >
          <LogIn className="w-3.5 h-3.5" />
          Acceso Oficial Mesa y Delegados
        </Link>
      </div>

      {/* Main Official Header */}
      <header className="sticky top-0 z-40 bg-[#070d1c]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">
            F
          </div>
          <div>
            <div className="font-black text-lg md:text-xl tracking-wider text-white flex items-center gap-1.5">
              FUTSALBA
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                OFICIAL
              </span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Liga Profesional de Fútbol Sala
            </div>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Link href="#partidos" className="hover:text-blue-400 transition-colors">
            Partidos
          </Link>
          <Link href="#clasificacion" className="hover:text-blue-400 transition-colors">
            Clasificación
          </Link>
          <Link href="#estadisticas" className="hover:text-blue-400 transition-colors">
            Estadísticas
          </Link>
          <Link href="#noticias" className="hover:text-blue-400 transition-colors">
            Noticias
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/mi-cuenta"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black tracking-wider uppercase border border-slate-700 shadow-md transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              MI CUENTA
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              INICIAR SESIÓN
            </Link>
          )}
        </div>
      </header>

      {/* Hero Stadium Section with Featured Match */}
      <section className="relative overflow-hidden py-12 md:py-20 px-4 md:px-8 bg-gradient-to-b from-[#0a1226] via-[#060b14] to-[#050914] border-b border-slate-800">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-black tracking-widest uppercase animate-pulse">
              <Flame className="w-4 h-4 text-amber-400" />
              TEMPORADA 2026 • LIGA PROFESIONAL
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
              LA PASIÓN DEL FUTSAL <br className="hidden md:inline" /> EN TIEMPO REAL
            </h1>
            <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto">
              Sigue cada gol, falta acumulada, estadísticas en vivo y el fixture oficial de los clubes de FUTSALBA.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="#partidos"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
              >
                VER PARTIDOS
              </Link>
              <Link
                href="/clasificacion"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
              >
                CLASIFICACIÓN
              </Link>
              <Link
                href="#estadisticas"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
              >
                ESTADÍSTICAS
              </Link>
            </div>
          </div>

          {/* Featured Live Match Center Card */}
          {liveMatch && (
            <div className="sports-card rounded-3xl p-6 md:p-10 border-2 border-blue-500/40 shadow-2xl max-w-4xl mx-auto relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-extrabold uppercase tracking-wider text-emerald-400">
                    PARTIDO ESTELAR DE LA JORNADA
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/tv/${liveMatch.id}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 rounded-lg border border-slate-700 transition-colors"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    Marcador TV
                  </Link>
                  <StatusBadge status={liveMatch.status} size="sm" />
                </div>
              </div>

              <div className="py-6 grid grid-cols-1 md:grid-cols-7 items-center gap-6">
                {/* Home */}
                <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-4 text-left md:text-right">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase">
                      {homeTeam?.name}
                    </h3>
                    <div className="text-xs text-slate-400">{homeTeam?.city}</div>
                    <div className="mt-1 text-xs font-bold text-slate-300">
                      {liveMatch.home_fouls} Faltas
                    </div>
                  </div>
                  <TeamLogo
                    name={homeTeam?.name || ""}
                    logoUrl={homeTeam?.logo_url}
                    primaryColor={homeTeam?.primary_color}
                    size="lg"
                  />
                </div>

                {/* Score */}
                <div className="md:col-span-1 flex flex-col items-center justify-center">
                  <div className="bg-[#030712] border-2 border-slate-700 rounded-2xl px-5 py-2 shadow-2xl flex items-center gap-2 font-scoreboard text-3xl md:text-4xl font-black text-white">
                    <span>{liveMatch.home_score}</span>
                    <span className="text-slate-600">:</span>
                    <span>{liveMatch.away_score}</span>
                  </div>
                  <div className="mt-2 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {formatTime(liveMatch.match_clock_seconds)} • {String(liveMatch.period).replace("_", " ")}
                  </div>

                </div>

                {/* Away */}
                <div className="md:col-span-3 flex items-center justify-start gap-4 text-left">
                  <TeamLogo
                    name={awayTeam?.name || ""}
                    logoUrl={awayTeam?.logo_url}
                    primaryColor={awayTeam?.primary_color}
                    size="lg"
                  />
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase">
                      {awayTeam?.name}
                    </h3>
                    <div className="text-xs text-slate-400">{awayTeam?.city}</div>
                    <div className="mt-1 text-xs font-bold text-slate-300">
                      {liveMatch.away_fouls} Faltas
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Polideportivo Cancha Central • 20:00 hs</span>
                <Link
                  href={`/partidos/${liveMatch.id}`}
                  className="text-blue-400 hover:text-white font-bold flex items-center gap-1"
                >
                  Seguimiento detallado en vivo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Grid Content: Matches, Standings & Top Scorers */}
      <section id="partidos" className="max-w-6xl w-full mx-auto px-4 md:px-8 py-12 space-y-12">
        {/* Próximos Encuentros y Últimos Resultados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Próximos Partidos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                PRÓXIMOS PARTIDOS PROGRAMADOS
              </h2>
            </div>

            <div className="space-y-4">
              {upcomingMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
              {upcomingMatches.length === 0 && (
                <div className="sports-card rounded-2xl p-8 text-center text-xs text-slate-400">
                  No hay partidos pendientes en esta fecha.
                </div>
              )}
            </div>
          </div>

          {/* Últimos Resultados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                ÚLTIMOS RESULTADOS OFICIALES
              </h2>
            </div>

            <div className="space-y-4">
              {recentResults.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        </div>

        {/* Clasificación y Goleadores */}
        <div id="clasificacion" className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          <div className="lg:col-span-2">
            <StandingsTable standings={standings} compact={false} />
          </div>

          <div id="estadisticas" className="lg:col-span-1">
            <TopScorers limit={5} />
          </div>
        </div>

        {/* Noticias y Novedades de la Liga (Requirement 52) */}
        <div id="noticias" className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              NOTICIAS Y BOLETINES DE LA LIGA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="sports-card rounded-3xl p-6 border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                COMUNICADO OFICIAL
              </span>
              <h3 className="font-bold text-white text-base">
                Aprobación del reglamento de doble penalti para el Torneo Apertura 2026
              </h3>
              <p className="text-xs text-slate-400">
                El Tribunal Disciplinario y el Colegio de Árbitros ratifican la aplicación de la regla FIFA de la 5ta falta acumulada.
              </p>
              <div className="text-[10px] text-slate-500 pt-2">Hace 2 días • Secretaría General</div>
            </div>

            <div className="sports-card rounded-3xl p-6 border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                INFRAESTRUCTURA
              </span>
              <h3 className="font-bold text-white text-base">
                Inauguración de la superficie de parquet flotante en el Microestadio Municipal
              </h3>
              <p className="text-xs text-slate-400">
                La nueva cancha cuenta con tecnología de amortiguación de alto impacto y capacidad para más de 3,500 personas.
              </p>
              <div className="text-[10px] text-slate-500 pt-2">Hace 4 días • Comisión de Sedes</div>
            </div>

            <div className="sports-card rounded-3xl p-6 border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                SELECCIÓN Y FIGURAS
              </span>
              <h3 className="font-bold text-white text-base">
                Juan Pérez lidera la tabla de goleo con 6 tantos en 3 presentaciones
              </h3>
              <p className="text-xs text-slate-400">
                El pivot de Tigres FC viene siendo una de las grandes figuras de la temporada con actuaciones determinantes en los cierres.
              </p>
              <div className="text-[10px] text-slate-500 pt-2">Hoy • Prensa FUTSALBA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#03060d] py-10 px-4 md:px-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm">
              F
            </div>
            <div>
              <div className="font-bold text-white">FUTSALBA MANAGER</div>
              <div className="text-[10px] text-slate-500">
                © 2026 Asociación Oficial de Fútbol Sala. Todos los derechos reservados.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="#partidos" className="hover:text-blue-400 transition-colors">
              Partidos
            </Link>
            <Link href="/clasificacion" className="hover:text-blue-400 transition-colors">
              Clasificación
            </Link>
            <Link href="#estadisticas" className="hover:text-blue-400 transition-colors">
              Estadísticas
            </Link>
            <Link href="/login" className="hover:text-blue-400 transition-colors">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

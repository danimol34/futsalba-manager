"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { publicSportsService } from "@/lib/services/publicSports";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { TopScorers } from "@/components/sports/TopScorers";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Match, Team, Standing, Player } from "@/types";
import {
  Activity,
  Flame,
  Trophy,
  Award,
  Shield,
  ArrowLeft,
  Users,
  Target,
  BarChart3,
} from "lucide-react";

export default function EstadisticasPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    Promise.all([
      publicSportsService.getPublicMatches(),
      publicSportsService.getPublicTeams(),
      publicSportsService.getPublicStandings(),
      publicSportsService.getPublicPlayers(),
    ])
      .then(([mList, tList, sList, pList]) => {
        if (isMounted) {
          setMatches(mList || []);
          setTeams(tList || []);
          setStandings(sList || []);
          setPlayers(pList || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[EstadisticasPage] Error:", err);
          setFetchError("No se pudieron cargar las estadísticas oficiales.");
          setMatches([]);
          setTeams([]);
          setStandings([]);
          setPlayers([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const finishedMatches = matches.filter((m) => m.status === "FINALIZADO");
  const totalGoals = finishedMatches.reduce((acc, m) => acc + m.home_score + m.away_score, 0);
  const avgGoalsPerMatch =
    finishedMatches.length > 0 ? (totalGoals / finishedMatches.length).toFixed(1) : "0.0";

  // Top attacking team
  const topAttack = [...standings].sort((a, b) => b.goals_for - a.goals_for)[0];
  // Top defensive team
  const topDefense = [...standings]
    .filter((s) => s.played > 0)
    .sort((a, b) => a.goals_against - b.goals_against)[0];

  return (
    <AuthGuard fallbackMessage="Verificando acceso a Estadísticas...">
      <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        <PublicHeader currentPath="/estadisticas" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            Volver a la portada oficial
          </Link>

          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            FUTSALBA Oficial • Temporada 2026
          </span>
        </div>

        {/* Title */}
        <div className="pb-4 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Activity className="w-3.5 h-3.5" />
            Rendimiento Deportivo
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            ESTADÍSTICAS OFICIALES
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Líderes de goleo individual, registros de efectividad y métricas colectivas de la Liga FUTSALBA.
          </p>
        </div>

        {loading ? (
          <div className="sports-card rounded-2xl p-12 text-center border border-slate-800">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Cargando estadísticas oficiales...
            </p>
          </div>
        ) : fetchError ? (
          <div className="sports-card rounded-2xl p-8 text-center border border-rose-900/40 bg-rose-950/20">
            <p className="text-sm font-bold text-rose-400 mb-3">{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          /* Overview Metric Cards */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sports-card rounded-2xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Goles Totales</span>
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-white font-scoreboard">
                {totalGoals}
              </div>
              <p className="text-[11px] text-slate-500">En {finishedMatches.length} partidos jugados</p>
            </div>

            <div className="sports-card rounded-2xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Promedio / Partido</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-white font-scoreboard">
                {avgGoalsPerMatch}
              </div>
              <p className="text-[11px] text-slate-500">Goles por encuentro</p>
            </div>

            <div className="sports-card rounded-2xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Mejor Ataque</span>
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg md:text-xl font-black text-white truncate">
                {topAttack?.team_name || "Sin registros"}
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">
                {topAttack?.goals_for ?? 0} goles marcados
              </p>
            </div>

            <div className="sports-card rounded-2xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Mejor Defensa</span>
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg md:text-xl font-black text-white truncate">
                {topDefense?.team_name || "Sin registros"}
              </div>
              <p className="text-[11px] text-cyan-400 font-bold">
                {topDefense?.goals_against ?? 0} goles recibidos
              </p>
            </div>
          </div>
        )}

        {/* Top Scorers and Team Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Tabla de Máximos Goleadores
              </h2>
            </div>
            <TopScorers limit={10} players={players} teams={teams} />
          </div>

          {/* Quick Navigation to Other Modules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Módulos Relacionados
              </h2>
            </div>

            <div className="sports-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">Tabla General de Posiciones</h3>
                <p className="text-xs text-slate-400">
                  Revisa la tabla completa con puntos, diferencia de gol y racha de cada equipo.
                </p>
              </div>

              <Link
                href="/clasificacion"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Ver Clasificación
              </Link>
            </div>

            <div className="sports-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">Calendario de Partidos</h3>
                <p className="text-xs text-slate-400">
                  Explora el cronograma de fechas, partidos por jugar y actas oficiales.
                </p>
              </div>

              <Link
                href="/partidos"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
              >
                <Target className="w-4 h-4" />
                Ver Calendario y Resultados
              </Link>
            </div>
          </div>
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}

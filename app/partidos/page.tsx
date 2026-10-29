"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { publicSportsService } from "@/lib/services/publicSports";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { MatchCard } from "@/components/sports/MatchCard";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Match, Team } from "@/types";
import {
  Calendar,
  Radio,
  Trophy,
  Clock,
  Filter,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

export default function PartidosPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"TODOS" | "EN_VIVO" | "PROGRAMADO" | "FINALIZADO">("TODOS");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    Promise.all([
      publicSportsService.getPublicMatches(),
      publicSportsService.getPublicTeams(),
    ])
      .then(([mList, tList]) => {
        if (isMounted) {
          setMatches(mList || []);
          setTeams(tList || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[PartidosPage] Error:", err);
          setFetchError("No se pudieron consultar los partidos oficiales.");
          setMatches([]);
          setTeams([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (filter === "EN_VIVO" && m.status !== "EN_VIVO" && m.status !== "DESCANSO") return false;
    if (filter === "PROGRAMADO" && m.status !== "PROGRAMADO") return false;
    if (filter === "FINALIZADO" && m.status !== "FINALIZADO") return false;
    if (selectedTeam !== "ALL" && m.home_team_id !== selectedTeam && m.away_team_id !== selectedTeam) {
      return false;
    }
    return true;
  });

  const liveMatches = matches.filter((m) => m.status === "EN_VIVO" || m.status === "DESCANSO");
  const upcomingMatches = matches.filter((m) => m.status === "PROGRAMADO");
  const finishedMatches = matches.filter((m) => m.status === "FINALIZADO");

  return (
    <AuthGuard fallbackMessage="Verificando acceso a Partidos...">
      <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        <PublicHeader currentPath="/partidos" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        {/* Breadcrumb & Navigation */}
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

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Fixture Oficial
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
              CALENDARIO Y PARTIDOS
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Consulta las fechas oficiales, encuentros en vivo, resultados y marcadores detallados de la Liga.
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-3 text-xs">
            {liveMatches.length > 0 && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                {liveMatches.length} En Vivo
              </span>
            )}
            <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold">
              {matches.length} Partidos
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter("TODOS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === "TODOS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Todos ({matches.length})
            </button>
            <button
              onClick={() => setFilter("EN_VIVO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === "EN_VIVO"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              En Vivo ({liveMatches.length})
            </button>
            <button
              onClick={() => setFilter("PROGRAMADO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === "PROGRAMADO"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Próximos ({upcomingMatches.length})
            </button>
            <button
              onClick={() => setFilter("FINALIZADO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === "FINALIZADO"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Finalizados ({finishedMatches.length})
            </button>
          </div>

          {/* Team Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los Equipos</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Match Cards Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="sports-card rounded-3xl p-12 text-center space-y-3 border border-slate-800">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Cargando fixture oficial...
              </p>
            </div>
          ) : fetchError ? (
            <div className="sports-card rounded-3xl p-12 text-center space-y-3 border border-rose-900/40 bg-rose-950/20">
              <p className="text-sm font-bold text-rose-400">{fetchError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="sports-card rounded-3xl p-12 text-center space-y-3 border border-slate-800">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No hay partidos programados actualmente.
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                La comisión de torneo aún no ha publicado el calendario oficial de esta fecha.
              </p>
            </div>
          ) : filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="sports-card rounded-3xl p-12 text-center space-y-3 border border-slate-800">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No hay partidos para el filtro seleccionado
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Prueba cambiando los criterios de búsqueda o revisa las demás jornadas del calendario oficial.
              </p>
            </div>
          )}
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}

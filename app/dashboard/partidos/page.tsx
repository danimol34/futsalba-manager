"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MatchCard } from "@/components/sports/MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchStatus } from "@/types";
import {
  Swords,
  Plus,
  Filter,
  Search,
  Radio,
  Calendar,
  Layers,
  Loader2,
} from "lucide-react";

export default function MatchesListPage() {
  const router = useRouter();
  const { matches, matchdays, competitions, teams, isLoadingRemote, currentUserRole } = useFutsal();
  const isReadOnly = currentUserRole === "PRENSA";

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [matchdayFilter, setMatchdayFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const matchesStatus =
        statusFilter === "ALL" || m.status === statusFilter;
      const matchesMatchday =
        matchdayFilter === "ALL" || m.matchday_id === matchdayFilter;
      const matchesTeam =
        teamFilter === "ALL" ||
        m.home_team_id === teamFilter ||
        m.away_team_id === teamFilter;

      return matchesStatus && matchesMatchday && matchesTeam;
    });
  }, [matches, statusFilter, matchdayFilter, teamFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              FIXTURE Y PARTIDOS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Programación oficial, seguimiento en vivo, actas y control de mesa técnica (Supabase).
            </p>
          </div>

          {!isReadOnly && (
            <Link
              href="/dashboard/partidos/nuevo"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              PROGRAMAR PARTIDO
            </Link>
          )}
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los estados</option>
              <option value="EN_VIVO">EN VIVO / EN DESARROLLO</option>
              <option value="PROGRAMADO">PROGRAMADOS</option>
              <option value="FINALIZADO">FINALIZADOS</option>
              <option value="DESCANSO">EN DESCANSO</option>
              <option value="SUSPENDIDO">SUSPENDIDOS</option>
              <option value="CANCELADO">CANCELADOS</option>
            </select>
          </div>

          <div>
            <select
              value={matchdayFilter}
              onChange={(e) => setMatchdayFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todas las jornadas</option>
              {matchdays.map((md) => (
                <option key={md.id} value={md.id}>
                  {md.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los equipos</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.short_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoadingRemote && matches.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium">Cargando partidos desde Supabase...</p>
          </div>
        ) : matches.length === 0 ? (
          /* Empty State when no matches exist in Supabase */
          <EmptyState
            icon={Swords}
            title="No hay partidos programados."
            description="Programa los encuentros oficiales entre los clubes de la liga para comenzar el campeonato."
            actionLabel="+ Programar primer partido"
            onAction={() => router.push("/dashboard/partidos/nuevo")}
          />
        ) : filteredMatches.length === 0 ? (
          /* Empty State for filters */
          <EmptyState
            icon={Swords}
            title="No se encontraron partidos"
            description="No hay encuentros que coincidan con los filtros seleccionados."
            secondaryActionLabel="Restablecer filtros"
            onSecondaryAction={() => {
              setStatusFilter("ALL");
              setMatchdayFilter("ALL");
              setTeamFilter("ALL");
            }}
          />
        ) : (
          /* Matches list */
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

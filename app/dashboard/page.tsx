"use client";

import React from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/sports/StatCard";
import { LiveMatchCard } from "@/components/sports/LiveMatchCard";
import { MatchCard } from "@/components/sports/MatchCard";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { TopScorers } from "@/components/sports/TopScorers";
import {
  CalendarDays,
  Shield,
  Users,
  Trophy,
  Flame,
  AlertOctagon,
  ArrowRight,
  Plus,
  Radio,
} from "lucide-react";

export default function DashboardPage() {
  const {
    teams,
    players,
    matches,
    standings,
    sanctions,
  } = useFutsal();

  // Metrics computation
  const matchesToday = matches.filter((m) => m.match_date === "2026-10-05");
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  const matchesPlayed = matches.filter((m) => m.status === "FINALIZADO").length;
  const totalGoals = matches.reduce((sum, m) => sum + m.home_score + m.away_score, 0);
  const activeSanctions = sanctions.filter((s) => s.status === "ACTIVA" || s.status === "PENDIENTE").length;

  // Prominent live/next match (match-301)
  const featuredMatch = matches.find((m) => m.id === "match-301") || matches[0];

  // Recent results
  const finishedMatches = matches
    .filter((m) => m.status === "FINALIZADO")
    .slice(0, 3);

  // Upcoming matches
  const upcomingMatches = matches
    .filter((m) => m.status === "PROGRAMADO")
    .slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              PANEL GENERAL
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                TEMPORADA 2026
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Bienvenido al sistema de administración y control operativo de la Liga FUTSALBA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/partidos/nuevo"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo Partido
            </Link>
          </div>
        </div>

        {/* 6 Key Metric Stat Cards (Requirement 5) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="PARTIDOS HOY"
            value={matchesToday.length}
            icon={<CalendarDays className="w-5 h-5 text-blue-400" />}
            subtitle="2 programados"
            accentColor="blue"
          />

          <StatCard
            title="EQUIPOS"
            value={totalTeams}
            icon={<Shield className="w-5 h-5 text-emerald-400" />}
            subtitle="Clubes activos"
            accentColor="emerald"
          />

          <StatCard
            title="JUGADORES"
            value={totalPlayers}
            icon={<Users className="w-5 h-5 text-purple-400" />}
            subtitle="Fichas federadas"
            accentColor="purple"
          />

          <StatCard
            title="PARTIDOS JUGADOS"
            value={matchesPlayed}
            icon={<Trophy className="w-5 h-5 text-amber-400" />}
            subtitle="Jornadas 1 y 2"
            accentColor="amber"
          />

          <StatCard
            title="GOLES"
            value={totalGoals}
            icon={<Flame className="w-5 h-5 text-amber-500" />}
            subtitle="Promedio 4.8 / PJ"
            accentColor="amber"
          />

          <StatCard
            title="SANCIONES ACTIVAS"
            value={activeSanctions}
            icon={<AlertOctagon className="w-5 h-5 text-rose-400" />}
            subtitle="Tribunal Disciplina"
            accentColor="rose"
          />
        </div>

        {/* Featured Live Match Card with Score & Logistics (Requirement 5 & 18) */}
        <div>
          <LiveMatchCard match={featuredMatch} />
        </div>

        {/* Standings Table & Top Scorers Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StandingsTable standings={standings} compact={true} />
          </div>

          <div className="lg:col-span-1">
            <TopScorers limit={5} />
          </div>
        </div>

        {/* Recent Results & Upcoming Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ÚLTIMOS RESULTADOS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                ÚLTIMOS RESULTADOS
              </h3>
              <Link
                href="/dashboard/partidos"
                className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {finishedMatches.map((m) => (
                <MatchCard key={m.id} match={m} compact={true} />
              ))}
            </div>
          </div>

          {/* PRÓXIMOS PARTIDOS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-400" />
                PRÓXIMOS PARTIDOS
              </h3>
              <Link
                href="/dashboard/calendario"
                className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                Ver calendario <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingMatches.map((m) => (
                <MatchCard key={m.id} match={m} compact={true} />
              ))}
              {upcomingMatches.length === 0 && (
                <div className="sports-card rounded-2xl p-6 text-center text-xs text-slate-500">
                  No hay más partidos programados en la jornada activa.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

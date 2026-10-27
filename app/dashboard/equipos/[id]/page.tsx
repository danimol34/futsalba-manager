"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { PlayerAvatar, PositionBadge } from "@/components/sports/PlayerAvatar";
import { MatchCard } from "@/components/sports/MatchCard";
import {
  Shield,
  ArrowLeft,
  Users,
  Calendar,
  Trophy,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Flame,
} from "lucide-react";

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params?.id as string;

  const { teams, players, matches, standings, sanctions } = useFutsal();

  const team = teams.find((t) => t.id === teamId) || teams[0];
  const teamPlayers = players.filter((p) => p.team_id === team?.id);
  const teamMatches = matches.filter(
    (m) => m.home_team_id === team?.id || m.away_team_id === team?.id
  );
  const teamStanding = standings.find((s) => s.team_id === team?.id);
  const teamSanctions = sanctions.filter((s) => s.team_id === team?.id);

  const [activeTab, setActiveTab] = useState<"plantilla" | "partidos" | "sanciones">("plantilla");

  if (!team) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-400">Equipo no encontrado.</div>
      </DashboardLayout>
    );
  }

  // Team top scorers
  const teamScorers = [...teamPlayers].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0));


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation back */}
        <Link
          href="/dashboard/equipos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a equipos
        </Link>

        {/* Team Hero Header */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <TeamLogo
                name={team.name}
                shortName={team.short_name}
                logoUrl={team.logo_url}
                primaryColor={team.primary_color}
                size="xl"
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl"
              />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {team.name}
                  </h1>
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                    {team.short_name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {team.city}
                  </span>
                  <span>•</span>
                  <span>DT: <strong className="text-white">{team.coach_name}</strong></span>
                  <span>•</span>
                  <span>Delegado: <strong className="text-slate-300">{team.delegate_name}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Record Stats */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center min-w-[70px]">
                <div className="text-[10px] text-slate-400 uppercase font-bold">PJ</div>
                <div className="text-xl font-black text-white">{teamStanding?.played || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center min-w-[70px]">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">PG</div>
                <div className="text-xl font-black text-emerald-400">{teamStanding?.won || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center min-w-[70px]">
                <div className="text-[10px] text-blue-400 uppercase font-bold">PTS</div>
                <div className="text-xl font-black text-blue-400">{teamStanding?.points || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("plantilla")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "plantilla"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Plantilla Oficial ({teamPlayers.length})
          </button>

          <button
            onClick={() => setActiveTab("partidos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "partidos"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Partidos y Resultados ({teamMatches.length})
          </button>

          <button
            onClick={() => setActiveTab("sanciones")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "sanciones"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Sanciones ({teamSanctions.length})
          </button>
        </div>

        {/* Tab 1: Plantilla */}
        {activeTab === "plantilla" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamPlayers.map((player) => (
              <div
                key={player.id}
                className="sports-card rounded-2xl p-4 border border-slate-800 hover:border-blue-500/40 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar player={player} size="md" />
                  <div>
                    <Link
                      href={`/dashboard/jugadores/${player.id}`}
                      className="font-bold text-sm text-white hover:text-blue-400 transition-colors block"
                    >
                      {player.first_name} {player.last_name}
                    </Link>
                    <div className="mt-1">
                      <PositionBadge position={player.position} />
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-bold text-amber-400">{player.goals} ⚽</div>
                  <div className="text-[10px] text-slate-400">{player.matches_played} PJ</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Partidos */}
        {activeTab === "partidos" && (
          <div className="space-y-4">
            {teamMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Tab 3: Sanciones */}
        {activeTab === "sanciones" && (
          <div className="sports-card rounded-2xl p-6 border border-slate-800">
            {teamSanctions.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8">
                El club no registra sanciones disciplinarias activas ni expedientes abiertos.
              </div>
            ) : (
              <div className="space-y-3">
                {teamSanctions.map((s) => {
                  const p = players.find((pl) => pl.id === s.player_id);
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">
                          #{p?.jersey_number} {p?.first_name} {p?.last_name}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{s.reason}</p>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Fecha dictamen: {s.date_issued} • Partidos de suspensión: {s.matches_suspended}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {s.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

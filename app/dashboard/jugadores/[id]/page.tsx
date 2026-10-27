"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlayerAvatar, PositionBadge } from "@/components/sports/PlayerAvatar";
import { TeamLogo } from "@/components/sports/TeamLogo";
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Flame,
  Award,
  AlertTriangle,
  FileText,
  User,
  Activity,
} from "lucide-react";

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = params?.id as string;

  const { players, teams, matches, sanctions, matchEvents } = useFutsal();

  const player = players.find((p) => p.id === playerId) || players[0];
  const team = teams.find((t) => t.id === player?.team_id);
  const playerSanctions = sanctions.filter((s) => s.player_id === player?.id);

  // Player matches
  const playerMatches = matches.filter(
    (m) => m.home_team_id === player?.team_id || m.away_team_id === player?.team_id
  );

  // Match events involving this player
  const playerEvents = matchEvents.filter(
    (e) => e.player_id === player?.id || e.secondary_player_id === player?.id
  );

  if (!player) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-400">Jugador no encontrado.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation back */}
        <Link
          href="/dashboard/jugadores"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a jugadores
        </Link>

        {/* Player Profile Card */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <PlayerAvatar player={player} size="xl" />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {player.first_name} {player.last_name}
                  </h1>
                  <span className="text-sm font-black px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                    #{player.jersey_number}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                  <PositionBadge position={player.position} />
                  <span>•</span>
                  <Link
                    href={`/dashboard/equipos/${team?.id}`}
                    className="flex items-center gap-1.5 font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    <TeamLogo name={team?.name || ""} logoUrl={team?.logo_url} size="sm" className="w-4 h-4 text-[8px]" />
                    {team?.name}
                  </Link>
                  <span>•</span>
                  <span>DNI: {player.document_number}</span>
                  <span>•</span>
                  <span>Nacimiento: {player.birth_date}</span>
                </div>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div>
              <span
                className={`text-xs font-black uppercase px-3 py-1.5 rounded-full ${
                  player.status === "ACTIVO"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                ESTADO: {player.status}
              </span>
            </div>
          </div>
        </div>

        {/* Individual Career Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="sports-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">PARTIDOS JUGADOS</span>
            <div className="text-3xl font-black text-white mt-1 font-scoreboard">
              {player.matches_played}
            </div>
          </div>

          <div className="sports-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              GOLES ANOTADOS
            </span>
            <div className="text-3xl font-black text-amber-400 mt-1 font-scoreboard">
              {player.goals}
            </div>
          </div>

          <div className="sports-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5" />
              ASISTENCIAS
            </span>
            <div className="text-3xl font-black text-blue-400 mt-1 font-scoreboard">
              {player.assists}
            </div>
          </div>

          <div className="sports-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-yellow-400">AMARILLAS</span>
            <div className="text-3xl font-black text-yellow-400 mt-1 font-scoreboard">
              {player.yellow_cards}
            </div>
          </div>

          <div className="sports-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-400">ROJAS DIRECTAS</span>
            <div className="text-3xl font-black text-rose-400 mt-1 font-scoreboard">
              {player.red_cards}
            </div>
          </div>
        </div>

        {/* Matches History & Disciplinary Sanciones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Historial de Partidos Disputados
            </h3>

            <div className="sports-card rounded-2xl overflow-hidden border border-slate-800">
              <div className="divide-y divide-slate-800/60">
                {playerMatches.map((match) => {
                  const opponent = teams.find(
                    (t) =>
                      t.id ===
                      (match.home_team_id === player.team_id
                        ? match.away_team_id
                        : match.home_team_id)
                  );
                  const isHome = match.home_team_id === player.team_id;

                  return (
                    <div
                      key={match.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{match.match_date}</span>
                        <span className="text-slate-600">•</span>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{isHome ? "vs" : "@"}</span>
                          <TeamLogo
                            name={opponent?.name || ""}
                            logoUrl={opponent?.logo_url}
                            size="sm"
                            className="w-4 h-4 text-[8px]"
                          />
                          <span>{opponent?.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-black text-sm font-scoreboard text-white">
                          {match.home_score} : {match.away_score}
                        </span>

                        <Link
                          href={`/partidos/${match.id}`}
                          className="text-blue-400 hover:underline font-semibold"
                        >
                          Ver ficha
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sanciones & Expedientes */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Sanciones Disciplinarias
            </h3>

            <div className="sports-card rounded-2xl p-4 border border-slate-800">
              {playerSanctions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  El jugador no registra suspensiones activas ni antecedentes disciplinarios.
                </div>
              ) : (
                <div className="space-y-3">
                  {playerSanctions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-300">
                          {s.matches_suspended} fecha(s) de suspensión
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {s.status}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{s.reason}</p>
                      <div className="text-[10px] text-slate-500 pt-1">
                        Emitida: {s.date_issued} • Cumplidas: {s.matches_served}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

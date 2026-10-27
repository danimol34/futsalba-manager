"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlayerAvatar } from "@/components/sports/PlayerAvatar";
import { TeamLogo } from "@/components/sports/TeamLogo";
import {
  BarChart3,
  Flame,
  Award,
  Shield,
  Activity,
  Trophy,
  AlertTriangle,
} from "lucide-react";

export default function StatisticsPage() {
  const { players, teams, matches } = useFutsal();

  const [activeTab, setActiveTab] = useState<"individual" | "equipos">("individual");

  // Top Scorers
  const topScorers = [...players]
    .sort((a, b) => ((b.goals ?? 0) - (a.goals ?? 0)) || ((b.assists ?? 0) - (a.assists ?? 0)))
    .slice(0, 8);

  // Top Assists
  const topAssists = [...players]
    .sort((a, b) => ((b.assists ?? 0) - (a.assists ?? 0)) || ((b.goals ?? 0) - (a.goals ?? 0)))
    .slice(0, 8);

  // Most Yellow Cards
  const topYellow = [...players]
    .filter((p) => (p.yellow_cards ?? 0) > 0)
    .sort((a, b) => (b.yellow_cards ?? 0) - (a.yellow_cards ?? 0))
    .slice(0, 8);

  // Most Red Cards
  const topRed = [...players]
    .filter((p) => (p.red_cards ?? 0) > 0)
    .sort((a, b) => (b.red_cards ?? 0) - (a.red_cards ?? 0))
    .slice(0, 8);


  // Team offensive stats (Most goals scored)
  const teamOffense = teams
    .map((team) => {
      const goals = matches.reduce((sum, m) => {
        if (m.home_team_id === team.id) return sum + m.home_score;
        if (m.away_team_id === team.id) return sum + m.away_score;
        return sum;
      }, 0);
      return { team, goals };
    })
    .sort((a, b) => b.goals - a.goals);

  // Team best defense (Fewest goals conceded)
  const teamDefense = teams
    .map((team) => {
      const conceded = matches.reduce((sum, m) => {
        if (m.home_team_id === team.id) return sum + m.away_score;
        if (m.away_team_id === team.id) return sum + m.home_score;
        return sum;
      }, 0);
      return { team, conceded };
    })
    .sort((a, b) => a.conceded - b.conceded);

  // Matches with most goals
  const highScoringMatches = [...matches]
    .filter((m) => m.status === "FINALIZADO" || m.status === "EN_VIVO")
    .sort((a, b) => (b.home_score + b.away_score) - (a.home_score + a.away_score))
    .slice(0, 4);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              CENTRO DE ESTADÍSTICAS Y RENDIMIENTO
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Líderes individuales de goleo, pases de gol, tarjetas y métricas de equipos.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("individual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "individual"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Líderes Individuales
            </button>
            <button
              onClick={() => setActiveTab("equipos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "equipos"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Rendimiento de Equipos
            </button>
          </div>
        </div>

        {activeTab === "individual" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Goleadores */}
            <div className="sports-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-sm uppercase text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Tabla de Goleadores (Pichichi)
                </h3>
                <span className="text-[10px] font-bold text-slate-500">GOLES</span>
              </div>

              <div className="divide-y divide-slate-800/60 mt-3">
                {topScorers.map((p, index) => {
                  const team = teams.find((t) => t.id === p.team_id);
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 text-center font-black ${index === 0 ? "text-amber-400 font-bold" : "text-slate-500"}`}>
                          {index + 1}
                        </span>
                        <PlayerAvatar player={p} size="sm" showNumber={false} />
                        <div>
                          <Link href={`/dashboard/jugadores/${p.id}`} className="font-bold text-white hover:text-blue-400 transition-colors">
                            {p.first_name} {p.last_name}
                          </Link>
                          <div className="text-[10px] text-slate-400">{team?.name}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-amber-400 font-scoreboard">
                          {p.goals} ⚽
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Asistencias */}
            <div className="sports-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-sm uppercase text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  Máximos Asistidores
                </h3>
                <span className="text-[10px] font-bold text-slate-500">PASES GOL</span>
              </div>

              <div className="divide-y divide-slate-800/60 mt-3">
                {topAssists.map((p, index) => {
                  const team = teams.find((t) => t.id === p.team_id);
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 text-center font-black ${index === 0 ? "text-blue-400 font-bold" : "text-slate-500"}`}>
                          {index + 1}
                        </span>
                        <PlayerAvatar player={p} size="sm" showNumber={false} />
                        <div>
                          <Link href={`/dashboard/jugadores/${p.id}`} className="font-bold text-white hover:text-blue-400 transition-colors">
                            {p.first_name} {p.last_name}
                          </Link>
                          <div className="text-[10px] text-slate-400">{team?.name}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-blue-400 font-scoreboard">
                          {p.assists} 👟
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tarjetas Amarillas */}
            <div className="sports-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-sm uppercase text-white flex items-center gap-2">
                  <span className="text-amber-400">🟨</span>
                  Amonestaciones (Tarjetas Amarillas)
                </h3>
                <span className="text-[10px] font-bold text-slate-500">CANTIDAD</span>
              </div>

              <div className="divide-y divide-slate-800/60 mt-3">
                {topYellow.map((p, index) => {
                  const team = teams.find((t) => t.id === p.team_id);
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center font-black text-slate-500">{index + 1}</span>
                        <PlayerAvatar player={p} size="sm" showNumber={false} />
                        <div>
                          <div className="font-bold text-white">
                            {p.first_name} {p.last_name}
                          </div>
                          <div className="text-[10px] text-slate-400">{team?.name}</div>
                        </div>
                      </div>

                      <div className="text-right font-black text-yellow-400 font-scoreboard text-base">
                        {p.yellow_cards} 🟨
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tarjetas Rojas */}
            <div className="sports-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-sm uppercase text-white flex items-center gap-2">
                  <span className="text-rose-400">🟥</span>
                  Expulsiones (Tarjetas Rojas)
                </h3>
                <span className="text-[10px] font-bold text-slate-500">CANTIDAD</span>
              </div>

              <div className="divide-y divide-slate-800/60 mt-3">
                {topRed.map((p, index) => {
                  const team = teams.find((t) => t.id === p.team_id);
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center font-black text-slate-500">{index + 1}</span>
                        <PlayerAvatar player={p} size="sm" showNumber={false} />
                        <div>
                          <div className="font-bold text-white">
                            {p.first_name} {p.last_name}
                          </div>
                          <div className="text-[10px] text-slate-400">{team?.name}</div>
                        </div>
                      </div>

                      <div className="text-right font-black text-rose-400 font-scoreboard text-base">
                        {p.red_cards} 🟥
                      </div>
                    </div>
                  );
                })}
                {topRed.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No se registran tarjetas rojas en la temporada.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Rendimiento de Equipos Tab */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Equipos más goleadores */}
            <div className="sports-card rounded-2xl p-5 border border-slate-800">
              <h3 className="font-extrabold text-sm uppercase text-white pb-3 border-b border-slate-800 flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                Ofensiva Más Goleadora
              </h3>

              <div className="space-y-4 mt-4 text-xs">
                {teamOffense.map(({ team, goals }, i) => (
                  <div key={team.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <TeamLogo name={team.name} logoUrl={team.logo_url} size="sm" className="w-4 h-4 text-[8px]" />
                        <span>{team.name}</span>
                      </div>
                      <span className="font-scoreboard font-black text-sm text-emerald-400">{goals} goles</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${(goals / (teamOffense[0]?.goals || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mejor Defensa */}
            <div className="sports-card rounded-2xl p-5 border border-slate-800">
              <h3 className="font-extrabold text-sm uppercase text-white pb-3 border-b border-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Valla Menos Vencida (Mejor Defensa)
              </h3>

              <div className="space-y-4 mt-4 text-xs">
                {teamDefense.map(({ team, conceded }, i) => (
                  <div key={team.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <TeamLogo name={team.name} logoUrl={team.logo_url} size="sm" className="w-4 h-4 text-[8px]" />
                        <span>{team.name}</span>
                      </div>
                      <span className="font-scoreboard font-black text-sm text-blue-400">{conceded} goles recibidos</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (conceded / 12) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Partidos con más goles */}
            <div className="md:col-span-2 sports-card rounded-2xl p-5 border border-slate-800">
              <h3 className="font-extrabold text-sm uppercase text-white pb-3 border-b border-slate-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Partidos con Mayor Cantidad de Goles
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {highScoringMatches.map((m) => {
                  const home = teams.find((t) => t.id === m.home_team_id);
                  const away = teams.find((t) => t.id === m.away_team_id);
                  const total = m.home_score + m.away_score;

                  return (
                    <div key={m.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">
                          {home?.name} {m.home_score} - {m.away_score} {away?.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{m.match_date} • Fecha oficial</div>
                      </div>

                      <div className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black font-scoreboard text-sm">
                        {total} Goles
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

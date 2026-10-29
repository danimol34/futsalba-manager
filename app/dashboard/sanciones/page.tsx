"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlayerAvatar } from "@/components/sports/PlayerAvatar";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { SanctionStatus } from "@/types";
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Ban,
  Filter,
  Plus,
  Search,
} from "lucide-react";

export default function SanctionsPage() {
  const { sanctions, players, teams, matches, updateSanctionStatus, currentUserRole } = useFutsal();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const isPrensa = currentUserRole === "PRENSA";
  const canAdminister = ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR"].includes(currentUserRole);

  const filteredSanctions = sanctions.filter(
    (s) => statusFilter === "ALL" || s.status === statusFilter
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-rose-400" />
                TRIBUNAL DE DISCIPLINA Y SANCIONES
              </h1>
              {isPrensa && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  PRENSA • SOLO CONSULTA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control de expedientes, suspensiones por tarjetas rojas, amonestaciones y fallos federativos.
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {["ALL", "PENDIENTE", "ACTIVA", "CUMPLIDA", "ANULADA"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {st === "ALL" ? "Todas las sanciones" : st}
            </button>
          ))}
        </div>

        {/* Sanctions Table */}
        <div className="sports-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Jugador / Sancionado</th>
                  <th className="py-3.5 px-3">Club</th>
                  <th className="py-3.5 px-3">Motivo / Causa Disciplinaria</th>
                  <th className="py-3.5 px-2 text-center">Fechas</th>
                  <th className="py-3.5 px-3 text-center">Dictamen</th>
                  <th className="py-3.5 px-3 text-center">Estado</th>
                  {canAdminister && <th className="py-3.5 px-4 text-right">Revisión Administrativa</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSanctions.map((s) => {
                  const player = players.find((p) => p.id === s.player_id);
                  const team = teams.find((t) => t.id === s.team_id);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <PlayerAvatar player={player} size="sm" />
                          <div>
                            <div className="font-bold text-white">
                              {player ? `${player.first_name} ${player.last_name}` : "Jugador"}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Dorsal #{player?.jersey_number} • {player?.position}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 text-slate-300 font-medium">
                          <TeamLogo
                            name={team?.name || ""}
                            logoUrl={team?.logo_url}
                            size="sm"
                            className="w-4 h-4 text-[8px]"
                          />
                          <span>{team?.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-200">{s.reason}</div>
                        {!isPrensa && s.notes && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">{s.notes}</div>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center font-scoreboard font-bold text-white">
                        <span className="text-rose-400">{s.matches_suspended}</span>
                        <span className="text-slate-500 text-[10px] block">
                          ({s.matches_served} cumplidas)
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {s.date_issued}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            s.status === "ACTIVA"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : s.status === "PENDIENTE"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : s.status === "CUMPLIDA"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      {canAdminister && (
                        <td className="py-3 px-4 text-right">
                          <select
                            value={s.status}
                            onChange={(e) =>
                              updateSanctionStatus(s.id, e.target.value as SanctionStatus)
                            }
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="ACTIVA">Mantener ACTIVA</option>
                            <option value="CUMPLIDA">Marcar CUMPLIDA</option>
                            <option value="PENDIENTE">En PENDIENTE</option>
                            <option value="ANULADA">ANULAR fallo</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

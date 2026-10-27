"use client";

import React from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { Trophy, ArrowLeft, Settings } from "lucide-react";

export default function StandingsPage() {
  const { standings, leagueSettings } = useFutsal();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              TABLA OFICIAL DE CLASIFICACIÓN
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cálculo reglamentario automático de posiciones, diferencia de gol, rachas y zona de playoffs.
            </p>
          </div>

          <Link
            href="/dashboard/configuracion"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 self-start sm:self-auto border border-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4 text-blue-400" />
            Configurar Reglas de Puntuación
          </Link>
        </div>

        {/* Rule reminder strip */}
        <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex flex-wrap items-center justify-between text-xs gap-3">
          <span className="text-blue-300 font-semibold">
            Sistema de puntuación activo: Victoria ({leagueSettings.points_for_win} pts), Empate ({leagueSettings.points_for_draw} pts), Derrota ({leagueSettings.points_for_loss} pts).
          </span>
          <span className="text-slate-400">
            Criterios de desempate: 1° Puntos, 2° Dif. de Gol (DG), 3° Goles a Favor (GF).
          </span>
        </div>

        {/* Full Table */}
        <StandingsTable standings={standings} compact={false} />
      </div>
    </DashboardLayout>
  );
}

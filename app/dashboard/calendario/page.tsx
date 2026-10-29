"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MatchCard } from "@/components/sports/MatchCard";
import {
  Calendar as CalendarIcon,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";

export default function CalendarPage() {
  const { matches, matchdays, venues, teams, currentUserRole } = useFutsal();
  const isReadOnly = currentUserRole === "PRENSA";

  const [selectedView, setSelectedView] = useState<"jornada" | "mes">("jornada");
  const [selectedMatchday, setSelectedMatchday] = useState<string>("matchday-3");

  const activeMatches = matches.filter((m) =>
    selectedView === "jornada" ? m.matchday_id === selectedMatchday : true
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-400" />
              CALENDARIO OFICIAL DE JUEGO
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cronograma completo de fechas, asignación de canchas y cruces programados.
            </p>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/partidos/nuevo"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                Nuevo Encuentro
              </Link>
            </div>
          )}
        </div>

        {/* View Switcher & Jornada Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            {matchdays.map((md) => (
              <button
                key={md.id}
                onClick={() => setSelectedMatchday(md.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  selectedMatchday === md.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {md.name} {md.is_current && "• (ACTUAL)"}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {activeMatches.length} partidos programados
          </div>
        </div>

        {/* Matches list for selected view */}
        <div className="space-y-4">
          {activeMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}

          {activeMatches.length === 0 && (
            <div className="sports-card rounded-2xl p-12 text-center text-slate-400 text-xs">
              No hay partidos asignados para esta fecha en el calendario.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

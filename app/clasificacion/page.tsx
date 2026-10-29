"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { publicSportsService } from "@/lib/services/publicSports";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Standing } from "@/types";
import { ArrowLeft, Trophy } from "lucide-react";

export default function PublicStandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    publicSportsService.getPublicStandings()
      .then((data) => {
        if (isMounted) {
          setStandings(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[PublicStandingsPage] Error:", err);
          setFetchError("No se pudo consultar la tabla de posiciones.");
          setStandings([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthGuard fallbackMessage="Verificando acceso a la Tabla de Posiciones...">
      <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col">
        <PublicHeader currentPath="/clasificacion" />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                TABLA DE POSICIONES
              </h1>
              <p className="text-xs text-slate-400">
                Clasificación general de la Liga Regular de Fútbol Sala FUTSALBA.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="sports-card rounded-2xl p-12 text-center border border-slate-800">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Cargando tabla de posiciones...
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
            <StandingsTable standings={standings} compact={false} isPublic={true} />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

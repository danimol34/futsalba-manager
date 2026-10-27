"use client";

import React from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { ArrowLeft, Trophy } from "lucide-react";

export default function PublicStandingsPage() {
  const { standings } = useFutsal();

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col">
      <header className="sticky top-0 z-30 bg-[#080f1d]/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          Volver a la portada oficial
        </Link>
        <div className="text-xs font-extrabold text-blue-400 tracking-wider uppercase">
          FUTSALBA 2026
        </div>
      </header>

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

        <StandingsTable standings={standings} compact={false} />
      </main>
    </div>
  );
}

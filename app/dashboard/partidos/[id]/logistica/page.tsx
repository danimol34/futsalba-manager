"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LogisticsChecklist } from "@/components/match/LogisticsChecklist";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { ArrowLeft, X, Radio, Tv } from "lucide-react";

export default function MatchLogisticsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;

  const { matches, teams } = useFutsal();

  const match = matches.find((m) => m.id === matchId) || matches[0];
  const homeTeam = teams.find((t) => t.id === match?.home_team_id);
  const awayTeam = teams.find((t) => t.id === match?.away_team_id);

  const handleSafeBack = () => {
    if (typeof window !== "undefined") {
      const ref = document.referrer || "";
      if (ref.includes("/dashboard/jornadas")) {
        router.push("/dashboard/jornadas");
        return;
      }
      if (ref.includes("/dashboard/partidos")) {
        router.push("/dashboard/partidos");
        return;
      }
      if (
        window.history.length > 1 &&
        ref.startsWith(window.location.origin)
      ) {
        router.back();
        return;
      }
    }
    router.push("/dashboard/partidos");
  };

  if (!match) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-400">Partido no encontrado.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSafeBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all active:scale-95 min-h-[42px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>← Volver</span>
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/partidos/${match.id}/live`}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 min-h-[42px]"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mesa Técnica</span>
            </Link>
            <Link
              href={`/tv/${match.id}`}
              target="_blank"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 min-h-[42px]"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Marcador TV</span>
            </Link>
            <button
              type="button"
              onClick={handleSafeBack}
              aria-label="Cerrar logística del partido"
              title="Cerrar y volver"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-all active:scale-95 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Match Header Strip */}
        <div className="sports-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo name={homeTeam?.name || ""} logoUrl={homeTeam?.logo_url} size="sm" />
            <span className="font-bold text-white text-sm">{homeTeam?.name}</span>
            <span className="text-slate-500 font-bold">vs</span>
            <TeamLogo name={awayTeam?.name || ""} logoUrl={awayTeam?.logo_url} size="sm" />
            <span className="font-bold text-white text-sm">{awayTeam?.name}</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {match.match_date} • {match.kickoff_time} hs
          </div>
        </div>

        {/* Interactive Checklist */}
        <LogisticsChecklist matchId={match.id} />
      </div>
    </DashboardLayout>
  );
}

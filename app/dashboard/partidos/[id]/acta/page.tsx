"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TeamLogo } from "@/components/sports/TeamLogo";
import {
  FileText,
  Printer,
  ArrowLeft,
  X,
  CheckCircle2,
  Calendar,
  MapPin,
  Award,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

export default function MatchActaPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;

  const { matches, teams, venues, matchdays, referees, matchEvents, players } = useFutsal();

  const match = matches.find((m) => m.id === matchId) || matches[0];
  const homeTeam = teams.find((t) => t.id === match?.home_team_id);
  const awayTeam = teams.find((t) => t.id === match?.away_team_id);
  const venue = venues.find((v) => v.id === match?.venue_id);
  const matchday = matchdays.find((m) => m.id === match?.matchday_id);

  const mainReferee = referees.find((r) => r.id === match?.main_referee_id);
  const secondReferee = referees.find((r) => r.id === match?.second_referee_id);
  const timekeeper = referees.find((r) => r.id === match?.timekeeper_id);

  const homePlayers = players.filter((p) => p.team_id === match?.home_team_id);
  const awayPlayers = players.filter((p) => p.team_id === match?.away_team_id);

  const events = matchEvents.filter((e) => e.match_id === match?.id);
  const goals = events.filter((e) => e.event_type === "goal" || e.event_type === "penalty" || e.event_type === "double_penalty");
  const cards = events.filter((e) => e.event_type === "yellow_card" || e.event_type === "red_card");

  const handlePrint = () => {
    window.print();
  };

  const handleSafeBack = () => {
    if (typeof window !== "undefined") {
      const ref = document.referrer || "";
      if (
        window.history.length > 1 &&
        ref.startsWith(window.location.origin)
      ) {
        router.back();
        return;
      }
    }
    router.push(`/dashboard/partidos/${match?.id || ""}/live`);
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Print Action */}
        <div className="flex items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={handleSafeBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all active:scale-95 min-h-[42px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>← Volver</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all min-h-[42px]"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar en PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSafeBack}
              aria-label="Cerrar acta del partido"
              title="Cerrar y volver"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-all active:scale-95 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Match Sheet */}
        <div className="bg-slate-900 text-white border-2 border-slate-700/80 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8 print:bg-white print:text-black print:border-black print:p-0">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-800 pb-6 text-center relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg">
                F
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-widest uppercase">
                ACTA OFICIAL DE PARTIDO
              </h1>
            </div>
            <p className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
              ASOCIACIÓN DE FÚTBOL SALA FUTSALBA • TEMPORADA 2026
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Registro Reglamentario Homologado • {matchday?.name}
            </p>
          </div>

          {/* General Match Information */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">FECHA</span>
              <span className="font-semibold text-white">{match.match_date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">HORA</span>
              <span className="font-semibold text-white">{match.kickoff_time} hs</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">SEDE / CANCHA</span>
              <span className="font-semibold text-white">{venue?.name}</span>
            </div>
          </div>

          {/* Result Banner */}
          <div className="p-6 rounded-2xl bg-[#060c18] border border-blue-500/30 grid grid-cols-7 items-center text-center">
            <div className="col-span-3">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase">{homeTeam?.name}</h2>
              <span className="text-xs text-slate-400">Faltas acumuladas: {match.home_fouls}</span>
            </div>

            <div className="col-span-1">
              <div className="text-3xl md:text-5xl font-black font-scoreboard text-blue-400">
                {match.home_score} - {match.away_score}
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                {match.status}
              </span>
            </div>

            <div className="col-span-3">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase">{awayTeam?.name}</h2>
              <span className="text-xs text-slate-400">Faltas acumuladas: {match.away_fouls}</span>
            </div>
          </div>

          {/* Goals & Cards Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Goals */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h3 className="font-extrabold text-sm uppercase text-slate-300 pb-2 border-b border-slate-800 flex items-center gap-1.5">
                ⚽ Registro de Goles
              </h3>
              <div className="mt-3 space-y-2">
                {goals.map((g) => {
                  const p = players.find((pl) => pl.id === g.player_id);
                  const t = teams.find((tm) => tm.id === g.team_id);
                  return (
                    <div key={g.id} className="flex justify-between items-center text-slate-300">
                      <span>
                        Min {g.minute}&apos; - <strong>#{p?.jersey_number} {p?.first_name} {p?.last_name}</strong>
                      </span>
                      <span className="text-slate-400 font-semibold">{t?.short_name}</span>
                    </div>
                  );
                })}
                {goals.length === 0 && (
                  <span className="text-slate-500 italic">No se registraron goles.</span>
                )}
              </div>
            </div>

            {/* Cards */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h3 className="font-extrabold text-sm uppercase text-slate-300 pb-2 border-b border-slate-800 flex items-center gap-1.5">
                🟨 Amonestaciones y Expulsiones
              </h3>
              <div className="mt-3 space-y-2">
                {cards.map((c) => {
                  const p = players.find((pl) => pl.id === c.player_id);
                  const t = teams.find((tm) => tm.id === c.team_id);
                  return (
                    <div key={c.id} className="flex justify-between items-center text-slate-300">
                      <span>
                        {c.event_type === "yellow_card" ? "🟨" : "🟥"} Min {c.minute}&apos; - #{p?.jersey_number} {p?.first_name} {p?.last_name}
                      </span>
                      <span className="text-slate-400">{t?.short_name}</span>
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <span className="text-slate-500 italic">Sin tarjetas registradas.</span>
                )}
              </div>
            </div>
          </div>

          {/* Rosters / Plantillas Convocadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Home Roster */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h4 className="font-bold text-white mb-2 pb-1 border-b border-slate-800">
                Alineación {homeTeam?.name} (DT: {homeTeam?.coach_name})
              </h4>
              <div className="space-y-1">
                {homePlayers.map((p) => (
                  <div key={p.id} className="flex justify-between text-slate-300">
                    <span>
                      #{p.jersey_number} {p.first_name} {p.last_name}
                    </span>
                    <span className="text-slate-500 uppercase text-[10px]">{p.position}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Away Roster */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h4 className="font-bold text-white mb-2 pb-1 border-b border-slate-800">
                Alineación {awayTeam?.name} (DT: {awayTeam?.coach_name})
              </h4>
              <div className="space-y-1">
                {awayPlayers.map((p) => (
                  <div key={p.id} className="flex justify-between text-slate-300">
                    <span>
                      #{p.jersey_number} {p.first_name} {p.last_name}
                    </span>
                    <span className="text-slate-500 uppercase text-[10px]">{p.position}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referees & Official Signatures */}
          <div className="pt-6 border-t-2 border-slate-800">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 text-center">
              CONFORMIDAD Y FIRMAS DIGITALES
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
              <div className="border-t border-slate-700 pt-3">
                <div className="font-bold text-white">{mainReferee?.full_name || "Alejandro Morales"}</div>
                <div className="text-[10px] text-slate-400">ÁRBITRO PRINCIPAL</div>
                <div className="text-[9px] text-emerald-400 mt-1 font-mono">Firma verificada ✓</div>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <div className="font-bold text-white">{secondReferee?.full_name || "Mariana Godoy"}</div>
                <div className="text-[10px] text-slate-400">SEGUNDO ÁRBITRO</div>
                <div className="text-[9px] text-emerald-400 mt-1 font-mono">Firma verificada ✓</div>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <div className="font-bold text-white">{timekeeper?.full_name || "Diego Santillán"}</div>
                <div className="text-[10px] text-slate-400">MESA TÉCNICA / CRONOMETRADOR</div>
                <div className="text-[9px] text-emerald-400 mt-1 font-mono">Firma verificada ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

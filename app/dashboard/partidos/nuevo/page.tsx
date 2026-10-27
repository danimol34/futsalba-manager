"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { MatchStatus, MatchPeriod } from "@/types";
import { Swords, ArrowLeft, Check, Calendar, Clock, MapPin, UserCheck, Loader2 } from "lucide-react";

export default function NewMatchPage() {
  const router = useRouter();
  const toast = useToast();
  const {
    seasons,
    competitions,
    matchdays,
    teams,
    venues,
    referees,
    addMatch,
  } = useFutsal();

  const [seasonId, setSeasonId] = useState(seasons[0]?.id || "");
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id || "");
  const [matchdayId, setMatchdayId] = useState(matchdays[0]?.id || "");
  const [homeTeamId, setHomeTeamId] = useState(teams[0]?.id || "");
  const [awayTeamId, setAwayTeamId] = useState(teams[1]?.id || (teams[0] ? teams[0].id : ""));
  const [venueId, setVenueId] = useState(venues[0]?.id || "");
  const [matchDate, setMatchDate] = useState("2026-10-12");
  const [kickoffTime, setKickoffTime] = useState("20:00:00");
  const [mainRefereeId, setMainRefereeId] = useState(referees[0]?.id || "");
  const [secondRefereeId, setSecondRefereeId] = useState(referees[1]?.id || "");
  const [timekeeperId, setTimekeeperId] = useState(referees[2]?.id || "");
  const [status, setStatus] = useState<MatchStatus>("PROGRAMADO");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!homeTeamId || !awayTeamId) {
      toast.warning("Debes seleccionar ambos equipos.");
      return;
    }

    if (homeTeamId === awayTeamId) {
      toast.warning("El equipo local y el equipo visitante no pueden ser el mismo.");
      return;
    }

    if (!matchDate) {
      toast.warning("Debes seleccionar una fecha para el encuentro.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addMatch({
        season_id: seasonId || null,
        competition_id: competitionId || null,
        matchday_id: matchdayId || null,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        venue_id: venueId || null,
        match_date: matchDate,
        kickoff_time: kickoffTime ? (kickoffTime.length === 5 ? `${kickoffTime}:00` : kickoffTime) : "19:00:00",
        status: status || "PROGRAMADO",
        period: 1,
        home_score: 0,
        away_score: 0,
        home_fouls: 0,
        away_fouls: 0,
        home_timeouts: 0,
        away_timeouts: 0,
        match_clock_seconds: 1200,
        is_clock_running: false,
        main_referee_id: mainRefereeId || null,
        second_referee_id: secondRefereeId || null,
        timekeeper_id: timekeeperId || null,
        notes: notes.trim() || null,
      });

      toast.success("✅ Partido programado");
      router.push("/dashboard/partidos");
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation back */}
        <Link
          href="/dashboard/partidos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a partidos
        </Link>

        {/* Form Container */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl">
          <div className="pb-5 border-b border-slate-800">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Swords className="w-5 h-5 text-blue-400" />
              PROGRAMAR NUEVO ENCUENTRO OFICIAL
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa los datos reglamentarios de fecha, sede, equipos y cuerpo arbitral designado (Supabase).
            </p>
          </div>

          {teams.length < 2 ? (
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <p className="font-bold mb-1">⚠️ Se necesitan al menos 2 equipos registrados</p>
              <p>
                Actualmente tienes {teams.length} equipo(s) en la base de datos. Para programar un partido, primero registra al menos dos clubes en la sección de Equipos.
              </p>
              <Link
                href="/dashboard/equipos"
                className="mt-3 inline-block px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-semibold text-xs hover:bg-amber-500/30 transition-colors"
              >
                Ir a Equipos
              </Link>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Competición y Jornada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Temporada
                </label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin temporada asignada</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Competición
                </label>
                <select
                  value={competitionId}
                  onChange={(e) => setCompetitionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin competición asignada</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Jornada
                </label>
                <select
                  value={matchdayId}
                  onChange={(e) => setMatchdayId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin jornada asignada</option>
                  {matchdays.map((md) => (
                    <option key={md.id} value={md.id}>
                      {md.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Equipos Local y Visitante */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div>
                <label className="block text-xs font-bold uppercase text-emerald-400 mb-1.5">
                  Equipo Local *
                </label>
                <select
                  required
                  value={homeTeamId}
                  onChange={(e) => setHomeTeamId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecciona equipo local</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.short_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-blue-400 mb-1.5">
                  Equipo Visitante *
                </label>
                <select
                  required
                  value={awayTeamId}
                  onChange={(e) => setAwayTeamId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecciona equipo visitante</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.short_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cancha, Fecha y Hora */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  Cancha / Gimnasio
                </label>
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin cancha asignada</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Fecha del Encuentro *
                </label>
                <input
                  type="date"
                  required
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Hora Oficial *
                </label>
                <input
                  type="time"
                  required
                  value={kickoffTime}
                  onChange={(e) => setKickoffTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Estado Inicial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Estado Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MatchStatus)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="PROGRAMADO">PROGRAMADO (Fixture oficial)</option>
                  <option value="EN_PREPARACION">EN PREPARACIÓN (Mesa técnica activa)</option>
                  <option value="EN_VIVO">EN VIVO (Comenzar de inmediato)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Observaciones / Notas
                </label>
                <input
                  type="text"
                  placeholder="Ej: Transmisión televisiva, partido destacado..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <Link
                href="/dashboard/partidos"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || teams.length < 2}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar y Programar Partido</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import { Match, MatchStatus } from "@/types";
import { useFutsal } from "@/lib/store/futsalStore";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { isUUID } from "@/lib/utils/validators";
import {
  Edit2,
  X,
  Check,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertTriangle,
  Swords,
} from "lucide-react";

interface EditMatchModalProps {
  isOpen: boolean;
  match: Match | null;
  onClose: () => void;
  onUpdated?: (updated: Match) => void;
}

export const EditMatchModal = memo(function EditMatchModal({
  isOpen,
  match,
  onClose,
  onUpdated,
}: EditMatchModalProps) {
  const {
    teams,
    competitions,
    matchdays,
    venues,
    referees,
    seasons,
    leagueSettings,
    updateMatch,
  } = useFutsal();
  const toast = useToast();

  // Entidades válidas con UUID real de Supabase (nunca datos demo)
  const validTeams = useMemo(
    () => teams.filter((t) => isUUID(t.id)),
    [teams]
  );
  const validCompetitions = useMemo(
    () => competitions.filter((c) => isUUID(c.id)),
    [competitions]
  );
  const validMatchdays = useMemo(
    () => matchdays.filter((md) => isUUID(md.id)),
    [matchdays]
  );
  const validVenues = useMemo(
    () => venues.filter((v) => isUUID(v.id)),
    [venues]
  );
  const validReferees = useMemo(
    () => referees.filter((r) => isUUID(r.id) && r.status !== false),
    [referees]
  );
  const validSeasons = useMemo(
    () => seasons.filter((s) => isUUID(s.id)),
    [seasons]
  );

  // Estado local aislado del formulario
  const [competitionId, setCompetitionId] = useState("");
  const [matchdayId, setMatchdayId] = useState("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [kickoffTime, setKickoffTime] = useState("20:00");
  const [venueId, setVenueId] = useState("");
  const [mainRefereeId, setMainRefereeId] = useState("");
  const [secondRefereeId, setSecondRefereeId] = useState("");
  const [timekeeperId, setTimekeeperId] = useState("");
  const [status, setStatus] = useState<MatchStatus>("PROGRAMADO");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar valores actuales al abrir el modal
  useEffect(() => {
    if (!isOpen || !match) return;

    const currentMatchday = validMatchdays.find((md) => md.id === match.matchday_id);
    const resolvedCompId =
      (match.competition_id && isUUID(match.competition_id)
        ? match.competition_id
        : undefined) ||
      (currentMatchday?.competition_id && isUUID(currentMatchday.competition_id)
        ? currentMatchday.competition_id
        : undefined) ||
      validCompetitions[0]?.id ||
      "";

    const compMatchdays = validMatchdays.filter(
      (md) => !resolvedCompId || !md.competition_id || md.competition_id === resolvedCompId
    );
    const resolvedMatchdayId =
      (match.matchday_id && isUUID(match.matchday_id) ? match.matchday_id : undefined) ||
      compMatchdays[0]?.id ||
      validMatchdays[0]?.id ||
      "";

    setCompetitionId(resolvedCompId);
    setMatchdayId(resolvedMatchdayId);
    setHomeTeamId(isUUID(match.home_team_id) ? match.home_team_id : validTeams[0]?.id || "");
    setAwayTeamId(isUUID(match.away_team_id) ? match.away_team_id : validTeams[1]?.id || "");
    setMatchDate(match.match_date || "");
    setKickoffTime(
      match.kickoff_time ? match.kickoff_time.slice(0, 5) : "20:00"
    );
    setVenueId(match.venue_id && isUUID(match.venue_id) ? match.venue_id : "");
    setMainRefereeId(
      match.main_referee_id && isUUID(match.main_referee_id)
        ? match.main_referee_id
        : ""
    );
    setSecondRefereeId(
      match.second_referee_id && isUUID(match.second_referee_id)
        ? match.second_referee_id
        : ""
    );
    setTimekeeperId(
      match.timekeeper_id && isUUID(match.timekeeper_id)
        ? match.timekeeper_id
        : ""
    );
    setStatus(match.status || "PROGRAMADO");
    setNotes(match.notes || "");
    setValidationError(null);
    setIsSubmitting(false);
  }, [isOpen, match, validCompetitions, validMatchdays, validTeams]);

  // Jornadas filtradas por competición seleccionada
  const availableMatchdays = useMemo(() => {
    if (!competitionId) return validMatchdays;
    const byComp = validMatchdays.filter((md) => md.competition_id === competitionId);
    return byComp.length > 0 ? byComp : validMatchdays;
  }, [validMatchdays, competitionId]);

  const handleCompetitionChange = (newCompId: string) => {
    setCompetitionId(newCompId);
    setValidationError(null);
    const byComp = validMatchdays.filter((md) => md.competition_id === newCompId);
    if (byComp.length > 0 && !byComp.some((md) => md.id === matchdayId)) {
      setMatchdayId(byComp[0].id);
    }
  };

  if (!isOpen || !match) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!isUUID(match.id)) {
      const msg = "El identificador del partido no es un UUID válido de Supabase.";
      setValidationError(msg);
      toast.error(msg);
      return;
    }

    if (!isUUID(competitionId)) {
      const msg = "Debes seleccionar una competición válida.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    if (!isUUID(matchdayId)) {
      const msg = "Debes seleccionar una jornada válida.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    if (!isUUID(homeTeamId) || !isUUID(awayTeamId)) {
      const msg = "Debes seleccionar equipos local y visitante válidos con UUID real.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    if (homeTeamId === awayTeamId) {
      const msg = "El equipo local y visitante no pueden ser el mismo.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    if (!matchDate || !/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) {
      const msg = "Debes seleccionar una fecha válida para el partido.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    const cleanTime = kickoffTime.trim();
    if (!cleanTime || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(cleanTime)) {
      const msg = "Debes ingresar una hora de inicio válida (formato HH:MM).";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    if (venueId && !isUUID(venueId)) {
      const msg = "La cancha o sede seleccionada no tiene un UUID válido.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    const chosenReferees = [mainRefereeId, secondRefereeId, timekeeperId].filter(Boolean);
    if (chosenReferees.some((id) => !isUUID(id))) {
      const msg = "Uno de los árbitros seleccionados no tiene un UUID válido.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }
    if (new Set(chosenReferees).size !== chosenReferees.length) {
      const msg = "Un mismo árbitro no puede ser asignado a dos funciones distintas en el mismo partido.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    const selectedComp = validCompetitions.find((c) => c.id === competitionId);
    const resolvedSeasonId =
      (selectedComp?.season_id && isUUID(selectedComp.season_id)
        ? selectedComp.season_id
        : undefined) ||
      (match.season_id && isUUID(match.season_id) ? match.season_id : undefined) ||
      (leagueSettings.active_season_id && isUUID(leagueSettings.active_season_id)
        ? leagueSettings.active_season_id
        : undefined) ||
      validSeasons.find((s) => s.status === "ACTIVA")?.id ||
      null;

    const formattedKickoff =
      cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;

    setIsSubmitting(true);
    try {
      const updated = await updateMatch(match.id, {
        season_id: resolvedSeasonId,
        competition_id: competitionId,
        matchday_id: matchdayId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        venue_id: venueId || null,
        match_date: matchDate,
        kickoff_time: formattedKickoff,
        status,
        main_referee_id: mainRefereeId || null,
        second_referee_id: secondRefereeId || null,
        timekeeper_id: timekeeperId || null,
        notes: notes.trim() || null,
      });

      toast.success("Partido actualizado correctamente.");
      onUpdated?.(updated);
      onClose();
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      setValidationError(formatted.message);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-white tracking-tight">
                EDITAR PARTIDO PROGRAMADO
              </h3>
              <p className="text-[11px] text-slate-400">
                Actualiza equipos, jornada, fecha, hora, sede o designación arbitral (Supabase)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal de edición"
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}

          {/* Competición y Jornada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Competición *
              </label>
              <select
                required
                value={competitionId}
                onChange={(e) => handleCompetitionChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecciona competición</option>
                {validCompetitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Jornada *
              </label>
              <select
                required
                value={matchdayId}
                onChange={(e) => {
                  setMatchdayId(e.target.value);
                  setValidationError(null);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecciona jornada</option>
                {availableMatchdays.map((md) => (
                  <option key={md.id} value={md.id}>
                    {md.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipo Local y Visitante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase text-emerald-400 mb-1 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" />
                Equipo Local *
              </label>
              <select
                required
                value={homeTeamId}
                onChange={(e) => {
                  setHomeTeamId(e.target.value);
                  setValidationError(null);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="">Selecciona equipo local</option>
                {validTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.short_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-blue-400 mb-1 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" />
                Equipo Visitante *
              </label>
              <select
                required
                value={awayTeamId}
                onChange={(e) => {
                  setAwayTeamId(e.target.value);
                  setValidationError(null);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecciona equipo visitante</option>
                {validTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.short_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cancha, Fecha, Hora y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Cancha / Sede
              </label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sin sede asignada</option>
                {validVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Fecha *
              </label>
              <input
                type="date"
                required
                value={matchDate}
                onChange={(e) => {
                  setMatchDate(e.target.value);
                  setValidationError(null);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Hora *
              </label>
              <input
                type="time"
                required
                value={kickoffTime}
                onChange={(e) => {
                  setKickoffTime(e.target.value);
                  setValidationError(null);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Designación Arbitral */}
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              Designación Arbitral (Opcional)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Árbitro Principal
                </label>
                <select
                  value={mainRefereeId}
                  onChange={(e) => setMainRefereeId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin designar</option>
                  {validReferees.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} {r.category ? `(${r.category})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  2do Árbitro / Auxiliar
                </label>
                <select
                  value={secondRefereeId}
                  onChange={(e) => setSecondRefereeId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin designar</option>
                  {validReferees.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} {r.category ? `(${r.category})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Cronometrador (Mesa)
                </label>
                <select
                  value={timekeeperId}
                  onChange={(e) => setTimekeeperId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin designar</option>
                  {validReferees.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} {r.category ? `(${r.category})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Estado y Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Estado del Partido
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="PROGRAMADO">PROGRAMADO</option>
                <option value="EN_PREPARACION">EN PREPARACIÓN</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Notas / Observaciones
              </label>
              <input
                type="text"
                placeholder="Ej. Partido televisado, reprogramación..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

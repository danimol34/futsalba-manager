"use client";

import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MatchCard } from "@/components/sports/MatchCard";
import { EditMatchModal } from "@/components/match/EditMatchModal";
import { DeleteMatchModal } from "@/components/match/DeleteMatchModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { NumericInput } from "@/components/ui/NumericInput";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { isUUID } from "@/lib/utils/validators";
import { Competition, Match, Season } from "@/types";
import { MatchdayInsert } from "@/lib/services";
import { Layers, Plus, Calendar, Swords, X, Check, Loader2, AlertTriangle } from "lucide-react";

interface CreateMatchdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextNumber: number;
  activeSeason: Season | null;
  competitions: Competition[];
  isLoadingCompetitions: boolean;
  onRefreshCompetitions: () => Promise<void>;
  onCreateMatchday: (data: MatchdayInsert) => Promise<any>;
}

const CreateMatchdayModal = memo(function CreateMatchdayModal({
  isOpen,
  onClose,
  nextNumber,
  activeSeason,
  competitions,
  isLoadingCompetitions,
  onRefreshCompetitions,
  onCreateMatchday,
}: CreateMatchdayModalProps) {
  const toast = useToast();

  // Estado 100% local del formulario para evitar re-renderizar el Dashboard mientras se escribe
  const [name, setName] = useState(`Jornada ${nextNumber}`);
  const [matchdayNumber, setMatchdayNumber] = useState<string>(String(nextNumber));
  const [competitionId, setCompetitionId] = useState("");
  const [startDate, setStartDate] = useState("2026-03-07");
  const [endDate, setEndDate] = useState("2026-03-08");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingModal, setIsSyncingModal] = useState(false);

  // Al abrir el modal, inicializar campos y asegurar carga fresca de competiciones desde Supabase
  useEffect(() => {
    if (!isOpen) return;
    setName(`Jornada ${nextNumber}`);
    setMatchdayNumber(String(nextNumber));
    setStartDate("2026-03-07");
    setEndDate("2026-03-08");
    setIsSubmitting(false);

    let active = true;
    setIsSyncingModal(true);
    onRefreshCompetitions().finally(() => {
      if (active) setIsSyncingModal(false);
    });

    return () => {
      active = false;
    };
  }, [isOpen, nextNumber, onRefreshCompetitions]);

  // Sincronizar selección por defecto cuando terminan de cargar las competiciones válidas
  useEffect(() => {
    if (!isOpen) return;
    if (competitions.length > 0) {
      setCompetitionId((prev) =>
        prev && competitions.some((c) => c.id === prev) ? prev : competitions[0].id
      );
    } else {
      setCompetitionId("");
    }
  }, [isOpen, competitions]);

  if (!isOpen) return null;

  const isWaitingCompetitions = isLoadingCompetitions || isSyncingModal;
  const hasValidCompetitions = !isWaitingCompetitions && competitions.length > 0;
  const isCompetitionValid = isUUID(competitionId) && competitions.some((c) => c.id === competitionId);
  const canCreateMatchday =
    !isSubmitting &&
    !isWaitingCompetitions &&
    hasValidCompetitions &&
    isCompetitionValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.warning("El nombre de la jornada es obligatorio.");
      return;
    }

    const parsedNum = parseInt(String(matchdayNumber).trim(), 10);
    if (isNaN(parsedNum) || parsedNum < 1) {
      toast.warning("Ingresa un número de fecha válido (mayor o igual a 1).");
      return;
    }

    if (!hasValidCompetitions) {
      toast.warning("No hay competiciones registradas para esta temporada.");
      return;
    }

    if (!isCompetitionValid) {
      toast.warning("Debes seleccionar una competición válida para la jornada.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateMatchday({
        competition_id: competitionId,
        name: cleanName,
        matchday_number: parsedNum,
        start_date: startDate || null,
        end_date: endDate || null,
      });

      toast.success(`✅ ${cleanName} creada correctamente`);
      onClose();
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              NUEVA JORNADA
            </h3>
            {activeSeason && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Temporada activa: <span className="text-slate-200 font-semibold">{activeSeason.name}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Nombre de la Jornada *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Jornada 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Número de Fecha *
              </label>
              <NumericInput
                required
                min={1}
                max={50}
                placeholder="Ej: 1"
                value={matchdayNumber}
                onValueChange={setMatchdayNumber}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Competición *
              </label>
              {isWaitingCompetitions ? (
                <div className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                  <span className="truncate">Cargando...</span>
                </div>
              ) : (
                <select
                  value={competitionId}
                  onChange={(e) => setCompetitionId(e.target.value)}
                  disabled={!hasValidCompetitions}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecciona torneo</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {!isWaitingCompetitions && !hasValidCompetitions && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">
                  No hay competiciones registradas para esta temporada.
                </p>
                <Link
                  href="/dashboard/competiciones"
                  onClick={onClose}
                  className="inline-block text-[11px] font-bold text-blue-400 hover:text-blue-300 underline"
                >
                  Ir a Competiciones para registrar un torneo →
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canCreateMatchday}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Crear Jornada</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default function MatchdaysPage() {
  const {
    matchdays,
    matches,
    seasons,
    competitions,
    leagueSettings,
    createMatchday,
    refetchSeasons,
    refetchCompetitions,
    isAuthLoading,
    isLoadingRemote,
    isCompetitionsLoading,
    currentUserRole,
  } = useFutsal();
  const isReadOnly = currentUserRole === "PRENSA";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);

  const openCreateModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleOpenEditMatch = useCallback((match: Match) => {
    setEditingMatch(match);
  }, []);

  const handleCloseEditMatch = useCallback(() => {
    setEditingMatch(null);
  }, []);

  const handleOpenDeleteMatch = useCallback((match: Match) => {
    setDeletingMatch(match);
  }, []);

  const handleCloseDeleteMatch = useCallback(() => {
    setDeletingMatch(null);
  }, []);

  const handleRefreshCompetitions = useCallback(async () => {
    await Promise.all([refetchSeasons(), refetchCompetitions()]);
  }, [refetchSeasons, refetchCompetitions]);

  // Temporadas válidas con UUID real de Supabase
  const validSeasons = useMemo(
    () => seasons.filter((s) => isUUID(s.id)),
    [seasons]
  );

  // Temporada activa real en Supabase (nunca IDs demo)
  const activeSeason = useMemo<Season | null>(() => {
    const activeByStatus = validSeasons.find((s) => s.status === "ACTIVA");
    if (activeByStatus) return activeByStatus;
    if (
      leagueSettings.active_season_id &&
      isUUID(leagueSettings.active_season_id)
    ) {
      const bySettings = validSeasons.find(
        (s) => s.id === leagueSettings.active_season_id
      );
      if (bySettings) return bySettings;
    }
    return validSeasons[0] || null;
  }, [validSeasons, leagueSettings.active_season_id]);

  // Competiciones con UUID real cuyo season_id coincide con la temporada activa
  const activeSeasonCompetitions = useMemo<Competition[]>(() => {
    if (!activeSeason || !isUUID(activeSeason.id)) return [];
    return competitions.filter(
      (c) => isUUID(c.id) && isUUID(c.season_id) && c.season_id === activeSeason.id
    );
  }, [competitions, activeSeason]);

  // Pre-agrupar partidos por jornada y competiciones por ID para evitar filtros O(N*M) en cada render
  const matchesByMatchday = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      if (!m.matchday_id) continue;
      const list = map.get(m.matchday_id);
      if (list) {
        list.push(m);
      } else {
        map.set(m.matchday_id, [m]);
      }
    }
    return map;
  }, [matches]);

  const competitionById = useMemo(() => {
    const map = new Map<string, Competition>();
    for (const c of competitions) {
      map.set(c.id, c);
    }
    return map;
  }, [competitions]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-400" />
              GESTIÓN DE JORNADAS Y FECHAS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Organización de fechas regulares, programación y cruces de la liga (Supabase).
            </p>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-4 h-4" />
                NUEVA JORNADA
              </button>
              <Link
                href="/dashboard/partidos/nuevo"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all self-start sm:self-auto"
              >
                <Swords className="w-4 h-4 text-blue-400" />
                Asignar Partido
              </Link>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoadingRemote && matchdays.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium">Cargando jornadas desde Supabase...</p>
          </div>
        ) : matchdays.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No hay jornadas registradas"
            description="Crea la primera jornada (Jornada 1) para comenzar a organizar las fechas oficiales del campeonato."
            actionLabel="+ Crear Jornada 1"
            onAction={openCreateModal}
          />
        ) : (
          /* Jornadas accordion list */
          <div className="space-y-6">
            {matchdays.map((md) => {
              const mdMatches = matchesByMatchday.get(md.id) || [];
              const comp = md.competition_id ? competitionById.get(md.competition_id) : undefined;

              return (
                <div
                  key={md.id}
                  className="sports-card rounded-3xl p-6 border border-slate-800 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-sm">
                        #{md.matchday_number || md.number || 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black text-white">{md.name}</h2>
                          {comp && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {comp.name}
                            </span>
                          )}
                          {md.is_current && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              EN CURSO
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {md.start_date || "Fecha por definir"} {md.end_date ? `al ${md.end_date}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-xl">
                      {mdMatches.length} partidos fijados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mdMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onEdit={handleOpenEditMatch}
                        onDelete={handleOpenDeleteMatch}
                      />
                    ))}
                    {mdMatches.length === 0 && (
                      <div className="md:col-span-2 text-center py-6 text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/40">
                        Sin partidos programados en esta jornada.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Create Matchday con estado local aislado */}
        <CreateMatchdayModal
          isOpen={modalOpen}
          onClose={closeCreateModal}
          nextNumber={matchdays.length + 1}
          activeSeason={activeSeason}
          competitions={activeSeasonCompetitions}
          isLoadingCompetitions={isAuthLoading || isLoadingRemote || isCompetitionsLoading}
          onRefreshCompetitions={handleRefreshCompetitions}
          onCreateMatchday={createMatchday}
        />

        {/* Modal Editar Partido Programado */}
        <EditMatchModal
          isOpen={Boolean(editingMatch)}
          match={editingMatch}
          onClose={handleCloseEditMatch}
        />

        {/* Modal Eliminar Partido Programado */}
        <DeleteMatchModal
          isOpen={Boolean(deletingMatch)}
          match={deletingMatch}
          onClose={handleCloseDeleteMatch}
        />
      </div>
    </DashboardLayout>
  );
}

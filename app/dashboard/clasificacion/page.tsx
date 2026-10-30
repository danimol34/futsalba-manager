"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { NumericInput } from "@/components/ui/NumericInput";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { isUUID } from "@/lib/utils/validators";
import {
  Trophy,
  SlidersHorizontal,
  Settings,
  History,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
  Trash2,
  RotateCcw,
  X,
  Loader2,
  ShieldAlert,
  Eye,
  Info,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { StandingAdjustment } from "@/types";

export default function StandingsPage() {
  const {
    standings,
    standingsAdjustments,
    teams,
    seasons,
    competitions,
    leagueSettings,
    currentUserRole,
    addStandingAdjustment,
    revertStandingAdjustment,
  } = useFutsal();
  const toast = useToast();

  // Permisos: Solo SUPER_ADMIN, PRESIDENTE y ADMINISTRADOR pueden alterar puntos
  const canAdjustPoints = [
    "SUPER_ADMIN",
    "PRESIDENTE",
    "ADMINISTRADOR",
  ].includes(currentUserRole);

  const isPrensa = currentUserRole === "PRENSA";

  // Temporadas con UUID real de Supabase
  const validSeasons = useMemo(() => {
    return seasons.filter((s) => isUUID(s.id));
  }, [seasons]);

  // Temporada seleccionada para la vista
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>("");

  useEffect(() => {
    if (!selectedSeasonFilter && validSeasons.length > 0) {
      const active =
        validSeasons.find(
          (s) => isUUID(leagueSettings.active_season_id) && s.id === leagueSettings.active_season_id
        ) ||
        validSeasons.find((s) => s.status === "ACTIVA") ||
        validSeasons[0];
      if (active) setSelectedSeasonFilter(active.id);
    }
  }, [validSeasons, leagueSettings.active_season_id, selectedSeasonFilter]);

  // Competiciones con UUID real de Supabase
  const validCompetitions = useMemo(() => {
    return competitions.filter((c) => isUUID(c.id));
  }, [competitions]);

  // Competición seleccionada para la vista ("ALL" o UUID)
  const [selectedCompFilter, setSelectedCompFilter] = useState<string>("ALL");

  // Competiciones disponibles para la temporada filtrada en vista
  const viewSeasonCompetitions = useMemo(() => {
    return validCompetitions.filter(
      (c) => !selectedSeasonFilter || !c.season_id || c.season_id === selectedSeasonFilter
    );
  }, [validCompetitions, selectedSeasonFilter]);

  // Equipos con UUID real de Supabase
  const validTeams = useMemo(() => {
    return teams.filter((t) => isUUID(t.id));
  }, [teams]);

  // Historial de ajustes filtrado por temporada/competición para que no se mezclen entre distintas temporadas
  const filteredAdjustments = useMemo(() => {
    return standingsAdjustments.filter((adj) => {
      if (selectedSeasonFilter && adj.season_id && adj.season_id !== selectedSeasonFilter) {
        return false;
      }
      if (selectedCompFilter !== "ALL" && adj.competition_id && adj.competition_id !== selectedCompFilter) {
        return false;
      }
      return true;
    });
  }, [standingsAdjustments, selectedSeasonFilter, selectedCompFilter]);

  // Modal State para nuevo ajuste
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSeasonId, setModalSeasonId] = useState<string>("");
  const [modalCompetitionId, setModalCompetitionId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [pointsDelta, setPointsDelta] = useState<string>("-1");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State para REVERSIÓN INMUTABLE
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [targetAdjustment, setTargetAdjustment] = useState<StandingAdjustment | null>(null);
  const [reversalReason, setReversalReason] = useState<string>("");
  const [isReversing, setIsReversing] = useState(false);

  // Equipo seleccionado en el modal
  const selectedTeam = validTeams.find((t) => t.id === selectedTeamId) || teams.find((t) => t.id === selectedTeamId) || teams[0];
  const selectedStanding = standings.find((s) => s.team_id === selectedTeam?.id);

  const parsedPointsDelta = Number.isNaN(parseInt(pointsDelta, 10)) ? 0 : parseInt(pointsDelta, 10);

  const currentMatchPoints =
    selectedStanding?.match_points !== undefined
      ? selectedStanding.match_points
      : (selectedStanding?.points || 0) - (selectedStanding?.points_adjustment || 0);
  const currentAdjustment = selectedStanding?.points_adjustment || 0;
  const currentTotal = selectedStanding?.points || 0;
  const projectedTotal = currentTotal + parsedPointsDelta;

  // Competiciones disponibles en el modal según la temporada seleccionada
  const modalCompetitions = useMemo(() => {
    return validCompetitions.filter(
      (c) => !modalSeasonId || !c.season_id || c.season_id === modalSeasonId
    );
  }, [validCompetitions, modalSeasonId]);

  const isModalSeasonValid = isUUID(modalSeasonId);
  const isModalCompetitionValid = isUUID(modalCompetitionId);
  const isModalTeamValid = isUUID(selectedTeamId);
  const isValidSelection = isModalSeasonValid && isModalCompetitionValid;
  const canSubmitAdjustment =
    isValidSelection &&
    isModalTeamValid &&
    parsedPointsDelta !== 0 &&
    reason.trim().length > 0 &&
    !isSubmitting;

  const openAdjustmentModal = (preselectedTeamId?: string) => {
    // 1. Temporada: Usar la de la vista si es UUID válido, o la activa en Supabase
    const defaultSeasonId =
      (selectedSeasonFilter && isUUID(selectedSeasonFilter) ? selectedSeasonFilter : null) ||
      validSeasons.find((s) => s.status === "ACTIVA")?.id ||
      validSeasons[0]?.id ||
      "";
    setModalSeasonId(defaultSeasonId);

    // 2. Competiciones de esa temporada
    const compsForSeason = validCompetitions.filter(
      (c) => !defaultSeasonId || !c.season_id || c.season_id === defaultSeasonId
    );
    const defaultCompId =
      (selectedCompFilter !== "ALL" && isUUID(selectedCompFilter) ? selectedCompFilter : null) ||
      compsForSeason[0]?.id ||
      "";
    setModalCompetitionId(defaultCompId);

    // 3. Equipo
    const teamId =
      (preselectedTeamId && isUUID(preselectedTeamId) ? preselectedTeamId : null) ||
      validTeams[0]?.id ||
      "";
    setSelectedTeamId(teamId);

    setPointsDelta("-1");
    setReason("");
    setModalOpen(true);
  };

  const handleModalSeasonChange = (newSeasonId: string) => {
    setModalSeasonId(newSeasonId);
    const compsForSeason = validCompetitions.filter(
      (c) => !newSeasonId || !c.season_id || c.season_id === newSeasonId
    );
    setModalCompetitionId(compsForSeason[0]?.id || "");
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isModalSeasonValid || !isModalCompetitionValid) {
      toast.warning("Debes seleccionar una temporada y competición válidas antes de registrar el ajuste.");
      return;
    }

    if (!isModalTeamValid) {
      toast.warning("Debes seleccionar un equipo con UUID real.");
      return;
    }

    if (!reason.trim()) {
      toast.warning("El motivo reglamentario del ajuste es obligatorio.");
      return;
    }

    if (parsedPointsDelta === 0) {
      toast.warning("El valor del ajuste no puede ser cero.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addStandingAdjustment({
        team_id: selectedTeamId,
        points_delta: parsedPointsDelta,
        reason: reason.trim(),
        season_id: modalSeasonId,
        competition_id: modalCompetitionId,
      });

      toast.success(
        `Ajuste de ${parsedPointsDelta > 0 ? `+${parsedPointsDelta}` : parsedPointsDelta} pts registrado para ${selectedTeam?.name}.`
      );
      setModalOpen(false);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReversalModal = (adj: StandingAdjustment) => {
    setTargetAdjustment(adj);
    setReversalReason(`Reversión de ajuste previo (${adj.points_delta > 0 ? `+${adj.points_delta}` : adj.points_delta} pts) por resolución oficial`);
    setReversalModalOpen(true);
  };

  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdjustment) return;
    if (!reversalReason.trim()) {
      toast.warning("El motivo de la reversión es obligatorio para la auditoría inmutable.");
      return;
    }

    setIsReversing(true);
    try {
      await revertStandingAdjustment(targetAdjustment, reversalReason.trim());
      toast.success(
        `Reversión inmutable registrada con éxito (+${-targetAdjustment.points_delta > 0 ? -targetAdjustment.points_delta : -targetAdjustment.points_delta} pts). Trazabilidad preservada.`
      );
      setReversalModalOpen(false);
      setTargetAdjustment(null);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsReversing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                TABLA OFICIAL DE CLASIFICACIÓN
              </h1>
              {isPrensa && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-pink-500/15 text-pink-300 border border-pink-500/30">
                  <Eye className="w-3.5 h-3.5" />
                  PRENSA • SOLO LECTURA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cálculo reglamentario de posiciones por partidos oficiales y resoluciones administrativas federativas.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {canAdjustPoints && (
              <button
                type="button"
                onClick={() => openAdjustmentModal()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4" />
                AJUSTAR PUNTOS
              </button>
            )}

            {canAdjustPoints && (
              <Link
                href="/dashboard/configuracion"
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
                title="Configuración de puntos por partido"
              >
                <Settings className="w-4 h-4 text-blue-400" />
                <span className="hidden md:inline">Reglas de Puntos</span>
              </Link>
            )}
          </div>
        </div>

        {/* Rule reminder strip with Formula transparency */}
        <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-blue-200 font-semibold">
              <strong>Fórmula Reglamentaria:</strong> Puntos Oficiales = Puntos Obtenidos en Partidos + Suma de Ajustes Administrativos.
            </span>
          </div>
          <div className="text-slate-400 text-[11px] font-mono">
            PG, PE, PP, GF, GC y DG se calculan exclusivamente de partidos finalizados.
          </div>
        </div>

        {/* Selector de Temporada y Competición para filtrar Clasificación y Auditoría */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Temporada:
              </span>
              <select
                value={selectedSeasonFilter}
                onChange={(e) => {
                  setSelectedSeasonFilter(e.target.value);
                  setSelectedCompFilter("ALL");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
              >
                {validSeasons.length === 0 ? (
                  <option value="">Sin temporadas activas</option>
                ) : (
                  validSeasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.status === "ACTIVA" ? "• ACTIVA" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            {viewSeasonCompetitions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Competición:
                </span>
                <select
                  value={selectedCompFilter}
                  onChange={(e) => setSelectedCompFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Todas las competiciones</option>
                  {viewSeasonCompetitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {filteredAdjustments.length} ajuste(s) registrado(s) en este período
          </div>
        </div>

        {/* Full Table with Points Breakdown */}
        <StandingsTable
          standings={standings}
          compact={false}
          showBreakdown={true}
          isPublic={false}
        />

        {/* Historial / Auditoría de Ajustes Administrativos */}
        <div className="sports-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-extrabold text-white text-sm tracking-tight">
                  Historial de Ajustes Administrativos (Auditoría)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Registro oficial y transparente de modificaciones reglamentarias de puntos. No se permiten cambios silenciosos.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
              {filteredAdjustments.length} registro(s)
            </span>
          </div>

          {filteredAdjustments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              <p className="font-bold text-white mb-0.5">Sin ajustes manuales registrados</p>
              <p className="text-slate-500 text-[11px]">
                Todos los puntos de la tabla reflejan íntegramente los resultados de partidos disputados en este período.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Equipo Sancionado / Ajustado</th>
                    <th className="py-3 px-3 text-center">Variación</th>
                    <th className="py-3 px-4">Motivo Reglamentario Oficial</th>
                    <th className="py-3 px-4">Autorizado por</th>
                    <th className="py-3 px-3">Fecha y Hora</th>
                    {canAdjustPoints && (
                      <th className="py-3 px-4 text-right">Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAdjustments.map((adj) => {
                    const team = teams.find((t) => t.id === adj.team_id);
                    const isPositive = adj.points_delta > 0;

                    return (
                      <tr key={adj.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <TeamLogo
                              name={team?.name || adj.team_name || ""}
                              shortName={team?.short_name}
                              logoUrl={team?.logo_url}
                              size="sm"
                            />
                            <div>
                              <div className="font-bold text-white">
                                {team?.name || adj.team_name || "Equipo"}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {adj.team_id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black font-scoreboard ${
                              isPositive
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {isPositive ? `+${adj.points_delta}` : adj.points_delta} pts
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-md">
                          <p className="text-slate-200 font-medium leading-relaxed">
                            {adj.reason}
                          </p>
                        </td>

                        <td className="py-3 px-4 text-slate-300 font-medium">
                          <div>
                            <span className="font-bold text-white text-xs block">
                              {adj.created_by_name || "Administrador"}
                            </span>
                            {adj.created_by_email && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {adj.created_by_email}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {adj.created_at
                            ? new Date(adj.created_at).toLocaleString("es-AR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "-"}
                        </td>

                        {canAdjustPoints && (
                          <td className="py-3 px-4 text-right">
                            {standingsAdjustments.some(
                              (a) => a.reverses_adjustment_id === adj.id
                            ) ? (
                              <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-slate-500" />
                                REVERTIDO
                              </span>
                            ) : adj.reverses_adjustment_id ? (
                              <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                                COMPENSATORIO
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openReversalModal(adj)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                title="Crear ajuste inverso de reversión (Auditoría inmutable)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>REVERTIR AJUSTE</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Ajustar Puntos Manualmente */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="sports-card w-full max-w-lg rounded-3xl p-6 border border-slate-700 bg-[#0a1020] shadow-2xl relative">
              {/* Header Modal con Controles Claros de Salida */}
              <div className="pb-4 border-b border-slate-800 space-y-3">
                {/* Fila superior: ← Volver a la izquierda y X a la derecha */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all active:scale-95 shadow-sm min-h-[42px] touch-manipulation"
                    title="Regresar a la clasificación sin guardar"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    aria-label="Cerrar ventana de ajuste"
                    title="Cerrar sin guardar"
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition-all active:scale-95 touch-manipulation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Título e Icono Oficial */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">
                      AJUSTE MANUAL DE PUNTOS
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Resolución federativa / disciplinaria oficial
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmAdjustment} className="mt-5 space-y-4">
                {/* Alerta de bloqueo si no hay temporada o competición válidas seleccionadas */}
                {!isValidSelection && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200">
                      <p className="font-bold text-amber-300 mb-0.5">Validación de Competición Requerida</p>
                      <p>Debes seleccionar una temporada y competición válidas antes de registrar el ajuste.</p>
                    </div>
                  </div>
                )}

                {/* 1. Seleccionar Temporada Oficial */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    1. Temporada Oficial *
                  </label>
                  <select
                    value={modalSeasonId}
                    onChange={(e) => handleModalSeasonChange(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  >
                    {validSeasons.length === 0 ? (
                      <option value="" disabled>
                        No hay temporadas registradas con UUID en Supabase
                      </option>
                    ) : (
                      validSeasons.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.status})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 2. Seleccionar Competición Oficial */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    2. Competición Oficial *
                  </label>
                  <select
                    value={modalCompetitionId}
                    onChange={(e) => setModalCompetitionId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  >
                    {modalCompetitions.length === 0 ? (
                      <option value="" disabled>
                        No hay competiciones registradas para esta temporada en Supabase
                      </option>
                    ) : (
                      modalCompetitions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 3. Seleccionar Club / Equipo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    3. Seleccionar Club / Equipo *
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  >
                    {validTeams.length === 0 ? (
                      <option value="" disabled>
                        No hay equipos con UUID real registrados en Supabase
                      </option>
                    ) : (
                      validTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.short_name})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 4. Resumen de Puntos Actuales del Club */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Puntos Partidos
                    </div>
                    <div className="text-lg font-black text-white font-scoreboard mt-0.5">
                      {currentMatchPoints}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-amber-400 uppercase">
                      Ajustes Previos
                    </div>
                    <div className="text-lg font-black text-amber-300 font-scoreboard mt-0.5">
                      {currentAdjustment > 0
                        ? `+${currentAdjustment}`
                        : currentAdjustment}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase">
                      Total Oficial Actual
                    </div>
                    <div className="text-lg font-black text-blue-400 font-scoreboard mt-0.5">
                      {currentTotal}
                    </div>
                  </div>
                </div>

                {/* 5. Valor del Ajuste (+ / -) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      4. Variación de Puntos (+ / -)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Valores positivos o negativos
                    </span>
                  </div>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { label: "+3 pts (Victoria otorgada)", value: 3 },
                      { label: "+1 pt (Resolución)", value: 1 },
                      { label: "-1 pt (Descuento)", value: -1 },
                      { label: "-3 pts (Quita disciplinaria)", value: -3 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setPointsDelta(String(preset.value))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          parsedPointsDelta === preset.value
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <NumericInput
                      allowNegative
                      step="1"
                      value={pointsDelta}
                      onChange={(e) => setPointsDelta(e.target.value)}
                      placeholder="Ej. -3 o +1"
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-base font-black font-scoreboard focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* 6. Live Preview del Nuevo Puntaje */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-200">
                    Nuevo Total Oficial Resultante:
                  </span>
                  <span className="font-scoreboard text-base font-black text-amber-400">
                    {projectedTotal} pts
                  </span>
                </div>

                {/* 7. Motivo Obligatorio */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    5. Motivo Oficial Obligatorio *
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Resolución N° 08/2026 del Tribunal de Disciplina por alineación indebida de jugador sancionado en la Jornada 2."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Este motivo quedará asentado permanentemente en la auditoría con tu usuario y fecha.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmitAdjustment}
                    title={
                      !isValidSelection
                        ? "Debes seleccionar una temporada y competición válidas antes de registrar el ajuste."
                        : undefined
                    }
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando Ajuste...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar y Registrar Ajuste Oficial
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: REVERSIÓN INMUTABLE DE AJUSTE */}
        {reversalModalOpen && targetAdjustment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="sports-card w-full max-w-lg rounded-3xl p-6 border border-amber-500/40 bg-[#0a1020] shadow-2xl relative">
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">
                      REVERSIÓN INMUTABLE DE AJUSTE
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Principio de trazabilidad: nunca se borra el historial
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReversalModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmReversal} className="mt-5 space-y-5">
                {/* Information Card */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Equipo Afectado:</span>
                    <span className="font-bold text-white">
                      {targetAdjustment.team_name || "Equipo"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Ajuste Original Registrado:</span>
                    <span className="font-scoreboard font-black text-rose-400">
                      {targetAdjustment.points_delta > 0
                        ? `+${targetAdjustment.points_delta}`
                        : targetAdjustment.points_delta}{" "}
                      pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                    <span className="text-slate-300 font-bold">Ajuste Inverso Compensatorio:</span>
                    <span className="font-scoreboard font-black text-emerald-400 text-sm">
                      {-targetAdjustment.points_delta > 0
                        ? `+${-targetAdjustment.points_delta}`
                        : -targetAdjustment.points_delta}{" "}
                      pts
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic pt-1">
                    Motivo original: &quot;{targetAdjustment.reason}&quot;
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-200 block mb-0.5">Auditoría Garantizada:</strong>
                  El ajuste original permanecerá inalterable en la base de datos para preservar el registro histórico. Se creará automáticamente un nuevo registro inverso que neutralizará el impacto en los puntos oficiales.
                </div>

                {/* Motivo Obligatorio */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Motivo Oficial de la Reversión *
                  </label>
                  <textarea
                    rows={3}
                    value={reversalReason}
                    onChange={(e) => setReversalReason(e.target.value)}
                    placeholder="Ej. Anulación del ajuste anterior tras estimarse el recurso de apelación según Resolución 018-CD."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReversalModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isReversing || !reversalReason.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    {isReversing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registrando Reversión...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Confirmar Reversión Inmutable
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

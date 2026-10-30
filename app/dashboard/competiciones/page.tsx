"use client";

import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { NumericInput } from "@/components/ui/NumericInput";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { isUUID } from "@/lib/utils/validators";
import { Competition, Season } from "@/types";
import { CompetitionInsert, CompetitionUpdate } from "@/lib/services";
import {
  Trophy,
  Plus,
  X,
  Check,
  Edit2,
  Power,
  Loader2,
} from "lucide-react";

interface CompetitionFormModalProps {
  isOpen: boolean;
  editingComp: Competition | null;
  onClose: () => void;
  seasons: Season[];
  createCompetition: (comp: CompetitionInsert) => Promise<Competition>;
  updateCompetition: (id: string, updates: CompetitionUpdate) => Promise<Competition>;
}

const CompetitionFormModal = memo(function CompetitionFormModal({
  isOpen,
  editingComp,
  onClose,
  seasons,
  createCompetition,
  updateCompetition,
}: CompetitionFormModalProps) {
  const toast = useToast();

  // Estado local aislado
  const [name, setName] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [competitionType, setCompetitionType] = useState("LIGA");
  const [format, setFormat] = useState("TODOS_CONTRA_TODOS");
  const [numberOfTeams, setNumberOfTeams] = useState<string>("8");
  const [startDate, setStartDate] = useState("2026-03-01");
  const [endDate, setEndDate] = useState("2026-11-15");
  const [status, setStatus] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validSeasons = useMemo(
    () => seasons.filter((s) => isUUID(s.id)),
    [seasons]
  );

  const defaultActiveSeasonId = useMemo(() => {
    const active = validSeasons.find((s) => s.status === "ACTIVA");
    return active?.id || validSeasons[0]?.id || "";
  }, [validSeasons]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingComp) {
      setName(editingComp.name || "");
      setSeasonId(
        editingComp.season_id && isUUID(editingComp.season_id)
          ? editingComp.season_id
          : defaultActiveSeasonId
      );
      setCompetitionType(editingComp.competition_type || editingComp.type || "LIGA");
      setFormat(editingComp.format || "TODOS_CONTRA_TODOS");
      setNumberOfTeams(String(editingComp.number_of_teams ?? 8));
      setStartDate(editingComp.start_date || "2026-03-01");
      setEndDate(editingComp.end_date || "2026-11-15");
      setStatus(
        editingComp.status === true ||
          editingComp.status === "ACTIVO" ||
          editingComp.status === "ACTIVA"
      );
    } else {
      setName("");
      setSeasonId(defaultActiveSeasonId);
      setCompetitionType("LIGA");
      setFormat("TODOS_CONTRA_TODOS");
      setNumberOfTeams("8");
      setStartDate("2026-03-01");
      setEndDate("2026-11-15");
      setStatus(true);
    }
    setIsSubmitting(false);
  }, [isOpen, editingComp, defaultActiveSeasonId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("El nombre de la competición es obligatorio.");
      return;
    }

    const parsedTeams = parseInt(String(numberOfTeams).trim(), 10);
    if (isNaN(parsedTeams) || parsedTeams < 2) {
      toast.warning("La cantidad de equipos debe ser al menos 2.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        season_id: seasonId || null,
        name: name.trim(),
        competition_type: competitionType,
        format,
        number_of_teams: parsedTeams,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
      };

      if (editingComp) {
        await updateCompetition(editingComp.id, payload);
        toast.success("✅ Competición actualizada correctamente");
      } else {
        await createCompetition(payload);
        toast.success("✅ Competición creada correctamente");
      }

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
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            {editingComp ? "EDITAR COMPETICIÓN" : "NUEVA COMPETICIÓN"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Nombre del Torneo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Liga Apertura 2026 - Primera División"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Temporada Vinculada *
              </label>
              <select
                required
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {validSeasons.length === 0 ? (
                  <option value="">Sin temporadas registradas</option>
                ) : (
                  validSeasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.status === "ACTIVA" ? "(ACTIVA)" : `(${s.status})`}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Tipo de Torneo
              </label>
              <select
                value={competitionType}
                onChange={(e) => setCompetitionType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="LIGA">LIGA REGULAR</option>
                <option value="COPA">COPA ELIMINATORIA</option>
                <option value="PLAYOFFS">PLAYOFFS / FASE FINAL</option>
                <option value="SUPERCOPA">SUPERCOPA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Formato
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS_CONTRA_TODOS">Todos contra todos (Round Robin)</option>
                <option value="IDA_Y_VUELTA">Ida y vuelta</option>
                <option value="ELIMINACION_DIRECTA">Eliminación directa</option>
                <option value="GRUPOS_Y_PLAYOFFS">Fase de grupos + Playoffs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Cantidad de Equipos
              </label>
              <NumericInput
                min={2}
                max={64}
                placeholder="Ej: 8"
                value={numberOfTeams}
                onValueChange={setNumberOfTeams}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingComp ? "Actualizar Torneo" : "Crear Torneo"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default function CompetitionsPage() {
  const { competitions, seasons, createCompetition, updateCompetition, isLoadingRemote, currentUserRole } = useFutsal();
  const toast = useToast();
  const isReadOnly = currentUserRole === "PRENSA";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);

  const seasonById = useMemo(() => {
    const map = new Map<string, Season>();
    for (const s of seasons) {
      map.set(s.id, s);
    }
    return map;
  }, [seasons]);

  const openCreateModal = useCallback(() => {
    setEditingComp(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((comp: Competition) => {
    setEditingComp(comp);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingComp(null);
  }, []);

  const handleToggleStatus = async (comp: Competition) => {
    const currentActive = comp.status === true || comp.status === "ACTIVO" || comp.status === "ACTIVA";
    const nextStatus = !currentActive;
    try {
      await updateCompetition(comp.id, { status: nextStatus });
      toast.success(nextStatus ? "✅ Competición activada" : "✅ Competición desactivada");
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              COMPETICIONES Y TORNEOS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configuración de formatos de liga, copas y fases finales (Supabase).
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              NUEVA COMPETICIÓN
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoadingRemote && competitions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium">Cargando competiciones desde Supabase...</p>
          </div>
        ) : competitions.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={Trophy}
            title="No hay competiciones registradas"
            description="Crea la primera competición del torneo asociada a una temporada oficial."
            actionLabel="+ Crear primer torneo"
            onAction={openCreateModal}
          />
        ) : (
          /* Competitions Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {competitions.map((comp) => {
              const season = comp.season_id ? seasonById.get(comp.season_id) : undefined;
              const isActive = comp.status === true || comp.status === "ACTIVO" || comp.status === "ACTIVA";

              return (
                <div
                  key={comp.id}
                  className={`sports-card rounded-3xl p-6 border flex flex-col justify-between space-y-4 ${
                    isActive ? "border-slate-800" : "border-slate-800/60 opacity-70"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        {comp.competition_type || comp.type || "LIGA"}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isActive ? "ACTIVA" : "INACTIVA"}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mt-3">{comp.name}</h3>
                    <div className="text-xs text-slate-400 font-semibold mt-1">
                      {season?.name || "Sin temporada asociada"}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          FORMATO
                        </span>
                        <span>{comp.format || "Todos contra todos"}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          EQUIPOS
                        </span>
                        <span className="font-bold text-white">{comp.number_of_teams || 0} Clubes</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          FECHA INICIO
                        </span>
                        <span>{comp.start_date || "Por definir"}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          FECHA FINAL
                        </span>
                        <span>{comp.end_date || "Por definir"}</span>
                      </div>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(comp)}
                        title={isActive ? "Desactivar" : "Activar"}
                        className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(comp)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Modificar Torneo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Create / Edit con estado local aislado */}
        <CompetitionFormModal
          isOpen={modalOpen}
          editingComp={editingComp}
          onClose={closeModal}
          seasons={seasons}
          createCompetition={createCompetition}
          updateCompetition={updateCompetition}
        />
      </div>
    </DashboardLayout>
  );
}

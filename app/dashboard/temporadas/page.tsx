"use client";

import React, { useState } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { Season, SeasonStatus } from "@/types";
import { CalendarDays, Plus, CheckCircle2, Clock, X, Check, Edit2, Loader2 } from "lucide-react";

export default function SeasonsPage() {
  const { seasons, createSeason, updateSeason, isLoadingRemote, currentUserRole } = useFutsal();
  const toast = useToast();
  const isReadOnly = currentUserRole === "PRENSA";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [status, setStatus] = useState<SeasonStatus>("ACTIVA");

  const openCreateModal = () => {
    setEditingSeason(null);
    setName("");
    setStartDate("2026-01-01");
    setEndDate("2026-12-31");
    setStatus("ACTIVA");
    setModalOpen(true);
  };

  const openEditModal = (season: Season) => {
    setEditingSeason(season);
    setName(season.name);
    setStartDate(season.start_date || "2026-01-01");
    setEndDate(season.end_date || "2026-12-31");
    setStatus(season.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("El nombre de la temporada es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSeason) {
        await updateSeason(editingSeason.id, {
          name: name.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
          status,
        });
        toast.success("✅ Temporada actualizada correctamente");
      } else {
        await createSeason({
          name: name.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
          status,
        });
        toast.success("✅ Temporada creada correctamente");
      }
      setModalOpen(false);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetStatus = async (season: Season, newStatus: SeasonStatus) => {
    try {
      await updateSeason(season.id, { status: newStatus });
      toast.success(`✅ Temporada marcada como ${newStatus}`);
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
              <CalendarDays className="w-6 h-6 text-blue-400" />
              TEMPORADAS DEPORTIVAS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ciclos anuales de competencia, periodos de habilitación y estados de temporada (Supabase).
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              NUEVA TEMPORADA
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoadingRemote && seasons.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium">Cargando temporadas desde Supabase...</p>
          </div>
        ) : seasons.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No hay temporadas registradas"
            description="Registra la primera temporada oficial (ej: Temporada 2026) para comenzar a organizar competiciones y partidos."
            actionLabel="+ Crear primer temporada"
            onAction={openCreateModal}
          />
        ) : (
          /* Seasons Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="sports-card rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        season.status === "ACTIVA"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : season.status === "FINALIZADA"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {season.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                      {season.id}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white mt-3">{season.name}</h3>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                    <div>
                      Fecha inicio: <strong className="text-slate-200">{season.start_date || "Sin fecha"}</strong>
                    </div>
                    <div>
                      Fecha fin: <strong className="text-slate-200">{season.end_date || "Sin fecha"}</strong>
                    </div>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(season)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>

                    {season.status !== "ACTIVA" ? (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(season, "ACTIVA")}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                      >
                        Activar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(season, "FINALIZADA")}
                        className="flex-1 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-colors"
                      >
                        Finalizar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Create / Edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-400" />
                  {editingSeason ? "EDITAR TEMPORADA" : "NUEVA TEMPORADA"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Nombre de la Temporada *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Temporada 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
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

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SeasonStatus)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BORRADOR">BORRADOR (En preparación)</option>
                    <option value="ACTIVA">ACTIVA (En curso oficial)</option>
                    <option value="FINALIZADA">FINALIZADA (Concluida)</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setModalOpen(false)}
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
                        <span>{editingSeason ? "Actualizar Temporada" : "Guardar Temporada"}</span>
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

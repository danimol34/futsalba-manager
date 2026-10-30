"use client";

import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MatchCard } from "@/components/sports/MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { NumericInput } from "@/components/ui/NumericInput";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { Competition, Match } from "@/types";
import { MatchdayInsert } from "@/lib/services";
import { Layers, Plus, Calendar, Swords, X, Check, Loader2 } from "lucide-react";

interface CreateMatchdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextNumber: number;
  competitions: Competition[];
  onCreateMatchday: (data: MatchdayInsert) => Promise<any>;
}

const CreateMatchdayModal = memo(function CreateMatchdayModal({
  isOpen,
  onClose,
  nextNumber,
  competitions,
  onCreateMatchday,
}: CreateMatchdayModalProps) {
  const toast = useToast();

  // Estado 100% local del formulario para evitar re-renderizar el Dashboard mientras se escribe
  const [name, setName] = useState(`Jornada ${nextNumber}`);
  const [matchdayNumber, setMatchdayNumber] = useState<string>(String(nextNumber));
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id || "");
  const [startDate, setStartDate] = useState("2026-03-07");
  const [endDate, setEndDate] = useState("2026-03-08");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(`Jornada ${nextNumber}`);
      setMatchdayNumber(String(nextNumber));
      setCompetitionId(competitions[0]?.id || "");
      setStartDate("2026-03-07");
      setEndDate("2026-03-08");
      setIsSubmitting(false);
    }
  }, [isOpen, nextNumber, competitions]);

  if (!isOpen) return null;

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

    if (!competitionId && competitions.length > 0) {
      toast.warning("Debes seleccionar una competición para la jornada.");
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
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            NUEVA JORNADA
          </h3>
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
                Competición
              </label>
              <select
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecciona torneo</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
  const { matchdays, matches, competitions, createMatchday, isLoadingRemote, currentUserRole } = useFutsal();
  const isReadOnly = currentUserRole === "PRENSA";

  const [modalOpen, setModalOpen] = useState(false);

  const openCreateModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setModalOpen(false);
  }, []);

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
                      <MatchCard key={match.id} match={match} />
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
          competitions={competitions}
          onCreateMatchday={createMatchday}
        />
      </div>
    </DashboardLayout>
  );
}

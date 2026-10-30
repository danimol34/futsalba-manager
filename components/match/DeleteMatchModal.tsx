"use client";

import React, { useState, useEffect, memo } from "react";
import { Match, MatchStatus } from "@/types";
import { useFutsal } from "@/lib/store/futsalStore";
import { matchesService } from "@/lib/services/matches";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import {
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Calendar,
  Layers,
  Ban,
  PauseCircle,
} from "lucide-react";

interface DeleteMatchModalProps {
  isOpen: boolean;
  match: Match | null;
  onClose: () => void;
  onDeleted?: (deletedId: string) => void;
}

export const DeleteMatchModal = memo(function DeleteMatchModal({
  isOpen,
  match,
  onClose,
  onDeleted,
}: DeleteMatchModalProps) {
  const {
    teams,
    matchdays,
    matchEvents,
    sanctions,
    deleteMatch,
    updateMatch,
  } = useFutsal();
  const toast = useToast();

  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasRemoteOfficialData, setHasRemoteOfficialData] = useState(false);

  const homeTeam = teams.find((t) => t.id === match?.home_team_id);
  const awayTeam = teams.find((t) => t.id === match?.away_team_id);
  const matchday = matchdays.find((md) => md.id === match?.matchday_id);

  const hasLocalOfficialData = Boolean(
    match &&
      (match.status !== "PROGRAMADO" ||
        (match.home_score ?? 0) > 0 ||
        (match.away_score ?? 0) > 0 ||
        (match.home_fouls ?? 0) > 0 ||
        (match.away_fouls ?? 0) > 0 ||
        matchEvents.some((e) => e.match_id === match.id) ||
        sanctions.some((s) => s.match_id === match.id))
  );

  useEffect(() => {
    if (!isOpen || !match) return;
    setIsDeleting(false);
    setHasRemoteOfficialData(false);

    let active = true;
    setIsChecking(true);
    matchesService
      .checkMatchHasOfficialData(match.id)
      .then((res) => {
        if (active && res.hasOfficialData) {
          setHasRemoteOfficialData(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsChecking(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  const isProtected = hasLocalOfficialData || hasRemoteOfficialData;

  const handleConfirmDelete = async () => {
    if (isProtected) {
      toast.error(
        "No se puede eliminar este partido porque ya contiene información oficial."
      );
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMatch(match.id);
      toast.success("Partido eliminado correctamente.");
      onDeleted?.(match.id);
      onClose();
    } catch (err: any) {
      if (err?.code === "MATCH_HAS_OFFICIAL_DATA") {
        setHasRemoteOfficialData(true);
        toast.error(
          "No se puede eliminar este partido porque ya contiene información oficial."
        );
      } else {
        const formatted = formatSupabaseError(err);
        toast.error(formatted.message, formatted.title);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetSafeStatus = async (nextStatus: "SUSPENDIDO" | "CANCELADO") => {
    setIsDeleting(true);
    try {
      await updateMatch(match.id, {
        status: nextStatus as MatchStatus,
      });
      toast.success("Partido actualizado correctamente.");
      onClose();
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isProtected
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-400"
              }`}
            >
              {isProtected ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isProtected
                  ? "PARTIDO PROTEGIDO"
                  : "¿Eliminar este partido programado?"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isProtected
                  ? "Integridad de datos e historial oficial"
                  : "Esta acción eliminará el encuentro del fixture"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cerrar confirmación"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-semibold">Equipo Local:</span>
            <span className="font-bold text-white flex items-center gap-2">
              <TeamLogo
                name={homeTeam?.name || "Local"}
                shortName={homeTeam?.short_name}
                logoUrl={homeTeam?.logo_url}
                size="sm"
              />
              {homeTeam?.name || "Equipo Local"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-semibold">Equipo Visitante:</span>
            <span className="font-bold text-white flex items-center gap-2">
              <TeamLogo
                name={awayTeam?.name || "Visitante"}
                shortName={awayTeam?.short_name}
                logoUrl={awayTeam?.logo_url}
                size="sm"
              />
              {awayTeam?.name || "Equipo Visitante"}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Fecha:
            </span>
            <span className="font-mono font-bold text-white">
              {match.match_date}{" "}
              {match.kickoff_time ? `• ${match.kickoff_time.slice(0, 5)} hs` : ""}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Jornada:
            </span>
            <span className="font-bold text-white">
              {matchday?.name || "Sin jornada asignada"}
            </span>
          </div>
        </div>

        {isChecking ? (
          <div className="py-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>Verificando historial oficial del partido...</span>
          </div>
        ) : isProtected ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
              Este partido ya contiene información oficial y no puede eliminarse.
              Puedes suspenderlo o cancelarlo sin borrar su historial.
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleSetSafeStatus("SUSPENDIDO")}
                className="px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Suspender</span>
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleSetSafeStatus("CANCELADO")}
                className="px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, eliminar partido</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

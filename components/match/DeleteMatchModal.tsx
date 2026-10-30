"use client";

import React, { useState, useEffect, memo } from "react";
import { Match, MatchStatus } from "@/types";
import { useFutsal } from "@/lib/store/futsalStore";
import {
  matchesService,
  MatchOfficialDataCheckResult,
  OFFICIAL_MATCH_EVENT_TYPES,
} from "@/lib/services/matches";
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
  ShieldAlert,
  ArrowLeft,
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
    currentUserRole,
    deleteMatch,
    deleteTestMatch,
    updateMatch,
  } = useFutsal();
  const toast = useToast();

  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [remoteCheck, setRemoteCheck] =
    useState<MatchOfficialDataCheckResult | null>(null);

  // Estado local para la confirmación fuerte de SUPER_ADMIN ("ELIMINAR DATOS DE PRUEBA")
  const [showTestCleanupConfirm, setShowTestCleanupConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const homeTeam = teams.find((t) => t.id === match?.home_team_id);
  const awayTeam = teams.find((t) => t.id === match?.away_team_id);
  const matchday = matchdays.find((md) => md.id === match?.matchday_id);

  const officialEventSet = new Set<string>(OFFICIAL_MATCH_EVENT_TYPES);
  const hasLocalOfficialData = Boolean(
    match &&
      ((match.status !== "PROGRAMADO" && match.status !== "EN_PREPARACION") ||
        (match.home_score ?? 0) > 0 ||
        (match.away_score ?? 0) > 0 ||
        matchEvents.some(
          (e) =>
            e.match_id === match.id && officialEventSet.has(e.event_type)
        ) ||
        sanctions.some((s) => s.match_id === match.id))
  );

  useEffect(() => {
    if (!isOpen || !match) return;
    setIsDeleting(false);
    setRemoteCheck(null);
    setShowTestCleanupConfirm(false);
    setConfirmText("");

    let active = true;
    setIsChecking(true);
    matchesService
      .checkMatchHasOfficialData(match.id)
      .then((res) => {
        if (active) {
          setRemoteCheck(res);
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

  const isProtected =
    hasLocalOfficialData || Boolean(remoteCheck?.hasOfficialData);
  const diagnosticReasons = remoteCheck?.reasons || [];
  const diagnostics = remoteCheck?.diagnostics;

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
        setRemoteCheck({
          hasOfficialData: true,
          reasons: err.reasons || [],
          diagnostics: err.diagnostics || {
            status: match.status,
            home_score: match.home_score ?? 0,
            away_score: match.away_score ?? 0,
            home_fouls: match.home_fouls ?? 0,
            away_fouls: match.away_fouls ?? 0,
            official_events_count: 0,
            auxiliary_events_count: 0,
            event_types: [],
            sanctions_count: 0,
            match_players_count: 0,
            match_referees_count: 0,
            logistics_tasks_count: 0,
          },
        });
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

  const handleSetSafeStatus = async (
    nextStatus: "SUSPENDIDO" | "CANCELADO"
  ) => {
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

  const handleConfirmTestCleanup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || confirmText !== "ELIMINAR") return;

    setIsDeleting(true);
    try {
      await deleteTestMatch(match.id);
      toast.success("Partido de prueba eliminado correctamente.");
      onDeleted?.(match.id);
      onClose();
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                showTestCleanupConfirm
                  ? "bg-rose-600/20 border-rose-500/40 text-rose-400"
                  : isProtected
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-400"
              }`}
            >
              {showTestCleanupConfirm ? (
                <ShieldAlert className="w-5 h-5" />
              ) : isProtected ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {showTestCleanupConfirm
                  ? "ELIMINAR DATOS DE PRUEBA"
                  : isProtected
                    ? "PARTIDO PROTEGIDO"
                    : "¿Eliminar este partido programado?"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {showTestCleanupConfirm
                  ? "Herramienta exclusiva de limpieza para SUPER_ADMIN"
                  : isProtected
                    ? "Integridad de datos e historial oficial"
                    : "Esta acción eliminará el encuentro del fixture"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cerrar ventana"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Card (Local, Visitante, Jornada, Fecha, Estado) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-semibold">Local:</span>
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
            <span className="text-slate-400 font-semibold">Visitante:</span>
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
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Jornada:
            </span>
            <span className="font-bold text-white">
              {matchday?.name || "Sin jornada asignada"}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
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
            <span className="text-slate-400 font-semibold">Estado:</span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-[11px] text-slate-200">
              {match.status}
            </span>
          </div>
        </div>

        {isChecking ? (
          <div className="py-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>Verificando historial oficial del partido...</span>
          </div>
        ) : showTestCleanupConfirm && isSuperAdmin ? (
          /* CONFIRMACIÓN FUERTE EXCLUSIVA PARA SUPER_ADMIN */
          <form onSubmit={handleConfirmTestCleanup} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 leading-relaxed space-y-2">
              <p className="font-bold text-rose-300">
                Esta acción eliminará permanentemente este partido de prueba y sus registros relacionados.
              </p>
              {diagnostics && (
                <div className="pt-1 border-t border-rose-500/20 text-[11px] text-rose-200/90 font-mono space-y-0.5">
                  <div>
                    • Eventos (match_events):{" "}
                    {diagnostics.official_events_count +
                      diagnostics.auxiliary_events_count}
                  </div>
                  <div>• Sanciones (sanctions): {diagnostics.sanctions_count}</div>
                  <div>
                    • Convocatoria (match_players):{" "}
                    {diagnostics.match_players_count}
                  </div>
                  <div>
                    • Árbitros (match_referees): {diagnostics.match_referees_count}
                  </div>
                  <div>
                    • Logística (logistics_tasks):{" "}
                    {diagnostics.logistics_tasks_count}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Escribe <span className="text-rose-400 font-mono">ELIMINAR</span> para habilitar el borrado definitivo:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.trim().toUpperCase())}
                placeholder="ELIMINAR"
                autoComplete="off"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowTestCleanupConfirm(false);
                  setConfirmText("");
                }}
                disabled={isDeleting}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>

              <button
                type="submit"
                disabled={isDeleting || confirmText !== "ELIMINAR"}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ELIMINAR DEFINITIVAMENTE</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : isProtected ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 leading-relaxed space-y-2">
              <p>
                Este partido ya contiene información oficial y no puede eliminarse.
                Puedes suspenderlo o cancelarlo sin borrar su historial.
              </p>
              {diagnosticReasons.length > 0 && (
                <div className="pt-1.5 border-t border-amber-500/20 text-[11px] text-amber-300/90 font-mono space-y-0.5">
                  {diagnosticReasons.map((r, idx) => (
                    <div key={idx}>• {r}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleSetSafeStatus("SUSPENDIDO")}
                className="px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Suspender partido</span>
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleSetSafeStatus("CANCELADO")}
                className="px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Cancelar partido</span>
              </button>
            </div>

            {/* Herramienta exclusiva de limpieza de pruebas para SUPER_ADMIN */}
            {isSuperAdmin && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2.5">
                <div className="flex items-start gap-2 text-[11px] text-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-300">Modo Fase de Pruebas (SUPER_ADMIN):</strong>{" "}
                    Si este registro es de prueba, puedes forzar la limpieza controlada de sus dependencias.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowTestCleanupConfirm(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ELIMINAR DATOS DE PRUEBA</span>
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cerrar ventana
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

            {isSuperAdmin && (
              <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowTestCleanupConfirm(true)}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 inline-flex items-center gap-1.5 underline underline-offset-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>ELIMINAR DATOS DE PRUEBA (SUPER_ADMIN)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

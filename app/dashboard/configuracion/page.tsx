"use client";

import React, { useState, useEffect } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import {
  Settings,
  Save,
  RotateCcw,
  Check,
  ShieldCheck,
  Flame,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function ConfigurationPage() {
  const { leagueSettings, updateLeagueSettings, resetToDemoData, currentUserRole } = useFutsal();
  const toast = useToast();

  const canConfigure = ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR"].includes(currentUserRole);

  const [leagueName, setLeagueName] = useState(leagueSettings.league_name);
  const [pointsForWin, setPointsForWin] = useState(leagueSettings.points_for_win);
  const [pointsForDraw, setPointsForDraw] = useState(leagueSettings.points_for_draw);
  const [periodDuration, setPeriodDuration] = useState(leagueSettings.period_duration_minutes);
  const [maxFouls, setMaxFouls] = useState(leagueSettings.max_accumulated_fouls);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincronizar el formulario cuando la configuración cargue o cambie en Supabase
  useEffect(() => {
    setLeagueName(leagueSettings.league_name);
    setPointsForWin(leagueSettings.points_for_win);
    setPointsForDraw(leagueSettings.points_for_draw);
    setPeriodDuration(leagueSettings.period_duration_minutes);
    setMaxFouls(leagueSettings.max_accumulated_fouls);
  }, [leagueSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) {
      toast.warning("El nombre oficial de la liga no puede estar vacío.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      await updateLeagueSettings({
        league_name: leagueName.trim(),
        points_for_win: pointsForWin,
        points_for_draw: pointsForDraw,
        period_duration_minutes: periodDuration,
        max_accumulated_fouls: maxFouls,
      });

      setSavedSuccess(true);
      toast.success("Configuración de liga guardada exitosamente en Supabase.");
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      setErrorMessage(formatted.message);
      toast.error(formatted.message, formatted.title || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = () => {
    if (confirm("¿Estás seguro de que deseas reiniciar todos los datos a la demostración inicial?")) {
      resetToDemoData();
      alert("Datos demo restaurados con éxito.");
    }
  };

  if (!canConfigure) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-sm text-slate-400">
            Tu rol actual ({currentUserRole}) no tiene privilegios para modificar los parámetros federativos ni la configuración general de la liga.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-400" />
              CONFIGURACIÓN DE REGLAS Y LIGA
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Parámetros federativos, duración cronometrada, límite de faltas y puntuación.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            Configuración guardada exitosamente en Supabase. Las tablas y cálculos se han actualizado.
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6">
          {/* Identity */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Identidad de la Asociación
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Nombre Oficial de la Liga
              </label>
              <input
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Points Rules */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-blue-400">
              Reglas de Puntuación de Tabla
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Puntos por Victoria
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  max={5}
                  value={pointsForWin}
                  onKeyDown={(e) => {
                    if ([".", ",", "e", "E", "+", "-"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setPointsForWin(parseInt(e.target.value) || 3)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Puntos por Empate
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  max={3}
                  value={pointsForDraw}
                  onKeyDown={(e) => {
                    if ([".", ",", "e", "E", "+", "-"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setPointsForDraw(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Timing & Fouls */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-blue-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              Reglamento Técnico de Futsal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Duración de cada tiempo (minutos)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={10}
                  max={45}
                  value={periodDuration}
                  onKeyDown={(e) => {
                    if ([".", ",", "e", "E", "+", "-"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setPeriodDuration(parseInt(e.target.value) || 20)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Reglamentario FIFA: 20 min netos por tiempo.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Límite de Faltas Acumuladas para Doble Penalti
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={3}
                  max={10}
                  value={maxFouls}
                  onKeyDown={(e) => {
                    if ([".", ",", "e", "E", "+", "-"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setMaxFouls(parseInt(e.target.value) || 5)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Reglamentario FIFA: A partir de la 5ta falta.</span>
              </div>
            </div>
          </div>

          {/* Save & Reset buttons */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            {process.env.NODE_ENV === "development" ? (
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Solo disponible en entorno de desarrollo"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar Datos Demo (Dev)
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Modificaciones
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NumericInput } from "@/components/ui/NumericInput";
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

  // Estado local en formato string para los inputs numéricos: permite borrar, escribir y pegar sin bloqueos ni saltos a valores por defecto
  const [leagueName, setLeagueName] = useState(leagueSettings.league_name);
  const [pointsForWin, setPointsForWin] = useState<string>(String(leagueSettings.points_for_win ?? 3));
  const [pointsForDraw, setPointsForDraw] = useState<string>(String(leagueSettings.points_for_draw ?? 1));
  const [periodDuration, setPeriodDuration] = useState<string>(String(leagueSettings.period_duration_minutes ?? 20));
  const [maxFouls, setMaxFouls] = useState<string>(String(leagueSettings.max_accumulated_fouls ?? 5));

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincronizar el formulario únicamente cuando cambian los valores remotos reales
  useEffect(() => {
    setLeagueName(leagueSettings.league_name);
    setPointsForWin(String(leagueSettings.points_for_win ?? 3));
    setPointsForDraw(String(leagueSettings.points_for_draw ?? 1));
    setPeriodDuration(String(leagueSettings.period_duration_minutes ?? 20));
    setMaxFouls(String(leagueSettings.max_accumulated_fouls ?? 5));
  }, [
    leagueSettings.league_name,
    leagueSettings.points_for_win,
    leagueSettings.points_for_draw,
    leagueSettings.period_duration_minutes,
    leagueSettings.max_accumulated_fouls,
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) {
      toast.warning("El nombre oficial de la liga no puede estar vacío.");
      return;
    }

    const parsedWin = parseInt(String(pointsForWin).trim(), 10);
    const parsedDraw = parseInt(String(pointsForDraw).trim(), 10);
    const parsedDuration = parseInt(String(periodDuration).trim(), 10);
    const parsedFouls = parseInt(String(maxFouls).trim(), 10);

    if (isNaN(parsedWin) || parsedWin < 1 || parsedWin > 10) {
      toast.warning("Los puntos por victoria deben ser un número entre 1 y 10.");
      return;
    }
    if (isNaN(parsedDraw) || parsedDraw < 0 || parsedDraw > 5) {
      toast.warning("Los puntos por empate deben ser un número entre 0 y 5.");
      return;
    }
    if (isNaN(parsedDuration) || parsedDuration < 5 || parsedDuration > 60) {
      toast.warning("La duración de cada tiempo debe estar entre 5 y 60 minutos.");
      return;
    }
    if (isNaN(parsedFouls) || parsedFouls < 1 || parsedFouls > 15) {
      toast.warning("El límite de faltas acumuladas debe estar entre 1 y 15.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      await updateLeagueSettings({
        league_name: leagueName.trim(),
        points_for_win: parsedWin,
        points_for_draw: parsedDraw,
        period_duration_minutes: parsedDuration,
        max_accumulated_fouls: parsedFouls,
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
                <NumericInput
                  min={1}
                  max={5}
                  required
                  value={pointsForWin}
                  onValueChange={setPointsForWin}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Puntos por Empate
                </label>
                <NumericInput
                  min={0}
                  max={3}
                  required
                  value={pointsForDraw}
                  onValueChange={setPointsForDraw}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500"
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
                <NumericInput
                  min={10}
                  max={45}
                  required
                  value={periodDuration}
                  onValueChange={setPeriodDuration}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Reglamentario FIFA: 20 min netos por tiempo.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Límite de Faltas Acumuladas para Doble Penalti
                </label>
                <NumericInput
                  min={3}
                  max={10}
                  required
                  value={maxFouls}
                  onValueChange={setMaxFouls}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500"
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

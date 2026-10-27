"use client";

import React, { useState } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings, Save, RotateCcw, Check, ShieldCheck, Flame } from "lucide-react";

export default function ConfigurationPage() {
  const { leagueSettings, updateLeagueSettings, resetToDemoData } = useFutsal();

  const [leagueName, setLeagueName] = useState(leagueSettings.league_name);
  const [pointsForWin, setPointsForWin] = useState(leagueSettings.points_for_win);
  const [pointsForDraw, setPointsForDraw] = useState(leagueSettings.points_for_draw);
  const [periodDuration, setPeriodDuration] = useState(leagueSettings.period_duration_minutes);
  const [maxFouls, setMaxFouls] = useState(leagueSettings.max_accumulated_fouls);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateLeagueSettings({
      league_name: leagueName,
      points_for_win: pointsForWin,
      points_for_draw: pointsForDraw,
      period_duration_minutes: periodDuration,
      max_accumulated_fouls: maxFouls,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDemo = () => {
    if (confirm("¿Estás seguro de que deseas reiniciar todos los datos a la demostración inicial?")) {
      resetToDemoData();
      alert("Datos demo restaurados con éxito.");
    }
  };

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
            <Check className="w-4 h-4" />
            Configuración guardada exitosamente. Las tablas y cálculos se han actualizado.
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
                  min={1}
                  max={5}
                  value={pointsForWin}
                  onChange={(e) => setPointsForWin(parseInt(e.target.value) || 3)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Puntos por Empate
                </label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={pointsForDraw}
                  onChange={(e) => setPointsForDraw(parseInt(e.target.value) || 1)}
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
                <input
                  type="number"
                  min={10}
                  max={45}
                  value={periodDuration}
                  onChange={(e) => setPeriodDuration(parseInt(e.target.value) || 20)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Reglamentario FIFA: 20 min netos por tiempo.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Límite de Faltas Acumuladas para Doble Penalti
                </label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={maxFouls}
                  onChange={(e) => setMaxFouls(parseInt(e.target.value) || 5)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-scoreboard font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Reglamentario FIFA: A partir de la 5ta falta.</span>
              </div>
            </div>
          </div>

          {/* Save & Reset buttons */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDemo}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Datos Demo
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              Guardar Modificaciones
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

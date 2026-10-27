"use client";

import React, { useState } from "react";
import { LogisticsTask } from "@/types";
import { useFutsal } from "@/lib/store/futsalStore";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  Clock,
  ShieldCheck,
  FileCheck,
  Plus,
} from "lucide-react";

interface LogisticsChecklistProps {
  matchId: string;
}

export function LogisticsChecklist({ matchId }: LogisticsChecklistProps) {
  const { logisticsTasks, toggleLogisticsTask, updateLogisticsTask } = useFutsal();

  const tasks = logisticsTasks.filter((t) => t.match_id === matchId);
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length || 1;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const missingCriticalTasks = tasks.filter((t) => t.is_critical && !t.completed);

  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const categories = [
    { id: "ALL", label: "Todas las tareas" },
    { id: "INSTALACIONES", label: "Instalaciones" },
    { id: "ARBITRAJE", label: "Arbitraje" },
    { id: "TECNICA", label: "Mesa Técnica" },
    { id: "SEGURIDAD", label: "Seguridad" },
    { id: "MEDICO", label: "Médico & DEA" },
    { id: "PRENSA", label: "Prensa & Media" },
  ];

  const filteredTasks =
    filterCategory === "ALL"
      ? tasks
      : tasks.filter((t) => t.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary */}
      <div className="sports-card rounded-3xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-blue-400">
              OPERATIVO DE PARTIDO
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Checklist Oficial de Logística
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verificación técnica, de seguridad, arbitraje y comodidades antes y durante el partido.
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl md:text-4xl font-black text-white font-scoreboard">
              {percentage}%
            </div>
            <div className="text-xs font-bold text-slate-400">
              {completedCount} de {totalCount} Verificados
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              percentage === 100
                ? "bg-emerald-500"
                : percentage > 70
                ? "bg-gradient-to-r from-blue-500 to-emerald-400"
                : "bg-amber-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Critical Alerts */}
        {missingCriticalTasks.length > 0 ? (
          <div className="mt-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs text-rose-300">
                ¡ATENCIÓN! Faltan {missingCriticalTasks.length} requerimientos obligatorios críticos
              </div>
              <ul className="mt-1 list-disc list-inside text-xs text-rose-200/80 space-y-0.5">
                {missingCriticalTasks.map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Todos los elementos críticos obligatorios han sido verificados satisfactoriamente.
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === cat.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-2xl border transition-all ${
              task.completed
                ? "bg-slate-900/60 border-slate-800/80 opacity-90"
                : task.is_critical
                ? "bg-slate-900/90 border-rose-500/30 shadow-sm"
                : "bg-slate-900/90 border-slate-700/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleLogisticsTask(task.id)}
                  className="mt-0.5 text-slate-400 hover:scale-110 transition-transform"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-600 hover:text-blue-400" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        task.completed ? "line-through text-slate-400" : "text-white"
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.is_critical && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        CRÍTICO
                      </span>
                    )}
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {task.category}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                  )}

                  {/* Responsible and Timestamp */}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>{task.assigned_to || "Sin asignar"}</span>
                    </div>

                    {task.completed_at && (
                      <div className="flex items-center gap-1.5 text-emerald-400/90">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Confirmado: {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  {task.notes && (
                    <div className="mt-2 text-xs italic text-slate-300 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-800">
                      Nota: {task.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="text-right shrink-0">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    task.completed
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {task.completed ? "Listo" : "Pendiente"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

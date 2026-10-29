"use client";

import React, { useState } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Referee } from "@/types";
import { UserCheck, Plus, Phone, Mail, Award, CheckCircle2 } from "lucide-react";

export default function RefereesPage() {
  const { referees, currentUserRole } = useFutsal();
  const [modalOpen, setModalOpen] = useState(false);

  const isPrensa = currentUserRole === "PRENSA";
  const canManage = ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR"].includes(currentUserRole);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-400" />
                CUERPO ARBITRAL Y OFICIALES DE MESA
              </h1>
              {isPrensa && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  PRENSA • SOLO CONSULTA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Colegio de árbitros homologados, designaciones oficiales y categorías federativas.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              REGISTRAR ÁRBITRO
            </button>
          )}
        </div>

        {/* Roles reminder banner */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
          <div className="border-l-2 border-amber-400 pl-3">
            <strong className="block text-white font-bold">ÁRBITRO PRINCIPAL</strong>
            <span className="text-[11px] text-slate-400">Máxima autoridad en pista</span>
          </div>
          <div className="border-l-2 border-blue-400 pl-3">
            <strong className="block text-white font-bold">SEGUNDO ÁRBITRO</strong>
            <span className="text-[11px] text-slate-400">Línea de banda opuesta</span>
          </div>
          <div className="border-l-2 border-emerald-400 pl-3">
            <strong className="block text-white font-bold">TERCER ÁRBITRO</strong>
            <span className="text-[11px] text-slate-400">Control de bancos y cambios</span>
          </div>
          <div className="border-l-2 border-purple-400 pl-3">
            <strong className="block text-white font-bold">CRONOMETRADOR</strong>
            <span className="text-[11px] text-slate-400">Control de reloj y faltas</span>
          </div>
        </div>

        {/* Referees cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {referees.map((ref) => (
            <div
              key={ref.id}
              className="sports-card rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      ref.category === "FIFA"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold"
                        : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    CATEGORÍA {ref.category}
                  </span>

                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ref.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-base">
                    {ref.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base leading-tight">
                      {ref.full_name}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {ref.matches_officiated} partidos dirigidos
                    </span>
                  </div>
                </div>

                {!isPrensa && (ref.phone || ref.email) && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    {ref.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ref.phone}</span>
                      </div>
                    )}
                    {ref.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{ref.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold">
                  Designaciones Oficiales
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

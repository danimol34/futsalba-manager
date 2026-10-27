"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { PublicHeader } from "@/components/layout/PublicHeader";
import {
  User,
  Mail,
  LogOut,
  ArrowLeft,
  Trophy,
  Calendar,
  Activity,
  CheckCircle,
} from "lucide-react";

export default function MiCuentaPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthLoading, currentUserRole, logout } = useFutsal();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#050914] text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-2xl animate-pulse mb-3">
          F
        </div>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold animate-pulse">
          Cargando tu cuenta...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Aficionado";

  return (
    <div className="min-h-screen bg-[#050914] text-white flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Official Public Navigation Header (with responsive hamburger menu) */}
      <PublicHeader currentPath="/mi-cuenta" />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 space-y-6">
        {/* Breadcrumb / Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            Volver a la Liga
          </Link>

          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            FUTSALBA Oficial • Temporada 2026
          </span>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <User className="w-7 h-7 text-blue-400" />
            MI CUENTA
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Perfil de aficionado registrado en la plataforma oficial de FUTSALBA.
          </p>
        </div>

        {/* Profile Card */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-600/30 shrink-0">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white capitalize">
                  {fullName}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              Cuenta Activa • {currentUserRole === "PUBLICO" ? "Aficionado" : currentUserRole}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-800 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Membresía
              </span>
              <p className="font-bold text-slate-200">Aficionado Oficial FUTSALBA</p>
              <p className="text-[11px] text-slate-400">
                Acceso completo a marcadores, clasificaciones y fichas oficiales.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Seguridad de Cuenta
              </span>
              <p className="font-bold text-slate-200">Protección Supabase Auth</p>
              <p className="text-[11px] text-slate-400">
                Sesión encriptada con verificación continua.
              </p>
            </div>
          </div>

          {/* Quick Links & Logout */}
          <div className="pt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/#partidos"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Ver Partidos
              </Link>
              <Link
                href="/#clasificacion"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Clasificación
              </Link>
              <Link
                href="/#estadisticas"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Estadísticas
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

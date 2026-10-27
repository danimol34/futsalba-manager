"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import {
  User,
  Mail,
  Shield,
  LogOut,
  ArrowLeft,
  Trophy,
  Calendar,
  Heart,
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
      {/* Top Navbar */}
      <header className="bg-[#070d1c]/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/20">
            F
          </div>
          <div>
            <div className="font-black text-base tracking-wider text-white flex items-center gap-1.5">
              FUTSALBA
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white">
                OFICIAL
              </span>
            </div>
            <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
              Portal del Aficionado
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Liga
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-12 space-y-6">
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-600/30">
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
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/#partidos"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Ver Partidos
              </Link>
              <Link
                href="/clasificacion"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Clasificación
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
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

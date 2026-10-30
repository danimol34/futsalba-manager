"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { UserRole } from "@/types";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertOctagon,
  ArrowLeft,
  Loader2,
  KeyRound,
} from "lucide-react";

const AUTHORIZED_STAFF_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "PRESIDENTE",
  "ADMINISTRADOR",
  "MESA_TECNICA",
  "ARBITRO",
  "DIRECTOR_TECNICO",
  "LOGISTICA",
  "PRENSA",
];

export default function AccesoInstitucionalPage() {
  const router = useRouter();
  const { login, logout, user, isAuthenticated, currentUserRole, isAuthLoading } = useFutsal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya tiene sesión institucional activa, redirigir al panel operativo
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      if (currentUserRole && currentUserRole !== "PUBLICO" && AUTHORIZED_STAFF_ROLES.includes(currentUserRole)) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[RBAC Auth Diagnostic] Redirigiendo a /dashboard con rol institucional: ${currentUserRole}`);
        }
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, currentUserRole, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim() || !password) {
      setError("Por favor introduce tu correo electrónico institucional y contraseña.");
      setLoading(false);
      return;
    }

    try {
      const res = await login(email.trim(), password);

      if (!res.success) {
        setError(
          res.error === "Invalid login credentials"
            ? "Credenciales incorrectas. Verifica tu correo institucional y contraseña."
            : res.error || "No fue posible verificar las credenciales institucionales."
        );
        setLoading(false);
        return;
      }

      // Verificación estricta de RBAC: comprobar rol devuelto desde public.user_roles
      const assignedRole = res.role;

      if (!assignedRole || assignedRole === "PUBLICO" || !AUTHORIZED_STAFF_ROLES.includes(assignedRole)) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[RBAC Auth Diagnostic] Acceso denegado en login. Motivo: el usuario ${email.trim()} no posee un rol institucional autorizado (Rol obtenido: ${assignedRole || 'ninguno'})`);
        }
        await logout();
        setError("Acceso no autorizado. Tu cuenta no tiene permisos para acceder a esta sección.");
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[RBAC Auth Diagnostic] Login exitoso. Rol institucional confirmado: ${assignedRole}. Accediendo a /dashboard...`);
      }
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error inesperado al validar el acceso institucional.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040711] text-white flex flex-col justify-between items-center p-4 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Institutional Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-blue-700/15 to-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="w-full max-w-5xl pt-4 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Portal Oficial</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-bold text-slate-400 tracking-wider">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          ÁREA RESTRINGIDA
        </div>
      </header>

      {/* Institutional Login Card */}
      <div className="w-full max-w-md relative z-10 py-8 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 mx-auto flex items-center justify-center font-black text-white text-3xl shadow-2xl shadow-blue-600/40 mb-4 border border-blue-400/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="inline-block text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 mb-2">
            FUTSALBA MANAGER
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wider text-white uppercase">
            ACCESO INSTITUCIONAL
          </h1>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed font-medium">
            Plataforma oficial de gestión operativa de la Liga FUTSALBA.
          </p>
        </div>

        {/* Card */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800/90 bg-[#070d1c]/90 backdrop-blur-xl shadow-2xl">
          {isAuthLoading ? (
            <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-3 mb-5">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
              <span>Verificando credenciales y roles institucionales...</span>
            </div>
          ) : isAuthenticated && currentUserRole === "PUBLICO" ? (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 mb-5 animate-in fade-in">
              <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-2 w-full">
                <div className="font-bold text-amber-200">
                  Acceso no autorizado. Tu cuenta no tiene permisos para acceder a esta sección.
                </div>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <Link
                    href="/"
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    VOLVER AL PORTAL
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    CERRAR SESIÓN
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-2.5 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                  <div className="leading-relaxed font-medium">{error}</div>
                </div>
                {error.includes("Acceso no autorizado") && (
                  <div className="pt-1">
                    <Link
                      href="/"
                      className="inline-flex px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      VOLVER AL PORTAL
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Correo Electrónico Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="personal@futsalba.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black tracking-widest uppercase shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  VALIDANDO CREDENCIALES...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  ACCEDER AL SISTEMA
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Discreet Footer Note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
              Acceso exclusivo para personal autorizado de FUTSALBA.
            </p>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="w-full max-w-5xl pb-4 text-center z-10 text-[11px] text-slate-600">
        © 2026 Asociación Oficial de Fútbol Sala (FUTSALBA). Sistema de Gestión Operativa.
      </footer>
    </div>
  );
}

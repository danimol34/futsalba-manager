"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserPlus,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useFutsal();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email || !password) {
      setError("Por favor completa tu correo electrónico y contraseña.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const res = await login(email, password);
        if (!res.success) {
          setError(
            res.error === "Invalid login credentials"
              ? "Credenciales incorrectas. Verifica tu correo y contraseña en Supabase Auth."
              : res.error || "Error al iniciar sesión."
          );
          setLoading(false);
          return;
        }

        // Sesión establecida correctamente con Supabase Auth
        // Los usuarios PUBLICO son dirigidos al portal público; el personal al dashboard
        if (res.role === "PUBLICO") {
          router.replace("/");
        } else {
          router.replace("/dashboard");
        }
      } else {
        // Registro de nuevo usuario en Supabase Auth (Rol PUBLICO únicamente)
        if (!isSupabaseConfigured) {
          setError("Supabase no está configurado en las variables de entorno.");
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          setSuccessMsg(
            `¡Cuenta registrada con éxito para ${data.user.email}! Tu acceso está habilitado como aficionado (rol PUBLICO). Ya puedes iniciar sesión.`
          );
          setMode("login");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic stadium lighting background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 py-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-400 mx-auto flex items-center justify-center font-black text-white text-3xl shadow-xl shadow-blue-600/30 mb-3">
            F
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wider text-white">
            FUTSALBA
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Portal Oficial de Aficionados
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 mb-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === "login"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === "register"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Login / Register Card */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Carlos Silva"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contraseña
                </label>
                {mode === "login" && (
                  <span className="text-[11px] text-slate-500">
                    Mínimo 6 caracteres
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                "PROCESANDO..."
              ) : mode === "login" ? (
                <>
                  INICIAR SESIÓN
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  CREAR CUENTA
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link to Public Website */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            ← Volver a la página principal de FUTSALBA
          </Link>
        </div>
      </div>
    </div>
  );
}

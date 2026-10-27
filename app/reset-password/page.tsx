"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "invalid_link">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Escuchar el evento de recuperación de contraseña o si ya estamos autenticados con un token válido
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Enlace válido
        setStatus("idle");
      }
    });

    // Validar también si simplemente no hay sesión y no estamos en el flujo
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Si no hay sesión después del redirect, podría ser un enlace inválido o expirado
        // Supabase redirecciona a reset-password con un error en hash (error=access_denied&error_description=...)
        const hash = window.location.hash;
        if (hash && hash.includes("error_code=404")) {
           setStatus("invalid_link");
           setErrorMessage("El enlace es inválido o ha expirado.");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setStatus("error");
      setErrorMessage("Por favor, completa ambos campos.");
      return;
    }

    if (newPassword.length < 8) {
      setStatus("error");
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    if (!isSupabaseConfigured) {
      setStatus("error");
      setErrorMessage("Supabase no está configurado.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Ocurrió un error al guardar la nueva contraseña.");
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
            CREAR NUEVA CONTRASEÑA
          </h1>
        </div>

        {/* Form Card */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl">
          {status === "invalid_link" ? (
             <div className="text-center py-4">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertCircle className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Enlace inválido</h2>
              <p className="text-sm text-slate-400 mb-6 px-4">
                El enlace de recuperación ha expirado o ya ha sido utilizado. Por favor, solicita uno nuevo.
              </p>
              <Link
                href="/forgot-password"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                SOLICITAR NUEVO ENLACE
              </Link>
            </div>
          ) : status === "success" ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-emerald-400 mb-2">¡Completado!</h2>
              <p className="text-sm text-slate-400 mb-6 px-4">
                ✅ Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                IR A INICIAR SESIÓN
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-400 mb-4 text-center">
                Escribe y confirma tu nueva contraseña de acceso para FUTSALBA.
              </p>

              {status === "error" && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {status === "loading" ? (
                  "GUARDANDO CONTRASEÑA..."
                ) : (
                  <>
                    CAMBIAR CONTRASEÑA
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

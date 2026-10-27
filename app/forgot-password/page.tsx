"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getSiteUrl = () => {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!isSupabaseConfigured) {
      setStatus("error");
      setErrorMessage("Supabase no está configurado.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const siteUrl = getSiteUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        throw error;
      }

      // Always show success to prevent email enumeration
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Ocurrió un error al conectar con el servidor.");
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
            RECUPERAR CONTRASEÑA
          </h1>
        </div>

        {/* Form Card */}
        <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl">
          {status === "success" ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Correo enviado</h2>
              <p className="text-sm text-slate-400 mb-6 px-4">
                Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                VOLVER A INICIAR SESIÓN
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-400 mb-4 text-center">
                Introduce el correo electrónico asociado a tu cuenta FUTSALBA. Te enviaremos un enlace seguro para crear una nueva contraseña.
              </p>

              {status === "error" && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
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

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {status === "loading" ? (
                  "ENVIANDO CORREO..."
                ) : (
                  <>
                    ENVIAR ENLACE DE RECUPERACIÓN
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <div className="text-center mt-6">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Volver a iniciar sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

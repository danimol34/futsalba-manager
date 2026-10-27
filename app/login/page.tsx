"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Send,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUserRole } = useFutsal();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para manejo de confirmación de email
  const [emailNeedsConfirmation, setEmailNeedsConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [registeredUnconfirmedEmail, setRegisteredUnconfirmedEmail] = useState<string | null>(null);

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      if (currentUserRole === "PUBLICO") {
        router.replace("/");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, currentUserRole, router]);

  // Detectar parámetros de confirmación o expiración en la URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      if (hash.includes("error_code=otp_expired") || search.includes("error_code=otp_expired")) {
        setError(
          "El enlace de verificación ha caducado o ya fue utilizado. Puedes solicitar un nuevo correo de confirmación a continuación."
        );
        setEmailNeedsConfirmation(true);
      }
    }
  }, []);

  const getEmailRedirectTo = (): string | undefined => {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    if (!siteUrl) return undefined;
    return `${siteUrl.replace(/\/$/, "")}/`;
  };

  const isRateLimitError = (msg?: string | null): boolean => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes("rate limit") ||
      lower.includes("over_email_send_rate_limit") ||
      lower.includes("too many requests") ||
      lower.includes("security purposes") ||
      lower.includes("seconds") ||
      lower.includes("demasiados")
    );
  };

  const isEmailNotConfirmed = (msg?: string | null): boolean => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes("email not confirmed") ||
      lower.includes("email_not_confirmed") ||
      lower.includes("correo no confirmado") ||
      lower.includes("confirmar tu correo") ||
      lower.includes("not confirmed")
    );
  };

  const handleResendConfirmation = async (targetEmail?: string) => {
    const emailToSend = (targetEmail || email).trim().toLowerCase();
    if (!emailToSend) {
      setError("Por favor ingresa tu correo electrónico para reenviar la confirmación.");
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase no está configurado en las variables de entorno.");
      return;
    }

    setIsResending(true);
    setResendSuccessMsg(null);
    setResendError(null);

    try {
      const emailRedirectTo = getEmailRedirectTo();

      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: emailToSend,
        options: {
          emailRedirectTo,
        },
      });

      if (resendErr) {
        if (isRateLimitError(resendErr.message)) {
          setResendError(
            "Has realizado varios intentos de reenvío en poco tiempo. Por favor espera unos momentos antes de volver a intentarlo."
          );
        } else {
          setResendError(
            resendErr.message || "No se pudo reenviar el correo de confirmación. Inténtalo más tarde."
          );
        }
      } else {
        setResendSuccessMsg(
          "Correo de confirmación reenviado. Revisa tu bandeja de entrada y la carpeta de spam."
        );
      }
    } catch (err: any) {
      if (isRateLimitError(err?.message)) {
        setResendError(
          "Has realizado varios intentos de reenvío en poco tiempo. Por favor espera unos momentos antes de volver a intentarlo."
        );
      } else {
        setResendError(err?.message || "Ocurrió un error inesperado al reenviar.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setResendSuccessMsg(null);
    setResendError(null);
    setEmailNeedsConfirmation(false);
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
          if (isEmailNotConfirmed(res.error)) {
            setEmailNeedsConfirmation(true);
            setError(
              "Tu correo electrónico todavía no ha sido confirmado. Revisa tu bandeja de entrada y pulsa el enlace de verificación que te enviamos."
            );
          } else if (res.error === "Invalid login credentials") {
            setError(
              "Credenciales incorrectas. Verifica tu correo y contraseña en Supabase Auth."
            );
          } else if (isRateLimitError(res.error)) {
            setError(
              "Has realizado demasiados intentos en poco tiempo. Por favor espera unos momentos."
            );
          } else {
            setError(res.error || "Error al iniciar sesión.");
          }
          setLoading(false);
          return;
        }

        // Sesión establecida correctamente con Supabase Auth
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

        const cleanEmail = email.trim().toLowerCase();
        const emailRedirectTo = getEmailRedirectTo();

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName.trim() || undefined,
            },
          },
        });

        if (signUpError) {
          if (isRateLimitError(signUpError.message)) {
            setError(
              "Has realizado varios intentos de registro en poco tiempo. Por favor espera unos momentos."
            );
          } else if (signUpError.message.toLowerCase().includes("already registered")) {
            setError(
              "Ya existe una cuenta con este correo electrónico. Puedes iniciar sesión directamente."
            );
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }

        // Si Supabase devuelve usuario pero no sesión porque requiere confirmación:
        if (data?.user && !data.session) {
          setRegisteredUnconfirmedEmail(data.user.email || cleanEmail);
          setLoading(false);
          return;
        }

        // Si devuelve sesión activa (confirmación deshabilitada en Supabase):
        if (data?.session) {
          router.replace("/");
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
      if (isRateLimitError(err?.message)) {
        setError(
          "Has realizado demasiados intentos. Por favor espera unos momentos antes de volver a intentarlo."
        );
      } else {
        setError(err?.message || "Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetMessagesAndErrors = () => {
    setError(null);
    setSuccessMsg(null);
    setResendSuccessMsg(null);
    setResendError(null);
    setEmailNeedsConfirmation(false);
    setRegisteredUnconfirmedEmail(null);
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

        {/* Tab Selector (Oculto cuando se muestra la pantalla de confirmación post-registro) */}
        {!registeredUnconfirmedEmail && (
          <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 mb-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetMessagesAndErrors();
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
                resetMessagesAndErrors();
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
        )}

        {/* Pantalla post-registro: Si Supabase requiere confirmación de correo */}
        {registeredUnconfirmedEmail ? (
          <div className="sports-card rounded-3xl p-6 md:p-8 border border-blue-500/40 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Mail className="w-8 h-8 animate-pulse text-cyan-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-white">
                Confirma tu Correo Electrónico
              </h2>
              <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Cuenta creada correctamente. Hemos enviado un correo de confirmación a{" "}
                <span className="font-bold text-white underline decoration-blue-500 underline-offset-2">
                  {registeredUnconfirmedEmail}
                </span>
                . Confirma tu dirección antes de iniciar sesión.
              </p>
            </div>

            {/* Mensaje de éxito al reenviar */}
            {resendSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{resendSuccessMsg}</span>
              </div>
            )}

            {/* Mensaje de error al reenviar */}
            {resendError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{resendError}</span>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                type="button"
                disabled={isResending}
                onClick={() => handleResendConfirmation(registeredUnconfirmedEmail)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-white text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-blue-400" />
                    REENVIAR CORREO DE CONFIRMACIÓN
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisteredUnconfirmedEmail(null);
                  setMode("login");
                  resetMessagesAndErrors();
                  setSuccessMsg("Una vez confirmado tu correo, ingresa tus datos para acceder.");
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5"
              >
                IR A INICIAR SESIÓN
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Card principal de Login / Registro */
          <div className="sports-card rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span className="flex-1 leading-relaxed">{error}</span>
                  </div>

                  {/* Botón Reenviar Correo si el email no está confirmado */}
                  {emailNeedsConfirmation && (
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={() => handleResendConfirmation()}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-blue-400 hover:text-blue-300 text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-blue-400" />
                          REENVIAR CORREO DE CONFIRMACIÓN
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Mensajes de éxito o error del reenvío */}
              {resendSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{resendSuccessMsg}</span>
                </div>
              )}

              {resendError && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{resendError}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
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
        )}

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

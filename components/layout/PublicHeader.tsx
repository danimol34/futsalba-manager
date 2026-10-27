"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFutsal } from "@/lib/store/futsalStore";
import {
  Menu,
  X,
  Users,
  LogIn,
  LogOut,
  Home,
  Calendar,
  Trophy,
  Activity,
  Tv,
  User,
  ArrowRight,
} from "lucide-react";

interface PublicHeaderProps {
  currentPath?: string;
}

export function PublicHeader({ currentPath = "/" }: PublicHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, currentUserRole, logout } = useFutsal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    router.replace("/");
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Aficionado";

  return (
    <header className="sticky top-0 z-40 bg-[#070d1c]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            F
          </div>
          <div>
            <div className="font-black text-lg md:text-xl tracking-wider text-white flex items-center gap-1.5">
              FUTSALBA
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                OFICIAL
              </span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Liga Profesional de Fútbol Sala
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Link
            href="/"
            className="hover:text-blue-400 transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/#partidos"
            className="hover:text-blue-400 transition-colors"
          >
            Partidos
          </Link>
          <Link
            href="/#clasificacion"
            className="hover:text-blue-400 transition-colors"
          >
            Clasificación
          </Link>
          <Link
            href="/#estadisticas"
            className="hover:text-blue-400 transition-colors"
          >
            Estadísticas
          </Link>
          <Link
            href="/#noticias"
            className="hover:text-blue-400 transition-colors"
          >
            Noticias
          </Link>
        </nav>

        {/* Desktop Auth State */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/mi-cuenta"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black tracking-wider uppercase border border-slate-700 shadow-md transition-all flex items-center gap-1.5 hover:border-slate-600"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              MI CUENTA
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              INICIAR SESIÓN
            </Link>
          )}
        </div>

        {/* Mobile Controls (Menu Toggle & Direct Account Icon if logged in) */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && (
            <Link
              href="/mi-cuenta"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-slate-800 text-blue-400 border border-slate-700 text-xs font-bold flex items-center gap-1"
              aria-label="Ir a mi cuenta"
            >
              <User className="w-4 h-4" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors focus:outline-none"
            aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-200" />
            ) : (
              <Menu className="w-5 h-5 text-slate-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070d1c]/98 backdrop-blur-xl border-t border-slate-800 px-4 py-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* Public Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 pb-1">
              Navegación Oficial
            </div>

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Home className="w-4 h-4 text-blue-400" />
              Inicio
            </Link>

            <Link
              href="/#partidos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              Partidos
            </Link>

            <Link
              href="/#clasificacion"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Clasificación
            </Link>

            <Link
              href="/#estadisticas"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              Estadísticas
            </Link>

            <Link
              href="/#noticias"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Tv className="w-4 h-4 text-indigo-400" />
              Noticias
            </Link>
          </div>

          {/* User Account Section */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                      {displayName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white capitalize leading-tight">
                        {displayName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {currentUserRole === "PUBLICO" ? "Aficionado Oficial" : currentUserRole}
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/mi-cuenta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <User className="w-4 h-4" />
                  Ver Mi Cuenta
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                INICIAR SESIÓN / REGISTRARSE
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

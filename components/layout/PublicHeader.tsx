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
  Shield,
  Smartphone,
  Info,
  Image as ImageIcon,
} from "lucide-react";

interface PublicHeaderProps {
  currentPath?: string;
}

export function PublicHeader({ currentPath = "/" }: PublicHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useFutsal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#050914]/95 backdrop-blur-md border-b border-slate-800/80">
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
              Liga Oficial de Fútbol Sala
            </div>
          </div>
        </Link>

        {/* Desktop Navigation: Institutional only */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Link
            href="/"
            className={`transition-colors ${currentPath === "/" ? "text-blue-400 font-extrabold" : "hover:text-blue-400"}`}
          >
            Inicio
          </Link>

          <a
            href="/#la-liga"
            className="hover:text-blue-400 transition-colors"
          >
            La Liga
          </a>

          <a
            href="/#actualidad"
            className="hover:text-blue-400 transition-colors"
          >
            Actualidad
          </a>

          <a
            href="/#galeria"
            className="hover:text-blue-400 transition-colors"
          >
            Galería
          </a>

          <a
            href="/#app-futsalba"
            className="hover:text-blue-400 transition-colors text-emerald-400"
          >
            App FUTSALBA
          </a>
        </nav>

        {/* Desktop Header Action */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/#app-futsalba"
            className="px-4 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span>App FUTSALBA</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-black">
              PRÓX
            </span>
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
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

      {/* Mobile Drawer Navigation (320px - 430px compatible) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#050914]/98 backdrop-blur-xl border-t border-slate-800 px-4 py-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 pb-1">
              Navegación Institucional
            </div>

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Home className="w-4 h-4 text-blue-400" />
              Inicio
            </Link>

            <a
              href="/#la-liga"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Shield className="w-4 h-4 text-blue-400" />
              La Liga
            </a>

            <a
              href="/#actualidad"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              Actualidad
            </a>

            <a
              href="/#galeria"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              Galería
            </a>

            <a
              href="/#app-futsalba"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              App FUTSALBA
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold ml-auto">
                Próximamente
              </span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

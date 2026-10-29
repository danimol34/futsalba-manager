"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFutsal } from "@/lib/store/futsalStore";
import { UserRole } from "@/types";
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  Shield,
  Users,
  Calendar,
  Layers,
  Swords,
  Radio,
  BarChart3,
  AlertOctagon,
  MapPin,
  ClipboardCheck,
  Newspaper,
  UserCheck,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Bell,
  Lock,
  ExternalLink,
  UserCog,
} from "lucide-react";

// RBAC: Módulos permitidos por cada rol según los requerimientos
const ROLE_ALLOWED_MODULES: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    "/dashboard",
    "/dashboard/temporadas",
    "/dashboard/competiciones",
    "/dashboard/equipos",
    "/dashboard/jugadores",
    "/dashboard/calendario",
    "/dashboard/jornadas",
    "/dashboard/partidos",
    "/dashboard/partidos/match-301/live",
    "/dashboard/clasificacion",
    "/dashboard/estadisticas",
    "/dashboard/sanciones",
    "/dashboard/arbitros",
    "/dashboard/canchas",
    "/dashboard/partidos/match-301/logistica",
    "/dashboard/prensa",
    "/dashboard/personal",
    "/dashboard/usuarios",
    "/dashboard/configuracion",
  ],
  PRESIDENTE: [
    "/dashboard",
    "/dashboard/temporadas",
    "/dashboard/competiciones",
    "/dashboard/equipos",
    "/dashboard/jugadores",
    "/dashboard/calendario",
    "/dashboard/jornadas",
    "/dashboard/partidos",
    "/dashboard/partidos/match-301/live",
    "/dashboard/clasificacion",
    "/dashboard/estadisticas",
    "/dashboard/sanciones",
    "/dashboard/arbitros",
    "/dashboard/canchas",
    "/dashboard/partidos/match-301/logistica",
    "/dashboard/prensa",
    "/dashboard/usuarios",
    "/dashboard/configuracion",
  ],
  ADMINISTRADOR: [
    "/dashboard",
    "/dashboard/temporadas",
    "/dashboard/competiciones",
    "/dashboard/equipos",
    "/dashboard/jugadores",
    "/dashboard/calendario",
    "/dashboard/jornadas",
    "/dashboard/partidos",
    "/dashboard/partidos/match-301/live",
    "/dashboard/clasificacion",
    "/dashboard/estadisticas",
    "/dashboard/sanciones",
    "/dashboard/arbitros",
    "/dashboard/canchas",
    "/dashboard/partidos/match-301/logistica",
    "/dashboard/prensa",
    "/dashboard/usuarios",
    "/dashboard/configuracion",
  ],
  MESA_TECNICA: [
    "/dashboard",
    "/dashboard/calendario",
    "/dashboard/jornadas",
    "/dashboard/partidos",
    "/dashboard/partidos/match-301/live",
    "/dashboard/clasificacion",
    "/dashboard/estadisticas",
  ],
  ARBITRO: [
    "/dashboard",
    "/dashboard/partidos",
    "/dashboard/partidos/match-301/live",
    "/dashboard/sanciones",
    "/dashboard/arbitros",
    "/dashboard/clasificacion",
    "/dashboard/estadisticas",
  ],
  DIRECTOR_TECNICO: [
    "/dashboard",
    "/dashboard/equipos",
    "/dashboard/jugadores",
    "/dashboard/partidos",
    "/dashboard/clasificacion",
    "/dashboard/estadisticas",
    "/dashboard/sanciones",
  ],
  LOGISTICA: [
    "/dashboard",
    "/dashboard/canchas",
    "/dashboard/partidos",
    "/dashboard/partidos/match-301/logistica",
  ],
  PRENSA: [
    "/dashboard",
    "/dashboard/temporadas",
    "/dashboard/competiciones",
    "/dashboard/equipos",
    "/dashboard/jugadores",
    "/dashboard/calendario",
    "/dashboard/jornadas",
    "/dashboard/partidos",
    "/dashboard/partidos/match-301/live",
    "/dashboard/clasificacion",
    "/dashboard/estadisticas",
    "/dashboard/sanciones",
    "/dashboard/arbitros",
    "/dashboard/canchas",
    "/dashboard/prensa",
  ],
  PUBLICO: [],
};

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Temporadas", href: "/dashboard/temporadas", icon: CalendarDays },
  { name: "Competiciones", href: "/dashboard/competiciones", icon: Trophy },
  { name: "Equipos", href: "/dashboard/equipos", icon: Shield },
  { name: "Jugadores", href: "/dashboard/jugadores", icon: Users },
  { name: "Calendario", href: "/dashboard/calendario", icon: Calendar },
  { name: "Jornadas", href: "/dashboard/jornadas", icon: Layers },
  { name: "Partidos", href: "/dashboard/partidos", icon: Swords },
  {
    name: "Partido en Vivo",
    href: "/dashboard/partidos/match-301/live",
    icon: Radio,
    badge: "LIVE",
    badgeColor: "bg-emerald-500",
  },
  { name: "Clasificación", href: "/dashboard/clasificacion", icon: Trophy },
  { name: "Estadísticas", href: "/dashboard/estadisticas", icon: BarChart3 },
  { name: "Sanciones", href: "/dashboard/sanciones", icon: AlertOctagon },
  { name: "Árbitros", href: "/dashboard/arbitros", icon: UserCheck },
  { name: "Canchas", href: "/dashboard/canchas", icon: MapPin },
  { name: "Logística", href: "/dashboard/partidos/match-301/logistica", icon: ClipboardCheck },
  { name: "Prensa", href: "/dashboard/prensa", icon: Newspaper },
  { name: "Personal de la Liga", href: "/dashboard/personal", icon: UserCog },
  { name: "Usuarios", href: "/dashboard/usuarios", icon: Users },
  { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];

export function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { currentUserRole, setCurrentUserRole, userRoles, logout } = useFutsal();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Filtrado de módulos según el rol activo
  const allowedPaths =
    ROLE_ALLOWED_MODULES[currentUserRole] || ROLE_ALLOWED_MODULES["PUBLICO"];

  const visibleNavItems = navigationItems.filter((item) =>
    allowedPaths.includes(item.href)
  );

  const allRolesList: UserRole[] = [
    "SUPER_ADMIN",
    "PRESIDENTE",
    "ADMINISTRADOR",
    "MESA_TECNICA",
    "ARBITRO",
    "DIRECTOR_TECNICO",
    "LOGISTICA",
    "PRENSA",
    "PUBLICO",
  ];

  const isDevelopment = process.env.NODE_ENV === "development";

  // En PRODUCCIÓN: Únicamente roles reales asociados al usuario en public.user_roles.
  // En DESARROLLO: Permitir simulación si se requiere para pruebas.
  const selectableRoles = isDevelopment
    ? allRolesList
    : (userRoles.length > 0 ? userRoles : ["PUBLICO" as UserRole]);

  const canSwitchRole = selectableRoles.length > 1;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#090f1d] border-r border-slate-800/90 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo and Brand */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80 bg-[#060b15]/60">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 font-black text-white text-xl">
              F
            </div>
            <div>
              <div className="font-black text-lg tracking-wider text-white flex items-center gap-1.5">
                FUTSALBA
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
                MANAGER
              </div>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Switcher */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/40">
          <div className="relative">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span>ROL ACTIVO</span>
              {canSwitchRole && (
                <span
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="text-[10px] text-blue-400 font-semibold cursor-pointer hover:underline"
                >
                  Cambiar
                </span>
              )}
            </div>
            <button
              disabled={!canSwitchRole}
              onClick={() => canSwitchRole && setRoleDropdownOpen(!roleDropdownOpen)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 transition-all text-xs font-bold text-white shadow-sm ${
                canSwitchRole ? "hover:border-blue-500/50 cursor-pointer" : "cursor-default opacity-90"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="truncate">{currentUserRole.replace("_", " ")}</span>
              </div>
              {canSwitchRole && <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {canSwitchRole && roleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 max-h-60 overflow-y-auto divide-y divide-slate-800/50">
                {selectableRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setCurrentUserRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-colors ${
                      currentUserRole === r
                        ? "bg-blue-600/20 text-blue-400"
                        : "text-slate-300"
                    }`}
                  >
                    {r.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav Items List (filtrado dinámicamente según permisos de rol) */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-blue-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white ${item.badgeColor} animate-pulse`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer shortcuts */}
        <div className="p-4 border-t border-slate-800/80 bg-[#060b15]/60 flex flex-col gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-blue-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Portal Público
            </span>
            <span className="text-[10px] text-slate-500">/</span>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión Segura
          </button>
        </div>
      </aside>
    </>
  );
}

export function DashboardHeader({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { notifications, markNotificationAsRead, currentUserRole, user } =
    useFutsal();
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080f1d]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-semibold text-slate-200">Liga FUTSALBA 2026</span>
          <span>•</span>
          <span className="text-slate-400">Jornada 3 en desarrollo</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick link to Live Match */}
        <Link
          href="/dashboard/partidos/match-301/live"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          EN VIVO: TIG 2 - 1 LEO
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Centro de Notificaciones
                </span>
                <span className="text-[11px] text-blue-400 font-semibold">
                  {unreadCount} nuevas
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      n.read
                        ? "bg-slate-800/30 opacity-70"
                        : "bg-slate-800/80 border border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-white mb-0.5">{n.title}</div>
                    <div className="text-slate-300 text-[11px]">{n.message}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {n.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
            {user?.email ? user.email.substring(0, 2).toUpperCase() : "AD"}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-white truncate max-w-[140px]">
              {user?.email || "Admin FUTSALBA"}
            </div>
            <div className="text-[10px] font-semibold text-blue-400">
              {currentUserRole.replace("_", " ")}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isAuthLoading, currentUserRole, authError, retryAuth } = useFutsal();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !authError) {
      if (!isAuthenticated) {
        if (window.location.pathname.startsWith("/dashboard")) {
          router.replace("/acceso-institucional");
        }
      } else if (currentUserRole === "PUBLICO") {
        router.replace("/");
      }
    }
  }, [isAuthenticated, isAuthLoading, currentUserRole, authError, router]);

  if (authError) {
    return (
      <div className="min-h-screen bg-[#060b14] flex flex-col items-center justify-center text-white p-4">
        <div className="sports-card max-w-md w-full p-8 rounded-3xl border border-slate-800 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Error de Autorización</h2>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Ocurrió un problema al cargar los permisos de tu sesión. No te preocupes, puedes volver a intentarlo.
            <br/><br/>
            <span className="text-[10px] text-rose-500 font-mono bg-rose-500/10 p-1.5 rounded-lg block">{authError}</span>
          </p>
          <button
            onClick={retryAuth}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
          >
            REINTENTAR
          </button>
        </div>
      </div>
    );
  }

  // Si está verificando sesión con Supabase Auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#060b14] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/30 animate-pulse mb-3">
          F
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Verificando permisos...
        </div>
      </div>
    );
  }

  // Si no hay sesión válida activa, proteger la vista administrativa
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060b14] flex flex-col items-center justify-center text-white p-4">
        <div className="sports-card max-w-md w-full p-8 rounded-3xl border border-slate-800 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Acceso Institucional Requerido</h2>
          <p className="text-xs text-slate-400 mt-2">
            Las funciones operativas de FUTSALBA requieren una cuenta autorizada de personal.
          </p>
          <Link
            href="/acceso-institucional"
            className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
          >
            Acceso Institucional
          </Link>
        </div>
      </div>
    );
  }

  // Los usuarios con rol PUBLICO nunca pueden acceder a /dashboard
  if (currentUserRole === "PUBLICO") {
    return (
      <div className="min-h-screen bg-[#060b14] flex flex-col items-center justify-center text-white p-4">
        <div className="sports-card max-w-md w-full p-8 rounded-3xl border border-slate-800 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Acceso Restringido</h2>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Los usuarios con rol <strong>Público</strong> no tienen acceso al panel de administración de la liga. Redirigiendo al portal...
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
          >
            Ir al Portal Público
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <DashboardHeader onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

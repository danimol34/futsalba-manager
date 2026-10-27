"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserRole } from "@/types";
import {
  Users,
  Shield,
  Plus,
  CheckCircle2,
  UserCheck,
  Lock,
  Copy,
  Check,
  Terminal,
  Key,
  UserCog,
} from "lucide-react";

export default function UsersPage() {
  const { currentUserRole, setCurrentUserRole, user, userRoles } = useFutsal();
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const userRolesInfo: {
    role: UserRole;
    title: string;
    desc: string;
    permissions: string[];
  }[] = [
    {
      role: "SUPER_ADMIN",
      title: "Super Administrador",
      desc: "Acceso ilimitado y configuración del sistema",
      permissions: [
        "Control total",
        "Base de datos",
        "Asignación de roles",
        "Auditoría",
      ],
    },
    {
      role: "PRESIDENTE",
      title: "Presidente de la Liga",
      desc: "Gobierno general y homologación de torneos",
      permissions: [
        "Aprobación de temporadas",
        "Fallos de apelación",
        "Supervisión",
      ],
    },
    {
      role: "ADMINISTRADOR",
      title: "Administrador Deportivo",
      desc: "Gestión operativa del fixture y fichajes",
      permissions: [
        "Equipos y jugadores",
        "Programación de partidos",
        "Árbitros y canchas",
      ],
    },
    {
      role: "MESA_TECNICA",
      title: "Mesa Técnica / Cronometrador",
      desc: "Operación de partidos en tiempo real",
      permissions: [
        "Marcador en vivo",
        "Reloj de juego",
        "Registro de goles y faltas",
        "Actas",
      ],
    },
    {
      role: "ARBITRO",
      title: "Cuerpo Arbitral",
      desc: "Visualización de designaciones e informes",
      permissions: [
        "Partidos asignados",
        "Firma digital de actas",
        "Informe de incidencias",
      ],
    },
    {
      role: "DIRECTOR_TECNICO",
      title: "Director Técnico / Delegado",
      desc: "Gestión del plantel y convocatoria",
      permissions: [
        "Plantilla de su equipo",
        "Calendario y rivales",
        "Consulta de sanciones",
      ],
    },
    {
      role: "LOGISTICA",
      title: "Responsable de Logística",
      desc: "Checklist de cancha y suministros",
      permissions: [
        "Checklist operativo",
        "Verificación médica/DEA",
        "Balones e indumentaria",
      ],
    },
    {
      role: "PRENSA",
      title: "Oficial de Prensa & Media",
      desc: "Generación de comunicados y estadísticas",
      permissions: [
        "Gacetillas oficiales",
        "Copiar resultados",
        "Goleadores y tablas",
      ],
    },
    {
      role: "PUBLICO",
      title: "Público General / Aficionado",
      desc: "Visualización abierta sin privilegios de edición",
      permissions: [
        "Consulta de resultados",
        "Ver partidos en vivo",
        "Tablas públicas",
      ],
    },
  ];

  const targetUid = user?.id || "MI_USER_UUID";
  const sqlAssignSnippet = `-- Asignar rol a tu usuario en Supabase SQL Editor:
insert into public.user_roles (user_id, role)
values ('${targetUid}', 'SUPER_ADMIN')
on conflict (user_id, role) do nothing;`;

  const copyUid = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlAssignSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              SISTEMA DE USUARIOS Y ROLES (RBAC)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Matriz de control de acceso basada en roles, permisos reglamentarios y seguridad Supabase RLS.
            </p>
          </div>

          {currentUserRole === "SUPER_ADMIN" && (
            <Link
              href="/dashboard/personal"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
            >
              <UserCog className="w-4 h-4" />
              Gestionar Personal de la Liga
            </Link>
          )}
        </div>

        {/* Active Session & User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Key className="w-4 h-4 text-blue-400" />
                Sesión Activa de Supabase Auth
              </div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>{user?.email || "Sin sesión activa"}</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>UID: {user?.id || "N/A"}</span>
                {user?.id && (
                  <button
                    onClick={copyUid}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copiar UID"
                  >
                    {copiedUid ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Roles en base de datos:</span>
              <div className="flex gap-1">
                {userRoles.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  SQL para Asignar SUPER_ADMIN
                </span>
                <button
                  onClick={copySql}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar SQL
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-300 overflow-x-auto">
                {sqlAssignSnippet}
              </pre>
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              Ejecútalo en el SQL Editor de tu Dashboard de Supabase.
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userRolesInfo.map((info) => {
            const isCurrent = currentUserRole === info.role;

            return (
              <div
                key={info.role}
                className={`sports-card rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 ${
                  isCurrent
                    ? "border-blue-500 bg-blue-950/20 shadow-xl shadow-blue-600/10"
                    : "border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {info.role}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        ACTIVO
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white mt-3">
                    {info.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{info.desc}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      PERMISOS OTORGADOS:
                    </span>
                    {info.permissions.map((perm, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-slate-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentUserRole(info.role)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    {isCurrent ? "Rol Activo Seleccionado" : `Probar vista como ${info.title}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

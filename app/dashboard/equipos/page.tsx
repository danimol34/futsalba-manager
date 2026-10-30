"use client";

import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { teamsService, TeamDependencyDiagnostic } from "@/lib/services/teams";
import { Team } from "@/types";
import {
  Shield,
  Plus,
  MapPin,
  Search,
  ChevronRight,
  X,
  Check,
  Edit2,
  Trash2,
  Loader2,
  Power,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

interface TeamFormModalProps {
  isOpen: boolean;
  editingTeam: Team | null;
  onClose: () => void;
  addTeam: (team: Omit<Team, "id" | "created_at">) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<Team>;
}

const TeamFormModal = memo(function TeamFormModal({
  isOpen,
  editingTeam,
  onClose,
  addTeam,
  updateTeam,
}: TeamFormModalProps) {
  const toast = useToast();

  // Estado local aislado del formulario
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0066ff");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");
  const [city, setCity] = useState("");
  const [coachName, setCoachName] = useState("");
  const [delegateName, setDelegateName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTeam) {
      setName(editingTeam.name || "");
      setShortName(editingTeam.short_name || "");
      setLogoUrl(editingTeam.logo_url || "");
      setPrimaryColor(editingTeam.primary_color || "#0066ff");
      setSecondaryColor(editingTeam.secondary_color || "#ffffff");
      setCity(editingTeam.city || "");
      setCoachName(editingTeam.coach_name || "");
      setDelegateName(editingTeam.delegate_name || "");
      setPhone(editingTeam.phone || "");
      setEmail(editingTeam.email || "");
      setStatus(editingTeam.status === true || editingTeam.status === "ACTIVO");
    } else {
      setName("");
      setShortName("");
      setLogoUrl("");
      setPrimaryColor("#0066ff");
      setSecondaryColor("#ffffff");
      setCity("");
      setCoachName("");
      setDelegateName("");
      setPhone("");
      setEmail("");
      setStatus(true);
    }
    setIsSubmitting(false);
  }, [isOpen, editingTeam]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim()) {
      toast.warning("El nombre y la sigla del equipo son obligatorios");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        short_name: shortName.toUpperCase().trim(),
        logo_url:
          logoUrl ||
          "https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=160&auto=format&fit=crop&q=80",
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        city: city.trim(),
        coach_name: coachName.trim() || undefined,
        delegate_name: delegateName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        status: status,
      };

      if (editingTeam) {
        await updateTeam(editingTeam.id, payload);
        toast.success("Equipo actualizado correctamente");
      } else {
        await addTeam(payload);
        toast.success("Equipo creado correctamente");
      }

      onClose();
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            {editingTeam ? "EDITAR EQUIPO" : "REGISTRAR NUEVO EQUIPO"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Huracán Futsal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Sigla / Nombre Corto (3-4 letras) *
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="Ej: HUR"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white uppercase focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Ciudad / Sede
              </label>
              <input
                type="text"
                placeholder="Ej: Buenos Aires"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Director Técnico
              </label>
              <input
                type="text"
                placeholder="Nombre del DT"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Delegado Oficial
              </label>
              <input
                type="text"
                placeholder="Nombre del delegado"
                value={delegateName}
                onChange={(e) => setDelegateName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="contacto@club.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Estado del Equipo
              </label>
              <select
                value={status ? "ACTIVO" : "INACTIVO"}
                onChange={(e) => setStatus(e.target.value === "ACTIVO")}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ACTIVO">Activo (Habilitado para competir)</option>
                <option value="INACTIVO">Inactivo (Suspendido / En pausa)</option>
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Color Principal
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0"
                />
                <span className="text-xs text-slate-300 font-mono">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Color Secundario
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0"
                />
                <span className="text-xs text-slate-300 font-mono">{secondaryColor}</span>
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              URL del Escudo
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Puedes ingresar una URL directa de tu escudo o usar imágenes de Supabase Storage.
            </p>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando en Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingTeam ? "Actualizar Equipo" : "Crear Equipo"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

interface DeleteTestTeamModalProps {
  isOpen: boolean;
  team: Team | null;
  localMatchesCount: number;
  onClose: () => void;
  deleteTestTeam: (id: string) => Promise<void>;
}

const DeleteTestTeamModal = memo(function DeleteTestTeamModal({
  isOpen,
  team,
  localMatchesCount,
  onClose,
  deleteTestTeam,
}: DeleteTestTeamModalProps) {
  const toast = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [diagnostics, setDiagnostics] = useState<TeamDependencyDiagnostic | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !team) return;

    let cancelled = false;
    setConfirmText("");
    setErrorMsg(null);
    setIsDeleting(false);
    setIsChecking(true);

    teamsService
      .inspectTeamDependencies(team.id)
      .then((res) => {
        if (cancelled) return;
        setDiagnostics(res);
      })
      .catch(() => {
        if (cancelled) return;
        setDiagnostics({
          matches_count: localMatchesCount,
          players_count: 0,
          coaches_count: 0,
          sanctions_count: 0,
          adjustments_count: 0,
        });
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, team?.id, localMatchesCount]);

  if (!isOpen || !team) return null;

  const matchesCount = Math.max(diagnostics?.matches_count ?? 0, localMatchesCount);
  const hasMatches = matchesCount > 0;
  const isConfirmReady = confirmText.trim() === "ELIMINAR";

  const handleConfirmDelete = async () => {
    if (hasMatches || !isConfirmReady) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteTestTeam(team.id);
      toast.success("Equipo de prueba eliminado correctamente.");
      onClose();
    } catch (err: any) {
      const msg = err?.message || "No se pudo eliminar el equipo de prueba.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            ELIMINAR EQUIPO DE PRUEBA
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cerrar ventana"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <TeamLogo team={team} size="md" />
            <div>
              <div className="text-sm font-black text-white">{team.name}</div>
              <div className="text-xs font-mono text-blue-400">{team.short_name}</div>
            </div>
          </div>
          {team.city && (
            <div className="text-xs text-slate-400 pt-1">
              Sede: <span className="text-slate-200 font-semibold">{team.city}</span>
            </div>
          )}
        </div>

        {isChecking ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs font-semibold">
              Inspeccionando relaciones del equipo en Supabase...
            </span>
          </div>
        ) : hasMatches ? (
          <>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-300 space-y-1.5 leading-relaxed">
                <p className="font-black uppercase tracking-wider text-amber-200">
                  Eliminación bloqueada por partidos asociados ({matchesCount})
                </p>
                <p className="font-semibold text-white">
                  Este equipo todavía tiene partidos registrados. Elimina primero sus partidos de prueba.
                </p>
              </div>
            </div>

            {diagnostics && (
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 uppercase tracking-wider">
                  Relaciones detectadas:
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <span>Partidos: <strong className="text-rose-400">{matchesCount}</strong></span>
                  <span>Jugadores: <strong className="text-slate-200">{diagnostics.players_count}</strong></span>
                  <span>Cuerpo técnico: <strong className="text-slate-200">{diagnostics.coaches_count}</strong></span>
                  <span>Sanciones: <strong className="text-slate-200">{diagnostics.sanctions_count}</strong></span>
                  <span className="col-span-2">
                    Ajustes de tabla: <strong className="text-slate-200">{diagnostics.adjustments_count}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Cerrar ventana
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200 space-y-1 leading-relaxed">
                <p className="font-black uppercase tracking-wider text-rose-300">
                  HERRAMIENTA EXCLUSIVA SUPER_ADMIN
                </p>
                <p>
                  Esta acción eliminará permanentemente este equipo de prueba y sus registros auxiliares asociados (jugadores, cuerpo técnico, sanciones y ajustes de tabla).
                </p>
              </div>
            </div>

            {diagnostics && (
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 uppercase tracking-wider">
                  Dependencias a limpiar en cascada controlada:
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <span>Partidos: <strong className="text-emerald-400">0</strong></span>
                  <span>Jugadores: <strong className="text-slate-200">{diagnostics.players_count}</strong></span>
                  <span>Cuerpo técnico: <strong className="text-slate-200">{diagnostics.coaches_count}</strong></span>
                  <span>Sanciones: <strong className="text-slate-200">{diagnostics.sanctions_count}</strong></span>
                  <span className="col-span-2">
                    Ajustes de tabla: <strong className="text-slate-200">{diagnostics.adjustments_count}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Escribe <span className="text-rose-400 font-black">ELIMINAR</span> para habilitar el borrado definitivo:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribe ELIMINAR"
                autoComplete="off"
                disabled={isDeleting}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-rose-500/40 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-rose-300">{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors disabled:opacity-50"
              >
                Cerrar ventana
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || !isConfirmReady}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ELIMINAR DEFINITIVAMENTE</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default function TeamsPage() {
  const {
    teams,
    players,
    matches,
    standings,
    addTeam,
    updateTeam,
    deleteTeam,
    deleteTestTeam,
    isLoadingRemote,
    currentUserRole,
  } = useFutsal();
  const toast = useToast();
  const isReadOnly = currentUserRole === "PRENSA";
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testDeletingTeam, setTestDeletingTeam] = useState<Team | null>(null);

  const filteredTeams = useMemo(() => {
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(clean) ||
        (t.city && t.city.toLowerCase().includes(clean)) ||
        t.short_name.toLowerCase().includes(clean)
    );
  }, [teams, searchTerm]);

  const playerCountByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of players) {
      map.set(p.team_id, (map.get(p.team_id) || 0) + 1);
    }
    return map;
  }, [players]);

  const pointsByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of standings) {
      map.set(s.team_id, s.points || 0);
    }
    return map;
  }, [standings]);

  const matchesCountByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of matches) {
      if (m.home_team_id) {
        map.set(m.home_team_id, (map.get(m.home_team_id) || 0) + 1);
      }
      if (m.away_team_id) {
        map.set(m.away_team_id, (map.get(m.away_team_id) || 0) + 1);
      }
    }
    return map;
  }, [matches]);

  const openCreateModal = useCallback(() => {
    setEditingTeam(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((team: Team) => {
    setEditingTeam(team);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingTeam(null);
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el equipo "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deleteTeam(id);
      toast.success(`Equipo "${name}" eliminado correctamente`);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (team: Team) => {
    const currentActive = team.status === true || team.status === "ACTIVO";
    const nextStatus = !currentActive;
    try {
      await updateTeam(team.id, { status: nextStatus });
      toast.success(nextStatus ? "Equipo activado" : "Equipo desactivado");
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              EQUIPOS Y CLUBES
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Administración de franquicias oficiales, plantillas, escudos y cuerpos técnicos (Supabase).
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              NUEVO EQUIPO
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, sigla o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Loading Indicator */}
        {isLoadingRemote && teams.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium">Cargando equipos desde Supabase...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={Shield}
            title={searchTerm ? "No se encontraron equipos" : "No hay equipos registrados"}
            description={
              searchTerm
                ? "No hay resultados para tu búsqueda. Intenta con otro término."
                : "Registra los equipos oficiales para comenzar a organizar los planteles y el calendario del torneo."
            }
            actionLabel={searchTerm ? undefined : "+ Registrar primer equipo"}
            onAction={searchTerm ? undefined : openCreateModal}
            secondaryActionLabel={searchTerm ? "Limpiar búsqueda" : undefined}
            onSecondaryAction={searchTerm ? () => setSearchTerm("") : undefined}
          />
        ) : (
          /* Teams Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTeams.map((team) => {
              const squadCount = playerCountByTeam.get(team.id) || 0;
              const teamPoints = pointsByTeam.get(team.id) || 0;
              const isActive = team.status === true || team.status === "ACTIVO";
              const isDeleting = deletingId === team.id;

              return (
                <div
                  key={team.id}
                  className={`sports-card rounded-2xl p-5 border flex flex-col justify-between group transition-all duration-300 hover:border-blue-500/50 ${
                    isActive ? "border-slate-800" : "border-slate-800/50 opacity-70"
                  }`}
                >
                  <div>
                    {/* Top Row: Logo & Badges */}
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        <TeamLogo team={team} size="lg" />
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900"
                          style={{ backgroundColor: team.primary_color }}
                          title={`Color: ${team.primary_color}`}
                        />
                      </div>

                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(team)}
                            title={isActive ? "Desactivar equipo" : "Activar equipo"}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              isActive
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(team)}
                            title="Editar equipo"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(team.id, team.name)}
                            disabled={isDeleting}
                            title="Eliminar equipo"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Team Names */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                          {team.short_name}
                        </span>
                        <h3 className="font-extrabold text-white text-base tracking-tight truncate">
                          {team.name}
                        </h3>
                      </div>

                      {team.city && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{team.city}</span>
                        </p>
                      )}
                    </div>

                    {/* DT / Delegate Info */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                      {team.coach_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">DT:</span>
                          <span className="text-slate-300 font-medium truncate max-w-[150px]">
                            {team.coach_name}
                          </span>
                        </div>
                      )}
                      {!isReadOnly && team.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tel:</span>
                          <span className="text-slate-300 font-mono truncate max-w-[150px]">
                            {team.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Plantel</div>
                        <div className="text-sm font-black text-white font-scoreboard">
                          {squadCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Puntos</div>
                        <div className="text-sm font-black text-blue-400 font-scoreboard">
                          {teamPoints}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* View squad button */}
                  <div className="mt-5 space-y-2">
                    <Link
                      href={`/dashboard/equipos/${team.id}`}
                      className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all group-hover:bg-blue-600 group-hover:text-white"
                    >
                      <span>Ver Plantel y Perfil</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => setTestDeletingTeam(team)}
                        className="w-full py-2 px-3 rounded-xl bg-rose-950/50 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>ELIMINAR EQUIPO DE PRUEBA</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Create / Edit con estado local aislado */}
        <TeamFormModal
          isOpen={modalOpen}
          editingTeam={editingTeam}
          onClose={closeModal}
          addTeam={addTeam}
          updateTeam={updateTeam}
        />

        {/* Modal Eliminar Equipo de Prueba (Solo SUPER_ADMIN) */}
        {isSuperAdmin && (
          <DeleteTestTeamModal
            isOpen={Boolean(testDeletingTeam)}
            team={testDeletingTeam}
            localMatchesCount={
              testDeletingTeam ? matchesCountByTeam.get(testDeletingTeam.id) || 0 : 0
            }
            onClose={() => setTestDeletingTeam(null)}
            deleteTestTeam={deleteTestTeam}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

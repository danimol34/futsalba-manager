"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { Team } from "@/types";
import {
  Shield,
  Plus,
  Users,
  Trophy,
  MapPin,
  Mail,
  Phone,
  Search,
  ChevronRight,
  X,
  Check,
  Edit2,
  Trash2,
  Loader2,
  Power,
} from "lucide-react";

export default function TeamsPage() {
  const { teams, players, standings, addTeam, updateTeam, deleteTeam, isLoadingRemote } = useFutsal();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
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

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingTeam(null);
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
    setModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setName(team.name);
    setShortName(team.short_name);
    setLogoUrl(team.logo_url || "");
    setPrimaryColor(team.primary_color || "#0066ff");
    setSecondaryColor(team.secondary_color || "#ffffff");
    setCity(team.city || "");
    setCoachName(team.coach_name || "");
    setDelegateName(team.delegate_name || "");
    setPhone(team.phone || "");
    setEmail(team.email || "");
    setStatus(team.status === true || team.status === "ACTIVO");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !shortName) {
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

      setModalOpen(false);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            NUEVO EQUIPO
          </button>
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
              const teamPlayers = players.filter((p) => p.team_id === team.id);
              const teamStanding = standings.find((s) => s.team_id === team.id);
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
                      {team.phone && (
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
                          {teamPlayers.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Puntos</div>
                        <div className="text-sm font-black text-blue-400 font-scoreboard">
                          {teamStanding?.points || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* View squad button */}
                  <Link
                    href={`/dashboard/equipos/${team.id}`}
                    className="mt-5 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <span>Ver Plantel y Perfil</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Create / Edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  {editingTeam ? "EDITAR EQUIPO" : "REGISTRAR NUEVO EQUIPO"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
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
                    onClick={() => setModalOpen(false)}
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
        )}
      </div>
    </DashboardLayout>
  );
}

"use client";

import React, { useState } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { Venue } from "@/types";
import {
  MapPin,
  Plus,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  Check,
  Edit2,
  Trash2,
  Power,
  Loader2,
} from "lucide-react";

export default function VenuesPage() {
  const { venues, createVenue, updateVenue, deleteVenue, isLoadingRemote } = useFutsal();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState<number>(1500);
  const [surfaceType, setSurfaceType] = useState("PARQUET FLOTANTE");
  const [status, setStatus] = useState<boolean>(true);

  const openCreateModal = () => {
    setEditingVenue(null);
    setName("");
    setAddress("");
    setCapacity(1500);
    setSurfaceType("PARQUET FLOTANTE");
    setStatus(true);
    setModalOpen(true);
  };

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue);
    setName(venue.name);
    setAddress(venue.address || "");
    setCapacity(venue.capacity ?? 1500);
    setSurfaceType(venue.surface_type || "PARQUET FLOTANTE");
    setStatus(venue.status === true || venue.status === "ACTIVO" || venue.status === "HABILITADO");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("El nombre del recinto es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        capacity: Number(capacity) || 0,
        surface_type: surfaceType,
        status,
      };

      if (editingVenue) {
        await updateVenue(editingVenue.id, payload);
        toast.success("✅ Cancha actualizada correctamente");
      } else {
        await createVenue(payload);
        toast.success("✅ Cancha registrada correctamente");
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
    if (!confirm(`¿Estás seguro de que deseas eliminar el recinto "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deleteVenue(id);
      toast.success(`Cancha "${name}" eliminada`);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (venue: Venue) => {
    const currentActive = venue.status === true || venue.status === "ACTIVO" || venue.status === "HABILITADO";
    const nextStatus = !currentActive;
    try {
      await updateVenue(venue.id, { status: nextStatus });
      toast.success(nextStatus ? "Cancha habilitada" : "Cancha deshabilitada");
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
              <MapPin className="w-6 h-6 text-blue-400" />
              CANCHAS E INSTALACIONES OFICIALES
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Polideportivos homologados, superficies reglamentarias de parquet y aforo (Supabase).
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            NUEVA CANCHA
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoadingRemote && venues.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium">Cargando canchas desde Supabase...</p>
          </div>
        ) : venues.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={MapPin}
            title="No hay canchas registradas"
            description="Registra los polideportivos, gimnasios y estadios donde se disputarán los partidos oficiales."
            actionLabel="+ Registrar primer cancha"
            onAction={openCreateModal}
          />
        ) : (
          /* Venues Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {venues.map((venue) => {
              const isActive = venue.status === true || venue.status === "ACTIVO" || venue.status === "HABILITADO";
              const isDeleting = deletingId === venue.id;

              return (
                <div
                  key={venue.id}
                  className={`sports-card rounded-3xl p-6 border flex flex-col justify-between space-y-4 ${
                    isActive ? "border-slate-800" : "border-slate-800/60 opacity-70"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isActive ? "HABILITADO" : "EN MANTENIMIENTO"}
                      </span>
                      <Building2 className="w-4 h-4 text-blue-400" />
                    </div>

                    <h3 className="text-lg font-black text-white mt-3">{venue.name}</h3>

                    {venue.address && (
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{venue.address}</span>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Capacidad / Aforo:</span>
                        <span className="font-bold text-white font-scoreboard">
                          {(venue.capacity ?? 0).toLocaleString()} espectadores
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Superficie:</span>
                        <span className="text-slate-300">{venue.surface_type || "Parquet oficial"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(venue)}
                      title={isActive ? "Deshabilitar cancha" : "Habilitar cancha"}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(venue)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar Cancha
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(venue.id, venue.name)}
                      disabled={isDeleting}
                      title="Eliminar cancha"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Create / Edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  {editingVenue ? "EDITAR CANCHA" : "NUEVA CANCHA"}
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
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Nombre del Recinto / Gimnasio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Microestadio Polideportivo Central"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Dirección / Ubicación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Av. del Libertador 4500, CABA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Capacidad de Espectadores
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Tipo de Superficie
                    </label>
                    <select
                      value={surfaceType}
                      onChange={(e) => setSurfaceType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="PARQUET FLOTANTE">Parquet Flotante</option>
                      <option value="PISO SINTETICO">Piso Sintético (Taraflex)</option>
                      <option value="CEMENTO PULIDO">Cemento Pulido</option>
                      <option value="BALDOSA">Baldosa Interior</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Estado de Habilitación
                  </label>
                  <select
                    value={status ? "ACTIVO" : "INACTIVO"}
                    onChange={(e) => setStatus(e.target.value === "ACTIVO")}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVO">Habilitado para partidos oficiales</option>
                    <option value="INACTIVO">En mantenimiento / No disponible</option>
                  </select>
                </div>

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
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingVenue ? "Actualizar Cancha" : "Registrar Cancha"}</span>
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

"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlayerAvatar, PositionBadge } from "@/components/sports/PlayerAvatar";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/lib/context/ToastContext";
import { formatSupabaseError } from "@/lib/utils/errorHandler";
import { PlayerPosition, Player } from "@/types";
import { playersService, PlayerInsert } from "@/lib/services/players";
import {
  Users,
  Plus,
  Search,
  Filter,
  Flame,
  Award,
  ChevronRight,
  X,
  Check,
  Edit2,
  Trash2,
  Loader2,
  Power,
  Shield,
  Camera,
  AlertCircle,
} from "lucide-react";

const POSITIONS: PlayerPosition[] = ["PORTERO", "CIERRE", "ALA", "PIVOT", "UNIVERSAL"];
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function PlayersPage() {
  const { players, teams, addPlayer, updatePlayer, deletePlayer, isLoadingRemote } = useFutsal();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("ALL");
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState<"idle" | "saving" | "uploading">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState<number | "">(10);
  const [position, setPosition] = useState<PlayerPosition>("ALA");
  const [documentNumber, setDocumentNumber] = useState("");
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [status, setStatus] = useState<boolean>(true);

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredPlayers = players.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (p.document_number && p.document_number.includes(searchTerm)) ||
      p.jersey_number.toString() === searchTerm;
    const matchesTeam =
      selectedTeamFilter === "ALL" || p.team_id === selectedTeamFilter;
    const matchesPos =
      selectedPosFilter === "ALL" || p.position === selectedPosFilter;

    return matchesSearch && matchesTeam && matchesPos;
  });

  const openCreateModal = () => {
    setEditingPlayer(null);
    setFirstName("");
    setLastName("");
    setTeamId(teams[0]?.id || "");
    setJerseyNumber(10);
    setPosition("ALA");
    setDocumentNumber("");
    setBirthDate("2000-01-01");
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    setSubmittingPhase("idle");
    setStatus(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFirstName(player.first_name);
    setLastName(player.last_name);
    setTeamId(player.team_id);
    setJerseyNumber(player.jersey_number ?? 0);
    setPosition(player.position);
    setDocumentNumber(player.document_number || "");
    setBirthDate(player.birth_date || "2000-01-01");
    setPhotoFile(null);
    setPhotoPreview(player.photo_url || null);
    setPhotoError(null);
    setSubmittingPhase("idle");
    setStatus(player.status === true || player.status === "ACTIVO");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.");
      toast.error("Formato no permitido", "Solo se admiten archivos image/jpeg, image/png o image/webp.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError(`La fotografía excede el tamaño máximo de 5 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      toast.error("Archivo demasiado grande", "El tamaño máximo permitido es de 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPhotoError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !teamId) {
      toast.warning("El nombre, apellido y equipo son obligatorios.");
      return;
    }

    if (jerseyNumber === "" || isNaN(Number(jerseyNumber))) {
      toast.warning("El dorsal de la camiseta es obligatorio.");
      return;
    }

    const dorsalNum = Number(jerseyNumber);
    if (!Number.isInteger(dorsalNum) || dorsalNum < 0 || dorsalNum > 99) {
      toast.warning("El dorsal debe ser un número entero entre 0 y 99.");
      return;
    }

    // Client-side pre-check for duplicate dorsal within the same team
    const duplicate = players.find(
      (p) =>
        p.team_id === teamId &&
        p.jersey_number === dorsalNum &&
        (!editingPlayer || p.id !== editingPlayer.id)
    );

    if (duplicate) {
      toast.error(
        `El dorsal ${dorsalNum} ya está utilizado por otro jugador de este equipo (${duplicate.first_name} ${duplicate.last_name}).`,
        "Dorsal duplicado"
      );
      return;
    }

    setIsSubmitting(true);
    setSubmittingPhase("saving");

    try {
      const payload: PlayerInsert = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        team_id: teamId,
        jersey_number: dorsalNum,
        position,
        document_number: documentNumber.trim() || `DOC-${Date.now().toString().slice(-6)}`,
        birth_date: birthDate || null,
        photo_url: photoFile ? null : (photoPreview || null),
        status: status,
      };

      if (editingPlayer) {
        await updatePlayer(editingPlayer.id, payload);

        // Si se seleccionó una nueva foto, subirla a Supabase Storage
        if (photoFile) {
          setSubmittingPhase("uploading");
          try {
            const uploadedUrl = await playersService.uploadPhoto(editingPlayer.id, photoFile);
            await updatePlayer(editingPlayer.id, { photo_url: uploadedUrl });
          } catch (photoErr: any) {
            toast.warning(
              `Datos actualizados, pero no se pudo subir la fotografía: ${photoErr?.message || "Error en Supabase Storage"}`
            );
          }
        } else if (!photoPreview && editingPlayer.photo_url) {
          // El usuario quitó la fotografía existente
          await updatePlayer(editingPlayer.id, { photo_url: null });
        }

        toast.success("✅ Datos del jugador actualizados correctamente");
      } else {
        // Flujo nuevo jugador: Crear primero en BD -> obtener ID -> subir fotografía -> actualizar foto
        const created = await addPlayer(payload);

        if (photoFile) {
          setSubmittingPhase("uploading");
          try {
            const uploadedUrl = await playersService.uploadPhoto(created.id, photoFile);
            await updatePlayer(created.id, { photo_url: uploadedUrl });
            toast.success("Jugador registrado correctamente.");
          } catch (photoErr: any) {
            toast.warning(
              `Jugador registrado, pero falló la subida de la fotografía: ${photoErr?.message || "Error en Storage"}`
            );
          }
        } else {
          toast.success("Jugador registrado correctamente.");
        }
      }

      setModalOpen(false);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setIsSubmitting(false);
      setSubmittingPhase("idle");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al jugador "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deletePlayer(id);
      toast.success(`Jugador "${name}" eliminado correctamente`);
    } catch (err: any) {
      const formatted = formatSupabaseError(err);
      toast.error(formatted.message, formatted.title);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (player: Player) => {
    const currentActive = player.status === true || player.status === "ACTIVO";
    const nextStatus = !currentActive;
    try {
      await updatePlayer(player.id, { status: nextStatus });
      toast.success(nextStatus ? "Jugador activado" : "Jugador desactivado");
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
              PADRÓN DE JUGADORES
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Registro federado de atletas, posiciones oficiales y fichas técnicas (Supabase).
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            NUEVO JUGADOR
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, dorsal o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Team Filter */}
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los equipos</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.short_name})
                </option>
              ))}
            </select>

            {/* Position Filter */}
            <select
              value={selectedPosFilter}
              onChange={(e) => setSelectedPosFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todas las posiciones</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoadingRemote && players.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium">Cargando jugadores desde Supabase...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={Users}
            title={searchTerm || selectedTeamFilter !== "ALL" || selectedPosFilter !== "ALL" ? "No se encontraron jugadores" : "No hay jugadores registrados todavía."}
            description={
              searchTerm || selectedTeamFilter !== "ALL" || selectedPosFilter !== "ALL"
                ? "No hay jugadores que coincidan con los filtros aplicados. Intenta restablecer los filtros."
                : "Registra jugadores para comenzar a construir las plantillas de tus equipos."
            }
            actionLabel={searchTerm || selectedTeamFilter !== "ALL" || selectedPosFilter !== "ALL" ? undefined : "+ Registrar primer jugador"}
            onAction={searchTerm || selectedTeamFilter !== "ALL" || selectedPosFilter !== "ALL" ? undefined : openCreateModal}
            secondaryActionLabel={searchTerm || selectedTeamFilter !== "ALL" || selectedPosFilter !== "ALL" ? "Restablecer filtros" : undefined}
            onSecondaryAction={
              searchTerm || selectedTeamFilter !== "ALL" || selectedPosFilter !== "ALL"
                ? () => {
                    setSearchTerm("");
                    setSelectedTeamFilter("ALL");
                    setSelectedPosFilter("ALL");
                  }
                : undefined
            }
          />
        ) : (
          /* Players Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPlayers.map((player) => {
              const team = teams.find((t) => t.id === player.team_id);
              const isActive = player.status === true || player.status === "ACTIVO";
              const isDeleting = deletingId === player.id;

              return (
                <div
                  key={player.id}
                  className={`sports-card rounded-2xl p-5 border flex flex-col justify-between group transition-all duration-300 hover:border-blue-500/50 ${
                    isActive ? "border-slate-800" : "border-slate-800/50 opacity-70"
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar & Actions */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          player={player}
                          size="md"
                          teamColor={team?.primary_color}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              #{player.jersey_number}
                            </span>
                            <PositionBadge position={player.position} />
                          </div>
                          <h3 className="font-extrabold text-white text-sm tracking-tight mt-1 truncate max-w-[140px]">
                            {player.first_name} {player.last_name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(player)}
                          title={isActive ? "Desactivar jugador" : "Activar jugador"}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${
                            isActive
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(player)}
                          title="Editar jugador"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(player.id, `${player.first_name} ${player.last_name}`)}
                          disabled={isDeleting}
                          title="Eliminar jugador"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Team & Document Info */}
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Club:</span>
                        {team ? (
                          <div className="flex items-center gap-1.5">
                            <TeamLogo team={team} size="xs" />
                            <span className="text-white font-semibold truncate max-w-[120px]">
                              {team.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Agente Libre</span>
                        )}
                      </div>

                      {player.document_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Documento:</span>
                          <span className="text-slate-300 font-mono">{player.document_number}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-1.5 mt-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-500">PJ</div>
                        <div className="text-xs font-black text-white font-scoreboard">
                          {player.matches_played ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-500">Goles</div>
                        <div className="text-xs font-black text-emerald-400 font-scoreboard">
                          {player.goals ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-500">Asist</div>
                        <div className="text-xs font-black text-blue-400 font-scoreboard">
                          {player.assists ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-500">Tarj</div>
                        <div className="text-xs font-black text-amber-400 font-scoreboard">
                          {(player.yellow_cards ?? 0) + (player.red_cards ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile link */}
                  <Link
                    href={`/dashboard/jugadores/${player.id}`}
                    className="mt-4 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <span>Ficha Deportiva</span>
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
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[92vh] overflow-y-auto overflow-x-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  {editingPlayer ? "EDITAR JUGADOR" : "REGISTRAR NUEVO JUGADOR"}
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
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Lucas"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Tripodi"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Asignar Equipo (Supabase) *
                    </label>
                    <select
                      required
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecciona un equipo</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.short_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Dorsal / Camiseta (0 - 99) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={99}
                      step={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Ej: 10"
                      value={jerseyNumber}
                      onKeyDown={(e) => {
                        if ([".", ",", "e", "E", "+", "-"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setJerseyNumber("");
                          return;
                        }
                        const intVal = parseInt(val, 10);
                        if (!isNaN(intVal) && intVal >= 0 && intVal <= 99) {
                          setJerseyNumber(intVal);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Posición Oficial (ENUM) *
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value as PlayerPosition)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      DNI / Documento de Identidad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 42.123.456"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Estado del Jugador
                    </label>
                    <select
                      value={status ? "ACTIVO" : "INACTIVO"}
                      onChange={(e) => setStatus(e.target.value === "ACTIVO")}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="ACTIVO">Activo (Habilitado para jugar)</option>
                      <option value="INACTIVO">Inactivo (Suspendido / No federado)</option>
                    </select>
                  </div>
                </div>

                {/* Subida real de Fotografía del Jugador */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Fotografía del Jugador</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      JPG, PNG o WebP (máx. 5 MB)
                    </span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {photoError && (
                    <div className="mb-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{photoError}</span>
                    </div>
                  )}

                  {photoPreview ? (
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center gap-3.5">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500/40 bg-slate-950 shrink-0 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreview}
                          alt="Vista previa jugador"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {photoFile ? photoFile.name : "Fotografía asignada"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {photoFile
                            ? `${(photoFile.size / 1024).toFixed(1)} KB • Lista para subir`
                            : "Imagen del perfil del jugador"}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5 text-blue-400" />
                            <span>Cambiar fotografía</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleRemovePhoto}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Quitar fotografía</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-900/40 hover:bg-slate-900 transition-all cursor-pointer text-center group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        Seleccionar fotografía
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Haz clic para abrir tu fototeca, galería o cámara móvil
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {submittingPhase === "uploading"
                            ? "Subiendo fotografía..."
                            : editingPlayer
                            ? "Actualizando jugador..."
                            : "Registrando jugador..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingPlayer ? "Actualizar Jugador" : "Registrar Jugador"}</span>
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

"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Referee } from "@/types";
import { refereesService } from "@/lib/services";
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  Upload,
  Loader2,
  AlertOctagon,
  Camera,
} from "lucide-react";

const REFEREE_CATEGORIES = [
  "PRINCIPAL",
  "SEGUNDO ÁRBITRO",
  "TERCER ÁRBITRO",
  "CRONOMETRADOR",
];

export default function RefereesPage() {
  const { referees, currentUserRole, addReferee, updateReferee, refetchReferees } = useFutsal();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReferee, setEditingReferee] = useState<Referee | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [category, setCategory] = useState("PRINCIPAL");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");

  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & error handling
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isPrensa = currentUserRole === "PRENSA";
  const canManage = ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR"].includes(currentUserRole);

  const openCreateModal = () => {
    setEditingReferee(null);
    setFullName("");
    setCategory("PRINCIPAL");
    setPhone("");
    setEmail("");
    setStatus("ACTIVO");
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (ref: Referee) => {
    setEditingReferee(ref);
    setFullName(ref.full_name);
    setCategory(ref.category || "PRINCIPAL");
    setPhone(ref.phone || "");
    setEmail(ref.email || "");
    setStatus(ref.status === false || ref.status === "INACTIVO" ? "INACTIVO" : "ACTIVO");
    setSelectedFile(null);
    setPreviewUrl(ref.photo_url || null);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingReferee(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      setFormError("Formato de imagen inválido. Solo se admiten archivos JPG, PNG o WEBP.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError("La fotografía no puede superar los 5 MB de tamaño.");
      return;
    }

    setFormError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 3) {
      setFormError("El nombre completo es obligatorio y debe tener al menos 3 caracteres.");
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setFormError("El correo electrónico ingresado no tiene un formato válido.");
        return;
      }
    }

    setSaving(true);

    try {
      let finalPhotoUrl = editingReferee?.photo_url || null;

      // Upload photo if a new file was chosen
      if (selectedFile) {
        try {
          const targetId = editingReferee?.id || `temp-${Date.now()}`;
          finalPhotoUrl = await refereesService.uploadPhoto(targetId, selectedFile);
        } catch (uploadErr: any) {
          console.warn("Notice: No se pudo subir foto a Storage (¿Falta bucket o políticas?):", uploadErr?.message);
          // If storage bucket is pending creation or fails, inform user gracefully
          if (uploadErr?.message?.includes("Bucket not found") || uploadErr?.message?.includes("bucket")) {
            setFormError("El bucket de almacenamiento 'referee-photos' está pendiente de creación en Supabase. Puedes guardar sin foto temporalmente o solicitar la migración de Storage.");
            setSaving(false);
            return;
          }
          throw uploadErr;
        }
      }

      const payload = {
        full_name: cleanName,
        category: category.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        photo_url: finalPhotoUrl,
        status: status === "ACTIVO",
      };

      if (editingReferee) {
        await updateReferee(editingReferee.id, payload);
      } else {
        await addReferee(payload);
      }

      await refetchReferees();
      closeModal();
    } catch (err: any) {
      console.error("Error al guardar árbitro:", err);
      setFormError(err?.message || "Ocurrió un error al registrar el árbitro en la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-400" />
                CUERPO ARBITRAL Y OFICIALES DE MESA
              </h1>
              {isPrensa && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  PRENSA • SOLO CONSULTA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Colegio de árbitros homologados, designaciones oficiales y categorías federativas de FUTSALBA.
            </p>
          </div>

          {canManage && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              REGISTRAR ÁRBITRO
            </button>
          )}
        </div>

        {/* Roles reminder banner */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
          <div className="border-l-2 border-amber-400 pl-3">
            <strong className="block text-white font-bold">ÁRBITRO PRINCIPAL</strong>
            <span className="text-[11px] text-slate-400">Máxima autoridad en pista</span>
          </div>
          <div className="border-l-2 border-blue-400 pl-3">
            <strong className="block text-white font-bold">SEGUNDO ÁRBITRO</strong>
            <span className="text-[11px] text-slate-400">Línea de banda opuesta</span>
          </div>
          <div className="border-l-2 border-emerald-400 pl-3">
            <strong className="block text-white font-bold">TERCER ÁRBITRO</strong>
            <span className="text-[11px] text-slate-400">Control de bancos y cambios</span>
          </div>
          <div className="border-l-2 border-purple-400 pl-3">
            <strong className="block text-white font-bold">CRONOMETRADOR</strong>
            <span className="text-[11px] text-slate-400">Control de reloj y faltas</span>
          </div>
        </div>

        {/* Empty State */}
        {referees.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 max-w-lg mx-auto my-8">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                No hay árbitros registrados todavía.
              </h3>
              <p className="text-xs text-slate-400">
                {canManage
                  ? "Registra el primer integrante del cuerpo arbitral para comenzar las designaciones oficiales de cada partido."
                  : "El cuerpo arbitral estará disponible una vez que la administración oficialice las designaciones."}
              </p>
            </div>
            {canManage && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar Primer Árbitro
              </button>
            )}
          </div>
        ) : (
          /* Referees grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {referees.map((ref) => {
              const isActive = ref.status !== false && ref.status !== "INACTIVO";
              return (
                <div
                  key={ref.id}
                  className="sports-card rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-4">
                    {/* Badge & Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {ref.category || "OFICIAL"}
                      </span>

                      <span
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          isActive ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ACTIVO
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            INACTIVO
                          </>
                        )}
                      </span>
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3">
                      {ref.photo_url ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 shrink-0 bg-slate-800 relative">
                          <Image
                            src={ref.photo_url}
                            alt={ref.full_name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-lg shrink-0">
                          {ref.full_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">
                          {ref.full_name}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          {ref.matches_officiated || 0} partidos dirigidos
                        </span>
                      </div>
                    </div>

                    {/* Phone & Email (Hidden for PRENSA) */}
                    {!isPrensa && (ref.phone || ref.email) && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                        {ref.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{ref.phone}</span>
                          </div>
                        )}
                        {ref.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{ref.email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(ref)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        EDITAR
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Registrar / Editar Árbitro */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="sports-card rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-700 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar formulario"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  {editingReferee ? "Edición de Árbitro" : "Nuevo Registro"}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white">
                  {editingReferee ? "EDITAR ÁRBITRO" : "REGISTRAR ÁRBITRO"}
                </h2>
                <p className="text-xs text-slate-400">
                  Completa los datos oficiales del integrante del cuerpo arbitral.
                </p>
              </div>

              {formError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                  <div className="leading-relaxed font-medium">{formError}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre completo */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Nombre Completo <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    required
                    minLength={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Categoría / Rol Principal <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    {REFEREE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fotografía (Archivo desde PC/teléfono) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Fotografía Oficial (JPG, PNG, WEBP - Máx 5 MB)
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />

                  <div className="flex items-center gap-4">
                    {previewUrl ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-500/50 bg-slate-800 shrink-0 relative">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>{previewUrl ? "Cambiar Fotografía" : "Subir desde Dispositivo"}</span>
                      </button>
                      <p className="text-[10px] text-slate-500">
                        {selectedFile ? selectedFile.name : "Formatos válidos: JPG, PNG o WEBP."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Teléfono de Contacto (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+58 412 0000000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Correo electrónico */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arbitro@futsalba.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Estado en el Colegio Arbitral
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus("ACTIVO")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        status === "ACTIVO"
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ACTIVO
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("INACTIVO")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        status === "INACTIVO"
                          ? "bg-rose-600/20 text-rose-400 border border-rose-500/40"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      INACTIVO
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>{editingReferee ? "Guardar Cambios" : "Registrar Árbitro"}</span>
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

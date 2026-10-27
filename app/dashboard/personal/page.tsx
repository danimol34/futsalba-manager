"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { staffService } from "@/lib/services/staff";
import { StaffProfile, StaffRole, STAFF_ASSIGNABLE_ROLES, UserRole } from "@/types";
import {
  UserCog,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Briefcase,
  ShieldAlert,
  Send,
  Edit2,
  Power,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
  UserCheck,
} from "lucide-react";

export default function StaffPage() {
  const { currentUserRole, user } = useFutsal();

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);

  // Add form fields
  const [addFullName, setAddFullName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPosition, setAddPosition] = useState("");
  const [addRole, setAddRole] = useState<StaffRole>("ADMINISTRADOR");
  const [addResponsibilities, setAddResponsibilities] = useState("");
  const [addPhone, setAddPhone] = useState("");

  // Edit form fields
  const [editFullName, setEditFullName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editRole, setEditRole] = useState<StaffRole>("ADMINISTRADOR");
  const [editResponsibilities, setEditResponsibilities] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");

  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  const fetchStaff = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await staffService.getStaffList();
      setStaffList(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al cargar la lista de personal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStaff();
    }
  }, [isSuperAdmin]);

  // Open Edit Modal
  const handleOpenEdit = (staff: StaffProfile) => {
    setEditingStaff(staff);
    setEditFullName(staff.full_name);
    setEditPosition(staff.position);
    setEditRole((staff.role as StaffRole) || "ADMINISTRADOR");
    setEditResponsibilities(staff.responsibilities || "");
    setEditPhone(staff.phone || "");
    setEditStatus(staff.status);
    setErrorMsg(null);
  };

  // Submit Add Staff
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFullName.trim() || !addEmail.trim() || !addPosition.trim()) {
      setErrorMsg("Completa los campos obligatorios: Nombre, Correo y Cargo.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await staffService.inviteStaffMember({
        fullName: addFullName.trim(),
        email: addEmail.trim(),
        position: addPosition.trim(),
        role: addRole,
        responsibilities: addResponsibilities.trim() || undefined,
        phone: addPhone.trim() || undefined,
        status: "ACTIVO",
      });

      setSuccessMsg(res.message);
      setIsAddModalOpen(false);
      // Reset form
      setAddFullName("");
      setAddEmail("");
      setAddPosition("");
      setAddRole("ADMINISTRADOR");
      setAddResponsibilities("");
      setAddPhone("");
      await fetchStaff();
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error al invitar al personal.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit Staff
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editFullName.trim() || !editPosition.trim()) {
      setErrorMsg("Nombre y Cargo no pueden estar vacíos.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await staffService.updateStaffMember(editingStaff.user_id, {
        fullName: editFullName.trim(),
        position: editPosition.trim(),
        responsibilities: editResponsibilities.trim() || null,
        phone: editPhone.trim() || null,
        status: editStatus,
        role: editRole,
      });

      setSuccessMsg(res.message);
      setEditingStaff(null);
      await fetchStaff();
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al actualizar la información del personal.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (staff: StaffProfile) => {
    const nextStatus = staff.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const confirmMsg =
      nextStatus === "INACTIVO"
        ? `¿Deseas desactivar a ${staff.full_name}? El empleado no será eliminado físicamente para conservar el historial y auditoría.`
        : `¿Deseas reactivar a ${staff.full_name}?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await staffService.toggleStaffStatus(staff.user_id, nextStatus);
      setSuccessMsg(
        `Estado de ${staff.full_name} modificado a ${nextStatus} correctamente.`
      );
      await fetchStaff();
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al cambiar el estado del personal.");
    } finally {
      setActionLoading(false);
    }
  };

  // Resend Invite
  const handleResendInvite = async (staff: StaffProfile) => {
    if (
      !window.confirm(
        `¿Reenviar correo oficial de invitación / acceso a ${staff.email}?`
      )
    )
      return;

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const msg = await staffService.resendInvite(staff.user_id);
      setSuccessMsg(msg);
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al reenviar la invitación.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered List
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      const matchesSearch =
        item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.responsibilities &&
          item.responsibilities.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        filterRole === "ALL" ? true : item.role === filterRole;

      const matchesStatus =
        filterStatus === "ALL" ? true : item.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, filterRole, filterStatus]);

  // Statistics
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status === "ACTIVO").length;
  const inactiveStaff = staffList.filter((s) => s.status === "INACTIVO").length;

  // Role Badge Helper
  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "PRESIDENTE":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "ADMINISTRADOR":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "MESA_TECNICA":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "ARBITRO":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "DIRECTOR_TECNICO":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "LOGISTICA":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "PRENSA":
        return "bg-pink-500/20 text-pink-300 border-pink-500/30";
      default:
        return "bg-slate-700/40 text-slate-400 border-slate-700";
    }
  };

  // Access Control Guard
  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-xl shadow-rose-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">
            Módulo Restringido: Personal de la Liga
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md">
            Este módulo contiene datos confidenciales y funciones de contratación/gestión de empleados.
            El acceso está reservado exclusivamente para la cuenta con rol <strong className="text-white">SUPER_ADMIN</strong>.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  PERSONAL DE LA LIGA
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestión federativa de empleados, invitaciones seguras por correo y asignación de roles RBAC.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchStaff}
              disabled={loading || actionLoading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Refrescar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={() => {
                setIsAddModalOpen(true);
                setErrorMsg(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Agregar Personal
            </button>
          </div>
        </div>

        {/* Notifications Banners */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Registrados
              </div>
              <div className="text-2xl font-black text-white mt-1">{totalStaff}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Personal Activo
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{activeStaff}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Personal Inactivo (Auditoría)
              </div>
              <div className="text-2xl font-black text-slate-400 mt-1">{inactiveStaff}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="sports-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, cargo, correo..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="ALL">Todos los roles</option>
                {STAFF_ASSIGNABLE_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="sports-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Cargando personal administrativo...
              </div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-16 text-center space-y-3 p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-white">No se encontró personal</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || filterRole !== "ALL" || filterStatus !== "ALL"
                  ? "No hay empleados que coincidan con los filtros seleccionados."
                  : "Aún no has agregado miembros al personal de la liga. Haz clic en 'Agregar Personal' para invitar al primer empleado."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Empleado & Correo</th>
                    <th className="py-3.5 px-4">Cargo en Liga</th>
                    <th className="py-3.5 px-4">Rol Autorización</th>
                    <th className="py-3.5 px-4">Responsabilidades</th>
                    <th className="py-3.5 px-4">Teléfono</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStaff.map((staff) => {
                    const isActive = staff.status === "ACTIVO";
                    return (
                      <tr
                        key={staff.user_id}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          !isActive ? "opacity-60 bg-slate-950/40" : ""
                        }`}
                      >
                        {/* Member Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-black text-white text-xs border border-slate-700 shadow-sm shrink-0">
                              {staff.full_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{staff.full_name}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {staff.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Position */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200">{staff.position}</span>
                        </td>

                        {/* Authorization Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getRoleBadge(
                              staff.role
                            )}`}
                          >
                            {staff.role ? staff.role.replace("_", " ") : "SIN ROL"}
                          </span>
                        </td>

                        {/* Responsibilities */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="text-slate-400 text-[11px] truncate" title={staff.responsibilities || ""}>
                            {staff.responsibilities || "—"}
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {staff.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {staff.phone}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              isActive
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-slate-700/30 text-slate-400 border-slate-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                              }`}
                            />
                            {staff.status}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(staff)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Editar información"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Resend Invite Button */}
                            <button
                              onClick={() => handleResendInvite(staff)}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition-colors"
                              title="Reenviar invitación o correo de contraseña"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Status Button (Activate / Deactivate - No physical delete) */}
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              disabled={actionLoading}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                isActive
                                  ? "bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border-rose-500/30"
                                  : "bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30"
                              }`}
                              title={isActive ? "Desactivar empleado" : "Activar empleado"}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security and Governance Note */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white text-xs">
              Políticas de Privacidad y Gobierno Federativo
            </div>
            <div>
              1. <strong>Fuente de Autorización Única:</strong> Los roles operativos residen estrictamente en la tabla <code className="text-cyan-300">public.user_roles</code> gobernada por PostgreSQL RLS.
            </div>
            <div>
              2. <strong>Historial Preservado:</strong> No se realizan borrados físicos de empleados. Al desactivar un empleado se conserva su trazabilidad en actas y estadísticas.
            </div>
            <div>
              3. <strong>Invitación por Servidor Seguro:</strong> La clave secreta de Supabase se ejecuta exclusivamente en el servidor mediante <code className="text-cyan-300">SUPABASE_SECRET_KEY</code> y nunca viaja al navegador.
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: AGREGAR PERSONAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="sports-card w-full max-w-lg rounded-3xl border border-slate-800 p-6 md:p-8 bg-[#090f1d] shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <UserPlusIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Agregar Personal de la Liga</h3>
                  <p className="text-[11px] text-slate-400">
                    Enviar invitación oficial y configurar rol administrativo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="Ej: Roberto Gómez"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="empleado@futsalba.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Cargo en la Liga *
                  </label>
                  <input
                    type="text"
                    required
                    value={addPosition}
                    onChange={(e) => setAddPosition(e.target.value)}
                    placeholder="Ej: Cronometrador Oficial"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Rol de Autorización RBAC *
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as StaffRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    {STAFF_ASSIGNABLE_ROLES.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+58 412 1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Responsabilidades Asignadas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={addResponsibilities}
                  onChange={(e) => setAddResponsibilities(e.target.value)}
                  placeholder="Detalla las funciones clave asignadas a este miembro del personal..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300 flex items-start gap-2">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <span>
                  El empleado recibirá un correo de FUTSALBA con un enlace de invitación para activar su cuenta y crear su contraseña de acceso.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  {actionLoading ? "Enviando invitación..." : "Enviar Invitación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PERSONAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="sports-card w-full max-w-lg rounded-3xl border border-slate-800 p-6 md:p-8 bg-[#090f1d] shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Editar Personal de la Liga</h3>
                  <p className="text-[11px] text-slate-400">
                    Modificar datos administrativos y rol de {editingStaff.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Correo Electrónico (Registrado en Auth)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={editingStaff.email}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Cargo en la Liga *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Rol de Autorización RBAC *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as StaffRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    {STAFF_ASSIGNABLE_ROLES.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Estado Administrativo
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "ACTIVO" | "INACTIVO")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+58 412 1234567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Responsabilidades Asignadas
                </label>
                <textarea
                  rows={2}
                  value={editResponsibilities}
                  onChange={(e) => setEditResponsibilities(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  {actionLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function UserPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}

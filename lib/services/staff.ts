import { supabase } from "@/lib/supabase/client";
import { StaffProfile, StaffRole } from "@/types";

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("No hay una sesión activa de Supabase.");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export const staffService = {
  /**
   * Obtiene la lista completa de personal administrativo y sus roles federativos.
   */
  async getStaffList(): Promise<StaffProfile[]> {
    const headers = await getAuthHeader();
    const res = await fetch("/api/staff", {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Error al obtener el personal.");
    }

    return json.staff || [];
  },

  /**
   * Invita a un nuevo miembro del personal y le asigna su rol.
   */
  async inviteStaffMember(params: {
    fullName: string;
    email: string;
    position: string;
    role: StaffRole;
    responsibilities?: string;
    phone?: string;
    status?: "ACTIVO" | "INACTIVO";
  }): Promise<{ message: string; staff: StaffProfile }> {
    const headers = await getAuthHeader();
    const res = await fetch("/api/staff", {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Error al invitar al personal.");
    }

    return json;
  },

  /**
   * Actualiza los datos de un miembro del personal o su rol.
   */
  async updateStaffMember(
    userId: string,
    updates: {
      fullName?: string;
      position?: string;
      responsibilities?: string | null;
      phone?: string | null;
      status?: "ACTIVO" | "INACTIVO";
      role?: StaffRole;
    }
  ): Promise<{ message: string; staff: StaffProfile }> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/staff/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updates),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Error al actualizar personal.");
    }

    return json;
  },

  /**
   * Alterna el estado ACTIVO / INACTIVO de un empleado (sin eliminación física).
   */
  async toggleStaffStatus(
    userId: string,
    newStatus: "ACTIVO" | "INACTIVO"
  ): Promise<StaffProfile> {
    const result = await this.updateStaffMember(userId, { status: newStatus });
    return result.staff;
  },

  /**
   * Reenvía el correo de invitación o enlace de acceso.
   */
  async resendInvite(userId: string): Promise<string> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/staff/${userId}/resend-invite`, {
      method: "POST",
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Error al reenviar invitación.");
    }

    return json.message || "Invitación reenviada.";
  },
};

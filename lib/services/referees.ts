import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Referee, UserRole } from "@/types";

export type RefereeInsert = {
  full_name: string;
  category?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: boolean | string;
};

export type RefereeUpdate = Partial<RefereeInsert>;

export const refereesService = {
  /**
   * Obtiene la lista oficial de árbitros y oficiales de mesa.
   * Si el rol es administrativo (SUPER_ADMIN, PRESIDENTE, ADMINISTRADOR), consulta la tabla base 'referees'.
   * Si es PRENSA u otro rol de consulta, utiliza la vista segura 'public_referees'.
   */
  async getReferees(userRole?: UserRole): Promise<Referee[]> {
    if (!isSupabaseConfigured) return [];

    const isSportsAdmin = userRole && ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR"].includes(userRole);

    const tableOrView = isSportsAdmin ? "referees" : "public_referees";

    const { data, error } = await supabase
      .from(tableOrView)
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      // Fallback a public_referees en caso de restricción RLS
      if (isSportsAdmin) {
        console.warn("Notice: Fallback a public_referees tras error en referees:", error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("public_referees")
          .select("*")
          .order("full_name", { ascending: true });

        if (fallbackError) throw fallbackError;
        return (fallbackData as Referee[]) || [];
      }
      throw error;
    }

    return (data as Referee[]) || [];
  },

  /**
   * Obtiene un árbitro por su ID
   */
  async getRefereeById(id: string): Promise<Referee | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from("referees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return (data as Referee) || null;
  },

  /**
   * Registra un nuevo árbitro u oficial de mesa (Solo administradores)
   */
  async createReferee(refereeData: RefereeInsert): Promise<Referee> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const cleanName = refereeData.full_name?.trim();
    if (!cleanName || cleanName.length < 3) {
      throw new Error("El nombre completo del árbitro es obligatorio y debe tener al menos 3 caracteres.");
    }

    const payload: any = {
      full_name: cleanName,
      category: refereeData.category?.trim() || "PRINCIPAL",
      photo_url: refereeData.photo_url || null,
      phone: refereeData.phone?.trim() || null,
      email: refereeData.email?.trim() || null,
      status: typeof refereeData.status === "boolean" ? refereeData.status : refereeData.status === "ACTIVO" || refereeData.status === undefined,
    };

    const { data, error } = await supabase
      .from("referees")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Referee;
  },

  /**
   * Actualiza los datos de un árbitro existente
   */
  async updateReferee(id: string, updates: RefereeUpdate): Promise<Referee> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    if (updates.full_name !== undefined) {
      const cleanName = updates.full_name.trim();
      if (!cleanName || cleanName.length < 3) {
        throw new Error("El nombre completo del árbitro debe tener al menos 3 caracteres.");
      }
      updates.full_name = cleanName;
    }

    const payload: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (typeof updates.status === "string") {
      payload.status = updates.status === "ACTIVO";
    }

    const { data, error } = await supabase
      .from("referees")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Referee;
  },

  /**
   * Desactiva un árbitro (borrado lógico, status = false)
   */
  async deactivateReferee(id: string): Promise<Referee> {
    return this.updateReferee(id, { status: false });
  },

  /**
   * Sube la fotografía del árbitro al bucket público 'referee-photos'
   * con ruta estructurada: referees/{refereeId}/{uuid}.{ext}
   */
  async uploadPhoto(refereeId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    // Validar tipo de archivo
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      throw new Error("Formato de imagen inválido. Solo se admiten archivos JPG, PNG o WEBP.");
    }

    // Validar peso máximo (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error("La fotografía supera el límite de 5 MB permitido.");
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const targetRefId = refereeId || "temp";
    const filePath = `referees/${targetRefId}/${uniqueId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("referee-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("referee-photos").getPublicUrl(filePath);
    return data.publicUrl;
  },
};

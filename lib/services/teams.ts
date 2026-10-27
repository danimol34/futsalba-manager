import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Team } from "@/types";

export type TeamInsert = Omit<Team, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export type TeamUpdate = Partial<Omit<Team, "id" | "created_at" | "updated_at">>;

export const teamsService = {
  /**
   * Get all teams from Supabase
   */
  async getTeams(): Promise<Team[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as Team[]) || [];
  },

  /**
   * Get a single team by its ID
   */
  async getTeamById(id: string): Promise<Team | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return (data as Team) || null;
  },

  /**
   * Create a new team in Supabase
   */
  async createTeam(team: TeamInsert): Promise<Team> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const newTeamPayload = {
      name: team.name.trim(),
      short_name: (team.short_name || team.name.substring(0, 3)).toUpperCase().trim(),
      city: team.city?.trim() || "",
      primary_color: team.primary_color || "#0066ff",
      secondary_color: team.secondary_color || "#ffffff",
      coach_name: team.coach_name?.trim() || null,
      delegate_name: team.delegate_name?.trim() || null,
      phone: team.phone?.trim() || null,
      email: team.email?.trim() || null,
      logo_url: team.logo_url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80",
      status: team.status ?? true,
    };

    const { data, error } = await supabase
      .from("teams")
      .insert(newTeamPayload)
      .select()
      .single();

    if (error) throw error;
    return data as Team;
  },

  /**
   * Update an existing team
   */
  async updateTeam(id: string, updates: TeamUpdate): Promise<Team> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { data, error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Team;
  },

  /**
   * Toggle team active/inactive status
   */
  async toggleTeamStatus(id: string, currentStatus: boolean | string | undefined): Promise<Team> {
    const newStatus = typeof currentStatus === "boolean" ? !currentStatus : currentStatus !== "ACTIVO";
    return this.updateTeam(id, { status: newStatus });
  },

  /**
   * Delete team from database
   */
  async deleteTeam(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Upload team logo to Supabase storage bucket 'logos' (if bucket exists)
   * Falls back gracefully to public URL if bucket is not present
   */
  async uploadLogo(file: File): Promise<string> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const fileExt = file.name.split(".").pop();
    const fileName = `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `teams/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      // If bucket does not exist or upload is blocked by storage RLS, throw to notify
      throw uploadError;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(filePath);
    return data.publicUrl;
  },
};

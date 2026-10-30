import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { isUUID } from "@/lib/utils/validators";
import { Team } from "@/types";

export interface TeamDependencyDiagnostic {
  matches_count: number;
  players_count: number;
  coaches_count: number;
  sanctions_count: number;
  adjustments_count: number;
}

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
   * Inspect all foreign-key dependencies of a team before deletion
   */
  async inspectTeamDependencies(id: string): Promise<TeamDependencyDiagnostic> {
    if (!isSupabaseConfigured || !isUUID(id)) {
      return {
        matches_count: 0,
        players_count: 0,
        coaches_count: 0,
        sanctions_count: 0,
        adjustments_count: 0,
      };
    }

    try {
      const { data, error } = await supabase.rpc("inspect_team_dependencies", {
        p_team_id: id,
      });

      if (!error && data && typeof data === "object") {
        const res = data as Record<string, any>;
        return {
          matches_count: Number(res.matches_count ?? 0),
          players_count: Number(res.players_count ?? 0),
          coaches_count: Number(res.coaches_count ?? 0),
          sanctions_count: Number(res.sanctions_count ?? 0),
          adjustments_count: Number(res.adjustments_count ?? 0),
        };
      }
    } catch {
      // Fallback to direct count queries if RPC is not yet installed
    }

    const [matchesRes, playersRes, coachesRes, sanctionsRes, adjRes] =
      await Promise.all([
        supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .or(`home_team_id.eq.${id},away_team_id.eq.${id}`),
        supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .eq("team_id", id),
        supabase
          .from("coaches")
          .select("id", { count: "exact", head: true })
          .eq("team_id", id),
        supabase
          .from("sanctions")
          .select("id", { count: "exact", head: true })
          .eq("team_id", id),
        supabase
          .from("standings_adjustments")
          .select("id", { count: "exact", head: true })
          .eq("team_id", id),
      ]);

    return {
      matches_count: matchesRes.count ?? 0,
      players_count: playersRes.count ?? 0,
      coaches_count: coachesRes.count ?? 0,
      sanctions_count: sanctionsRes.count ?? 0,
      adjustments_count: adjRes.count ?? 0,
    };
  },

  /**
   * SUPER_ADMIN ONLY: Delete a test team and its remaining test dependencies
   * once all its test matches have been removed.
   */
  async deleteTestTeam(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");
    if (!isUUID(id)) {
      throw new Error("El identificador del equipo no es un UUID válido.");
    }

    const deps = await this.inspectTeamDependencies(id);
    if (deps.matches_count > 0) {
      const err: any = new Error(
        "Este equipo todavía tiene partidos registrados. Elimina primero sus partidos de prueba."
      );
      err.code = "TEAM_HAS_MATCHES";
      throw err;
    }

    const { error } = await supabase.rpc("delete_test_team", {
      p_team_id: id,
    });

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

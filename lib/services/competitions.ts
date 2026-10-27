import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Competition } from "@/types";

export type CompetitionInsert = {
  season_id?: string | null;
  name: string;
  competition_type?: string | null;
  format?: string | null;
  number_of_teams?: number;
  start_date?: string | null;
  end_date?: string | null;
  status?: boolean | string;
};

export type CompetitionUpdate = Partial<CompetitionInsert>;

export const competitionsService = {
  async getCompetitions(seasonId?: string): Promise<Competition[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase.from("competitions").select("*");

    if (seasonId) {
      query = query.eq("season_id", seasonId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Competition[]) || [];
  },

  async getCompetitionById(id: string): Promise<Competition | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return (data as Competition) || null;
  },

  async createCompetition(comp: CompetitionInsert): Promise<Competition> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const payload = {
      season_id: comp.season_id || null,
      name: comp.name.trim(),
      competition_type: comp.competition_type || "LIGA",
      format: comp.format || "TODOS_CONTRA_TODOS",
      number_of_teams: comp.number_of_teams || 8,
      start_date: comp.start_date || null,
      end_date: comp.end_date || null,
      status: comp.status ?? true,
    };

    const { data, error } = await supabase
      .from("competitions")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Competition;
  },

  async updateCompetition(id: string, updates: CompetitionUpdate): Promise<Competition> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { data, error } = await supabase
      .from("competitions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Competition;
  },

  async toggleCompetitionStatus(id: string, currentStatus: boolean | string | undefined): Promise<Competition> {
    const newStatus = typeof currentStatus === "boolean" ? !currentStatus : currentStatus !== "ACTIVO";
    return this.updateCompetition(id, { status: newStatus });
  },

  async deleteCompetition(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { error } = await supabase
      .from("competitions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

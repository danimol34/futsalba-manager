import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { isUUID } from "@/lib/utils/validators";
import { Season, SeasonStatus } from "@/types";

export type SeasonInsert = {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: SeasonStatus;
};

export type SeasonUpdate = Partial<SeasonInsert>;

export const seasonsService = {
  async getSeasons(): Promise<Season[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("seasons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data as Season[]) || []).filter((s) => isUUID(s.id));
  },

  async getSeasonById(id: string): Promise<Season | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return (data as Season) || null;
  },

  async createSeason(season: SeasonInsert): Promise<Season> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const payload = {
      name: season.name.trim(),
      start_date: season.start_date || null,
      end_date: season.end_date || null,
      status: season.status || "BORRADOR",
    };

    const { data, error } = await supabase
      .from("seasons")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Season;
  },

  async updateSeason(id: string, updates: SeasonUpdate): Promise<Season> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { data, error } = await supabase
      .from("seasons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Season;
  },

  async setSeasonStatus(id: string, status: SeasonStatus): Promise<Season> {
    return this.updateSeason(id, { status });
  },

  async deleteSeason(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { error } = await supabase
      .from("seasons")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

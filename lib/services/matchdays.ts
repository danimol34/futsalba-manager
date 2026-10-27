import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Matchday } from "@/types";

export type MatchdayInsert = {
  competition_id: string;
  name: string;
  matchday_number?: number;
  start_date?: string | null;
  end_date?: string | null;
};

export type MatchdayUpdate = Partial<MatchdayInsert>;

export const matchdaysService = {
  async getMatchdays(competitionId?: string): Promise<Matchday[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase.from("matchdays").select("*");

    if (competitionId) {
      query = query.eq("competition_id", competitionId);
    }

    const { data, error } = await query.order("matchday_number", { ascending: true });

    if (error) throw error;
    return (data as Matchday[]) || [];
  },

  async getMatchdayById(id: string): Promise<Matchday | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("matchdays")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return (data as Matchday) || null;
  },

  async createMatchday(md: MatchdayInsert): Promise<Matchday> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const payload = {
      competition_id: md.competition_id,
      name: md.name.trim(),
      matchday_number: md.matchday_number || 1,
      start_date: md.start_date || null,
      end_date: md.end_date || null,
    };

    const { data, error } = await supabase
      .from("matchdays")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Matchday;
  },

  async updateMatchday(id: string, updates: MatchdayUpdate): Promise<Matchday> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { data, error } = await supabase
      .from("matchdays")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Matchday;
  },

  async deleteMatchday(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { error } = await supabase
      .from("matchdays")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

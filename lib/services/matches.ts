import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Match, MatchStatus, MatchPeriod } from "@/types";


export type MatchInsert = {
  season_id?: string | null;
  competition_id?: string | null;
  matchday_id?: string | null;
  home_team_id: string;
  away_team_id: string;
  venue_id?: string | null;
  match_date: string;
  kickoff_time?: string | null;
  status?: MatchStatus;
  period?: number | MatchPeriod;
  period_number?: number;
  home_score?: number;
  away_score?: number;
  home_fouls?: number;
  away_fouls?: number;
  home_timeouts?: number;
  away_timeouts?: number;
  match_clock_seconds?: number;
  is_clock_running?: boolean;
  main_referee_id?: string | null;
  second_referee_id?: string | null;
  timekeeper_id?: string | null;
  notes?: string | null;
};



export type MatchUpdate = Partial<Match>;

export const matchesService = {
  /**
   * Get all matches ordered by match date descending
   */
  async getMatches(): Promise<Match[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false });

    if (error) throw error;
    return (data as Match[]) || [];
  },

  /**
   * Get a single match by ID
   */
  async getMatchById(id: string): Promise<Match | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return (data as Match) || null;
  },

  /**
   * Create a new match with futsal defaults
   */
  async createMatch(match: MatchInsert): Promise<Match> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    // Validation: Home and away teams must be different
    if (match.home_team_id === match.away_team_id) {
      const err: any = new Error("El equipo local y el equipo visitante no pueden ser el mismo.");
      err.code = "SAME_TEAM";
      throw err;
    }

    const payload = {
      season_id: match.season_id || null,
      competition_id: match.competition_id || null,
      matchday_id: match.matchday_id || null,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      venue_id: match.venue_id || null,
      match_date: match.match_date,
      kickoff_time: match.kickoff_time || "19:00:00",
      status: match.status || ("PROGRAMADO" as MatchStatus),
      home_score: match.home_score ?? 0,
      away_score: match.away_score ?? 0,
      home_fouls: match.home_fouls ?? 0,
      away_fouls: match.away_fouls ?? 0,
      home_timeouts: match.home_timeouts ?? 0,
      away_timeouts: match.away_timeouts ?? 0,
      period: typeof match.period === "number" ? match.period : 1,
      match_clock_seconds: match.match_clock_seconds ?? 1200,
      notes: match.notes?.trim() || null,

    };

    const { data, error } = await supabase
      .from("matches")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Match;
  },

  /**
   * Update an existing match
   */
  async updateMatch(id: string, updates: MatchUpdate): Promise<Match> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    if (updates.home_team_id && updates.away_team_id && updates.home_team_id === updates.away_team_id) {
      const err: any = new Error("El equipo local y el equipo visitante no pueden ser el mismo.");
      err.code = "SAME_TEAM";
      throw err;
    }

    const { data, error } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Match;
  },

  /**
   * Start a match (sets status to EN_VIVO)
   */
  async startMatch(id: string): Promise<Match> {
    return this.updateMatch(id, {
      status: "EN_VIVO",
      is_clock_running: true,
      period: 1,
    });
  },

  /**
   * Cancel a match (sets status to CANCELADO)
   */
  async cancelMatch(id: string, reason?: string): Promise<Match> {
    return this.updateMatch(id, {
      status: "CANCELADO",
      is_clock_running: false,
      notes: reason ? `Cancelado: ${reason}` : "Partido cancelado",
    });
  },

  /**
   * Delete match from database
   */
  async deleteMatch(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

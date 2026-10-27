import { supabase, isSupabaseConfigured } from "./client";
import {
  Team,
  Player,
  Match,
  MatchEvent,
  Standing,
  LogisticsTask,
  Sanction,
  LeagueSettings,
  Referee,
  Venue,
} from "@/types";

/**
 * Service to execute direct Supabase queries against the PostgreSQL database
 */
export const futsalbaApi = {
  // 1. TEAMS
  async getTeams(): Promise<Team[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from("teams").select("*").order("name");
    if (error) throw error;
    return data || [];
  },

  async createTeam(team: Omit<Team, "id" | "created_at" | "updated_at">): Promise<Team> {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
    const { data, error } = await supabase.from("teams").insert(team).select().single();
    if (error) throw error;
    return data;
  },

  // 2. PLAYERS
  async getPlayers(teamId?: string): Promise<Player[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase.from("players").select("*");
    if (teamId) query = query.eq("team_id", teamId);
    const { data, error } = await query.order("jersey_number");
    if (error) throw error;
    return data || [];
  },

  // 3. MATCHES
  async getMatches(): Promise<Match[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateMatchLiveState(
    matchId: string,
    updates: Partial<Match>
  ): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", matchId);
    if (error) throw error;
  },

  // 4. MATCH EVENTS
  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId)
      .order("minute", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createMatchEvent(event: Omit<MatchEvent, "id" | "created_at">): Promise<MatchEvent> {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
    const { data, error } = await supabase
      .from("match_events")
      .insert(event)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 5. STANDINGS VIEW (Directly from public.standings view!)
  async getStandings(): Promise<Standing[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from("standings").select("*");
    if (error) throw error;
    return (data || []).map((row: any) => ({
      team_id: row.team_id,
      team_name: row.name,
      team_short: row.short_name,
      logo_url: row.logo_url,
      played: row.played || 0,
      won: row.wins || 0,
      drawn: row.draws || 0,
      lost: row.losses || 0,
      goals_for: row.goals_for || 0,
      goals_against: row.goals_against || 0,
      goal_difference: row.goal_difference || 0,
      points: row.points || 0,
    }));
  },

  // 6. LOGISTICS TASKS
  async getLogisticsTasks(matchId: string): Promise<LogisticsTask[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("logistics_tasks")
      .select("*")
      .eq("match_id", matchId);
    if (error) throw error;
    return data || [];
  },

  async toggleLogisticsTask(taskId: string, completed: boolean): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from("logistics_tasks")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", taskId);
    if (error) throw error;
  },

  // 7. LEAGUE SETTINGS
  async getLeagueSettings(): Promise<LeagueSettings | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("league_settings")
      .select("*")
      .limit(1)
      .single();
    if (error) return null;
    return data;
  },
};

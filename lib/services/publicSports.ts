import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Team,
  Player,
  Match,
  MatchEvent,
  Standing,
  Referee,
  Coach,
  Venue,
  Matchday,
  Sanction,
} from "@/types";

/**
 * Public Sports Service (Capa Segura para Aficionados y Portal Público)
 *
 * Consulta EXCLUSIVAMENTE las vistas públicas seguras creadas en Supabase:
 * - public_teams (sin teléfonos, correos ni datos del delegado)
 * - public_players (sin documento de identidad / DNI ni fecha de nacimiento completa)
 * - public_matches (sin notas disciplinarias ni observaciones internas de mesa)
 * - public_match_events (sin created_by ni notas arbitrales internas)
 * - public_coaches (sin teléfonos ni correos privados)
 * - public_referees (sin teléfonos ni correos privados)
 * - standings (cálculo de posiciones oficial)
 * - player_statistics (goles, asistencias y tarjetas)
 *
 * Las tablas base permanecen restringidas al personal de la liga (staff/admin) por RLS.
 */

export interface PublicPlayerStatistic {
  player_id: string;
  first_name: string;
  last_name: string;
  team_id: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
}

export const publicSportsService = {
  /**
   * Obtener todos los equipos desde la vista segura 'public_teams'
   */
  async getPublicTeams(): Promise<Team[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("public_teams")
      .select("id, name, short_name, logo_url, primary_color, secondary_color, city, coach_name, status")
      .order("name", { ascending: true });

    if (error) {
      console.warn("[publicSportsService] Error fetching public_teams:", error.message);
      return [];
    }
    return (data as Team[]) || [];
  },

  /**
   * Obtener jugadores desde la vista segura 'public_players' (sin DNI ni fecha de nacimiento)
   */
  async getPublicPlayers(teamId?: string): Promise<Player[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase
      .from("public_players")
      .select("id, team_id, first_name, last_name, jersey_number, position, photo_url, status");

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query.order("jersey_number", { ascending: true });

    if (error) {
      console.warn("[publicSportsService] Error fetching public_players:", error.message);
      return [];
    }
    return (data as Player[]) || [];
  },

  /**
   * Obtener partidos desde la vista segura 'public_matches' (sin notas internas de mesa técnica)
   */
  async getPublicMatches(): Promise<Match[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("public_matches")
      .select(
        "id, season_id, competition_id, matchday_id, home_team_id, away_team_id, venue_id, match_date, kickoff_time, status, home_score, away_score, period, match_clock_seconds, home_fouls, away_fouls, home_timeouts, away_timeouts, created_at, updated_at"
      )
      .order("match_date", { ascending: false });

    if (error) {
      console.warn("[publicSportsService] Error fetching public_matches:", error.message);
      return [];
    }
    return (data as Match[]) || [];
  },

  /**
   * Obtener un partido por ID desde la vista segura 'public_matches'
   */
  async getPublicMatchById(id: string): Promise<Match | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("public_matches")
      .select(
        "id, season_id, competition_id, matchday_id, home_team_id, away_team_id, venue_id, match_date, kickoff_time, status, home_score, away_score, period, match_clock_seconds, home_fouls, away_fouls, home_timeouts, away_timeouts, created_at, updated_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.warn("[publicSportsService] Error fetching public match by id:", error.message);
      return null;
    }
    return (data as Match) || null;
  },

  /**
   * Obtener eventos de partido desde la vista segura 'public_match_events' (sin created_by ni notas)
   */
  async getPublicMatchEvents(matchId: string): Promise<MatchEvent[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("public_match_events")
      .select("id, match_id, team_id, player_id, secondary_player_id, event_type, period, minute, second, created_at")
      .eq("match_id", matchId)
      .order("minute", { ascending: true });

    if (error) {
      console.warn("[publicSportsService] Error fetching public_match_events:", error.message);
      return [];
    }
    return (data as MatchEvent[]) || [];
  },

  /**
   * Obtener tabla de clasificación desde la vista calculada 'standings'
   */
  async getPublicStandings(): Promise<Standing[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("standings")
      .select("team_id, name, short_name, logo_url, played, wins, draws, losses, goals_for, goals_against, goal_difference, match_points, points_adjustment, points");

    if (error) {
      console.warn("[publicSportsService] Error fetching standings:", error.message);
      return [];
    }

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
      match_points: row.match_points ?? (row.points || 0),
      points_adjustment: row.points_adjustment ?? 0,
      points: row.points || 0,
    }));
  },

  /**
   * Obtener sanciones deportivas visibles desde la vista segura 'public_sanctions' (sin notas internas)
   */
  async getPublicSanctions(): Promise<Sanction[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("public_sanctions")
      .select("id, player_id, team_id, match_id, reason, suspension_matches, start_date, end_date, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[publicSportsService] Error fetching public_sanctions:", error.message);
      return [];
    }
    return (data as Sanction[]) || [];
  },

  /**
   * Obtener estadísticas de goleadores y tarjetas desde la vista 'player_statistics'
   */
  async getPublicPlayerStatistics(): Promise<PublicPlayerStatistic[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("player_statistics")
      .select("player_id, first_name, last_name, team_id, goals, assists, yellow_cards, red_cards")
      .order("goals", { ascending: false });

    if (error) {
      console.warn("[publicSportsService] Error fetching player_statistics:", error.message);
      return [];
    }
    return (data as PublicPlayerStatistic[]) || [];
  },

  /**
   * Obtener árbitros desde la vista segura 'public_referees' (sin teléfono ni email)
   */
  async getPublicReferees(): Promise<Referee[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("public_referees")
      .select("id, full_name, photo_url, category, status, created_at, updated_at")
      .order("full_name", { ascending: true });

    if (error) {
      console.warn("[publicSportsService] Error fetching public_referees:", error.message);
      return [];
    }
    return (data as Referee[]) || [];
  },

  /**
   * Obtener cuerpo técnico desde la vista segura 'public_coaches' (sin teléfono ni email)
   */
  async getPublicCoaches(): Promise<Coach[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("public_coaches")
      .select("id, team_id, full_name, status, created_at, updated_at")
      .order("full_name", { ascending: true });

    if (error) {
      console.warn("[publicSportsService] Error fetching public_coaches:", error.message);
      return [];
    }
    return (data as Coach[]) || [];
  },

  /**
   * Obtener sedes/canchas (tabla no sensible, pero protegida para authenticated)
   */
  async getPublicVenues(): Promise<Venue[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("venues")
      .select("id, name, address, capacity, surface_type, status")
      .order("name", { ascending: true });

    if (error) {
      console.warn("[publicSportsService] Error fetching venues:", error.message);
      return [];
    }
    return (data as Venue[]) || [];
  },

  /**
   * Obtener jornadas de competición (tabla no sensible, pero protegida para authenticated)
   */
  async getPublicMatchdays(): Promise<Matchday[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("matchdays")
      .select("id, competition_id, name, matchday_number, start_date, end_date")
      .order("matchday_number", { ascending: true });

    if (error) {
      console.warn("[publicSportsService] Error fetching matchdays:", error.message);
      return [];
    }
    return (data as Matchday[]) || [];
  },
};

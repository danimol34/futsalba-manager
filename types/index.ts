export type UserRole =
  | "SUPER_ADMIN"
  | "PRESIDENTE"
  | "ADMINISTRADOR"
  | "MESA_TECNICA"
  | "ARBITRO"
  | "DIRECTOR_TECNICO"
  | "LOGISTICA"
  | "PRENSA"
  | "PUBLICO";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  status?: boolean | string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at?: string;
}

export type SeasonStatus = "BORRADOR" | "ACTIVA" | "FINALIZADA";

export interface Season {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  status: SeasonStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Competition {
  id: string;
  season_id?: string | null;
  name: string;
  competition_type?: string | null;
  type?: "LIGA" | "COPA" | "PLAYOFFS" | string;
  format?: string | null;
  number_of_teams?: number;
  start_date?: string | null;
  end_date?: string | null;
  status?: boolean | string;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  city: string;
  coach_name?: string | null;
  delegate_name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: boolean | string;
  created_at?: string;
  updated_at?: string;
}

export interface Coach {
  id: string;
  team_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PlayerPosition =
  | "PORTERO"
  | "CIERRE"
  | "ALA"
  | "PIVOT"
  | "UNIVERSAL";

export interface Player {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  document_number: string;
  jersey_number: number;
  position: PlayerPosition;
  photo_url?: string | null;
  status?: boolean | string;
  matches_played?: number;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  created_at?: string;
  updated_at?: string;
}


export type MatchStatus =
  | "PROGRAMADO"
  | "EN_PREPARACION"
  | "EN_VIVO"
  | "DESCANSO"
  | "FINALIZADO"
  | "SUSPENDIDO"
  | "CANCELADO";

export type MatchPeriod =
  | "PREVIO"
  | "PRIMER_TIEMPO"
  | "DESCANSO"
  | "SEGUNDO_TIEMPO"
  | "PRORROGA_1"
  | "PRORROGA_2"
  | "PENALTIS"
  | "FINALIZADO";

export interface Match {
  id: string;
  season_id?: string;
  competition_id?: string;
  matchday_id?: string;
  home_team_id: string;
  away_team_id: string;
  venue_id?: string;
  match_date: string;
  kickoff_time?: string;
  status: MatchStatus;
  period: number | MatchPeriod;
  period_number?: number;

  home_score: number;
  away_score: number;
  home_fouls: number;
  away_fouls: number;
  home_timeouts: number;
  away_timeouts: number;
  match_clock_seconds: number;
  is_clock_running?: boolean;
  main_referee_id?: string;
  second_referee_id?: string;
  timekeeper_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  is_starting?: boolean;
  jersey_number?: number;
  created_at?: string;
}

export type RefereeRole =
  | "ARBITRO_PRINCIPAL"
  | "SEGUNDO_ARBITRO"
  | "TERCER_ARBITRO"
  | "CRONOMETRADOR";

export interface MatchReferee {
  id: string;
  match_id: string;
  referee_id: string;
  role: RefereeRole;
  created_at?: string;
}

export type MatchEventType =
  | "goal"
  | "assist"
  | "yellow_card"
  | "red_card"
  | "foul"
  | "penalty"
  | "double_penalty"
  | "substitution"
  | "timeout"
  | "injury"
  | "note";

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id?: string;
  secondary_player_id?: string;
  event_type: MatchEventType;
  period?: MatchPeriod | number;
  minute: number;
  second: number;
  notes?: string;
  created_by?: string;
  created_at?: string;
}

export interface Venue {
  id: string;
  name: string;
  address?: string | null;
  capacity?: number | null;
  surface_type?: string | null;
  status?: boolean | string;
  created_at?: string;
  updated_at?: string;
}

export interface Matchday {
  id: string;
  competition_id?: string | null;
  name: string;
  number?: number;
  matchday_number?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
  created_at?: string;
  updated_at?: string;
}


export interface Referee {
  id: string;
  full_name: string;
  photo_url?: string;
  category?: string;
  phone?: string;
  email?: string;
  status?: boolean | string;
  matches_officiated?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Standing {
  team_id: string;
  team_name: string;
  team_short: string;
  logo_url?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form?: ("W" | "D" | "L")[];
}

export type SanctionStatus = "PENDIENTE" | "ACTIVA" | "CUMPLIDA" | "ANULADA";

export interface Sanction {
  id: string;
  player_id: string;
  team_id: string;
  match_id?: string;
  reason: string;
  suspension_matches?: number;
  matches_suspended?: number;
  matches_served?: number;
  start_date?: string;
  end_date?: string;
  date_issued?: string;
  status: SanctionStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LogisticsTask {
  id: string;
  match_id: string;
  title: string;
  description?: string;
  category?: string;
  assigned_user_id?: string;
  assigned_to?: string;
  is_critical?: boolean;
  completed?: boolean;
  completed_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeagueSettings {
  id?: string;
  league_name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  active_season_id?: string;
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
  points_win?: number;
  points_draw?: number;
  points_loss?: number;
  period_duration_minutes: number;
  number_of_periods?: number;
  periods?: number;
  match_duration_minutes?: number;
  max_accumulated_fouls: number;
  max_fouls_per_period?: number;
  timeouts_per_team_per_period?: number;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type?: string;
  timestamp?: string;
  read?: boolean;
  is_read?: boolean;
  link?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_data?: any;
  new_data?: any;
  created_at?: string;
}

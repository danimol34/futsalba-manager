import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { isUUID } from "@/lib/utils/validators";
import { Match, MatchStatus, MatchPeriod, MatchReferee } from "@/types";

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

export type MatchUpdate = Partial<MatchInsert>;

export const OFFICIAL_MATCH_EVENT_TYPES = [
  "goal",
  "assist",
  "yellow_card",
  "red_card",
  "foul",
  "penalty",
  "double_penalty",
] as const;

export interface MatchOfficialDataCheckResult {
  hasOfficialData: boolean;
  reason?: string;
  reasons: string[];
  diagnostics: {
    status: string;
    home_score: number;
    away_score: number;
    home_fouls: number;
    away_fouls: number;
    official_events_count: number;
    auxiliary_events_count: number;
    event_types: string[];
    sanctions_count: number;
    match_players_count: number;
    match_referees_count: number;
    logistics_tasks_count: number;
  };
}

async function hydrateMatchReferees(matches: Match[]): Promise<Match[]> {
  if (!isSupabaseConfigured || matches.length === 0) return matches;
  try {
    const matchIds = matches.map((m) => m.id).filter((id) => isUUID(id));
    if (matchIds.length === 0) return matches;

    const { data, error } = await supabase
      .from("match_referees")
      .select("match_id, referee_id, role")
      .in("match_id", matchIds);

    if (error || !data) return matches;

    const byMatch = new Map<
      string,
      { main?: string; second?: string; timekeeper?: string }
    >();

    for (const row of data as MatchReferee[]) {
      const entry = byMatch.get(row.match_id) || {};
      if (row.role === "ARBITRO_PRINCIPAL") entry.main = row.referee_id;
      else if (row.role === "SEGUNDO_ARBITRO") entry.second = row.referee_id;
      else if (row.role === "CRONOMETRADOR") entry.timekeeper = row.referee_id;
      byMatch.set(row.match_id, entry);
    }

    return matches.map((m) => {
      const refs = byMatch.get(m.id);
      if (!refs) return m;
      return {
        ...m,
        main_referee_id: refs.main ?? m.main_referee_id,
        second_referee_id: refs.second ?? m.second_referee_id,
        timekeeper_id: refs.timekeeper ?? m.timekeeper_id,
      };
    });
  } catch {
    return matches;
  }
}

async function syncMatchReferees(
  matchId: string,
  refs: {
    main_referee_id?: string | null;
    second_referee_id?: string | null;
    timekeeper_id?: string | null;
  }
): Promise<void> {
  if (!isSupabaseConfigured || !isUUID(matchId)) return;

  const hasAnyRefereeField =
    refs.main_referee_id !== undefined ||
    refs.second_referee_id !== undefined ||
    refs.timekeeper_id !== undefined;

  if (!hasAnyRefereeField) return;

  try {
    await supabase.from("match_referees").delete().eq("match_id", matchId);

    const inserts: { match_id: string; referee_id: string; role: string }[] = [];
    const usedRefIds = new Set<string>();

    if (refs.main_referee_id && isUUID(refs.main_referee_id)) {
      inserts.push({
        match_id: matchId,
        referee_id: refs.main_referee_id,
        role: "ARBITRO_PRINCIPAL",
      });
      usedRefIds.add(refs.main_referee_id);
    }

    if (
      refs.second_referee_id &&
      isUUID(refs.second_referee_id) &&
      !usedRefIds.has(refs.second_referee_id)
    ) {
      inserts.push({
        match_id: matchId,
        referee_id: refs.second_referee_id,
        role: "SEGUNDO_ARBITRO",
      });
      usedRefIds.add(refs.second_referee_id);
    }

    if (
      refs.timekeeper_id &&
      isUUID(refs.timekeeper_id) &&
      !usedRefIds.has(refs.timekeeper_id)
    ) {
      inserts.push({
        match_id: matchId,
        referee_id: refs.timekeeper_id,
        role: "CRONOMETRADOR",
      });
    }

    if (inserts.length > 0) {
      await supabase.from("match_referees").insert(inserts);
    }
  } catch (e) {
    console.warn("Notice: could not sync match_referees:", e);
  }
}

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
    const valid = ((data as Match[]) || []).filter((m) => isUUID(m.id));
    return hydrateMatchReferees(valid);
  },

  /**
   * Get a single match by ID
   */
  async getMatchById(id: string): Promise<Match | null> {
    if (!isSupabaseConfigured || !isUUID(id)) return null;
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    if (!data) return null;
    const [hydrated] = await hydrateMatchReferees([data as Match]);
    return hydrated || null;
  },

  /**
   * Create a new match with futsal defaults
   */
  async createMatch(match: MatchInsert): Promise<Match> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    if (!isUUID(match.home_team_id) || !isUUID(match.away_team_id)) {
      throw new Error("Debes seleccionar equipos válidos registrados en Supabase.");
    }

    // Validation: Home and away teams must be different
    if (match.home_team_id === match.away_team_id) {
      const err: any = new Error("El equipo local y visitante no pueden ser el mismo.");
      err.code = "SAME_TEAM";
      throw err;
    }

    const payload = {
      season_id: match.season_id && isUUID(match.season_id) ? match.season_id : null,
      competition_id:
        match.competition_id && isUUID(match.competition_id)
          ? match.competition_id
          : null,
      matchday_id:
        match.matchday_id && isUUID(match.matchday_id) ? match.matchday_id : null,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      venue_id: match.venue_id && isUUID(match.venue_id) ? match.venue_id : null,
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
    const created = data as Match;

    await syncMatchReferees(created.id, {
      main_referee_id: match.main_referee_id,
      second_referee_id: match.second_referee_id,
      timekeeper_id: match.timekeeper_id,
    });

    return {
      ...created,
      main_referee_id: match.main_referee_id || undefined,
      second_referee_id: match.second_referee_id || undefined,
      timekeeper_id: match.timekeeper_id || undefined,
    };
  },

  /**
   * Update an existing match and record updated_at
   */
  async updateMatch(id: string, updates: MatchUpdate): Promise<Match> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");
    if (!isUUID(id)) throw new Error("El identificador del partido no es un UUID válido.");

    if (
      updates.home_team_id &&
      updates.away_team_id &&
      updates.home_team_id === updates.away_team_id
    ) {
      const err: any = new Error("El equipo local y visitante no pueden ser el mismo.");
      err.code = "SAME_TEAM";
      throw err;
    }

    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.season_id !== undefined) {
      dbUpdates.season_id =
        updates.season_id && isUUID(updates.season_id) ? updates.season_id : null;
    }
    if (updates.competition_id !== undefined) {
      dbUpdates.competition_id =
        updates.competition_id && isUUID(updates.competition_id)
          ? updates.competition_id
          : null;
    }
    if (updates.matchday_id !== undefined) {
      dbUpdates.matchday_id =
        updates.matchday_id && isUUID(updates.matchday_id)
          ? updates.matchday_id
          : null;
    }
    if (updates.home_team_id !== undefined) {
      if (!isUUID(updates.home_team_id)) {
        throw new Error("El equipo local seleccionado no es válido.");
      }
      dbUpdates.home_team_id = updates.home_team_id;
    }
    if (updates.away_team_id !== undefined) {
      if (!isUUID(updates.away_team_id)) {
        throw new Error("El equipo visitante seleccionado no es válido.");
      }
      dbUpdates.away_team_id = updates.away_team_id;
    }
    if (updates.venue_id !== undefined) {
      dbUpdates.venue_id =
        updates.venue_id && isUUID(updates.venue_id) ? updates.venue_id : null;
    }
    if (updates.match_date !== undefined) {
      dbUpdates.match_date = updates.match_date;
    }
    if (updates.kickoff_time !== undefined) {
      dbUpdates.kickoff_time = updates.kickoff_time;
    }
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status;
    }
    if (updates.period !== undefined && typeof updates.period === "number") {
      dbUpdates.period = updates.period;
    }
    if (updates.home_score !== undefined) {
      dbUpdates.home_score = updates.home_score;
    }
    if (updates.away_score !== undefined) {
      dbUpdates.away_score = updates.away_score;
    }
    if (updates.home_fouls !== undefined) {
      dbUpdates.home_fouls = updates.home_fouls;
    }
    if (updates.away_fouls !== undefined) {
      dbUpdates.away_fouls = updates.away_fouls;
    }
    if (updates.home_timeouts !== undefined) {
      dbUpdates.home_timeouts = updates.home_timeouts;
    }
    if (updates.away_timeouts !== undefined) {
      dbUpdates.away_timeouts = updates.away_timeouts;
    }
    if (updates.match_clock_seconds !== undefined) {
      dbUpdates.match_clock_seconds = updates.match_clock_seconds;
    }
    if (updates.notes !== undefined) {
      dbUpdates.notes = updates.notes ? updates.notes.trim() : null;
    }

    const { data, error } = await supabase
      .from("matches")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await syncMatchReferees(id, {
      main_referee_id: updates.main_referee_id,
      second_referee_id: updates.second_referee_id,
      timekeeper_id: updates.timekeeper_id,
    });

    const [hydrated] = await hydrateMatchReferees([data as Match]);
    return hydrated || (data as Match);
  },

  /**
   * Start a match (sets status to EN_VIVO)
   */
  async startMatch(id: string): Promise<Match> {
    return this.updateMatch(id, {
      status: "EN_VIVO",
      period: 1,
    });
  },

  /**
   * Cancel a match (sets status to CANCELADO)
   */
  async cancelMatch(id: string, reason?: string): Promise<Match> {
    return this.updateMatch(id, {
      status: "CANCELADO",
      notes: reason ? `Cancelado: ${reason}` : "Partido cancelado",
    });
  },

  /**
   * Checks whether a match already has official information (status EN_VIVO/FINALIZADO,
   * scores > 0, official match events, or linked sanctions) that prevents normal deletion.
   *
   * Auxiliary data on a PROGRAMADO/EN_PREPARACION match (matchday, venue, date/time,
   * match_referees, preliminary match_players, logistics_tasks, or pre-match notes)
   * is NOT considered official data and does not block normal deletion.
   */
  async checkMatchHasOfficialData(
    id: string
  ): Promise<MatchOfficialDataCheckResult> {
    const emptyDiagnostics = {
      status: "PROGRAMADO",
      home_score: 0,
      away_score: 0,
      home_fouls: 0,
      away_fouls: 0,
      official_events_count: 0,
      auxiliary_events_count: 0,
      event_types: [] as string[],
      sanctions_count: 0,
      match_players_count: 0,
      match_referees_count: 0,
      logistics_tasks_count: 0,
    };

    if (!isSupabaseConfigured || !isUUID(id)) {
      return {
        hasOfficialData: false,
        reasons: [],
        diagnostics: emptyDiagnostics,
      };
    }

    const [
      matchRes,
      eventsRes,
      sanctionsRes,
      playersRes,
      refereesRes,
      logisticsRes,
    ] = await Promise.all([
      supabase
        .from("matches")
        .select(
          "id, status, home_score, away_score, home_fouls, away_fouls, home_timeouts, away_timeouts"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("match_events")
        .select("id, event_type")
        .eq("match_id", id),
      supabase
        .from("sanctions")
        .select("id", { count: "exact", head: true })
        .eq("match_id", id),
      supabase
        .from("match_players")
        .select("id", { count: "exact", head: true })
        .eq("match_id", id),
      supabase
        .from("match_referees")
        .select("id", { count: "exact", head: true })
        .eq("match_id", id),
      supabase
        .from("logistics_tasks")
        .select("id", { count: "exact", head: true })
        .eq("match_id", id),
    ]);

    const matchRow = matchRes.data;
    const allEvents = (eventsRes.data as { id: string; event_type: string }[]) || [];
    const officialSet = new Set<string>(OFFICIAL_MATCH_EVENT_TYPES);

    const officialEvents = allEvents.filter((e) => officialSet.has(e.event_type));
    const auxiliaryEvents = allEvents.filter((e) => !officialSet.has(e.event_type));
    const distinctEventTypes = Array.from(
      new Set(allEvents.map((e) => e.event_type))
    );

    const sanctionsCount = sanctionsRes.count ?? 0;
    const matchPlayersCount = playersRes.count ?? 0;
    const matchRefereesCount = refereesRes.count ?? 0;
    const logisticsTasksCount = logisticsRes.count ?? 0;

    const status = matchRow?.status || "PROGRAMADO";
    const homeScore = matchRow?.home_score ?? 0;
    const awayScore = matchRow?.away_score ?? 0;
    const homeFouls = matchRow?.home_fouls ?? 0;
    const awayFouls = matchRow?.away_fouls ?? 0;

    const reasons: string[] = [];

    // 1. Estado oficial iniciado o cerrado (EN_VIVO, DESCANSO, FINALIZADO, SUSPENDIDO, CANCELADO)
    if (status !== "PROGRAMADO" && status !== "EN_PREPARACION") {
      reasons.push(`Estado del partido: ${status}.`);
    }

    // 2. Goles registrados en el marcador oficial
    if (homeScore > 0 || awayScore > 0) {
      reasons.push(
        `Marcador con goles registrados (${homeScore} - ${awayScore}).`
      );
    }

    // 3. Eventos oficiales en match_events (goles, asistencias, tarjetas, faltas, penales)
    if (officialEvents.length > 0) {
      reasons.push(
        `${officialEvents.length} evento(s) oficial(es) en match_events (${distinctEventTypes.join(", ")}).`
      );
    }

    // 4. Sanciones disciplinarias vinculadas en sanctions
    if (sanctionsCount > 0) {
      reasons.push(
        `${sanctionsCount} sanción(es) disciplinaria(s) vinculada(s) en sanctions.`
      );
    }

    const diagnostics = {
      status,
      home_score: homeScore,
      away_score: awayScore,
      home_fouls: homeFouls,
      away_fouls: awayFouls,
      official_events_count: officialEvents.length,
      auxiliary_events_count: auxiliaryEvents.length,
      event_types: distinctEventTypes,
      sanctions_count: sanctionsCount,
      match_players_count: matchPlayersCount,
      match_referees_count: matchRefereesCount,
      logistics_tasks_count: logisticsTasksCount,
    };

    return {
      hasOfficialData: reasons.length > 0,
      reason: reasons[0],
      reasons,
      diagnostics,
    };
  },

  /**
   * Delete match from database (only if PROGRAMADO/EN_PREPARACION and without official data).
   * Auxiliary records (referees, preliminary lineup, logistics tasks, pre-match notes)
   * are cleaned safely before deleting the match.
   */
  async deleteMatch(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");
    if (!isUUID(id)) throw new Error("El identificador del partido no es un UUID válido.");

    const check = await this.checkMatchHasOfficialData(id);
    if (check.hasOfficialData) {
      const err: any = new Error(
        "No se puede eliminar este partido porque ya contiene información oficial."
      );
      err.code = "MATCH_HAS_OFFICIAL_DATA";
      err.reasons = check.reasons;
      err.diagnostics = check.diagnostics;
      throw err;
    }

    // Limpiar datos preliminares/auxiliares (sin eventos oficiales ni sanciones) antes del DELETE
    await Promise.allSettled([
      supabase.from("match_referees").delete().eq("match_id", id),
      supabase.from("match_players").delete().eq("match_id", id),
      supabase.from("logistics_tasks").delete().eq("match_id", id),
      supabase.from("match_events").delete().eq("match_id", id),
    ]);

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * SUPER_ADMIN ONLY: Permanently delete a test match and its related test records
   * via the transactional RPC `public.delete_test_match(p_match_id uuid)`.
   */
  async deleteTestMatch(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");
    if (!isUUID(id)) {
      throw new Error("El identificador del partido no es un UUID válido.");
    }

    const { error } = await supabase.rpc("delete_test_match", {
      p_match_id: id,
    });

    if (error) throw error;
  },
};

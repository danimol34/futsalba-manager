import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { LeagueSettings } from "@/types";
import { initialLeagueSettings } from "@/lib/data/initialData";
import { isUUID } from "@/lib/utils/validators";

/**
 * Mapea una fila de public.league_settings de Supabase al objeto LeagueSettings
 * asegurando consistencia entre los nombres en BD (points_win, max_fouls_per_period)
 * y los nombres usados en TypeScript (points_for_win, max_accumulated_fouls).
 */
export function mapDbToLeagueSettings(
  row: any,
  fallback: LeagueSettings = initialLeagueSettings
): LeagueSettings {
  if (!row) return fallback;

  const pointsWin = row.points_win ?? row.points_for_win ?? fallback.points_for_win;
  const pointsDraw = row.points_draw ?? row.points_draw ?? fallback.points_for_draw;
  const pointsLoss = row.points_loss ?? row.points_for_loss ?? fallback.points_for_loss;
  const periodDuration = row.period_duration_minutes ?? fallback.period_duration_minutes;
  const maxFouls = row.max_fouls_per_period ?? row.max_accumulated_fouls ?? fallback.max_accumulated_fouls;

  // En producción jamás utilizar IDs demo como "season-2026" para Supabase
  const rawSeasonId = row.active_season_id ?? fallback.active_season_id;
  const validSeasonId = isUUID(rawSeasonId) ? rawSeasonId : undefined;

  return {
    id: row.id,
    league_name: row.league_name || fallback.league_name,
    logo_url: row.logo_url ?? fallback.logo_url,
    primary_color: row.primary_color ?? fallback.primary_color,
    secondary_color: row.secondary_color ?? fallback.secondary_color,
    active_season_id: validSeasonId,
    points_for_win: pointsWin,
    points_for_draw: pointsDraw,
    points_for_loss: pointsLoss,
    points_win: pointsWin,
    points_draw: pointsDraw,
    points_loss: pointsLoss,
    period_duration_minutes: periodDuration,
    number_of_periods: row.periods ?? row.number_of_periods ?? fallback.number_of_periods ?? 2,
    periods: row.periods ?? 2,
    match_duration_minutes: row.match_duration_minutes ?? periodDuration * 2,
    max_accumulated_fouls: maxFouls,
    max_fouls_per_period: maxFouls,
    timeouts_per_team_per_period:
      row.timeouts_per_team_per_period ?? fallback.timeouts_per_team_per_period ?? 1,
  };
}

export const settingsService = {
  /**
   * Obtiene la configuración activa de la liga desde public.league_settings.
   * Si no hay registro o falla, retorna null para que el store use el fallback.
   */
  async getLeagueSettings(): Promise<LeagueSettings | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from("league_settings")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Notice: could not fetch league_settings from Supabase:", error.message);
        return null;
      }

      if (!data) return null;
      return mapDbToLeagueSettings(data);
    } catch (err) {
      console.warn("Notice: exception fetching league_settings:", err);
      return null;
    }
  },

  /**
   * Actualiza la configuración de la liga en public.league_settings.
   * Mapea los campos del formulario a las columnas reales de la base de datos.
   */
  async updateLeagueSettings(settings: Partial<LeagueSettings>): Promise<LeagueSettings> {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase no está configurado");
    }

    // 1. Obtener el ID del registro existente en public.league_settings
    const { data: existing, error: fetchErr } = await supabase
      .from("league_settings")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      throw fetchErr;
    }

    // 2. Mapear datos a columnas reales de PostgreSQL
    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (settings.league_name !== undefined) {
      dbPayload.league_name = settings.league_name.trim();
    }

    if (settings.points_for_win !== undefined || settings.points_win !== undefined) {
      const val = Number(settings.points_for_win ?? settings.points_win);
      if (isNaN(val) || val < 1) throw new Error("Los puntos por victoria deben ser al menos 1");
      dbPayload.points_win = val;
    }

    if (settings.points_for_draw !== undefined || settings.points_draw !== undefined) {
      const val = Number(settings.points_for_draw ?? settings.points_draw);
      if (isNaN(val) || val < 0) throw new Error("Los puntos por empate deben ser 0 o mayor");
      dbPayload.points_draw = val;
    }

    if (settings.period_duration_minutes !== undefined) {
      const val = Number(settings.period_duration_minutes);
      if (isNaN(val) || val < 10 || val > 45) {
        throw new Error("La duración de cada tiempo debe estar entre 10 y 45 minutos");
      }
      dbPayload.period_duration_minutes = val;
      dbPayload.match_duration_minutes = val * 2;
    }

    if (settings.max_accumulated_fouls !== undefined || settings.max_fouls_per_period !== undefined) {
      const val = Number(settings.max_accumulated_fouls ?? settings.max_fouls_per_period);
      if (isNaN(val) || val < 3 || val > 10) {
        throw new Error("El límite de faltas acumuladas debe estar entre 3 y 10");
      }
      dbPayload.max_fouls_per_period = val;
    }

    if (settings.logo_url !== undefined) {
      dbPayload.logo_url = settings.logo_url;
    }

    // 3. Ejecutar UPDATE si existe la fila, o INSERT si la tabla estaba vacía
    let resultRow: any = null;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("league_settings")
        .update(dbPayload)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      resultRow = data;
    } else {
      const { data, error } = await supabase
        .from("league_settings")
        .insert({
          league_name: dbPayload.league_name || "FUTSALBA",
          points_win: dbPayload.points_win ?? 3,
          points_draw: dbPayload.points_draw ?? 1,
          points_loss: 0,
          period_duration_minutes: dbPayload.period_duration_minutes ?? 20,
          match_duration_minutes: (dbPayload.period_duration_minutes ?? 20) * 2,
          periods: 2,
          max_fouls_per_period: dbPayload.max_fouls_per_period ?? 5,
          timeouts_per_team_per_period: 1,
        })
        .select()
        .single();

      if (error) throw error;
      resultRow = data;
    }

    return mapDbToLeagueSettings(resultRow);
  },
};

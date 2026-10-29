import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { StandingAdjustment } from "@/types";
import { isUUID } from "@/lib/utils/validators";

export type StandingAdjustmentInsert = {
  team_id: string;
  points_delta: number;
  reason: string;
  competition_id?: string | null;
  season_id?: string | null;
  created_by?: string | null;
  reverses_adjustment_id?: string | null;
};

export const standingsAdjustmentsService = {
  /**
   * Obtener ajustes administrativos.
   * Si es PRENSA, consulta la vista segura 'public_standings_adjustments' (sin UID created_by).
   * Si es Staff/Admin, consulta la tabla base con perfil del autor.
   */
  async getAdjustments(isPrensa = false, seasonId?: string | null): Promise<StandingAdjustment[]> {
    if (!isSupabaseConfigured) return [];
    try {
      if (isPrensa) {
        // Vista segura sin created_by para PRENSA
        let query = supabase
          .from("public_standings_adjustments")
          .select(`
            id,
            team_id,
            competition_id,
            season_id,
            points_delta,
            reason,
            reverses_adjustment_id,
            created_at,
            teams:team_id (id, name, short_name, logo_url)
          `);

        if (seasonId && isUUID(seasonId)) {
          query = query.eq("season_id", seasonId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) {
          let fallbackQuery = supabase
            .from("public_standings_adjustments")
            .select("*");
          if (seasonId && isUUID(seasonId)) {
            fallbackQuery = fallbackQuery.eq("season_id", seasonId);
          }
          const fallback = await fallbackQuery.order("created_at", { ascending: false });
          if (fallback.error) throw fallback.error;
          return (fallback.data as StandingAdjustment[]) || [];
        }

        return (data || []).map((row: any) => ({
          id: row.id,
          team_id: row.team_id,
          team_name: row.teams?.name,
          competition_id: row.competition_id,
          season_id: row.season_id,
          points_delta: row.points_delta,
          reason: row.reason,
          reverses_adjustment_id: row.reverses_adjustment_id || null,
          created_at: row.created_at,
          created_by_name: "Resolución Federativa Oficial",
        }));
      }

      // Consulta con auditoría completa para SUPER_ADMIN, PRESIDENTE, ADMINISTRADOR, MESA_TECNICA
      let query = supabase
        .from("standings_adjustments")
        .select(`
          id,
          team_id,
          competition_id,
          season_id,
          points_delta,
          reason,
          created_by,
          reverses_adjustment_id,
          created_at,
          updated_at,
          teams:team_id (id, name, short_name, logo_url),
          profiles:created_by (id, full_name, email)
        `);

      if (seasonId && isUUID(seasonId)) {
        query = query.eq("season_id", seasonId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        let fallbackQuery = supabase
          .from("standings_adjustments")
          .select("*");
        if (seasonId && isUUID(seasonId)) {
          fallbackQuery = fallbackQuery.eq("season_id", seasonId);
        }
        const fallback = await fallbackQuery.order("created_at", { ascending: false });
        if (fallback.error) throw fallback.error;
        return (fallback.data as StandingAdjustment[]) || [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        team_id: row.team_id,
        team_name: row.teams?.name,
        competition_id: row.competition_id,
        season_id: row.season_id,
        points_delta: row.points_delta,
        reason: row.reason,
        created_by: row.created_by,
        reverses_adjustment_id: row.reverses_adjustment_id || null,
        created_by_name: row.profiles?.full_name || row.profiles?.email || "Administrador",
        created_by_email: row.profiles?.email,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (err: any) {
      console.warn("[standingsAdjustmentsService] Error fetching adjustments:", err?.message || err);
      return [];
    }
  },

  /**
   * Crear un nuevo ajuste manual de puntos en clasificación
   * Requiere rol SUPER_ADMIN, PRESIDENTE o ADMINISTRADOR en Supabase RLS.
   * En producción jamás utilizar IDs demo para season_id, competition_id o team_id.
   */
  async createAdjustment(adj: StandingAdjustmentInsert): Promise<StandingAdjustment> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");
    if (!adj.reason || !adj.reason.trim()) {
      throw new Error("El motivo del ajuste reglamentario es estrictamente obligatorio");
    }
    if (!adj.team_id || !isUUID(adj.team_id)) {
      throw new Error("Debe seleccionar un equipo válido con identificador UUID");
    }
    if (!adj.season_id || !isUUID(adj.season_id)) {
      throw new Error("Debes seleccionar una temporada válida con UUID real antes de registrar el ajuste.");
    }
    if (!adj.competition_id || !isUUID(adj.competition_id)) {
      throw new Error("Debes seleccionar una competición válida con UUID real antes de registrar el ajuste.");
    }
    if (adj.points_delta === 0) {
      throw new Error("El ajuste de puntos debe ser diferente de cero (+/-)");
    }

    const payload = {
      team_id: adj.team_id,
      points_delta: Number(adj.points_delta),
      reason: adj.reason.trim(),
      competition_id: adj.competition_id,
      season_id: adj.season_id,
      created_by: isUUID(adj.created_by) ? adj.created_by : null,
      reverses_adjustment_id: isUUID(adj.reverses_adjustment_id) ? adj.reverses_adjustment_id : null,
    };

    const { data, error } = await supabase
      .from("standings_adjustments")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as StandingAdjustment;
  },

  /**
   * REVERSIÓN INMUTABLE:
   * En lugar de borrar el registro histórico, crea un nuevo registro con el valor inverso (+/-)
   * asociando el `reverses_adjustment_id` para garantizar que no pueda revertirse dos veces.
   */
  async revertAdjustment(
    original: StandingAdjustment,
    reversalReason: string,
    currentUserId?: string | null
  ): Promise<StandingAdjustment> {
    const trimmedReason = reversalReason.trim();
    if (!trimmedReason) {
      throw new Error("El motivo de la reversión es obligatorio para la auditoría inmutable.");
    }
    if (!original.team_id || !isUUID(original.team_id)) {
      throw new Error("El equipo del ajuste original no cuenta con un UUID válido.");
    }

    const inverseDelta = -original.points_delta;

    return this.createAdjustment({
      team_id: original.team_id,
      points_delta: inverseDelta,
      reason: `Reversión: ${trimmedReason} (Ajuste ref: ${original.points_delta > 0 ? `+${original.points_delta}` : original.points_delta} pts)`,
      competition_id: isUUID(original.competition_id) ? original.competition_id : null,
      season_id: isUUID(original.season_id) ? original.season_id : null,
      created_by: isUUID(currentUserId) ? currentUserId : null,
      reverses_adjustment_id: isUUID(original.id) ? original.id : null,
    });
  },
};

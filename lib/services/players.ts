import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Player, PlayerPosition } from "@/types";

export type PlayerInsert = {
  team_id: string;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  document_number: string;
  jersey_number: number;
  position: PlayerPosition;
  photo_url?: string | null;
  status?: boolean | string;
};

export type PlayerUpdate = Partial<PlayerInsert>;

export const playersService = {
  /**
   * Get players, optionally filtered by team ID
   */
  async getPlayers(teamId?: string): Promise<Player[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase.from("players").select("*");

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query.order("jersey_number", { ascending: true });

    if (error) throw error;
    return (data as Player[]) || [];
  },

  /**
   * Get single player by ID
   */
  async getPlayerById(id: string): Promise<Player | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return (data as Player) || null;
  },

  /**
   * Check if a jersey number is already taken in a team
   */
  async isJerseyNumberTaken(teamId: string, jerseyNumber: number, excludePlayerId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    let query = supabase
      .from("players")
      .select("id")
      .eq("team_id", teamId)
      .eq("jersey_number", jerseyNumber);

    if (excludePlayerId) {
      query = query.neq("id", excludePlayerId);
    }

    const { data, error } = await query;
    if (error) return false;
    return Boolean(data && data.length > 0);
  },

  /**
   * Create a new player
   */
  async createPlayer(player: PlayerInsert): Promise<Player> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    // Client pre-check for duplicate jersey number
    const isTaken = await this.isJerseyNumberTaken(player.team_id, player.jersey_number);
    if (isTaken) {
      const err: any = new Error("El dorsal seleccionado ya está utilizado por otro jugador de este equipo.");
      err.code = "23505";
      err.details = "jersey_number";
      throw err;
    }

    const payload = {
      team_id: player.team_id,
      first_name: player.first_name.trim(),
      last_name: player.last_name.trim(),
      birth_date: player.birth_date || null,
      document_number: player.document_number.trim(),
      jersey_number: Number(player.jersey_number),
      position: player.position,
      photo_url: player.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      status: player.status ?? true,
    };

    const { data, error } = await supabase
      .from("players")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Player;
  },

  /**
   * Update an existing player
   */
  async updatePlayer(id: string, updates: PlayerUpdate): Promise<Player> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    if (updates.team_id && updates.jersey_number !== undefined) {
      const isTaken = await this.isJerseyNumberTaken(updates.team_id, updates.jersey_number, id);
      if (isTaken) {
        const err: any = new Error("El dorsal seleccionado ya está utilizado por otro jugador de este equipo.");
        err.code = "23505";
        err.details = "jersey_number";
        throw err;
      }
    }

    const { data, error } = await supabase
      .from("players")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Player;
  },

  /**
   * Toggle player active/inactive status
   */
  async togglePlayerStatus(id: string, currentStatus: boolean | string | undefined): Promise<Player> {
    const newStatus = typeof currentStatus === "boolean" ? !currentStatus : currentStatus !== "ACTIVO";
    return this.updatePlayer(id, { status: newStatus });
  },

  /**
   * Delete player from database
   */
  async deletePlayer(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Upload player photo to Supabase storage bucket 'photos'
   */
  async uploadPhoto(file: File): Promise<string> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const fileExt = file.name.split(".").pop();
    const fileName = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `players/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("photos").getPublicUrl(filePath);
    return data.publicUrl;
  },
};

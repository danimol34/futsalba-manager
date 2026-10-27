import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Venue } from "@/types";

export type VenueInsert = {
  name: string;
  address?: string | null;
  capacity?: number | null;
  surface_type?: string | null;
  status?: boolean | string;
};

export type VenueUpdate = Partial<VenueInsert>;

export const venuesService = {
  async getVenues(): Promise<Venue[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as Venue[]) || [];
  },

  async getVenueById(id: string): Promise<Venue | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return (data as Venue) || null;
  },

  async createVenue(venue: VenueInsert): Promise<Venue> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const payload = {
      name: venue.name.trim(),
      address: venue.address?.trim() || null,
      capacity: venue.capacity ? Number(venue.capacity) : 0,
      surface_type: venue.surface_type || "PARQUET",
      status: venue.status ?? true,
    };

    const { data, error } = await supabase
      .from("venues")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Venue;
  },

  async updateVenue(id: string, updates: VenueUpdate): Promise<Venue> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { data, error } = await supabase
      .from("venues")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Venue;
  },

  async toggleVenueStatus(id: string, currentStatus: boolean | string | undefined): Promise<Venue> {
    const newStatus = typeof currentStatus === "boolean" ? !currentStatus : currentStatus !== "ACTIVO";
    return this.updateVenue(id, { status: newStatus });
  },

  async deleteVenue(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");

    const { error } = await supabase
      .from("venues")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

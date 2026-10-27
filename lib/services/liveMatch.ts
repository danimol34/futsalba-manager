import { supabase } from '../supabase/client';
import { MatchStatus, MatchEventType } from '@/types';

export const liveMatchService = {
  async registerEvent(params: {
    match_id: string;
    team_id: string;
    player_id?: string;
    secondary_player_id?: string;
    event_type: MatchEventType;
    period: number | string;
    minute: number;
    second: number;
    notes?: string;
    client_event_id?: string;
  }) {
    let periodNum = 1;
    if (typeof params.period === "number") periodNum = params.period;
    else if (params.period === "SEGUNDO_TIEMPO") periodNum = 2;
    
    const { data, error } = await supabase.rpc('register_match_event', {
      p_match_id: params.match_id,
      p_team_id: params.team_id,
      p_player_id: params.player_id || null,
      p_secondary_player_id: params.secondary_player_id || null,
      p_event_type: params.event_type,
      p_period: periodNum,
      p_minute: params.minute,
      p_second: params.second,
      p_notes: params.notes || null,
      p_client_event_id: params.client_event_id || null,
    });

    if (error) throw error;
    return data as any;
  },

  async deleteEvent(eventId: string) {
    const { data, error } = await supabase.rpc('delete_match_event', {
      p_event_id: eventId,
    });

    if (error) throw error;
    return data as any;
  },

  async changeMatchStatus(matchId: string, status: MatchStatus, period?: number) {
    const { data, error } = await supabase.rpc('change_match_status', {
      p_match_id: matchId,
      p_status: status,
      p_period: period || null,
    });

    if (error) throw error;
    return data;
  },

  async updateClock(matchId: string, status: 'PAUSED' | 'RUNNING', clockSeconds: number) {
    const { data, error } = await supabase.rpc('update_match_clock', {
      p_match_id: matchId,
      p_clock_status: status,
      p_manual_override_seconds: clockSeconds,
    });

    if (error) throw error;
    return data as any;
  },
};

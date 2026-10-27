import { supabase } from '../supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export const realtimeService = {
  subscribeToMatch(
    matchId: string,
    onUpdate: (payload: any) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`match_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();
    return channel;
  },

  subscribeToMatchEvents(
    matchId: string,
    onUpdate: (payload: any) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`match_events_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();
    return channel;
  },

  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  },
};

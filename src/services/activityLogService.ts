import { supabase } from '../lib/supabase';

export interface LogActivityParams {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description?: string;
  metadata?: Record<string, any>;
  userId?: string | null;
}

export const activityLogService = {
  /**
   * Records an admin action in public.activity_logs
   */
  async log(params: LogActivityParams) {
    try {
      let currentUserId = params.userId;
      if (!currentUserId) {
        const { data } = await supabase.auth.getUser();
        currentUserId = data?.user?.id || null;
      }

      const { error } = await supabase.from('activity_logs').insert([
        {
          user_id: currentUserId,
          action: params.action,
          entity_type: params.entity_type,
          entity_id: params.entity_id || null,
          description: params.description || null,
          metadata: params.metadata || {},
        },
      ]);

      if (error) {
        console.warn('Could not record activity log:', error.message);
      }
    } catch (err: any) {
      console.warn('Activity logging error:', err?.message);
    }
  },
};

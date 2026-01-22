import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export interface SettingsAuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  admin_email?: string;
}

// Helper to safely parse Json to Record
function parseJsonToRecord(data: Json | null): Record<string, unknown> | null {
  if (!data) return null;
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return null;
}

export const useSettingsAuditLogs = (limit: number = 20) => {
  const { user, session } = useAuth();

  const logsQuery = useQuery({
    queryKey: ['settings-audit-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', 'platform_settings')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching settings audit logs:', error);
        throw error;
      }

      // Fetch admin emails for display
      const adminIds = [...new Set(data?.map(log => log.user_id).filter(Boolean))];
      let adminEmails: Record<string, string> = {};
      
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', adminIds);
        
        profiles?.forEach(p => {
          if (p.email) adminEmails[p.user_id] = p.email;
        });
      }

      return (data || []).map(log => ({
        id: log.id,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        user_id: log.user_id,
        old_data: parseJsonToRecord(log.old_data),
        new_data: parseJsonToRecord(log.new_data),
        created_at: log.created_at,
        admin_email: log.user_id ? adminEmails[log.user_id] : undefined,
      })) as SettingsAuditLog[];
    },
    enabled: user?.role === 'admin' && !!session,
  });

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    refetch: logsQuery.refetch,
  };
};

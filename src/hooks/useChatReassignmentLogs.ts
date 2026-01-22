import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChatReassignmentLog {
  id: string;
  session_id: string | null;
  from_agent_id: string | null;
  to_agent_id: string | null;
  reason: string | null;
  created_at: string;
  from_agent_profile?: {
    name: string;
    email: string;
  };
  to_agent_profile?: {
    name: string;
    email: string;
  };
}

export const useChatReassignmentLogs = (limit = 50) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['chat-reassignment-logs', limit],
    queryFn: async () => {
      // First get the logs
      const { data: logsData, error: logsError } = await supabase
        .from('chat_reassignment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (logsError) throw logsError;

      // Get unique agent IDs for profile lookup
      const agentIds = new Set<string>();
      logsData?.forEach(log => {
        if (log.from_agent_id) agentIds.add(log.from_agent_id);
        if (log.to_agent_id) agentIds.add(log.to_agent_id);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', Array.from(agentIds));

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, { name: p.name || '', email: p.email || '' }])
      );

      // Map logs with profile data
      return logsData?.map(log => ({
        id: log.id,
        session_id: log.session_id,
        from_agent_id: log.from_agent_id,
        to_agent_id: log.to_agent_id,
        reason: log.reason,
        created_at: log.created_at,
        from_agent_profile: log.from_agent_id ? profileMap.get(log.from_agent_id) : undefined,
        to_agent_profile: log.to_agent_id ? profileMap.get(log.to_agent_id) : undefined,
      })) as ChatReassignmentLog[];
    },
  });

  return {
    logs,
    isLoading,
  };
};

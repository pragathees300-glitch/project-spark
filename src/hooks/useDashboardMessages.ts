import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardMessage {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  target_role: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  // Aliased properties for component compatibility
  message_type: string;
  is_enabled: boolean;
  show_to_admins: boolean;
  show_to_users: boolean;
  expires_at: string | null;
  target_type: 'all' | 'specific_users' | 'by_role';
  target_roles: string[];
  target_user_ids: string[];
  priority: number;
}

export const useDashboardMessages = (isAdmin: boolean = false) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['dashboard-messages', isAdmin, user?.id],
    queryFn: async () => {
      if (isAdmin) {
        // Admin fetches all messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('dashboard_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;
        
        // Map database fields to component-expected fields
        return (messagesData || []).map(msg => ({
          ...msg,
          message_type: msg.type || 'info',
          is_enabled: msg.is_active,
          show_to_admins: msg.target_role === 'all' || msg.target_role === 'admin',
          show_to_users: msg.target_role === 'all' || msg.target_role === 'user',
          expires_at: msg.ends_at,
          target_type: 'all' as const,
          target_roles: msg.target_role ? [msg.target_role] : [],
          target_user_ids: [],
          priority: 0,
        })) as DashboardMessage[];
      } else {
        // Users fetch only active messages targeted to them
        const currentUserId = user?.id;
        if (!currentUserId) return [];

        // Get user's role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUserId)
          .single();

        const userRole = roleData?.role || 'user';

        // Fetch active messages
        const now = new Date().toISOString();
        const { data: messagesData, error: messagesError } = await supabase
          .from('dashboard_messages')
          .select('*')
          .eq('is_active', true)
          .or(`target_role.eq.all,target_role.eq.${userRole}`)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gte.${now}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;
        
        // Map database fields to component-expected fields
        return (messagesData || []).map(msg => ({
          ...msg,
          message_type: msg.type || 'info',
          is_enabled: msg.is_active,
          show_to_admins: msg.target_role === 'all' || msg.target_role === 'admin',
          show_to_users: msg.target_role === 'all' || msg.target_role === 'user',
          expires_at: msg.ends_at,
          target_type: 'all' as const,
          target_roles: msg.target_role ? [msg.target_role] : [],
          target_user_ids: [],
          priority: 0,
        })) as DashboardMessage[];
      }
    },
    enabled: isAdmin || !!user?.id,
  });

  const createMessage = useMutation({
    mutationFn: async (newMessage: Partial<DashboardMessage> & { 
      title: string;
      message: string;
    }) => {
      // Determine target_role from component fields
      let targetRole = 'all';
      if (newMessage.show_to_admins && !newMessage.show_to_users) {
        targetRole = 'admin';
      } else if (newMessage.show_to_users && !newMessage.show_to_admins) {
        targetRole = 'user';
      }
      
      const { data: createdMessage, error: messageError } = await supabase
        .from('dashboard_messages')
        .insert([{
          title: newMessage.title,
          message: newMessage.message,
          type: newMessage.message_type || newMessage.type || 'info',
          is_active: newMessage.is_enabled ?? newMessage.is_active ?? true,
          target_role: targetRole,
          starts_at: newMessage.starts_at,
          ends_at: newMessage.expires_at || newMessage.ends_at,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (messageError) throw messageError;
      return createdMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-messages'] });
      toast({ title: 'Message created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create message', description: error.message, variant: 'destructive' });
    },
  });

  const updateMessage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DashboardMessage> & { id: string }) => {
      // Map component fields to database fields
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.message !== undefined) dbUpdates.message = updates.message;
      if (updates.message_type !== undefined) dbUpdates.type = updates.message_type;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.is_enabled !== undefined) dbUpdates.is_active = updates.is_enabled;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.starts_at !== undefined) dbUpdates.starts_at = updates.starts_at;
      if (updates.expires_at !== undefined) dbUpdates.ends_at = updates.expires_at;
      if (updates.ends_at !== undefined) dbUpdates.ends_at = updates.ends_at;
      
      // Determine target_role from show_to fields
      if (updates.show_to_admins !== undefined || updates.show_to_users !== undefined) {
        if (updates.show_to_admins && !updates.show_to_users) {
          dbUpdates.target_role = 'admin';
        } else if (updates.show_to_users && !updates.show_to_admins) {
          dbUpdates.target_role = 'user';
        } else {
          dbUpdates.target_role = 'all';
        }
      }
      
      const { data, error } = await supabase
        .from('dashboard_messages')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-messages'] });
      toast({ title: 'Message updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update message', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dashboard_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-messages'] });
      toast({ title: 'Message deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete message', description: error.message, variant: 'destructive' });
    },
  });

  return {
    messages,
    isLoading,
    refetch,
    createMessage,
    updateMessage,
    deleteMessage,
  };
};

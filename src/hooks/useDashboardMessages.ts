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
        return messagesData as DashboardMessage[];
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
        return messagesData as DashboardMessage[];
      }
    },
    enabled: isAdmin || !!user?.id,
  });

  const createMessage = useMutation({
    mutationFn: async (newMessage: Omit<Partial<DashboardMessage>, 'id' | 'created_at'> & { 
      title: string;
      message: string;
    }) => {
      const { data: createdMessage, error: messageError } = await supabase
        .from('dashboard_messages')
        .insert([{
          title: newMessage.title,
          message: newMessage.message,
          type: newMessage.type || 'info',
          is_active: newMessage.is_active ?? true,
          target_role: newMessage.target_role || 'all',
          starts_at: newMessage.starts_at,
          ends_at: newMessage.ends_at,
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
      const { data, error } = await supabase
        .from('dashboard_messages')
        .update(updates)
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

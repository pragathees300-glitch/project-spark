import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PopupMessage {
  id: string;
  title: string;
  content: string;
  message: string | null;
  message_type: string | null;
  type: string | null;
  target_type: string | null;
  target_roles: string[] | null;
  target_role: string | null;
  target_user_ids: string[] | null;
  is_enabled: boolean | null;
  is_active: boolean | null;
  is_blocking: boolean | null;
  priority: number | null;
  starts_at: string | null;
  expires_at: string | null;
  re_acknowledgment_mode: string | null;
  re_ack_period_days: number | null;
  require_acknowledgment: boolean | null;
  show_once_per_session: boolean | null;
  version: number | null;
  acknowledgment_count: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PopupAcknowledgment {
  id: string;
  popup_id: string;
  user_id: string;
  session_id: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export function usePopupMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  // Fetch all popup messages (admin) or user-targeted messages (user)
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['popup-messages', user?.id, isAdmin],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const userRole = roleData?.role || 'user';

      // Fetch all messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('popup_messages')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // For admins, return all messages
      if (isAdmin) {
        return (messagesData || []).map(msg => ({
          ...msg,
          is_enabled: msg.is_active ?? msg.is_enabled ?? true,
          message_type: msg.type || msg.message_type || 'info',
        })) as PopupMessage[];
      }

      // For users, filter based on targeting rules
      const now = new Date();
      const filtered = (messagesData || []).filter(msg => {
        if (!(msg.is_active ?? msg.is_enabled)) return false;
        
        // Check time constraints
        if (msg.starts_at && new Date(msg.starts_at) > now) return false;
        if (msg.expires_at && new Date(msg.expires_at) < now) return false;

        // Check targeting
        const targetType = msg.target_type || 'all';
        if (targetType === 'all') return true;
        if (targetType === 'specific_users') {
          return msg.target_user_ids?.includes(user.id);
        }
        if (targetType === 'by_role') {
          const roles = msg.target_roles || (msg.target_role ? [msg.target_role] : []);
          return roles.includes(userRole);
        }
        return false;
      });

      return filtered.map(msg => ({
        ...msg,
        is_enabled: msg.is_active ?? msg.is_enabled ?? true,
        message_type: msg.type || msg.message_type || 'info',
      })) as PopupMessage[];
    },
    enabled: !!user?.id
  });

  // Fetch user's acknowledgments
  const { data: acknowledgments = [] } = useQuery({
    queryKey: ['popup-acknowledgments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('popup_acknowledgments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []) as PopupAcknowledgment[];
    },
    enabled: !!user?.id
  });

  // Get unacknowledged messages for the user
  const unacknowledgedMessages = messages.filter(msg => {
    if (isAdmin) return false; // Don't show popups to admins
    
    const ack = acknowledgments.find(a => a.popup_id === msg.id);
    
    if (!ack) return true; // Never acknowledged
    
    // Check re-acknowledgment mode
    const reAckMode = msg.re_acknowledgment_mode || 'once';
    if (reAckMode === 'once') {
      return false; // Already acknowledged once
    }
    
    if (reAckMode === 'on_update') {
      // We don't have message_version in acknowledgments, so just check if ack exists
      return false;
    }
    
    if (reAckMode === 'periodic' && msg.re_ack_period_days) {
      const ackDate = new Date(ack.acknowledged_at || ack.created_at);
      const periodMs = msg.re_ack_period_days * 24 * 60 * 60 * 1000;
      return new Date().getTime() - ackDate.getTime() > periodMs;
    }
    
    return false;
  });

  // Acknowledge a message
  const acknowledgeMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('popup_acknowledgments')
        .upsert({
          popup_id: messageId,
          user_id: user.id,
          acknowledged_at: new Date().toISOString()
        }, {
          onConflict: 'popup_id,user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup-acknowledgments'] });
    },
    onError: (error) => {
      console.error('Failed to acknowledge message:', error);
      toast.error('Failed to acknowledge message');
    }
  });

  // Create a new popup message (admin)
  const createMutation = useMutation({
    mutationFn: async (data: Partial<PopupMessage> & { target_user_ids?: string[] }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { target_user_ids, ...messageData } = data;

      const { data: newMessage, error } = await supabase
        .from('popup_messages')
        .insert([{
          title: messageData.title || 'Announcement',
          content: messageData.content || messageData.message || '',
          message: messageData.message,
          type: messageData.message_type || messageData.type || 'info',
          message_type: messageData.message_type,
          target_type: messageData.target_type,
          target_roles: messageData.target_roles,
          target_role: messageData.target_roles?.[0] || null,
          target_user_ids: target_user_ids,
          is_active: messageData.is_enabled ?? true,
          is_enabled: messageData.is_enabled ?? true,
          is_blocking: messageData.is_blocking ?? false,
          priority: messageData.priority || 0,
          starts_at: messageData.starts_at,
          expires_at: messageData.expires_at,
          re_acknowledgment_mode: messageData.re_acknowledgment_mode || 'once',
          re_ack_period_days: messageData.re_ack_period_days,
          require_acknowledgment: messageData.require_acknowledgment ?? false,
          show_once_per_session: messageData.show_once_per_session ?? false,
          version: messageData.version || 1,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      return newMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup-messages'] });
      toast.success('Popup message created');
    },
    onError: (error) => {
      console.error('Failed to create popup message:', error);
      toast.error('Failed to create popup message');
    }
  });

  // Update a popup message (admin)
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PopupMessage> & { id: string; target_user_ids?: string[] }) => {
      const { target_user_ids, ...messageData } = data;

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      if (messageData.title !== undefined) updateData.title = messageData.title;
      if (messageData.content !== undefined) updateData.content = messageData.content;
      if (messageData.message !== undefined) updateData.message = messageData.message;
      if (messageData.message_type !== undefined) {
        updateData.type = messageData.message_type;
        updateData.message_type = messageData.message_type;
      }
      if (messageData.target_type !== undefined) updateData.target_type = messageData.target_type;
      if (messageData.target_roles !== undefined) {
        updateData.target_roles = messageData.target_roles;
        updateData.target_role = messageData.target_roles?.[0] || null;
      }
      if (target_user_ids !== undefined) updateData.target_user_ids = target_user_ids;
      if (messageData.is_enabled !== undefined) {
        updateData.is_active = messageData.is_enabled;
        updateData.is_enabled = messageData.is_enabled;
      }
      if (messageData.is_blocking !== undefined) updateData.is_blocking = messageData.is_blocking;
      if (messageData.priority !== undefined) updateData.priority = messageData.priority;
      if (messageData.starts_at !== undefined) updateData.starts_at = messageData.starts_at;
      if (messageData.expires_at !== undefined) updateData.expires_at = messageData.expires_at;
      if (messageData.re_acknowledgment_mode !== undefined) updateData.re_acknowledgment_mode = messageData.re_acknowledgment_mode;
      if (messageData.re_ack_period_days !== undefined) updateData.re_ack_period_days = messageData.re_ack_period_days;
      if (messageData.require_acknowledgment !== undefined) updateData.require_acknowledgment = messageData.require_acknowledgment;
      if (messageData.show_once_per_session !== undefined) updateData.show_once_per_session = messageData.show_once_per_session;
      if (messageData.version !== undefined) updateData.version = messageData.version;

      const { error } = await supabase
        .from('popup_messages')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup-messages'] });
      toast.success('Popup message updated');
    },
    onError: (error) => {
      console.error('Failed to update popup message:', error);
      toast.error('Failed to update popup message');
    }
  });

  // Delete a popup message (admin)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('popup_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup-messages'] });
      toast.success('Popup message deleted');
    },
    onError: (error) => {
      console.error('Failed to delete popup message:', error);
      toast.error('Failed to delete popup message');
    }
  });

  return {
    messages,
    unacknowledgedMessages,
    acknowledgments,
    isLoading,
    refetch,
    acknowledge: acknowledgeMutation.mutate,
    createMessage: createMutation.mutate,
    updateMessage: updateMutation.mutate,
    deleteMessage: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

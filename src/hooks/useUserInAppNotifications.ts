import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface UserNotification {
  id: string;
  user_id: string;
  type: string | null;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean | null;
  created_at: string;
}

export function useUserInAppNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['user-in-app-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as UserNotification[];
    },
    enabled: !!user?.id && user?.role === 'user',
  });

  const unreadCountQuery = useQuery({
    queryKey: ['user-in-app-notifications-unread', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && user?.role === 'user',
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications-unread'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications-unread'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications-unread'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications-unread'] });
    },
  });

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user?.id || user?.role !== 'user') return;

    const channel = supabase
      .channel('user-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['user-in-app-notifications-unread'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role, queryClient]);

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    unreadCount: unreadCountQuery.data || 0,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    clearAll: clearAllMutation.mutate,
    isClearing: clearAllMutation.isPending,
  };
}

// Helper function to create a notification (used in hooks)
// Updated signature to match callers that pass entityType and entityId
export async function createUserNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  _entityType?: string, // Not stored in DB but accepted for compatibility
  _entityId?: string    // Not stored in DB but accepted for compatibility
) {
  try {
    const { error } = await supabase.from('user_notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      action_url: _entityId ? `/${_entityType}/${_entityId}` : null,
    });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

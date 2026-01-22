import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

export interface OrderChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  // Aliased properties for component compatibility
  sender_type: 'user' | 'customer' | 'system';
  sender_user_id: string | null;
  admin_id: string | null;
}

export const useOrderChat = (orderId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settingsMap } = usePlatformSettings();

  // Fetch messages for the order
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['order-chat-messages', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('order_chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map database fields to expected interface
      return (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_role === 'admin' ? 'customer' : 'user',
        sender_user_id: msg.sender_id,
        admin_id: msg.sender_role === 'admin' ? msg.sender_id : null,
      })) as OrderChatMessage[];
    },
    enabled: !!orderId && !!user?.id,
  });

  // Fetch assigned customer name for the order
  const { data: customerName, isLoading: isLoadingCustomerName } = useQuery({
    queryKey: ['order-customer-name', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      // Get from chat_customer_names using order info
      const { data: order } = await supabase
        .from('orders')
        .select('dropshipper_user_id')
        .eq('id', orderId)
        .single();

      if (!order) return null;

      const { data, error } = await supabase
        .from('chat_customer_names')
        .select('indian_name')
        .eq('user_id', order.dropshipper_user_id)
        .maybeSingle();

      if (error) throw error;
      return data?.indian_name || null;
    },
    enabled: !!orderId && !!user?.id,
  });

  // Send message as user
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!orderId || !user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('order_chat_messages')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          sender_role: 'user',
          message,
        })
        .select()
        .single();

      if (error) throw error;

      // Get order info and user profile for email notification
      const [orderRes, profileRes] = await Promise.all([
        supabase.from('orders').select('order_number').eq('id', orderId).single(),
        supabase.from('profiles').select('name, email').eq('user_id', user.id).single(),
      ]);

      // Send email notification to admin
      if (orderRes.data && profileRes.data) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'order_chat_to_admin',
              orderNumber: orderRes.data.order_number,
              userName: profileRes.data.name,
              userEmail: profileRes.data.email,
              message: message.substring(0, 500),
            },
          });
        } catch (e) {
          console.error('Email notification failed:', e);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-chat-messages', orderId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!orderId) return;

      const { error } = await supabase
        .from('order_chat_messages')
        .update({ is_read: true })
        .eq('order_id', orderId)
        .eq('sender_role', 'admin')
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-chat-messages', orderId] });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!orderId || !user?.id) return;

    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['order-chat-messages', orderId] });
          
          const newMessage = payload.new as any;
          if (newMessage.sender_role === 'admin') {
            // Play sound if enabled
            if (settingsMap.notification_sound_enabled) {
              const notificationSound = new Audio('/notification.mp3');
              notificationSound.volume = (settingsMap.notification_sound_volume || 50) / 100;
              notificationSound.play().catch(() => {});
            }
            
            if (Notification.permission === 'granted') {
              new Notification('New message from customer', {
                body: newMessage.message.substring(0, 100),
                icon: '/favicon.ico',
                tag: `order-chat-${orderId}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user?.id, queryClient, settingsMap.notification_sound_enabled, settingsMap.notification_sound_volume]);

  const unreadCount = messages.filter(
    (m) => m.sender_role === 'admin' && !m.is_read
  ).length;

  return {
    messages,
    isLoadingMessages,
    customerName: customerName || 'Customer',
    isLoadingCustomerName,
    unreadCount,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    assignCustomerName: () => {}, // No-op for compatibility
  };
};

// Admin hook for order chat
export const useAdminOrderChat = (orderId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settingsMap } = usePlatformSettings();

  // Fetch messages for the order
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['order-chat-messages', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('order_chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map database fields to expected interface
      return (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_role === 'admin' ? 'customer' : 'user',
        sender_user_id: msg.sender_id,
        admin_id: msg.sender_role === 'admin' ? msg.sender_id : null,
      })) as OrderChatMessage[];
    },
    enabled: !!orderId && !!user?.id,
  });

  // Fetch assigned customer name
  const { data: customerName } = useQuery({
    queryKey: ['order-customer-name', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      // Get from chat_customer_names using order info
      const { data: order } = await supabase
        .from('orders')
        .select('dropshipper_user_id')
        .eq('id', orderId)
        .single();

      if (!order) return null;

      const { data, error } = await supabase
        .from('chat_customer_names')
        .select('indian_name')
        .eq('user_id', order.dropshipper_user_id)
        .maybeSingle();

      if (error) throw error;
      return data?.indian_name || null;
    },
    enabled: !!orderId && !!user?.id,
  });

  // Fetch dropshipper user info
  const { data: dropshipperInfo } = useQuery({
    queryKey: ['order-dropshipper-info', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      // Get order to find dropshipper_user_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('dropshipper_user_id')
        .eq('id', orderId)
        .single();

      if (orderError || !order) return null;

      // Get profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, email, phone')
        .eq('user_id', order.dropshipper_user_id)
        .single();

      return {
        name: profileData?.name || 'Unknown',
        email: profileData?.email || '',
        mobileNumber: profileData?.phone || null,
        kycName: null,
      };
    },
    enabled: !!orderId && !!user?.id,
  });

  // Send message as customer (impersonation)
  const sendAsCustomerMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!orderId || !user?.id) throw new Error('Not authenticated');

      // Insert the message
      const { data, error } = await supabase
        .from('order_chat_messages')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          sender_role: 'admin',
          message,
        })
        .select()
        .single();

      if (error) throw error;

      // Get order and dropshipper info for email notification
      const { data: orderData } = await supabase
        .from('orders')
        .select('order_number, dropshipper_user_id')
        .eq('id', orderId)
        .single();

      if (orderData) {
        const { data: dropshipperProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('user_id', orderData.dropshipper_user_id)
          .single();

        // Send email notification to dropshipper
        if (dropshipperProfile) {
          try {
            await supabase.functions.invoke('send-notification-email', {
              body: {
                type: 'order_chat_to_user',
                orderNumber: orderData.order_number,
                userName: dropshipperProfile.name,
                recipientEmail: dropshipperProfile.email,
                message: message.substring(0, 500),
              },
            });
          } catch (e) {
            console.error('Email notification failed:', e);
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-chat-messages', orderId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!orderId || !user?.id) return;

    const channel = supabase
      .channel(`admin-order-chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['order-chat-messages', orderId] });
          
          const newMessage = payload.new as any;
          if (newMessage.sender_role === 'user') {
            // Play sound if enabled
            if (settingsMap.notification_sound_enabled) {
              const notificationSound = new Audio('/notification.mp3');
              notificationSound.volume = (settingsMap.notification_sound_volume || 50) / 100;
              notificationSound.play().catch(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user?.id, queryClient, settingsMap.notification_sound_enabled, settingsMap.notification_sound_volume]);

  return {
    messages,
    isLoadingMessages,
    customerName: customerName || 'Customer',
    dropshipperInfo,
    sendAsCustomer: sendAsCustomerMutation.mutate,
    isSending: sendAsCustomerMutation.isPending,
  };
};

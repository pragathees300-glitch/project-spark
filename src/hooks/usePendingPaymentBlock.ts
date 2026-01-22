import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export interface PendingPaymentBlockSettings {
  enabled: boolean;
  title: string;
  message: string;
  showOrderCount: boolean;
  showViewOrdersLink: boolean;
}

const DEFAULT_SETTINGS: PendingPaymentBlockSettings = {
  enabled: true,
  title: 'Payout Not Available',
  message: 'You currently have pending payments for one or more orders.\nPlease complete or resolve these payments before requesting a payout.',
  showOrderCount: true,
  showViewOrdersLink: true,
};

// Helper to safely parse JSON settings
function parseJsonSettings(value: Json | null | undefined): PendingPaymentBlockSettings {
  if (!value) return DEFAULT_SETTINGS;
  
  if (typeof value === 'string') {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(value) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    return { ...DEFAULT_SETTINGS, ...value } as PendingPaymentBlockSettings;
  }
  
  return DEFAULT_SETTINGS;
}

export function usePendingPaymentBlock() {
  const { user } = useAuth();

  // Fetch pending payment orders count
  const { data: pendingOrdersData, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['pending-payment-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0, orders: [] };

      const { data, error, count } = await supabase
        .from('orders')
        .select('id, order_number, selling_price, quantity, created_at', { count: 'exact' })
        .eq('dropshipper_user_id', user.id)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending orders:', error);
        throw error;
      }

      return {
        count: count || 0,
        orders: data || []
      };
    },
    enabled: !!user?.id && user.role === 'user',
  });

  // Fetch admin settings for this feature
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['pending-payment-block-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'pending_payment_block_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching pending payment block settings:', error);
        throw error;
      }

      return parseJsonSettings(data?.value);
    },
    enabled: !!user?.id,
  });

  const pendingCount = pendingOrdersData?.count || 0;
  const pendingOrders = pendingOrdersData?.orders || [];
  const hasPendingPayments = pendingCount > 0;
  const isBlocked = settings?.enabled && hasPendingPayments;

  return {
    pendingCount,
    pendingOrders,
    hasPendingPayments,
    isBlocked,
    settings: settings || DEFAULT_SETTINGS,
    isLoading: isLoadingOrders || isLoadingSettings,
    refetch: refetchOrders,
  };
}

// Admin hook for managing settings
export function usePendingPaymentBlockAdmin() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['pending-payment-block-settings-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'pending_payment_block_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return parseJsonSettings(data?.value);
    },
    enabled: isAdmin,
  });

  const updateSettings = async (newSettings: PendingPaymentBlockSettings) => {
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        key: 'pending_payment_block_settings',
        value: newSettings as unknown as Json,
        description: 'Settings for blocking payout requests when user has pending order payments',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key'
      });

    if (error) throw error;
    refetch();
  };

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings,
    refetch,
  };
}

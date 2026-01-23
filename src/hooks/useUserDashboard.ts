import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardOrder {
  id: string;
  order_number: string;
  storefront_product_id: string;
  dropshipper_user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string;
  quantity: number;
  selling_price: number;
  base_price: number;
  status: 'pending_payment' | 'paid_by_user' | 'processing' | 'completed' | 'cancelled' | 'postpaid_pending';
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  payment_link: string | null;
  payment_link_updated_at: string | null;
  payment_link_clicked_at: string | null;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    base_price: number;
  } | null;
}

export interface UserStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  paidAmount: number;
}

// Interface for masked order data from RPC
interface MaskedOrder {
  id: string;
  order_number: string;
  status: 'pending_payment' | 'paid_by_user' | 'processing' | 'completed' | 'cancelled' | 'postpaid_pending';
  quantity: number;
  selling_price: number;
  base_price: number;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  completed_at: string | null;
  payment_link: string | null;
  payment_link_clicked_at: string | null;
  storefront_product_id: string;
  dropshipper_user_id: string;
  customer_name_masked: string;
  customer_email_masked: string;
  customer_phone_masked: string | null;
  customer_address_masked: string;
}

export const useUserDashboard = () => {
  const { user, session } = useAuth();

  const ordersQuery = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch orders directly from the orders table
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          storefront_product_id,
          dropshipper_user_id,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          quantity,
          selling_price,
          base_price,
          status,
          created_at,
          updated_at,
          paid_at,
          completed_at,
          payment_link,
          payment_link_clicked_at,
          storefront_products!storefront_product_id(
            id,
            product_id,
            products!product_id(
              id,
              name,
              image_url,
              base_price
            )
          )
        `)
        .eq('dropshipper_user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Transform data to match expected format
      return (ordersData || []).map((order: any): DashboardOrder => {
        const storefrontProduct = order.storefront_products;
        const product = storefrontProduct?.products;
        return {
          id: order.id,
          order_number: order.order_number,
          storefront_product_id: order.storefront_product_id,
          dropshipper_user_id: order.dropshipper_user_id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          quantity: order.quantity,
          selling_price: Number(order.selling_price),
          base_price: Number(order.base_price),
          status: order.status,
          created_at: order.created_at,
          paid_at: order.paid_at,
          completed_at: order.completed_at,
          payment_link: order.payment_link,
          payment_link_updated_at: order.updated_at,
          payment_link_clicked_at: order.payment_link_clicked_at,
          product: product ? {
            id: product.id,
            name: product.name,
            image_url: product.image_url,
            base_price: Number(product.base_price),
          } : null,
        };
      });
    },
    enabled: !!user?.id && !!session,
  });
  const profileQuery = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!session,
  });

  const transactionsQuery = useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      return (data || []).map(tx => ({
        id: tx.id,
        user_id: tx.user_id,
        amount: Number(tx.amount),
        type: tx.type,
        description: tx.description,
        order_id: tx.order_id,
        created_at: tx.created_at,
      }));
    },
    enabled: !!user?.id && !!session,
  });

  const storefrontProductsQuery = useQuery({
    queryKey: ['user-storefront-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('storefront_products')
        .select(`
          *,
          products(*)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching storefront products:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id && !!session,
  });

  // Calculate stats from orders
  const stats: UserStats = {
    totalOrders: ordersQuery.data?.length || 0,
    pendingOrders: ordersQuery.data?.filter(o => o.status === 'pending_payment').length || 0,
    completedOrders: ordersQuery.data?.filter(o => o.status === 'completed').length || 0,
    totalRevenue: ordersQuery.data?.reduce((sum, o) => {
      if (o.status === 'completed') {
        return sum + ((o.selling_price - o.base_price) * o.quantity);
      }
      return sum;
    }, 0) || 0,
    pendingPayments: ordersQuery.data?.reduce((sum, o) => {
      if (o.status === 'pending_payment') {
        return sum + (o.base_price * o.quantity);
      }
      return sum;
    }, 0) || 0,
    paidAmount: ordersQuery.data?.reduce((sum, o) => {
      if (['paid_by_user', 'processing', 'completed'].includes(o.status)) {
        return sum + (o.base_price * o.quantity);
      }
      return sum;
    }, 0) || 0,
  };

  return {
    orders: ordersQuery.data || [],
    recentOrders: (ordersQuery.data || []).slice(0, 5),
    profile: profileQuery.data,
    transactions: transactionsQuery.data || [],
    storefrontProducts: storefrontProductsQuery.data || [],
    stats,
    isLoading: ordersQuery.isLoading || profileQuery.isLoading || transactionsQuery.isLoading,
    error: ordersQuery.error || profileQuery.error,
    refetchOrders: ordersQuery.refetch,
  };
};

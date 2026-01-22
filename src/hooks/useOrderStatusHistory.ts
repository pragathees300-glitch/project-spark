import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StatusHistoryItem {
  id: string;
  order_id: string;
  status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  // Aliased properties for component compatibility
  old_status: string | null;
  new_status: string;
  changed_by_type: string;
}

export const useOrderStatusHistory = (orderId: string | undefined) => {
  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['order-status-history', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map database fields to expected interface
      return (data || []).map((item, index, arr) => ({
        ...item,
        old_status: index < arr.length - 1 ? arr[index + 1].status : null,
        new_status: item.status,
        changed_by_type: item.changed_by ? 'admin' : 'system',
      })) as StatusHistoryItem[];
    },
    enabled: !!orderId,
  });

  return {
    history: history || [],
    isLoading,
    refetch,
  };
};

interface PublicOrderStatus {
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  product_name: string;
}

export const usePublicOrderTracking = (orderNumber: string | undefined) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-order-tracking', orderNumber],
    queryFn: async () => {
      if (!orderNumber) return null;
      
      // Query orders directly with limited fields for public access
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('order_number, status, created_at, updated_at, storefront_product_id')
        .eq('order_number', orderNumber)
        .single();
      
      if (orderError) throw orderError;
      if (!orderData) {
        throw new Error('Order not found');
      }
      
      // Get product name if available
      let productName = 'Product';
      if (orderData.storefront_product_id) {
        const { data: productData } = await supabase
          .from('storefront_products')
          .select('products(name)')
          .eq('id', orderData.storefront_product_id)
          .single();
        
        if (productData?.products) {
          productName = (productData.products as any).name || 'Product';
        }
      }
      
      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from('order_status_history')
        .select('status, created_at')
        .eq('order_id', orderNumber)
        .order('created_at', { ascending: false });
      
      // Transform history to match expected interface
      const history: StatusHistoryItem[] = (historyData || []).map((h, index) => ({
        id: `${orderNumber}-${index}`,
        order_id: orderNumber,
        status: h.status,
        changed_by: null,
        notes: null,
        created_at: h.created_at,
        old_status: null,
        new_status: h.status,
        changed_by_type: 'system',
      }));
      
      // Construct order object compatible with the UI
      // Note: Sensitive fields are NOT included for public access
      return {
        order: {
          order_number: orderData.order_number,
          status: orderData.status,
          created_at: orderData.created_at,
          updated_at: orderData.updated_at,
          product_name: productName,
          // Placeholder values for fields not exposed publicly
          customer_name: 'Customer', // Masked - not exposed publicly
          customer_email: '***@***.com', // Masked - not exposed publicly
          paid_at: null,
          completed_at: null,
          quantity: 1,
          selling_price: 0,
          storefront_products: {
            products: {
              name: productName,
              image_url: null
            }
          }
        },
        history,
      };
    },
    enabled: !!orderNumber,
    retry: false,
  });

  return {
    order: data?.order,
    history: data?.history || [],
    isLoading,
    error,
    notFound: error && !isLoading,
  };
};

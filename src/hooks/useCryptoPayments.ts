import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CryptoPayment {
  id: string;
  user_id: string;
  wallet_id: string | null;
  amount: number;
  transaction_hash: string | null;
  status: string;
  proof_url: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  // Joined fields
  user_email?: string;
  user_name?: string;
  order_number?: string;
  order_total?: number;
}

export function useCryptoPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userRole = user?.role;

  // Fetch all crypto payments (admin) or user's own payments
  const paymentsQuery = useQuery({
    queryKey: ['crypto-payments', userRole],
    queryFn: async () => {
      let query = supabase
        .from('crypto_payments')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // For admin, fetch user details
      if (userRole === 'admin' && data && data.length > 0) {
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, name')
          .in('user_id', userIds);

        return data.map(payment => {
          const profile = profiles?.find(p => p.user_id === payment.user_id);
          return {
            ...payment,
            user_email: profile?.email || '',
            user_name: profile?.name || '',
          };
        }) as CryptoPayment[];
      }

      return data as CryptoPayment[];
    },
    enabled: !!user,
  });

  // Create a new crypto payment
  const createPaymentMutation = useMutation({
    mutationFn: async (payment: {
      wallet_id?: string;
      amount: number;
      transaction_hash?: string;
      proof_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('crypto_payments')
        .insert({
          user_id: user!.id,
          wallet_id: payment.wallet_id,
          amount: payment.amount,
          transaction_hash: payment.transaction_hash,
          proof_url: payment.proof_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crypto-payments'] });
      toast({
        title: 'Payment Submitted',
        description: 'Your payment has been submitted for verification.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit payment.',
        variant: 'destructive',
      });
    },
  });

  // Update transaction hash (user)
  const updateTransactionHashMutation = useMutation({
    mutationFn: async ({ paymentId, transactionHash }: { paymentId: string; transactionHash: string }) => {
      const { data, error } = await supabase
        .from('crypto_payments')
        .update({ transaction_hash: transactionHash })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crypto-payments'] });
      toast({
        title: 'Transaction Hash Updated',
        description: 'Your transaction hash has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update transaction hash.',
        variant: 'destructive',
      });
    },
  });

  // Verify or reject payment (admin) - uses Edge Function for proper permissions
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ 
      paymentId, 
      status, 
      adminNotes,
    }: { 
      paymentId: string; 
      status: 'confirmed' | 'rejected'; 
      adminNotes?: string;
    }) => {
      // Use Edge Function for wallet/postpaid operations (bypasses RLS for self-hosted)
      const { data, error } = await supabase.functions.invoke('verify-crypto-payment', {
        body: {
          paymentId,
          status,
          adminNotes,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to verify payment');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return { 
        status, 
        walletCredited: data?.walletCredited,
        postpaidCleared: data?.postpaidCleared,
        newBalance: data?.newBalance,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crypto-payments'] });
      queryClient.invalidateQueries({ queryKey: ['postpaid-status'] });
      queryClient.invalidateQueries({ queryKey: ['postpaid-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dropshipper-wallets'] });
      
      const isPostpaid = data.postpaidCleared;
      const isWalletCredited = data.walletCredited;
      toast({
        title: data.status === 'confirmed' ? 'Payment Verified' : 'Payment Rejected',
        description: data.status === 'confirmed' 
          ? isPostpaid
            ? 'Payment verified and postpaid dues have been auto-cleared.'
            : isWalletCredited
              ? `Payment verified and wallet has been credited.${data.newBalance ? ` New balance: $${data.newBalance.toFixed(2)}` : ''}`
              : 'Payment has been verified.'
          : 'The payment has been rejected. User has been notified.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment status.',
        variant: 'destructive',
      });
    },
  });

  // Get counts by status
  const paymentCounts = {
    pending: paymentsQuery.data?.filter(p => p.status === 'pending').length || 0,
    confirmed: paymentsQuery.data?.filter(p => p.status === 'confirmed').length || 0,
    rejected: paymentsQuery.data?.filter(p => p.status === 'rejected').length || 0,
  };

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    paymentCounts,
    createPayment: createPaymentMutation.mutateAsync,
    isCreating: createPaymentMutation.isPending,
    updateTransactionHash: updateTransactionHashMutation.mutateAsync,
    isUpdatingHash: updateTransactionHashMutation.isPending,
    updatePaymentStatus: updatePaymentStatusMutation.mutateAsync,
    isUpdatingStatus: updatePaymentStatusMutation.isPending,
    refetch: paymentsQuery.refetch,
  };
}

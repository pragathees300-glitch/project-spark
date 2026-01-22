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
}

export function useCryptoPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userRole = user?.role;

  const paymentsQuery = useQuery({
    queryKey: ['crypto-payments', userRole],
    queryFn: async () => {
      const query = supabase
        .from('crypto_payments')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

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
          wallet_id: payment.wallet_id || null,
          amount: payment.amount,
          transaction_hash: payment.transaction_hash || null,
          proof_url: payment.proof_url || null,
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
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      
      toast({
        title: data.status === 'confirmed' ? 'Payment Verified' : 'Payment Rejected',
        description: data.status === 'confirmed' 
          ? 'Payment has been verified and processed.'
          : 'The payment has been rejected.',
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PostpaidTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'credit_used' | 'credit_repaid' | 'adjustment';
  description: string | null;
  reference_id: string | null;
  balance_after: number | null;
  created_at: string;
}

export interface PostpaidProfile {
  postpaid_enabled: boolean;
  postpaid_credit_limit: number;
  postpaid_used: number;
  postpaid_due_cycle: string | null;
}

export interface PostpaidStatus {
  enabled: boolean;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  outstandingDues: number;
  dueCycle: string | null;
  canRequestPayout: boolean;
}

export const usePostpaid = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const postpaidStatusQuery = useQuery({
    queryKey: ['postpaid-status', user?.id],
    queryFn: async (): Promise<PostpaidStatus & { hasOutstandingDues: boolean }> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('postpaid_enabled, postpaid_credit_limit, postpaid_used, postpaid_due_cycle')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      const profile = data as PostpaidProfile;
      const hasCreditLimit = profile.postpaid_credit_limit > 0;
      const availableCredit = hasCreditLimit 
        ? Math.max(0, profile.postpaid_credit_limit - profile.postpaid_used)
        : 0;
      
      return {
        enabled: profile.postpaid_enabled || hasCreditLimit,
        creditLimit: profile.postpaid_credit_limit,
        usedCredit: profile.postpaid_used,
        availableCredit,
        outstandingDues: profile.postpaid_used,
        dueCycle: profile.postpaid_due_cycle,
        canRequestPayout: profile.postpaid_used === 0,
        hasOutstandingDues: profile.postpaid_used > 0,
      };
    },
    enabled: !!user?.id && !!session,
  });

  const transactionsQuery = useQuery({
    queryKey: ['postpaid-transactions', user?.id],
    queryFn: async (): Promise<PostpaidTransaction[]> => {
      const { data, error } = await supabase
        .from('postpaid_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        user_id: t.user_id,
        amount: Number(t.amount),
        transaction_type: t.transaction_type as PostpaidTransaction['transaction_type'],
        description: t.description,
        reference_id: t.reference_id,
        balance_after: t.balance_after ? Number(t.balance_after) : null,
        created_at: t.created_at,
      }));
    },
    enabled: !!user?.id && !!session,
  });

  const repayPostpaidMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance, postpaid_used')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const walletBalance = Number(profile.wallet_balance);
      const postpaidUsed = Number(profile.postpaid_used);

      if (amount > walletBalance) throw new Error('Insufficient wallet balance');
      if (amount > postpaidUsed) throw new Error('Amount exceeds outstanding postpaid dues');

      const newWalletBalance = walletBalance - amount;
      const newPostpaidUsed = postpaidUsed - amount;

      const { error: txError } = await supabase
        .from('postpaid_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          transaction_type: 'credit_repaid',
          description: 'Postpaid dues repayment from wallet',
          balance_after: newPostpaidUsed,
        });

      if (txError) throw txError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: newWalletBalance,
          postpaid_used: newPostpaidUsed,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return { newPostpaidUsed, newWalletBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postpaid-status'] });
      queryClient.invalidateQueries({ queryKey: ['postpaid-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({ title: 'Payment Successful', description: 'Your postpaid dues have been reduced.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    postpaidStatus: postpaidStatusQuery.data,
    isLoading: postpaidStatusQuery.isLoading,
    transactions: transactionsQuery.data || [],
    isLoadingTransactions: transactionsQuery.isLoading,
    repayPostpaid: repayPostpaidMutation.mutate,
    isRepaying: repayPostpaidMutation.isPending,
    refetch: postpaidStatusQuery.refetch,
  };
};

export const useAdminPostpaid = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersWithPostpaidQuery = useQuery({
    queryKey: ['admin-postpaid-users'],
    queryFn: async () => {
      const { data: users, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      if (error) throw error;

      const userIds = users?.map(u => u.user_id) || [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, postpaid_enabled, postpaid_credit_limit, postpaid_used, postpaid_due_cycle, wallet_balance, allow_payout_with_dues')
        .in('user_id', userIds)
        .order('name');

      if (profilesError) throw profilesError;

      return (profiles || []).map(p => ({
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        postpaid_enabled: p.postpaid_enabled,
        postpaid_credit_limit: Number(p.postpaid_credit_limit),
        postpaid_used: Number(p.postpaid_used),
        postpaid_due_cycle: p.postpaid_due_cycle,
        wallet_balance: Number(p.wallet_balance),
        available_credit: Math.max(0, Number(p.postpaid_credit_limit) - Number(p.postpaid_used)),
        allow_payout_with_dues: Boolean(p.allow_payout_with_dues),
      }));
    },
    enabled: !!user && user.role === 'admin' && !!session,
  });

  const togglePostpaid = async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
    const { error } = await supabase.from('profiles').update({ postpaid_enabled: enabled }).eq('user_id', userId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['admin-postpaid-users'] });
  };

  const updateCreditLimit = async ({ userId, creditLimit }: { userId: string; creditLimit: number }) => {
    const { error } = await supabase.from('profiles').update({ postpaid_credit_limit: creditLimit }).eq('user_id', userId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['admin-postpaid-users'] });
  };

  const updateDueCycle = async ({ userId, dueCycle }: { userId: string; dueCycle: string | null }) => {
    const { error } = await supabase.from('profiles').update({ postpaid_due_cycle: dueCycle }).eq('user_id', userId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['admin-postpaid-users'] });
  };

  const toggleAllowPayoutWithDues = async ({ userId, allow }: { userId: string; allow: boolean }) => {
    const { error } = await supabase.from('profiles').update({ allow_payout_with_dues: allow }).eq('user_id', userId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['admin-postpaid-users'] });
  };

  return {
    usersWithPostpaid: usersWithPostpaidQuery.data || [],
    isLoading: usersWithPostpaidQuery.isLoading,
    togglePostpaid,
    updateCreditLimit,
    updateDueCycle,
    toggleAllowPayoutWithDues,
    refetch: usersWithPostpaidQuery.refetch,
  };
};

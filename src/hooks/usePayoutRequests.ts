import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { playPayoutSound, playNotificationSound } from '@/lib/notificationSound';
import { logIPAction } from '@/hooks/useIPLogger';
import { triggerPaymentConfetti } from '@/lib/confetti';
import { createUserNotification } from '@/hooks/useUserInAppNotifications';
import { Json } from '@/integrations/supabase/types';

export interface PayoutStatusHistory {
  id: string;
  payout_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_name?: string;
  notes: string | null;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_details: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  user_name?: string;
  user_email?: string;
}

// Helper to safely parse JSON payout_details
function parsePayoutDetails(details: Json | null): Record<string, string> {
  if (!details) return {};
  if (typeof details === 'object' && !Array.isArray(details)) {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(details)) {
      result[key] = String(value ?? '');
    }
    return result;
  }
  return {};
}

export const usePayoutRequests = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's own payout requests
  const userPayoutsQuery = useQuery({
    queryKey: ['user-payout-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payout requests:', error);
        throw error;
      }

      return (data || []).map((p): PayoutRequest => ({
        id: p.id,
        user_id: p.user_id,
        amount: Number(p.amount),
        payment_method: p.payout_method,
        payment_details: parsePayoutDetails(p.payout_details),
        status: p.status as PayoutRequest['status'],
        admin_notes: p.rejection_reason,
        created_at: p.created_at,
        processed_at: p.processed_at,
        processed_by: p.processed_by,
      }));
    },
    enabled: !!user && user.role === 'user' && !!session,
  });

  // Create payout request mutation
  const createPayoutMutation = useMutation({
    mutationFn: async ({ 
      amount, 
      paymentMethod, 
      paymentDetails 
    }: { 
      amount: number; 
      paymentMethod: string; 
      paymentDetails: Record<string, string>;
    }) => {
      // Check if user has pending postpaid dues - block payout unless admin allowed
      const { data: profileData, error: ppError } = await supabase
        .from('profiles')
        .select('postpaid_used, allow_payout_with_dues, wallet_balance')
        .eq('user_id', user?.id)
        .single();

      if (ppError) throw ppError;

      const postpaidDues = Number(profileData?.postpaid_used || 0);
      const allowPayoutWithDues = Boolean(profileData?.allow_payout_with_dues);
      const currentBalance = Number(profileData?.wallet_balance || 0);
      
      if (postpaidDues > 0 && !allowPayoutWithDues) {
        throw new Error(`You have pending postpaid dues of $${postpaidDues.toFixed(2)}. Please clear them before requesting a payout.`);
      }

      // If "Payout with Dues" is allowed, hold the dues amount from wallet balance
      // User can only withdraw: wallet_balance - postpaid_dues
      const duesHold = allowPayoutWithDues ? postpaidDues : 0;
      const balanceAfterDuesHold = Math.max(0, currentBalance - duesHold);
      
      if (amount > balanceAfterDuesHold) {
        if (duesHold > 0) {
          throw new Error(`Insufficient balance. Your dues of $${postpaidDues.toFixed(2)} are held from your wallet. Available for payout: $${balanceAfterDuesHold.toFixed(2)}`);
        }
        throw new Error('Insufficient wallet balance');
      }

      // Check minimum payout amount from settings
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'min_payout_amount')
        .single();

      const minPayout = settings?.value ? parseFloat(String(settings.value)) : 50;
      if (amount < minPayout) {
        throw new Error(`Minimum payout amount is $${minPayout}`);
      }

      // Prevent multiple pending payout requests exceeding wallet balance
      const { data: pendingPayouts, error: pendingError } = await supabase
        .from('payout_requests')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      const pendingTotal = (pendingPayouts || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const availableToWithdraw = currentBalance - pendingTotal;

      if (amount > availableToWithdraw) {
        throw new Error(
          `Insufficient available balance. Pending payouts on hold: ${pendingTotal.toFixed(2)}`
        );
      }

      // Get user profile for email notification
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', user?.id)
        .single();

      // Create payout request (wallet balance is adjusted when admin approves/completes)
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          user_id: user?.id,
          amount,
          payout_method: paymentMethod,
          payout_details: paymentDetails as unknown as Json,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Log IP for payout request action
      if (user?.id) {
        logIPAction(user.id, 'payout_request');
      }

      // Send email notification to admin about new payout request
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'new_payout_request_admin',
            userName: userProfile?.name || 'User',
            userEmail: userProfile?.email || '',
            amount: amount,
          },
        });
      } catch (emailError) {
        console.error('Failed to send payout request notification:', emailError);
        // Don't fail the payout request if email fails
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-payout-requests'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'], exact: false });
      triggerPaymentConfetti();
      playPayoutSound();
      toast({
        title: 'Payout Requested',
        description: 'Your payout request has been submitted for review.',
      });
    },
    onError: (error: Error) => {
      console.error('Error creating payout request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payout request.',
        variant: 'destructive',
      });
    },
  });

  // Cancel payout request mutation (only for pending status)
  const cancelPayoutMutation = useMutation({
    mutationFn: async ({ payoutId, amount, reason }: { payoutId: string; amount: number; reason?: string }) => {
      // First verify the payout is still pending
      const { data: payout, error: fetchError } = await supabase
        .from('payout_requests')
        .select('status')
        .eq('id', payoutId)
        .eq('user_id', user?.id)
        .single();

      if (fetchError) throw fetchError;
      if (!payout) throw new Error('Payout request not found');
      if (payout.status !== 'pending') {
        throw new Error('Only pending payout requests can be cancelled');
      }

      // Get user profile for email notification
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', user?.id)
        .single();

      // Build the admin notes with reason if provided
      const rejectionReason = reason 
        ? `Cancelled by user: ${reason}` 
        : 'Cancelled by user';

      // Update the payout request status to cancelled (instead of deleting)
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'cancelled',
          rejection_reason: rejectionReason,
          processed_at: new Date().toISOString(),
        })
        .eq('id', payoutId)
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Send email notification to admin about cancelled payout
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'payout_cancelled_admin',
            userName: userProfile?.name || 'User',
            userEmail: userProfile?.email || '',
            amount: amount,
            cancellationReason: reason || null,
          },
        });
      } catch (emailError) {
        console.error('Failed to send payout cancellation notification:', emailError);
        // Don't fail the cancellation if email fails
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-payout-requests'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'], exact: false });
      toast({
        title: 'Payout Cancelled',
        description: 'Your payout request has been cancelled. The record is preserved in your history.',
      });
    },
    onError: (error: Error) => {
      console.error('Error cancelling payout request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel payout request.',
        variant: 'destructive',
      });
    },
  });

  return {
    payoutRequests: userPayoutsQuery.data || [],
    isLoading: userPayoutsQuery.isLoading,
    error: userPayoutsQuery.error,
    refetch: userPayoutsQuery.refetch,
    createPayout: createPayoutMutation.mutate,
    isCreatingPayout: createPayoutMutation.isPending,
    cancelPayout: cancelPayoutMutation.mutate,
    isCancellingPayout: cancelPayoutMutation.isPending,
  };
};

// Admin hook for managing all payout requests
export const useAdminPayouts = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const payoutsQuery = useQuery({
    queryKey: ['admin-payout-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payout requests:', error);
        throw error;
      }

      // Fetch user profiles
      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map((p): PayoutRequest => {
        const profile = profileMap.get(p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          amount: Number(p.amount),
          payment_method: p.payout_method,
          payment_details: parsePayoutDetails(p.payout_details),
          status: p.status as PayoutRequest['status'],
          admin_notes: p.rejection_reason,
          created_at: p.created_at,
          processed_at: p.processed_at,
          processed_by: p.processed_by,
          user_name: profile?.name,
          user_email: profile?.email,
        };
      });
    },
    enabled: user?.role === 'admin' && !!session,
  });

  const processPayoutMutation = useMutation({
    mutationFn: async ({ 
      payoutId, 
      status, 
      adminNotes,
      userId,
      amount,
      userName,
      userEmail,
      previousStatus
    }: { 
      payoutId: string; 
      status: 'approved' | 'rejected' | 'completed' | 'pending';
      adminNotes?: string;
      userId: string;
      amount: number;
      userName?: string;
      userEmail?: string;
      previousStatus?: string;
    }) => {
      if (!payoutId || !userId) {
        throw new Error('Invalid payout data');
      }

      // Update payout request
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status,
          rejection_reason: adminNotes || null,
          processed_at: status === 'pending' ? null : new Date().toISOString(),
          processed_by: status === 'pending' ? null : user?.id,
        })
        .eq('id', payoutId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

       // If approving/completing for the first time (from pending), deduct funds from wallet
       const shouldDebit =
         (status === 'approved' || status === 'completed') &&
         (!previousStatus || !['approved', 'completed'].includes(previousStatus));

       if (shouldDebit) {
         const { data: profile, error: profileError } = await supabase
           .from('profiles')
           .select('wallet_balance')
           .eq('user_id', userId)
           .single();

         if (profileError) {
           console.error('Profile fetch error:', profileError);
           throw profileError;
         }

         const currentBalance = Number(profile.wallet_balance);
         if (amount > currentBalance) {
           throw new Error('Insufficient wallet balance to approve this payout');
         }

         const newBalance = currentBalance - amount;
         const { error: updateError } = await supabase
           .from('profiles')
           .update({ wallet_balance: newBalance })
           .eq('user_id', userId);

         if (updateError) {
           console.error('Balance update error:', updateError);
           throw updateError;
         }

         const { error: txError } = await supabase
           .from('wallet_transactions')
           .insert({
             user_id: userId,
             amount: -amount,
             type: status === 'approved' ? 'payout_approved' : 'payout_completed',
             description:
               status === 'approved'
                 ? 'Payout approved - funds deducted'
                 : 'Payout completed - funds deducted',
           });

         if (txError) {
           console.error('Transaction insert error:', txError);
           throw txError;
         }
       }

       // Refund ONLY if funds had been deducted previously
       const shouldRefund =
         (status === 'rejected' &&
           !!previousStatus &&
           ['approved', 'completed'].includes(previousStatus)) ||
         (status === 'pending' &&
           !!previousStatus &&
           ['approved', 'completed'].includes(previousStatus));

       if (shouldRefund) {
         const { data: profile, error: profileError } = await supabase
           .from('profiles')
           .select('wallet_balance')
           .eq('user_id', userId)
           .single();

         if (profileError) {
           console.error('Profile fetch error:', profileError);
           throw profileError;
         }

         if (profile) {
           const newBalance = Number(profile.wallet_balance) + amount;
           const { error: updateError } = await supabase
             .from('profiles')
             .update({ wallet_balance: newBalance })
             .eq('user_id', userId);

           if (updateError) {
             console.error('Balance update error:', updateError);
             throw updateError;
           }

           const { error: txError } = await supabase
             .from('wallet_transactions')
             .insert({
               user_id: userId,
               amount: amount,
               type: 'payout_refund',
               description: `Payout ${status} - funds refunded`,
             });

           if (txError) {
             console.error('Transaction insert error:', txError);
             throw txError;
           }
         }
       }

      // Create notification for user
      if (userId && status !== 'pending') {
        try {
          await createUserNotification(userId, {
            title: `Payout ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: status === 'approved' 
              ? `Your payout request for $${amount.toFixed(2)} has been approved.`
              : status === 'completed'
              ? `Your payout of $${amount.toFixed(2)} has been completed.`
              : `Your payout request for $${amount.toFixed(2)} has been rejected.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
            type: status === 'rejected' ? 'warning' : 'success',
            action_url: '/user/payments',
          });
        } catch (e) {
          console.error('Failed to create notification:', e);
        }
      }

      // Send email notification to user
      if (userEmail) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: `payout_${status}`,
              userName: userName || 'User',
              recipientEmail: userEmail,
              amount: amount,
              adminNotes: adminNotes,
            },
          });
        } catch (emailError) {
          console.error('Failed to send payout status notification:', emailError);
        }
      }

      return { status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-payout-requests'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-payout-requests'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['dropshipper-wallets'], exact: false });
      
      toast({
        title: 'Payout Updated',
        description: `Payout has been ${data.status}.`,
      });
    },
    onError: (error: Error) => {
      console.error('Error processing payout:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process payout.',
        variant: 'destructive',
      });
    },
  });

  return {
    payoutRequests: payoutsQuery.data || [],
    isLoading: payoutsQuery.isLoading,
    error: payoutsQuery.error,
    refetch: payoutsQuery.refetch,
    processPayout: processPayoutMutation.mutate,
    isProcessing: processPayoutMutation.isPending,
  };
};

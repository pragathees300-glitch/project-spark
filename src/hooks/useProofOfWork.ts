import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createUserNotification } from '@/hooks/useUserInAppNotifications';
import { Json } from '@/integrations/supabase/types';

export interface ProofOfWork {
  id: string;
  user_id: string;
  work_title: string | null;
  work_type: string;
  product_link: string | null;
  proof_url: string | null;
  proof_urls: string[];
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  commission_amount: number | null;
}

export interface ProofOfWorkWithUser extends ProofOfWork {
  user_name?: string;
  user_email?: string;
}

// Helper to parse proof_urls from Json
function parseProofUrls(urls: Json | null): string[] {
  if (!urls) return [];
  if (Array.isArray(urls)) {
    return urls.filter((u): u is string => typeof u === 'string');
  }
  return [];
}

// User: Fetch own proofs
export function useMyProofs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-proofs', user?.id],
    queryFn: async (): Promise<ProofOfWork[]> => {
      const { data, error } = await supabase
        .from('proof_of_work')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        work_title: p.work_title,
        work_type: p.work_type,
        product_link: p.product_link,
        proof_url: p.proof_url,
        proof_urls: parseProofUrls(p.proof_urls),
        description: p.description,
        status: p.status as ProofOfWork['status'],
        admin_notes: p.admin_notes,
        rejection_reason: p.rejection_reason,
        reviewed_by: p.reviewed_by,
        created_at: p.created_at,
        reviewed_at: p.reviewed_at,
        commission_amount: p.commission_amount ? Number(p.commission_amount) : null,
      }));
    },
    enabled: !!user?.id,
  });
}

// Admin: Fetch all proofs with user info
export function useAllProofs(statusFilter?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-proofs', statusFilter],
    queryFn: async (): Promise<ProofOfWorkWithUser[]> => {
      let query = supabase
        .from('proof_of_work')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user profiles for all unique user_ids
      const userIds = [...new Set((data || []).map((p) => p.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, { name: p.name, email: p.email }])
      );

      return (data || []).map((p): ProofOfWorkWithUser => ({
        id: p.id,
        user_id: p.user_id,
        work_title: p.work_title,
        work_type: p.work_type,
        product_link: p.product_link,
        proof_url: p.proof_url,
        proof_urls: parseProofUrls(p.proof_urls),
        description: p.description,
        status: p.status as ProofOfWork['status'],
        admin_notes: p.admin_notes,
        rejection_reason: p.rejection_reason,
        reviewed_by: p.reviewed_by,
        created_at: p.created_at,
        reviewed_at: p.reviewed_at,
        commission_amount: p.commission_amount ? Number(p.commission_amount) : null,
        user_name: profileMap.get(p.user_id)?.name || 'Unknown',
        user_email: profileMap.get(p.user_id)?.email || '',
      }));
    },
    enabled: user?.role === 'admin',
  });
}

// Admin: Fetch pending proofs count
export function usePendingProofsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-proofs-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('proof_of_work')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) return 0;
      return count || 0;
    },
    enabled: user?.role === 'admin',
  });
}

// User: Submit proof of work
export function useSubmitProof() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      work_title: string;
      work_type: string;
      product_link?: string;
      proof_urls: string[];
      description?: string;
    }) => {
      const { error } = await supabase.from('proof_of_work').insert({
        user_id: user?.id,
        work_title: data.work_title,
        work_type: data.work_type,
        product_link: data.product_link || null,
        proof_urls: data.proof_urls,
        description: data.description || null,
        status: 'pending',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proofs'] });
      toast.success('Proof of work submitted successfully!');
    },
    onError: (error: Error) => {
      if (error.message.includes('unique')) {
        toast.error('You have already submitted proof for this link');
      } else {
        toast.error('Failed to submit proof: ' + error.message);
      }
    },
  });
}

// Send proof status notification email
async function sendProofNotificationEmail(
  type: 'proof_approved' | 'proof_rejected',
  userName: string,
  userEmail: string,
  workTitle: string,
  adminRemark?: string
) {
  try {
    await supabase.functions.invoke('send-notification-email', {
      body: {
        type,
        userName,
        userEmail,
        recipientEmail: userEmail,
        workTitle,
        adminRemark,
      },
    });
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}

// Admin: Update proof status
export function useUpdateProofStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      proofId: string;
      status: 'approved' | 'rejected';
      admin_remark?: string;
      userName?: string;
      userEmail?: string;
      workTitle?: string;
      userId?: string;
    }) => {
      const { error } = await supabase
        .from('proof_of_work')
        .update({
          status: data.status,
          admin_notes: data.admin_remark || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', data.proofId);

      if (error) throw error;

      // Send email notification
      if (data.userName && data.userEmail && data.workTitle) {
        await sendProofNotificationEmail(
          data.status === 'approved' ? 'proof_approved' : 'proof_rejected',
          data.userName,
          data.userEmail,
          data.workTitle,
          data.admin_remark
        );
      }

      // Create in-app notification for the user
      if (data.userId) {
        const isApproved = data.status === 'approved';
        await createUserNotification(
          data.userId,
          `proof_${data.status}`,
          isApproved ? '✅ Proof of Work Approved' : '❌ Proof of Work Rejected',
          isApproved 
            ? `Your submission "${data.workTitle}" has been approved!`
            : `Your submission "${data.workTitle}" was not approved.${data.admin_remark ? ` Reason: ${data.admin_remark}` : ''}`,
          'proof',
          data.proofId
        );
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['pending-proofs-count'] });
      toast.success(
        `Proof ${variables.status === 'approved' ? 'approved' : 'rejected'} successfully!`
      );
    },
    onError: (error: Error) => {
      toast.error('Failed to update proof: ' + error.message);
    },
  });
}

// Admin: Bulk update proof statuses
export function useBulkUpdateProofStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      proofIds: string[];
      status: 'approved' | 'rejected';
      admin_remark?: string;
      proofs: ProofOfWorkWithUser[];
    }) => {
      const { error } = await supabase
        .from('proof_of_work')
        .update({
          status: data.status,
          admin_notes: data.admin_remark || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .in('id', data.proofIds);

      if (error) throw error;

      // Send email and in-app notifications in parallel
      await Promise.all(
        data.proofs
          .filter((p) => data.proofIds.includes(p.id))
          .map(async (proof) => {
            // Send email
            await sendProofNotificationEmail(
              data.status === 'approved' ? 'proof_approved' : 'proof_rejected',
              proof.user_name || 'User',
              proof.user_email || '',
              proof.work_title,
              data.admin_remark
            );
            
            // Create in-app notification
            const isApproved = data.status === 'approved';
            await createUserNotification(
              proof.user_id,
              `proof_${data.status}`,
              isApproved ? '✅ Proof of Work Approved' : '❌ Proof of Work Rejected',
              isApproved 
                ? `Your submission "${proof.work_title}" has been approved!`
                : `Your submission "${proof.work_title}" was not approved.${data.admin_remark ? ` Reason: ${data.admin_remark}` : ''}`,
              'proof',
              proof.id
            );
          })
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['pending-proofs-count'] });
      toast.success(
        `${variables.proofIds.length} proof(s) ${variables.status === 'approved' ? 'approved' : 'rejected'} successfully!`
      );
    },
    onError: (error: Error) => {
      toast.error('Failed to update proofs: ' + error.message);
    },
  });
}

// Upload proof images
export async function uploadProofImages(
  userId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = [];

  await Promise.all(
    files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('proof-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('proof-images')
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    })
  );

  return urls;
}

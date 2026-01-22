import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TopDropshipper {
  id: string;
  display_name: string;
  avatar_url: string | null;
  rank: number | null;
  earnings: number | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
}

export const useTopDropshippers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch active top dropshippers
  const topDropshippersQuery = useQuery({
    queryKey: ['top-dropshippers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('top_dropshippers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TopDropshipper[];
    },
  });

  // Fetch all top dropshippers for admin
  const allDropshippersQuery = useQuery({
    queryKey: ['all-top-dropshippers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('top_dropshippers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TopDropshipper[];
    },
    enabled: user?.role === 'admin',
  });

  // Add or update top dropshipper
  const upsertDropshipperMutation = useMutation({
    mutationFn: async (dropshipper: Partial<TopDropshipper> & { display_name: string }) => {
      if (dropshipper.id) {
        const { error } = await supabase
          .from('top_dropshippers')
          .update({
            display_name: dropshipper.display_name,
            avatar_url: dropshipper.avatar_url,
            rank: dropshipper.rank,
            earnings: dropshipper.earnings,
            is_active: dropshipper.is_active,
            sort_order: dropshipper.sort_order,
          })
          .eq('id', dropshipper.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('top_dropshippers')
          .insert({
            display_name: dropshipper.display_name,
            avatar_url: dropshipper.avatar_url,
            rank: dropshipper.rank,
            earnings: dropshipper.earnings,
            is_active: dropshipper.is_active ?? true,
            sort_order: dropshipper.sort_order,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-dropshippers'] });
      queryClient.invalidateQueries({ queryKey: ['all-top-dropshippers'] });
      toast.success('Top dropshipper updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  // Delete top dropshipper
  const deleteDropshipperMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('top_dropshippers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-dropshippers'] });
      queryClient.invalidateQueries({ queryKey: ['all-top-dropshippers'] });
      toast.success('Entry removed');
    },
    onError: (error) => {
      toast.error('Failed to remove: ' + error.message);
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('top_dropshippers')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-dropshippers'] });
      queryClient.invalidateQueries({ queryKey: ['all-top-dropshippers'] });
    },
  });

  // Reorder dropshippers
  const reorderDropshippersMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from('top_dropshippers')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-dropshippers'] });
      queryClient.invalidateQueries({ queryKey: ['all-top-dropshippers'] });
      toast.success('Positions updated');
    },
    onError: (error) => {
      toast.error('Failed to reorder: ' + error.message);
    },
  });

  return {
    topDropshippers: topDropshippersQuery.data ?? [],
    allDropshippers: allDropshippersQuery.data ?? [],
    isLoading: topDropshippersQuery.isLoading,
    upsertDropshipper: upsertDropshipperMutation.mutate,
    deleteDropshipper: deleteDropshipperMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    reorderDropshippers: reorderDropshippersMutation.mutate,
    isUpdating: upsertDropshipperMutation.isPending || reorderDropshippersMutation.isPending,
  };
};

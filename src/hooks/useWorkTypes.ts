import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WorkType {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  commission_amount: number | null;
  is_active: boolean | null;
  requires_proof: boolean | null;
  sort_order: number | null;
  created_at: string;
}

// Fetch active work types (for users)
export function useActiveWorkTypes() {
  return useQuery({
    queryKey: ['work-types-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as WorkType[];
    },
  });
}

// Fetch all work types (for admins)
export function useAllWorkTypes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['work-types-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as WorkType[];
    },
    enabled: user?.role === 'admin',
  });
}

// Create work type
export function useCreateWorkType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; category_id?: string; commission_amount?: number }) => {
      const { data: existing } = await supabase
        .from('work_types')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order ?? 0) + 1 : 1;

      const { error } = await supabase.from('work_types').insert({
        name: data.name,
        description: data.description || null,
        category_id: data.category_id || null,
        commission_amount: data.commission_amount || 0,
        sort_order: nextOrder,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-types-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-types-active'] });
      toast.success('Work type added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add work type: ' + error.message);
    },
  });
}

// Update work type
export function useUpdateWorkType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      category_id?: string;
      commission_amount?: number;
      is_active?: boolean;
      requires_proof?: boolean;
      sort_order?: number;
    }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('work_types')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-types-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-types-active'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update work type: ' + error.message);
    },
  });
}

// Placeholder for set default (not supported in current schema)
export function useSetDefaultWorkType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_id: string) => {
      // No-op: is_default column doesn't exist in current schema
      console.log('Set default work type not supported in current schema');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-types-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-types-active'] });
    },
  });
}

// Delete work type
export function useDeleteWorkType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-types-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-types-active'] });
      toast.success('Work type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete work type: ' + error.message);
    },
  });
}

// Reorder work types
export function useReorderWorkTypes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('work_types').update({ sort_order: index + 1 }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-types-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-types-active'] });
      toast.success('Order updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to reorder work types: ' + error.message);
    },
  });
}

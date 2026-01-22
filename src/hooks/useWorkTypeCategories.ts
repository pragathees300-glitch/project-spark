import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WorkTypeCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
}

// Fetch active categories (for users)
export function useActiveCategories() {
  return useQuery({
    queryKey: ['work-type-categories-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_type_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as WorkTypeCategory[];
    },
  });
}

// Fetch all categories (for admins)
export function useAllCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['work-type-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_type_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as WorkTypeCategory[];
    },
    enabled: user?.role === 'admin',
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: existing } = await supabase
        .from('work_type_categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order ?? 0) + 1 : 1;

      const { error } = await supabase.from('work_type_categories').insert({
        name: data.name,
        description: data.description || null,
        sort_order: nextOrder,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-type-categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-type-categories-active'] });
      toast.success('Category added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add category: ' + error.message);
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      is_active?: boolean;
      sort_order?: number;
    }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('work_type_categories')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-type-categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-type-categories-active'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update category: ' + error.message);
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_type_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-type-categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-type-categories-active'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete category: ' + error.message);
    },
  });
}

// Reorder categories
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('work_type_categories').update({ sort_order: index + 1 }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-type-categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['work-type-categories-active'] });
      toast.success('Order updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to reorder categories: ' + error.message);
    },
  });
}

// Category color map helper (returns default colors since table doesn't have color column)
export function useCategoryColorMap() {
  const { data: categories } = useActiveCategories();
  
  const colorMap = new Map<string, { color: string; icon: string }>();
  const defaultColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
  
  categories?.forEach((cat, index) => {
    colorMap.set(cat.id, { 
      color: defaultColors[index % defaultColors.length], 
      icon: 'folder' 
    });
  });
  
  return colorMap;
}

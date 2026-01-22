import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuickReply {
  id: string;
  title: string;
  message: string;
  category: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
}

export const useQuickReplies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quickReplies = [], isLoading } = useQuery({
    queryKey: ['quick-replies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_replies')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        title: r.title,
        message: r.message,
        category: r.category,
        is_active: r.is_active || false,
        sort_order: r.sort_order,
        created_at: r.created_at,
      })) as QuickReply[];
    },
  });

  const addQuickReply = useMutation({
    mutationFn: async (reply: { title: string; message: string; category?: string }) => {
      const { data, error } = await supabase
        .from('quick_replies')
        .insert({
          title: reply.title,
          message: reply.message,
          category: reply.category || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({ title: 'Quick reply added successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add quick reply',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateQuickReply = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuickReply> & { id: string }) => {
      const { data, error } = await supabase
        .from('quick_replies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({ title: 'Quick reply updated' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update quick reply',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteQuickReply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quick_replies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({ title: 'Quick reply deleted' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete quick reply',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const categories = [...new Set(quickReplies.map((r) => r.category).filter(Boolean))] as string[];

  return {
    quickReplies,
    isLoading,
    categories,
    addQuickReply: addQuickReply.mutate,
    updateQuickReply: updateQuickReply.mutate,
    deleteQuickReply: deleteQuickReply.mutate,
    isAdding: addQuickReply.isPending,
    isUpdating: updateQuickReply.isPending,
    isDeleting: deleteQuickReply.isPending,
  };
};

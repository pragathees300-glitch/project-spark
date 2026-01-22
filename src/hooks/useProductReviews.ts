import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
}

interface SubmitReviewData {
  product_id: string;
  rating: number;
  review_text?: string;
}

export const useProductReviews = (productId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch approved reviews for a product
  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async (): Promise<ProductReview[]> => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }

      return (data || []).map(r => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        rating: r.rating,
        review_text: r.review_text,
        is_approved: r.is_approved || false,
        created_at: r.created_at,
      }));
    },
    enabled: !!productId,
  });

  // Calculate average rating
  const averageRating = reviewsQuery.data && reviewsQuery.data.length > 0
    ? reviewsQuery.data.reduce((sum, r) => sum + r.rating, 0) / reviewsQuery.data.length
    : 0;

  // Count reviews by rating
  const ratingCounts = reviewsQuery.data?.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>) || {};

  // Submit a new review
  const submitReviewMutation = useMutation({
    mutationFn: async (data: SubmitReviewData) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: data.product_id,
          user_id: user.id,
          rating: data.rating,
          review_text: data.review_text || null,
          is_approved: false, // Reviews require admin approval
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Review Submitted',
        description: 'Thank you! Your review will be visible after approval.',
      });
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    },
    onError: (error: Error) => {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    reviews: reviewsQuery.data || [],
    isLoading: reviewsQuery.isLoading,
    averageRating,
    totalReviews: reviewsQuery.data?.length || 0,
    ratingCounts,
    submitReview: submitReviewMutation.mutate,
    isSubmitting: submitReviewMutation.isPending,
  };
};

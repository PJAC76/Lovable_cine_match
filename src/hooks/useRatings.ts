import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Rating {
  id: string;
  user_id: string;
  media_item_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export function useRatings(mediaItemId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all ratings for this media item
  const { data: ratings, isLoading: isLoadingRatings } = useQuery({
    queryKey: ["ratings", mediaItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_ratings")
        .select("*")
        .eq("media_item_id", mediaItemId);

      if (error) throw error;
      return data as Rating[];
    },
  });

  // Get current user's rating
  const { data: userRating, isLoading: isLoadingUserRating } = useQuery({
    queryKey: ["userRating", mediaItemId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_ratings")
        .select("*")
        .eq("media_item_id", mediaItemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Rating | null;
    },
    enabled: !!user,
  });

  // Submit or update rating
  const submitRating = useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error("Debes iniciar sesión para votar");

      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from("user_ratings")
          .update({ rating })
          .eq("id", userRating.id);

        if (error) throw error;
      } else {
        // Create new rating
        const { error } = await supabase.from("user_ratings").insert({
          user_id: user.id,
          media_item_id: mediaItemId,
          rating,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", mediaItemId] });
      queryClient.invalidateQueries({
        queryKey: ["userRating", mediaItemId, user?.id],
      });
      toast.success("Valoración guardada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    },
  });

  // Calculate average rating
  const averageRating =
    ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;

  return {
    ratings,
    userRating,
    averageRating,
    ratingsCount: ratings?.length || 0,
    isLoading: isLoadingRatings || isLoadingUserRating,
    submitRating: submitRating.mutate,
    isSubmitting: submitRating.isPending,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_favorites")
        .select(`
          id,
          media_item_id,
          created_at,
          media_items (
            *,
            aggregated_scores (*),
            sources_scores (*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async (mediaItemId: string) => {
      if (!user) throw new Error("Debes iniciar sesión");

      const { error } = await supabase
        .from("user_favorites")
        .insert({ user_id: user.id, media_item_id: mediaItemId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Añadido a favoritas");
    },
    onError: (error) => {
      toast.error("Error al añadir a favoritas");
      console.error(error);
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (mediaItemId: string) => {
      if (!user) throw new Error("Debes iniciar sesión");

      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("media_item_id", mediaItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Eliminado de favoritas");
    },
    onError: (error) => {
      toast.error("Error al eliminar de favoritas");
      console.error(error);
    },
  });

  const toggleFavorite = (mediaItemId: string) => {
    if (!user) {
      toast.error("Inicia sesión para guardar favoritas");
      return;
    }

    const isFavorite = favorites.some((f) => f.media_item_id === mediaItemId);
    if (isFavorite) {
      removeFavorite.mutate(mediaItemId);
    } else {
      addFavorite.mutate(mediaItemId);
    }
  };

  const isFavorite = (mediaItemId: string) => {
    return favorites.some((f) => f.media_item_id === mediaItemId);
  };

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
  };
}

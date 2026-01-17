import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Comment {
  id: string;
  user_id: string;
  media_item_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useComments(mediaItemId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all comments for this media item
  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", mediaItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_comments")
        .select("*")
        .eq("media_item_id", mediaItemId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Comment[];
    },
  });

  // Add a new comment
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Debes iniciar sesión para comentar");

      const { error } = await supabase.from("user_comments").insert({
        user_id: user.id,
        media_item_id: mediaItemId,
        content,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", mediaItemId] });
      toast.success("Comentario añadido");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al comentar");
    },
  });

  // Delete a comment
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("No autorizado");

      const { error } = await supabase
        .from("user_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", mediaItemId] });
      toast.success("Comentario eliminado");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    },
  });

  return {
    comments,
    isLoading,
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
    isAdding: addComment.isPending,
    isDeleting: deleteComment.isPending,
  };
}

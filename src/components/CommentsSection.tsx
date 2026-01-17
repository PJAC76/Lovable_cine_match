import { useState } from "react";
import { MessageSquare, Loader2, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CommentsSectionProps {
  mediaItemId: string;
}

export function CommentsSection({ mediaItemId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { comments, isLoading, addComment, deleteComment, isAdding } =
    useComments(mediaItemId);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(newComment.trim());
      setNewComment("");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Comentarios ({comments?.length || 0})
      </h3>

      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2 resize-none"
            rows={3}
          />
          <Button type="submit" disabled={isAdding || !newComment.trim()}>
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Publicar
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground text-sm mb-6">
          Inicia sesión para dejar un comentario
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments?.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Sé el primero en comentar
          </p>
        ) : (
          comments?.map((comment) => (
            <div
              key={comment.id}
              className="bg-muted/30 rounded-lg p-4 relative group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

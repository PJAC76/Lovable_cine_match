import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRatings } from "@/hooks/useRatings";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface RatingSectionProps {
  mediaItemId: string;
}

export function RatingSection({ mediaItemId }: RatingSectionProps) {
  const { user } = useAuth();
  const {
    userRating,
    averageRating,
    ratingsCount,
    isLoading,
    submitRating,
    isSubmitting,
  } = useRatings(mediaItemId);

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const currentRating = hoverRating ?? selectedRating ?? userRating?.rating ?? 0;

  const handleSubmit = () => {
    if (selectedRating) {
      submitRating(selectedRating);
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
      <h3 className="text-lg font-semibold mb-4">Valoración de usuarios</h3>

      {/* Average Rating */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          <span className="text-3xl font-bold">
            {averageRating ? averageRating.toFixed(1) : "-"}
          </span>
        </div>
        <span className="text-muted-foreground">
          {ratingsCount} {ratingsCount === 1 ? "voto" : "votos"}
        </span>
      </div>

      {/* User Rating */}
      {user ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {userRating ? "Tu valoración:" : "¿Qué te ha parecido?"}
          </p>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <button
                key={rating}
                className="p-1 hover:scale-110 transition-transform"
                onMouseEnter={() => setHoverRating(rating)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setSelectedRating(rating)}
              >
                <Star
                  className={cn(
                    "w-6 h-6 transition-colors",
                    rating <= currentRating
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-lg font-medium w-8">
              {currentRating || "-"}
            </span>
          </div>

          {(selectedRating || userRating) && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!selectedRating && !!userRating)}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {userRating ? "Actualizar valoración" : "Guardar valoración"}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Inicia sesión para valorar este contenido
        </p>
      )}
    </div>
  );
}

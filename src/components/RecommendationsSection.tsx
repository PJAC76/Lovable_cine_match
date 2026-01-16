import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/MediaCard";
import type { RecommendedItem } from "@/hooks/useRecommendations";

interface RecommendationsSectionProps {
  recommendations: RecommendedItem[];
  isLoading: boolean;
  error: string | null;
  onGetRecommendations: () => void;
  onFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  hasFavorites: boolean;
}

export function RecommendationsSection({
  recommendations,
  isLoading,
  error,
  onGetRecommendations,
  onFavorite,
  isFavorite,
  hasFavorites,
}: RecommendationsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header with button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Recomendaciones IA
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Basadas en tus series y películas favoritas
          </p>
        </div>

        <Button
          onClick={onGetRecommendations}
          disabled={isLoading || !hasFavorites}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizando...
            </>
          ) : recommendations.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Obtener recomendaciones
            </>
          )}
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Analizando tus gustos para encontrar recomendaciones...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error}
        </div>
      )}

      {/* No favorites message */}
      {!hasFavorites && !isLoading && (
        <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Añade series o películas a favoritas usando el buscador de arriba para obtener recomendaciones personalizadas
          </p>
        </div>
      )}

      {/* Recommendations grid */}
      {!isLoading && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendations.map((item) => (
              <div key={item.id} className="space-y-2">
                <MediaCard
                  item={item}
                  isFavorite={isFavorite(item.id)}
                  onFavorite={onFavorite}
                />
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-foreground leading-relaxed">
                    <span className="font-semibold text-primary">¿Por qué te gustará?</span>
                    <br />
                    {item.ai_reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

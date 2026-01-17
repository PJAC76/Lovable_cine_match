import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Heart, Calendar, Film, Tv } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useMediaById } from "@/hooks/useMedia";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { RatingSection } from "@/components/RatingSection";
import { CommentsSection } from "@/components/CommentsSection";
import { SourceScores } from "@/components/SourceScores";
import { cn } from "@/lib/utils";

export default function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, error } = useMediaById(id);
  const { toggleFavorite, isFavorite } = useFavorites();

  const historicalScore = item?.aggregated_scores?.find(
    (s) => s.ranking_type === "historical"
  );
  const recentScore = item?.aggregated_scores?.find(
    (s) => s.ranking_type === "recent"
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid md:grid-cols-3 gap-8">
              <div className="aspect-[2/3] bg-muted rounded-lg" />
              <div className="md:col-span-2 space-y-4">
                <div className="h-10 w-3/4 bg-muted rounded" />
                <div className="h-6 w-1/2 bg-muted rounded" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Contenido no encontrado</h1>
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isFav = isFavorite(item.id);

  return (
    <Layout>
      <div className="container py-8">
        {/* Back Button */}
        <Link
          to={item.type === "series" ? "/series" : "/peliculas"}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a {item.type === "series" ? "Series" : "Películas"}
        </Link>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="relative">
            <img
              src={item.poster_url || "/placeholder.svg"}
              alt={item.title}
              className="w-full rounded-lg shadow-xl"
            />
            <Button
              size="lg"
              variant={isFav ? "default" : "secondary"}
              className="absolute bottom-4 left-4 right-4"
              onClick={() => toggleFavorite(item.id)}
            >
              <Heart className={cn("w-5 h-5 mr-2", isFav && "fill-current")} />
              {isFav ? "En favoritas" : "Añadir a favoritas"}
            </Button>
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {item.type === "series" ? (
                  <Tv className="w-5 h-5 text-primary" />
                ) : (
                  <Film className="w-5 h-5 text-primary" />
                )}
                <span className="text-muted-foreground capitalize">
                  {item.type === "series" ? "Serie" : "Película"}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-2">{item.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {item.year}
                </span>
                <div className="flex flex-wrap gap-2">
                  {item.genres?.map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Puntuación Histórica
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-3xl font-bold">
                    {Number(historicalScore?.final_score || 0).toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({historicalScore?.total_votes || 0} votos)
                  </span>
                </div>
              </div>
              {recentScore && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    Puntuación Reciente
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-primary fill-primary" />
                    <span className="text-3xl font-bold">
                      {Number(recentScore.final_score).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({recentScore.total_votes} votos)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Synopsis */}
            {item.synopsis_short && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Sinopsis</h2>
                <p className="text-muted-foreground">{item.synopsis_short}</p>
              </div>
            )}

            {/* Source Scores */}
            <SourceScores scores={item.sources_scores} />
          </div>
        </div>

        {/* Social Section */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <RatingSection mediaItemId={item.id} />
          <CommentsSection mediaItemId={item.id} />
        </div>
      </div>
    </Layout>
  );
}

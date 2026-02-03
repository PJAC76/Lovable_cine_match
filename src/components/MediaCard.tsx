import { Star, Heart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/hooks/useMedia";

interface MediaCardProps {
  item: MediaItem;
  rank?: number;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export function MediaCard({ item, rank, onFavorite, isFavorite = false }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get the best available score for display (prefer historical, fallback to recent)
  const historicalScore = item.aggregated_scores?.find(
    (s) => s.ranking_type === "historical"
  );
  const recentScore = item.aggregated_scores?.find(
    (s) => s.ranking_type === "recent"
  );
  const displayScore = historicalScore?.final_score || recentScore?.final_score || 0;

  return (
    <Link to={`/media/${item.id}`}>
      <article
        className="media-card group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Ranking Badge */}
        {rank && (
          <div className="ranking-badge">
            <span className="text-primary-foreground">{rank}</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavorite?.(item.id);
          }}
          className={cn(
            "absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
            isFavorite
              ? "bg-primary text-primary-foreground"
              : "bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-primary hover:bg-background/80"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>

        {/* Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={item.poster_url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop"}
            alt={item.title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              isHovered && "scale-110",
              !imageLoaded && "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Gradient Overlay */}
          <div className="media-card-overlay absolute inset-0" />
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Score Badge */}
            <div className="score-badge mb-2">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{Number(displayScore).toFixed(1)}</span>
            </div>

            {/* Title & Year */}
            <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">{item.year}</p>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5">
              {item.genres?.slice(0, 2).map((genre) => (
                <span key={genre} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

import { MediaCard } from "./MediaCard";
import { MediaItem } from "@/lib/mockData";
import { ChevronRight, Clock, History } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RankingSectionProps {
  title: string;
  items: MediaItem[];
  type: "series" | "movies";
  viewMode?: "historical" | "recent";
  onViewModeChange?: (mode: "historical" | "recent") => void;
  linkTo?: string;
  favorites?: string[];
  onFavorite?: (id: string) => void;
}

export function RankingSection({
  title,
  items,
  type,
  viewMode = "historical",
  onViewModeChange,
  linkTo,
  favorites = [],
  onFavorite,
}: RankingSectionProps) {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="section-title">{title}</h2>
          {linkTo && (
            <Link to={linkTo}>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Ver todo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => onViewModeChange("historical")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === "historical"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </button>
            <button
              onClick={() => onViewModeChange("recent")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === "recent"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Reciente</span>
            </button>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.slice(0, 10).map((item, index) => (
          <MediaCard
            key={item.id}
            item={item}
            rank={index + 1}
            isFavorite={favorites.includes(item.id)}
            onFavorite={onFavorite}
          />
        ))}
      </div>
    </section>
  );
}

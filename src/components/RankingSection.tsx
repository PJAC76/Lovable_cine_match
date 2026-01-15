import { MediaCard } from "./MediaCard";
import { ChevronRight, Clock, History, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/hooks/useMedia";

interface RankingSectionProps {
  title: string;
  items: MediaItem[];
  isLoading?: boolean;
  viewMode?: "historical" | "recent";
  onViewModeChange?: (mode: "historical" | "recent") => void;
  linkTo?: string;
  isFavorite?: (id: string) => boolean;
  onFavorite?: (id: string) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function RankingSection({
  title,
  items,
  isLoading = false,
  viewMode = "historical",
  onViewModeChange,
  linkTo,
  isFavorite,
  onFavorite,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Cards Grid */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              rank={index + 1}
              isFavorite={isFavorite?.(item.id) ?? false}
              onFavorite={onFavorite}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {!isLoading && hasNextPage && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="min-w-[200px]"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Cargar más
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron resultados
        </div>
      )}
    </section>
  );
}

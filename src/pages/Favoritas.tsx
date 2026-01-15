import { Layout } from "@/components/Layout";
import { MediaCard } from "@/components/MediaCard";
import { Heart, Film, Tv, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Favoritas = () => {
  const { isAuthenticated } = useAuth();
  const { favorites, isLoading, toggleFavorite, isFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<"all" | "series" | "movies">("all");

  const favoriteItems = favorites
    .map((f) => f.media_items)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const filteredItems = activeTab === "all"
    ? favoriteItems
    : favoriteItems.filter((item) =>
        activeTab === "series" ? item.type === "series" : item.type === "movie"
      );

  const seriesCount = favoriteItems.filter((i) => i.type === "series").length;
  const moviesCount = favoriteItems.filter((i) => i.type === "movie").length;

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Inicia sesión para ver tus favoritas</h3>
            <p className="text-muted-foreground mb-6">
              Guarda tus series y películas favoritas para acceder a ellas fácilmente
            </p>
            <Button asChild>
              <Link to="/perfil">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary" />
              Mis Favoritas
            </h1>
            <p className="text-muted-foreground">
              {favoriteItems.length} títulos guardados
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Todas ({favoriteItems.length})
            </button>
            <button
              onClick={() => setActiveTab("series")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "series"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Tv className="w-4 h-4" />
              Series ({seriesCount})
            </button>
            <button
              onClick={() => setActiveTab("movies")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "movies"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Film className="w-4 h-4" />
              Películas ({moviesCount})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Favorites Grid */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <MediaCard
                key={item.id}
                item={item as any}
                isFavorite={true}
                onFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin favoritas aún</h3>
            <p className="text-muted-foreground mb-6">
              Explora los rankings y guarda tus series y películas favoritas
            </p>
            <Button asChild>
              <Link to="/">Explorar rankings</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favoritas;

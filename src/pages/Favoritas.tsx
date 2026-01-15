import { Layout } from "@/components/Layout";
import { MediaCard } from "@/components/MediaCard";
import { mockSeries, mockMovies } from "@/lib/mockData";
import { Heart, Film, Tv } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Favoritas = () => {
  const [favorites, setFavorites] = useState<string[]>(["1", "2", "m1", "m3"]);
  const [activeTab, setActiveTab] = useState<"all" | "series" | "movies">("all");

  const handleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id]
    );
  };

  const allMedia = [...mockSeries, ...mockMovies];
  const favoriteItems = allMedia.filter((item) => favorites.includes(item.id));
  
  const filteredItems = activeTab === "all" 
    ? favoriteItems
    : favoriteItems.filter((item) => 
        activeTab === "series" ? item.type === "series" : item.type === "movie"
      );

  const seriesCount = favoriteItems.filter((i) => i.type === "series").length;
  const moviesCount = favoriteItems.filter((i) => i.type === "movie").length;

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

        {/* Favorites Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                isFavorite={true}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin favoritas aún</h3>
            <p className="text-muted-foreground mb-6">
              Explora los rankings y guarda tus series y películas favoritas
            </p>
            <Button asChild>
              <a href="/">Explorar rankings</a>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favoritas;

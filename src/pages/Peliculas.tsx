import { useState } from "react";
import { Layout } from "@/components/Layout";
import { RankingSection } from "@/components/RankingSection";
import { GenreFilter } from "@/components/GenreFilter";
import { mockMovies, MediaItem } from "@/lib/mockData";

const Peliculas = () => {
  const [viewMode, setViewMode] = useState<"historical" | "recent">("historical");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id]
    );
  };

  const filterByGenres = (items: MediaItem[]) => {
    if (selectedGenres.length === 0) return items;
    return items.filter((item) =>
      item.genres.some((genre) => selectedGenres.includes(genre))
    );
  };

  const filteredMovies = filterByGenres(mockMovies);

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Top Películas
          </h1>
          <p className="text-muted-foreground">
            Las mejores películas según la comunidad
          </p>
        </div>

        {/* Genre Filter */}
        <GenreFilter
          selectedGenres={selectedGenres}
          onGenreToggle={handleGenreToggle}
        />

        {/* Movies Ranking */}
        <RankingSection
          title="Ranking Completo"
          items={filteredMovies}
          type="movies"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          favorites={favorites}
          onFavorite={handleFavorite}
        />
      </div>
    </Layout>
  );
};

export default Peliculas;

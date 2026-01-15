import { useState } from "react";
import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/HeroSection";
import { RankingSection } from "@/components/RankingSection";
import { GenreFilter } from "@/components/GenreFilter";
import { mockSeries, mockMovies, MediaItem } from "@/lib/mockData";

const Index = () => {
  const [seriesViewMode, setSeriesViewMode] = useState<"historical" | "recent">("historical");
  const [moviesViewMode, setMoviesViewMode] = useState<"historical" | "recent">("historical");
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

  // Simulate "recent" mode by shuffling (in real app, this would be different data)
  const getItems = (items: MediaItem[], mode: "historical" | "recent") => {
    if (mode === "recent") {
      return [...items].sort(() => Math.random() - 0.5);
    }
    return items;
  };

  const filteredSeries = filterByGenres(getItems(mockSeries, seriesViewMode));
  const filteredMovies = filterByGenres(getItems(mockMovies, moviesViewMode));

  return (
    <Layout>
      <HeroSection />

      <div className="container space-y-12 pb-12">
        {/* Genre Filter */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">Filtrar por género</h3>
          <GenreFilter
            selectedGenres={selectedGenres}
            onGenreToggle={handleGenreToggle}
          />
        </section>

        {/* Series Section */}
        <RankingSection
          title="Top 10 Series"
          items={filteredSeries}
          type="series"
          viewMode={seriesViewMode}
          onViewModeChange={setSeriesViewMode}
          linkTo="/series"
          favorites={favorites}
          onFavorite={handleFavorite}
        />

        {/* Movies Section */}
        <RankingSection
          title="Top 10 Películas"
          items={filteredMovies}
          type="movies"
          viewMode={moviesViewMode}
          onViewModeChange={setMoviesViewMode}
          linkTo="/peliculas"
          favorites={favorites}
          onFavorite={handleFavorite}
        />
      </div>
    </Layout>
  );
};

export default Index;

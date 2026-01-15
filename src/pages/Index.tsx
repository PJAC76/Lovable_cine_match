import { useState } from "react";
import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/HeroSection";
import { RankingSection } from "@/components/RankingSection";
import { GenreFilter } from "@/components/GenreFilter";
import { useMedia, RankingType } from "@/hooks/useMedia";
import { useFavorites } from "@/hooks/useFavorites";

const Index = () => {
  const [seriesViewMode, setSeriesViewMode] = useState<RankingType>("historical");
  const [moviesViewMode, setMoviesViewMode] = useState<RankingType>("historical");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: series = [], isLoading: seriesLoading } = useMedia({
    type: "series",
    rankingType: seriesViewMode,
    genres: selectedGenres.length > 0 ? selectedGenres : undefined,
    limit: 10,
  });

  const { data: movies = [], isLoading: moviesLoading } = useMedia({
    type: "movie",
    rankingType: moviesViewMode,
    genres: selectedGenres.length > 0 ? selectedGenres : undefined,
    limit: 10,
  });

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

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
          items={series}
          isLoading={seriesLoading}
          viewMode={seriesViewMode}
          onViewModeChange={setSeriesViewMode}
          linkTo="/series"
          isFavorite={isFavorite}
          onFavorite={toggleFavorite}
        />

        {/* Movies Section */}
        <RankingSection
          title="Top 10 Películas"
          items={movies}
          isLoading={moviesLoading}
          viewMode={moviesViewMode}
          onViewModeChange={setMoviesViewMode}
          linkTo="/peliculas"
          isFavorite={isFavorite}
          onFavorite={toggleFavorite}
        />
      </div>
    </Layout>
  );
};

export default Index;

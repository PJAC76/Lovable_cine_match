import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { RankingSection } from "@/components/RankingSection";
import { GenreFilter } from "@/components/GenreFilter";
import { useInfiniteMedia, RankingType } from "@/hooks/useInfiniteMedia";
import { useFavorites } from "@/hooks/useFavorites";

const Series = () => {
  const [viewMode, setViewMode] = useState<RankingType>("historical");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const { toggleFavorite, isFavorite } = useFavorites();

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteMedia({
    type: "series",
    rankingType: viewMode,
    genres: selectedGenres.length > 0 ? selectedGenres : undefined,
    pageSize: 5,
    maxItems: 50,
  });

  const series = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Top Series
          </h1>
          <p className="text-muted-foreground">
            Las mejores series según la comunidad
          </p>
        </div>

        {/* Genre Filter */}
        <GenreFilter
          selectedGenres={selectedGenres}
          onGenreToggle={handleGenreToggle}
        />

        {/* Series Ranking */}
        <RankingSection
          title="Ranking Completo"
          items={series}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isFavorite={isFavorite}
          onFavorite={toggleFavorite}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </Layout>
  );
};

export default Series;

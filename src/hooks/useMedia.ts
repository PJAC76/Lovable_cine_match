import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getYearRangesForRankingType } from "@/lib/dateRanges";

export type MediaItem = Tables<"media_items"> & {
  aggregated_scores: Tables<"aggregated_scores">[];
  sources_scores: Tables<"sources_scores">[];
};

export type RankingType = "historical" | "recent";
export type MediaType = "movie" | "series";

interface UseMediaOptions {
  type?: MediaType;
  rankingType?: RankingType;
  genres?: string[];
  limit?: number;
}

export function useMedia(options: UseMediaOptions = {}) {
  const { type, rankingType = "historical", genres, limit = 10 } = options;

  return useQuery({
    queryKey: ["media", type, rankingType, genres, limit],
    queryFn: async () => {
      // Get year ranges based on ranking type
      const { minYear, maxYear } = getYearRangesForRankingType(rankingType);

      // Get media items filtered by year range
      let mediaQuery = supabase
        .from("media_items")
        .select(`
          *,
          aggregated_scores (*),
          sources_scores (*)
        `)
        .gte("year", minYear)
        .lte("year", maxYear);

      if (type) {
        mediaQuery = mediaQuery.eq("type", type);
      }

      const { data: mediaItems, error: mediaError } = await mediaQuery;

      if (mediaError) throw mediaError;
      if (!mediaItems || mediaItems.length === 0) return [];

      // Filter by genres if provided
      let filtered = mediaItems;
      if (genres && genres.length > 0) {
        filtered = filtered.filter((item) =>
          item.genres.some((g) => genres.includes(g))
        );
      }

      // Sort by final_score from aggregated_scores (prefer the matching ranking_type)
      filtered.sort((a, b) => {
        const scoreA = a.aggregated_scores.find(s => s.ranking_type === rankingType)?.final_score 
          || a.aggregated_scores[0]?.final_score || 0;
        const scoreB = b.aggregated_scores.find(s => s.ranking_type === rankingType)?.final_score 
          || b.aggregated_scores[0]?.final_score || 0;
        return Number(scoreB) - Number(scoreA);
      });

      // Apply limit
      return filtered.slice(0, limit) as MediaItem[];
    },
  });
}

export function useMediaById(id: string | undefined) {
  return useQuery({
    queryKey: ["media", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("media_items")
        .select(`
          *,
          aggregated_scores (*),
          sources_scores (*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as MediaItem | null;
    },
    enabled: !!id,
  });
}

export function useAllGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_items")
        .select("genres");

      if (error) throw error;

      const allGenres = new Set<string>();
      data?.forEach((item) => {
        item.genres?.forEach((genre) => allGenres.add(genre));
      });

      return Array.from(allGenres).sort();
    },
  });
}

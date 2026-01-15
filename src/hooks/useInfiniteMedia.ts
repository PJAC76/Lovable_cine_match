import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MediaItem = Tables<"media_items"> & {
  aggregated_scores: Tables<"aggregated_scores">[];
  sources_scores: Tables<"sources_scores">[];
};

export type RankingType = "historical" | "recent";
export type MediaType = "movie" | "series";

interface UseInfiniteMediaOptions {
  type?: MediaType;
  rankingType?: RankingType;
  genres?: string[];
  pageSize?: number;
}

export function useInfiniteMedia(options: UseInfiniteMediaOptions = {}) {
  const { type, rankingType = "historical", genres, pageSize = 10 } = options;

  return useInfiniteQuery({
    queryKey: ["infinite-media", type, rankingType, genres, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      // First, get aggregated scores for the ranking type with pagination
      const { data: scores, error: scoresError } = await supabase
        .from("aggregated_scores")
        .select("media_item_id, final_score, total_votes")
        .eq("ranking_type", rankingType)
        .order("final_score", { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (scoresError) throw scoresError;
      if (!scores || scores.length === 0) {
        return { items: [], nextOffset: null };
      }

      const mediaItemIds = scores.map((s) => s.media_item_id);

      // Get media items with their source scores
      let mediaQuery = supabase
        .from("media_items")
        .select(`
          *,
          aggregated_scores (*),
          sources_scores (*)
        `)
        .in("id", mediaItemIds);

      if (type) {
        mediaQuery = mediaQuery.eq("type", type);
      }

      const { data: mediaItems, error: mediaError } = await mediaQuery;

      if (mediaError) throw mediaError;

      // Filter by genres if provided
      let filtered = mediaItems || [];
      if (genres && genres.length > 0) {
        filtered = filtered.filter((item) =>
          item.genres.some((g) => genres.includes(g))
        );
      }

      // Sort by ranking score
      const scoreMap = new Map(scores.map((s) => [s.media_item_id, s.final_score]));
      filtered.sort((a, b) => {
        const scoreA = scoreMap.get(a.id) || 0;
        const scoreB = scoreMap.get(b.id) || 0;
        return Number(scoreB) - Number(scoreA);
      });

      // Calculate if there's more data
      const nextOffset = scores.length === pageSize ? pageParam + pageSize : null;

      return {
        items: filtered as MediaItem[],
        nextOffset,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
}

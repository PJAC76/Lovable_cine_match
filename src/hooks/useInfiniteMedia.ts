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
  maxItems?: number;
}

export function useInfiniteMedia(options: UseInfiniteMediaOptions = {}) {
  const { type, rankingType = "historical", genres, pageSize = 5, maxItems = 50 } = options;

  return useInfiniteQuery({
    queryKey: ["infinite-media", type, rankingType, genres, pageSize, maxItems],
    queryFn: async ({ pageParam = 0 }) => {
      // Check if we've reached the max items limit
      if (pageParam >= maxItems) {
        return { items: [], nextOffset: null, totalLoaded: pageParam };
      }

      // Calculate how many items to fetch (don't exceed maxItems)
      const remainingItems = maxItems - pageParam;
      const itemsToFetch = Math.min(pageSize, remainingItems);

      // Get all aggregated scores for this ranking type first, then paginate
      const { data: allScores, error: allScoresError } = await supabase
        .from("aggregated_scores")
        .select("media_item_id, final_score, total_votes")
        .eq("ranking_type", rankingType)
        .order("final_score", { ascending: false });

      if (allScoresError) throw allScoresError;
      if (!allScores || allScores.length === 0) {
        return { items: [], nextOffset: null, totalLoaded: pageParam };
      }

      // Get all media item IDs
      const allMediaItemIds = allScores.map((s) => s.media_item_id);

      // Get all media items to filter by type
      let mediaQuery = supabase
        .from("media_items")
        .select(`
          *,
          aggregated_scores (*),
          sources_scores (*)
        `)
        .in("id", allMediaItemIds);

      if (type) {
        mediaQuery = mediaQuery.eq("type", type);
      }

      const { data: allMediaItems, error: mediaError } = await mediaQuery;

      if (mediaError) throw mediaError;

      // Filter by genres if provided
      let filtered = allMediaItems || [];
      if (genres && genres.length > 0) {
        filtered = filtered.filter((item) =>
          item.genres.some((g) => genres.includes(g))
        );
      }

      // Sort by ranking score
      const scoreMap = new Map(allScores.map((s) => [s.media_item_id, s.final_score]));
      filtered.sort((a, b) => {
        const scoreA = scoreMap.get(a.id) || 0;
        const scoreB = scoreMap.get(b.id) || 0;
        return Number(scoreB) - Number(scoreA);
      });

      // Apply pagination to the filtered and sorted results
      const paginatedItems = filtered.slice(pageParam, pageParam + itemsToFetch);

      // Calculate if there's more data
      const totalAvailable = filtered.length;
      const nextPageStart = pageParam + itemsToFetch;
      const hasMoreData = nextPageStart < totalAvailable && nextPageStart < maxItems;
      const nextOffset = hasMoreData ? nextPageStart : null;

      return {
        items: paginatedItems as MediaItem[],
        nextOffset,
        totalLoaded: pageParam + paginatedItems.length,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
}


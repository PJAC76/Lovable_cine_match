import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getYearRangesForRankingType } from "@/lib/dateRanges";

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

      // Get year ranges based on ranking type
      const { minYear, maxYear } = getYearRangesForRankingType(rankingType);

      // Get all media items filtered by year range
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

      const { data: allMediaItems, error: mediaError } = await mediaQuery;

      if (mediaError) throw mediaError;
      if (!allMediaItems || allMediaItems.length === 0) {
        return { items: [], nextOffset: null, totalLoaded: pageParam };
      }

      // Filter by genres if provided
      let filtered = allMediaItems;
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


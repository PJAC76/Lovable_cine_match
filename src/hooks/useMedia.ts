import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
      // First, get aggregated scores for the ranking type
      let scoresQuery = supabase
        .from("aggregated_scores")
        .select("media_item_id, final_score, total_votes")
        .eq("ranking_type", rankingType)
        .order("final_score", { ascending: false })
        .limit(limit);

      const { data: scores, error: scoresError } = await scoresQuery;
      
      if (scoresError) throw scoresError;
      if (!scores || scores.length === 0) return [];

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

      return filtered as MediaItem[];
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

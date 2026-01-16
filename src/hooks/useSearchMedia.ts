import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MediaItem } from "./useMedia";

interface SearchResult {
  items: MediaItem[];
  isSearching: boolean;
  error: string | null;
}

export function useSearchMedia() {
  const [searchResult, setSearchResult] = useState<SearchResult>({
    items: [],
    isSearching: false,
    error: null,
  });

  const searchMedia = async (query: string, type?: "movie" | "series") => {
    if (!query.trim()) {
      setSearchResult({ items: [], isSearching: false, error: null });
      return;
    }

    setSearchResult((prev) => ({ ...prev, isSearching: true, error: null }));

    try {
      let queryBuilder = supabase
        .from("media_items")
        .select(`
          *,
          aggregated_scores (*),
          sources_scores (*)
        `)
        .ilike("title", `%${query}%`);

      if (type) {
        queryBuilder = queryBuilder.eq("type", type);
      }

      const { data, error } = await queryBuilder.limit(10);

      if (error) throw error;

      setSearchResult({
        items: (data as MediaItem[]) || [],
        isSearching: false,
        error: null,
      });
    } catch (err) {
      setSearchResult({
        items: [],
        isSearching: false,
        error: err instanceof Error ? err.message : "Error al buscar",
      });
    }
  };

  const clearSearch = () => {
    setSearchResult({ items: [], isSearching: false, error: null });
  };

  return {
    ...searchResult,
    searchMedia,
    clearSearch,
  };
}

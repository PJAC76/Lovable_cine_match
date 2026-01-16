import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MediaItem } from "./useMedia";
import { toast } from "sonner";

export interface RecommendedItem extends MediaItem {
  ai_reason: string;
}

interface RecommendationsState {
  recommendations: RecommendedItem[];
  isLoading: boolean;
  error: string | null;
}

export function useRecommendations() {
  const [state, setState] = useState<RecommendationsState>({
    recommendations: [],
    isLoading: false,
    error: null,
  });

  const getRecommendations = async (favoriteIds: string[]) => {
    if (favoriteIds.length === 0) {
      toast.error("Añade al menos una serie o película a favoritas");
      return;
    }

    setState({ recommendations: [], isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke("get-recommendations", {
        body: { favoriteIds },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setState({
        recommendations: data.recommendations || [],
        isLoading: false,
        error: null,
      });

      if (data.recommendations?.length > 0) {
        toast.success(`¡${data.recommendations.length} recomendaciones encontradas!`);
      } else {
        toast.info("No se encontraron recomendaciones similares");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al obtener recomendaciones";
      setState({
        recommendations: [],
        isLoading: false,
        error: errorMsg,
      });
      toast.error(errorMsg);
    }
  };

  const clearRecommendations = () => {
    setState({ recommendations: [], isLoading: false, error: null });
  };

  return {
    ...state,
    getRecommendations,
    clearRecommendations,
  };
}

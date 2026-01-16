import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { favoriteIds } = await req.json();
    
    if (!favoriteIds || favoriteIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No favorites provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get favorite media items details
    const { data: favorites, error: favError } = await supabase
      .from("media_items")
      .select("id, title, genres, synopsis_short, year, type")
      .in("id", favoriteIds);

    if (favError) throw favError;
    if (!favorites || favorites.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "No se encontraron los favoritos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all available media items that are not in favorites
    const { data: allMedia, error: mediaError } = await supabase
      .from("media_items")
      .select("id, title, genres, synopsis_short, year, type")
      .not("id", "in", `(${favoriteIds.join(",")})`)
      .limit(100);

    if (mediaError) throw mediaError;

    // Build prompt for AI
    const favoritesInfo = favorites.map(f => 
      `- "${f.title}" (${f.year}): Géneros: ${f.genres?.join(", ") || "N/A"}. ${f.synopsis_short || ""}`
    ).join("\n");

    const catalogInfo = allMedia?.map(m =>
      `ID: ${m.id} | "${m.title}" (${m.year}) | Géneros: ${m.genres?.join(", ") || "N/A"} | ${m.synopsis_short || ""}`
    ).join("\n") || "";

    const systemPrompt = `Eres un experto en cine y series. Analiza los favoritos del usuario y recomienda contenido similar del catálogo disponible.

REGLAS:
1. Solo recomienda títulos del catálogo proporcionado
2. Busca similitudes por géneros, temáticas, época o estilo
3. Devuelve exactamente 5 recomendaciones o menos si no hay suficientes
4. Para cada recomendación explica brevemente por qué le gustará al usuario
5. Responde SIEMPRE en español`;

    const userPrompt = `FAVORITOS DEL USUARIO:
${favoritesInfo}

CATÁLOGO DISPONIBLE:
${catalogInfo}

Recomienda hasta 5 títulos similares del catálogo. Usa el tool suggest_recommendations para responder.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_recommendations",
              description: "Devuelve recomendaciones de películas/series basadas en favoritos",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        media_id: { type: "string", description: "ID del media item del catálogo" },
                        reason: { type: "string", description: "Razón breve en español de por qué le gustará" }
                      },
                      required: ["media_id", "reason"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["recommendations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_recommendations" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido, intenta más tarde" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere añadir créditos a Lovable AI" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("Error al obtener recomendaciones de IA");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("Respuesta de IA inválida");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const recommendationIds = parsed.recommendations.map((r: any) => r.media_id);

    // Get full media details for recommendations
    const { data: recommendedMedia, error: recError } = await supabase
      .from("media_items")
      .select(`
        *,
        aggregated_scores (*),
        sources_scores (*)
      `)
      .in("id", recommendationIds);

    if (recError) throw recError;

    // Merge AI reasons with media data
    const recommendations = recommendedMedia?.map(media => {
      const aiRec = parsed.recommendations.find((r: any) => r.media_id === media.id);
      return {
        ...media,
        ai_reason: aiRec?.reason || "Recomendado según tus gustos"
      };
    }) || [];

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Recommendation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

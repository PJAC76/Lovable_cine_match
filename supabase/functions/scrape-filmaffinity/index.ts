import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScrapedMedia {
  title: string;
  year: number;
  type: "movie" | "series";
  poster_url?: string;
  synopsis_short?: string;
  genres: string[];
  filmaffinity_score?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { mediaType, year, updateExisting } = await req.json();
    
    // FilmAffinity URLs for best movies/series by year
    const urls: Record<string, Record<number, string>> = {
      movie: {
        2025: "https://www.filmaffinity.com/es/topgen.php?genre=&fromyear=2025&toyear=2025&country=&nodoc&notvse",
        2024: "https://www.filmaffinity.com/es/topgen.php?genre=&fromyear=2024&toyear=2024&country=&nodoc&notvse",
      },
      series: {
        2025: "https://www.filmaffinity.com/es/topgen.php?genre=&fromyear=2025&toyear=2025&country=&nodoc=&notvse=&tvse",
        2024: "https://www.filmaffinity.com/es/topgen.php?genre=&fromyear=2024&toyear=2024&country=&nodoc=&notvse=&tvse",
      },
    };

    const targetType = mediaType || "movie";
    const targetYear = year || 2025;
    const url = urls[targetType]?.[targetYear];

    if (!url) {
      throw new Error(`No URL configured for ${targetType} ${targetYear}`);
    }

    console.log(`Scraping ${targetType}s from ${targetYear}: ${url}`);

    // Scrape the page using Firecrawl - request markdown format
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      throw new Error(scrapeData.error || "Failed to scrape FilmAffinity");
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

    console.log("Scraped markdown length:", markdown.length, "chars");

    // Parse the scraped content to extract media items
    const mediaItems = parseFilmAffinityMarkdown(markdown, targetType, targetYear);

    console.log(`Parsed ${mediaItems.length} ${targetType}s`);

    // Log first few items for debugging
    mediaItems.slice(0, 5).forEach((item, i) => {
      console.log(`Item ${i + 1}: ${item.title} - Score: ${item.filmaffinity_score} - Poster: ${item.poster_url ? 'YES' : 'NO'}`);
    });

    // Insert or update database
    const insertedItems: string[] = [];
    const updatedItems: string[] = [];
    const errors: string[] = [];

    for (const item of mediaItems) {
      try {
        // Check if item already exists
        const { data: existing } = await supabase
          .from("media_items")
          .select("id, poster_url")
          .eq("title", item.title)
          .eq("year", item.year)
          .eq("type", item.type)
          .maybeSingle();

        if (existing) {
          if (updateExisting) {
            // Update existing item with new data
            const updates: Record<string, unknown> = {};
            if (item.poster_url && !existing.poster_url) {
              updates.poster_url = item.poster_url;
            }
            if (item.genres?.length > 0) {
              updates.genres = item.genres;
            }

            if (Object.keys(updates).length > 0) {
              await supabase
                .from("media_items")
                .update(updates)
                .eq("id", existing.id);
            }

            // Update or insert scores
            if (item.filmaffinity_score) {
              // Upsert source score
              const { data: existingScore } = await supabase
                .from("sources_scores")
                .select("id")
                .eq("media_item_id", existing.id)
                .eq("source", "filmaffinity")
                .maybeSingle();

              if (existingScore) {
                await supabase
                  .from("sources_scores")
                  .update({ score_normalized: item.filmaffinity_score })
                  .eq("id", existingScore.id);
              } else {
                await supabase.from("sources_scores").insert({
                  media_item_id: existing.id,
                  source: "filmaffinity",
                  score_normalized: item.filmaffinity_score,
                  votes_count: 0,
                });
              }

              // Upsert aggregated score
              const { data: existingAgg } = await supabase
                .from("aggregated_scores")
                .select("id")
                .eq("media_item_id", existing.id)
                .eq("ranking_type", "recent")
                .maybeSingle();

              if (existingAgg) {
                await supabase
                  .from("aggregated_scores")
                  .update({ final_score: item.filmaffinity_score })
                  .eq("id", existingAgg.id);
              } else {
                await supabase.from("aggregated_scores").insert({
                  media_item_id: existing.id,
                  ranking_type: "recent",
                  final_score: item.filmaffinity_score,
                  total_votes: 0,
                });
              }
            }

            updatedItems.push(item.title);
            console.log(`Updated: ${item.title}`);
          } else {
            console.log(`Skipping existing: ${item.title} (${item.year})`);
          }
          continue;
        }

        // Insert new media item
        const { data: insertedMedia, error: insertError } = await supabase
          .from("media_items")
          .insert({
            title: item.title,
            year: item.year,
            type: item.type,
            poster_url: item.poster_url,
            synopsis_short: item.synopsis_short,
            genres: item.genres,
          })
          .select()
          .single();

        if (insertError) {
          errors.push(`Failed to insert ${item.title}: ${insertError.message}`);
          continue;
        }

        // Insert FilmAffinity score if available
        if (item.filmaffinity_score && insertedMedia) {
          await supabase.from("sources_scores").insert({
            media_item_id: insertedMedia.id,
            source: "filmaffinity",
            score_normalized: item.filmaffinity_score,
            votes_count: 0,
          });

          // Create aggregated score
          await supabase.from("aggregated_scores").insert({
            media_item_id: insertedMedia.id,
            ranking_type: "recent",
            final_score: item.filmaffinity_score,
            total_votes: 0,
          });
        }

        insertedItems.push(item.title);
        console.log(`Inserted: ${item.title} (${item.year}) - Score: ${item.filmaffinity_score}`);
      } catch (err) {
        errors.push(`Error processing ${item.title}: ${err}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scraped: mediaItems.length,
        inserted: insertedItems.length,
        updated: updatedItems.length,
        insertedTitles: insertedItems,
        updatedTitles: updatedItems,
        errors,
        sampleItems: mediaItems.slice(0, 5),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scraper error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseFilmAffinityMarkdown(
  markdown: string,
  type: "movie" | "series",
  year: number
): ScrapedMedia[] {
  const items: ScrapedMedia[] = [];
  
  // FilmAffinity markdown format from the ranking page:
  // - [![Title (Info)](https://pics.filmaffinity.com/xxx-msmall.jpg)](https://www.filmaffinity.com/es/filmXXX.html)
  // [Title](https://www.filmaffinity.com/es/filmXXX.html)
  // ... other info ...
  // - 8,1 (score)
  // 572 (votes)

  // Pattern to find movie entries with poster and link
  // Looking for: [![...](poster_url)](film_url)
// ...
// [Title](film_url)
  const entryPattern = /\\[!\[[^\]]*\]\((https:\/\/pics\.filmaffinity\.com\/[^)]+)\)\]\([^)]+\)[\s\S]*?\[([^\]]+)\]\(https:\/\/www\.filmaffinity\.com\/es\/film\d+\.html[^)]*\)[\s\S]*-(\d[\.,]\d)/g;
  
  let match;
  while ((match = entryPattern.exec(markdown)) !== null) {
    const posterUrl = match[1];
    const title = cleanTitle(match[2]);
    const score = parseFloat(match[3].replace(",", "."));
    
    if (title && title.length > 1 && title.length < 150) {
      // Convert small poster to medium size
      const mediumPoster = posterUrl.replace("-msmall.", "-mmed.");
      
      items.push({
        title,
        year,
        type,
        poster_url: mediumPoster,
        genres: [],
        filmaffinity_score: score,
      });
    }
  }

  // If the first pattern didn't work well, try alternative approach
  if (items.length < 5) {
    console.log("Trying alternative parsing...");
    
    // Extract all posters
    const posterPattern = /\\[!\[[^\]]*\]\((https:\/\/pics\.filmaffinity\.com\/[^)]+)\)\]/g;
    const posters: string[] = [];
    while ((match = posterPattern.exec(markdown)) !== null) {
      posters.push(match[1].replace("-msmall.", "-mmed."));
    }
    
    // Extract all titles with film links
    const titlePattern = /\[([^\]]+)\]\(https:\/\/www\.filmaffinity\.com\/es\/film\d+\.html[^)]*\)/g;
    const titles: string[] = [];
    while ((match = titlePattern.exec(markdown)) !== null) {
      const title = cleanTitle(match[1]);
      // Avoid duplicates and short titles, filter out UI elements
      if (title && title.length > 2 && title.length < 150 && 
          !title.includes("Sort by") && !title.includes("Copia") &&
          !titles.includes(title)) {
        titles.push(title);
      }
    }
    
    // Extract all scores (format: "- 7,8" or "- 8,1")
    const scorePattern = /-\s*(\d[\.,]\d)\n/g;
    const scores: number[] = [];
    while ((match = scorePattern.exec(markdown)) !== null) {
      scores.push(parseFloat(match[1].replace(",", ".")));
    }
    
    console.log(`Found ${titles.length} titles, ${scores.length} scores, ${posters.length} posters`);
    
    // Clear previous items and rebuild
    items.length = 0;
    
    // Match by position
    for (let i = 0; i < titles.length && i < 50; i++) {
      items.push({
        title: titles[i],
        year,
        type,
        poster_url: i < posters.length ? posters[i] : undefined,
        genres: [],
        filmaffinity_score: i < scores.length ? scores[i] : undefined,
      });
    }
  }

  // Filter out items without scores (likely parsing errors)
  const validItems = items.filter(item => 
    item.filmaffinity_score && 
    item.filmaffinity_score >= 1 && 
    item.filmaffinity_score <= 10
  );

  return validItems.slice(0, 50);
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*\(Serie de TV\)\s*/gi, "")
    .replace(/\s*\(Miniserie de TV\)\s*/gi, "")
    .replace(/\s*\(TV\)\s*/gi, "")
    .replace(/\s*\(Serie\)\s*/gi, "")
    .replace(/\s*\(Miniserie\)\s*/gi, "")
    .trim();
}

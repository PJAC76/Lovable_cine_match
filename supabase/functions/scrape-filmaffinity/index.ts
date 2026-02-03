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
  filmId?: string;
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

    const { mediaType, year, updateExisting, forceUpdatePosters, forceUpdateSynopsis } = await req.json();
    
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
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    // Now fetch individual movie pages for synopsis (first 30 items)
    const fetchSynopsis = async (filmId: string): Promise<string | undefined> => {
      try {
        const filmUrl = `https://www.filmaffinity.com/es/film${filmId}.html`;
        const filmResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: filmUrl,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 2000,
          }),
        });
        
        const filmData = await filmResponse.json();
        const filmMarkdown = filmData.data?.markdown || filmData.markdown || "";
        
        // Extract synopsis from the movie page
        // FilmAffinity format: "...GéneroXXXSinopsisActual synopsis text here.\n\n[![..."
        // The synopsis is directly after "Sinopsis" word, no line breaks
        let synopsisMatch = filmMarkdown.match(/Sinopsis\s*([^[\n]+)/i);
        if (synopsisMatch) {
          let synopsis = synopsisMatch[1].trim();
          // Clean up and limit length
          synopsis = synopsis.replace(/\s+/g, ' ').trim();
          // Remove trailing markup if any
          synopsis = synopsis.replace(/\[!\[.*$/, '').trim();
          if (synopsis.length > 20 && synopsis.length < 500) {
            if (synopsis.length > 300) {
              synopsis = synopsis.substring(0, 297) + '...';
            }
            return synopsis;
          }
        }
        
        // Alternative: look for text after "Género" section that looks like a synopsis
        const altMatch = filmMarkdown.match(/Género[^\n]+\n([A-ZÁÉÍÓÚ][^[\n]{50,})/);
        if (altMatch) {
          let synopsis = altMatch[1].trim();
          if (synopsis.length > 300) {
            synopsis = synopsis.substring(0, 297) + '...';
          }
          return synopsis;
        }
        
        return undefined;
      } catch (err) {
        console.error(`Error fetching synopsis for film ${filmId}:`, err);
        return undefined;
      }
    };

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      throw new Error(scrapeData.error || "Failed to scrape FilmAffinity");
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

    console.log("Scraped markdown length:", markdown.length, "chars");
    // Log a sample of markdown for debugging
    console.log("Markdown sample:", markdown.substring(0, 500));

    // Parse the scraped content to extract media items
    const mediaItems = parseFilmAffinityMarkdown(markdown, targetType, targetYear);

    console.log(`Parsed ${mediaItems.length} ${targetType}s`);

    // Log first few items for debugging
    mediaItems.slice(0, 5).forEach((item, i) => {
      console.log(`Item ${i + 1}: ${item.title} - Score: ${item.filmaffinity_score} - Poster: ${item.poster_url ? item.poster_url.substring(0, 60) : 'NO'} - FilmId: ${item.filmId}`);
    });

    // Fetch synopsis for first 10 items (to save API calls and avoid timeout)
    console.log("Fetching synopsis for top items...");
    const synopsisLimit = 10;
    for (let i = 0; i < Math.min(mediaItems.length, synopsisLimit); i++) {
      const item = mediaItems[i];
      if (item.filmId) {
        const synopsis = await fetchSynopsis(item.filmId);
        if (synopsis) {
          item.synopsis_short = synopsis;
          console.log(`Synopsis for ${item.title}: ${synopsis.substring(0, 50)}...`);
        }
      }
    }

    // Insert or update database
    const insertedItems: string[] = [];
    const updatedItems: string[] = [];
    const errors: string[] = [];

    for (const item of mediaItems) {
      try {
        // Check if item already exists
        const { data: existing } = await supabase
          .from("media_items")
          .select("id, poster_url, synopsis_short")
          .eq("title", item.title)
          .eq("year", item.year)
          .eq("type", item.type)
          .maybeSingle();

        if (existing) {
          if (updateExisting) {
            // Update existing item with new data
            const updates: Record<string, unknown> = {};
            
            // Update poster if we have one and either force update or no existing
            if (item.poster_url && (forceUpdatePosters || !existing.poster_url)) {
              updates.poster_url = item.poster_url;
            }
            // Update synopsis if we have a real one (not placeholder) and either force or existing is placeholder
            const isPlaceholderSynopsis = existing.synopsis_short?.startsWith("Película de") || 
                                          existing.synopsis_short?.startsWith("Serie de") ||
                                          !existing.synopsis_short;
            if (item.synopsis_short && (forceUpdateSynopsis || isPlaceholderSynopsis)) {
              updates.synopsis_short = item.synopsis_short;
            }
            if (item.genres?.length > 0) {
              updates.genres = item.genres;
            }

            if (Object.keys(updates).length > 0) {
              const { error: updateError } = await supabase
                .from("media_items")
                .update(updates)
                .eq("id", existing.id);
              
              if (updateError) {
                console.error(`Error updating ${item.title}:`, updateError);
              } else {
                console.log(`Updated ${item.title} with:`, Object.keys(updates));
              }
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
  
  // FilmAffinity markdown format:
  // [![Title](https://pics.filmaffinity.com/xxx-msmall.jpg)](link)
  // [Title](https://www.filmaffinity.com/es/filmXXX.html)
  // Info text
  // - 8,1
  // votes

  // Extract all posters - looking for FilmAffinity image URLs
  const posterRegex = /https:\/\/pics\.filmaffinity\.com\/[^\s\)\]"]+/g;
  const allPosters: string[] = [];
  let posterMatch;
  while ((posterMatch = posterRegex.exec(markdown)) !== null) {
    const url = posterMatch[0];
    // Only keep actual movie posters (exclude icons, logos)
    if (url.includes("-m") && (url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".webp"))) {
      // Convert to medium size
      const mediumUrl = url.replace("-msmall.", "-mmed.").replace("-small.", "-mmed.");
      if (!allPosters.includes(mediumUrl)) {
        allPosters.push(mediumUrl);
      }
    }
  }
  
  console.log(`Found ${allPosters.length} unique posters`);
  
  // Extract titles with film links
  const titleRegex = /\[([^\]]+)\]\(https:\/\/www\.filmaffinity\.com\/es\/film(\d+)\.html[^\)]*\)/g;
  const titleEntries: { title: string; filmId: string }[] = [];
  let titleMatch;
  while ((titleMatch = titleRegex.exec(markdown)) !== null) {
    const rawTitle = titleMatch[1];
    const filmId = titleMatch[2];
    const title = cleanTitle(rawTitle);
    
    // Filter out navigation elements and duplicates
    if (title && 
        title.length > 2 && 
        title.length < 150 && 
        !title.toLowerCase().includes("sort") &&
        !title.toLowerCase().includes("copia") &&
        !title.toLowerCase().includes("copy") &&
        !titleEntries.find(e => e.filmId === filmId)) {
      titleEntries.push({ title, filmId });
    }
  }
  
  console.log(`Found ${titleEntries.length} unique titles`);
  
  // Extract scores - format: "- 7,8" or "- 8,1" followed by newline
  const scoreRegex = /- (\d[\.,]\d)\n/g;
  const scores: number[] = [];
  let scoreMatch;
  while ((scoreMatch = scoreRegex.exec(markdown)) !== null) {
    const score = parseFloat(scoreMatch[1].replace(",", "."));
    if (score >= 1 && score <= 10) {
      scores.push(score);
    }
  }
  
  console.log(`Found ${scores.length} scores`);
  
  // Try to match posters to films by their ID in the URL
  // FilmAffinity poster URLs often contain a slug related to the movie
  const posterMap = new Map<number, string>();
  
  // For each poster, try to find its position/order
  for (let i = 0; i < allPosters.length && i < titleEntries.length; i++) {
    posterMap.set(i, allPosters[i]);
  }
  
  // Build items by matching titles with scores and posters by position
  for (let i = 0; i < titleEntries.length && i < 50; i++) {
    const { title, filmId } = titleEntries[i];
    const score = i < scores.length ? scores[i] : undefined;
    const poster = posterMap.get(i);
    
    items.push({
      title,
      year,
      type,
      poster_url: poster,
      genres: [],
      filmaffinity_score: score,
      filmId,
    });
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
    .replace(/\s*\(\d{4}\)\s*/g, "") // Remove year in parentheses
    .trim();
}

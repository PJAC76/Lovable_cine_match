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

    const { mediaType, year } = await req.json();
    
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

    // Scrape the page using Firecrawl
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      throw new Error(scrapeData.error || "Failed to scrape FilmAffinity");
    }

    const html = scrapeData.data?.html || scrapeData.html || "";
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

    console.log("Scraped content length:", html.length, "chars");
    console.log("Markdown preview:", markdown.substring(0, 500));

    // Parse the scraped content to extract media items
    const mediaItems = parseFilmAffinityContent(html, markdown, targetType, targetYear);

    console.log(`Parsed ${mediaItems.length} ${targetType}s`);

    // Insert into database
    const insertedItems: string[] = [];
    const errors: string[] = [];

    for (const item of mediaItems) {
      try {
        // Check if item already exists
        const { data: existing } = await supabase
          .from("media_items")
          .select("id")
          .eq("title", item.title)
          .eq("year", item.year)
          .eq("type", item.type)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping existing: ${item.title} (${item.year})`);
          continue;
        }

        // Insert media item
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
        console.log(`Inserted: ${item.title} (${item.year})`);
      } catch (err) {
        errors.push(`Error processing ${item.title}: ${err}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scraped: mediaItems.length,
        inserted: insertedItems.length,
        insertedTitles: insertedItems,
        errors,
        rawMarkdown: markdown.substring(0, 2000),
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

function parseFilmAffinityContent(
  html: string,
  markdown: string,
  type: "movie" | "series",
  year: number
): ScrapedMedia[] {
  const items: ScrapedMedia[] = [];

  // Try to extract from markdown - FilmAffinity lists usually have format:
  // Title - Score - Year
  // Or in table format with rankings

  // Pattern 1: Look for movie titles with scores in markdown
  // Format usually: "1. Movie Title (7.5)"
  const titleScorePattern = /(\d+)\.\s*\[?([^\]\(\n]+?)(?:\]|\s*)\(?(\d[\.,]\d)?\)?/g;
  let match;

  while ((match = titleScorePattern.exec(markdown)) !== null) {
    const title = match[2].trim().replace(/\*\*/g, "").replace(/\[|\]/g, "");
    const score = match[3] ? parseFloat(match[3].replace(",", ".")) : undefined;

    if (title && title.length > 2 && title.length < 150) {
      items.push({
        title,
        year,
        type,
        genres: [],
        filmaffinity_score: score,
      });
    }
  }

  // Pattern 2: Look for titles in HTML links
  // FilmAffinity uses links like /es/film123456.html
  const linkPattern = /<a[^>]*href="[^"]*\/film\d+\.html"[^>]*>([^<]+)<\/a>/gi;
  while ((match = linkPattern.exec(html)) !== null) {
    const title = match[1].trim();
    
    // Avoid duplicates
    if (title && title.length > 2 && !items.find(i => i.title === title)) {
      items.push({
        title,
        year,
        type,
        genres: [],
      });
    }
  }

  // Pattern 3: Look for score values near titles
  const scorePattern = /<div[^>]*class="[^"]*avgrat[^"]*"[^>]*>(\d[\.,]\d)<\/div>/gi;
  const scores: number[] = [];
  while ((match = scorePattern.exec(html)) !== null) {
    scores.push(parseFloat(match[1].replace(",", ".")));
  }

  // Associate scores with items that don't have them
  let scoreIndex = 0;
  for (const item of items) {
    if (!item.filmaffinity_score && scoreIndex < scores.length) {
      item.filmaffinity_score = scores[scoreIndex++];
    }
  }

  // Limit to top 50 items
  return items.slice(0, 50);
}

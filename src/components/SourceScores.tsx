import type { Tables } from "@/integrations/supabase/types";

interface SourceScoresProps {
  scores: Tables<"sources_scores">[];
}

const sourceNames: Record<string, string> = {
  forocoches: "Forocoches",
  filmaffinity: "Filmaffinity",
  reddit: "Reddit",
};

const sourceColors: Record<string, string> = {
  forocoches: "bg-blue-500",
  filmaffinity: "bg-green-500",
  reddit: "bg-orange-500",
};

export function SourceScores({ scores }: SourceScoresProps) {
  if (!scores || scores.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Puntuaciones por fuente</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {scores.map((score) => (
          <div
            key={score.id}
            className="bg-muted/50 rounded-lg p-3 flex items-center gap-3"
          >
            <div
              className={`w-3 h-3 rounded-full ${sourceColors[score.source] || "bg-gray-500"}`}
            />
            <div className="flex-1">
              <div className="text-sm font-medium">
                {sourceNames[score.source] || score.source}
              </div>
              <div className="text-xs text-muted-foreground">
                {score.votes_count.toLocaleString()} votos
              </div>
            </div>
            <div className="text-xl font-bold">
              {Number(score.score_normalized).toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

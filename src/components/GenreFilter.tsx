import { cn } from "@/lib/utils";
import { useAllGenres } from "@/hooks/useMedia";

interface GenreFilterProps {
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
}

export function GenreFilter({ selectedGenres, onGenreToggle }: GenreFilterProps) {
  const { data: genres = [], isLoading } = useAllGenres();

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-20 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  const handleClearAll = () => {
    selectedGenres.forEach(onGenreToggle);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleClearAll}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all",
          selectedGenres.length === 0
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        Todos
      </button>
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => onGenreToggle(genre)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            selectedGenres.includes(genre)
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}

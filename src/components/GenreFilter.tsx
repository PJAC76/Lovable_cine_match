import { cn } from "@/lib/utils";
import { allGenres } from "@/lib/mockData";

interface GenreFilterProps {
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
}

export function GenreFilter({ selectedGenres, onGenreToggle }: GenreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => selectedGenres.length > 0 && selectedGenres.forEach(onGenreToggle)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all",
          selectedGenres.length === 0
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        Todos
      </button>
      {allGenres.map((genre) => (
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

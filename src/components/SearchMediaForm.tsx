import { useState } from "react";
import { Search, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchMedia } from "@/hooks/useSearchMedia";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/hooks/useMedia";

interface SearchMediaFormProps {
  onAddFavorite: (id: string) => void;
  existingFavoriteIds: string[];
}

export function SearchMediaForm({ onAddFavorite, existingFavoriteIds }: SearchMediaFormProps) {
  const [query, setQuery] = useState("");
  const { items, isSearching, error, searchMedia, clearSearch } = useSearchMedia();
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      searchMedia(query);
      setShowResults(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    clearSearch();
    setShowResults(false);
  };

  const handleAdd = (item: MediaItem) => {
    onAddFavorite(item.id);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar series o películas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Buscar"
          )}
        </Button>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isSearching && (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="p-4 flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {!isSearching && !error && items.length === 0 && query && (
            <div className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No se encontró "{query}" en las fuentes
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Prueba con otro título o verifica la ortografía
              </p>
            </div>
          )}

          {!isSearching && items.length > 0 && (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const isAlreadyFavorite = existingFavoriteIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <img
                      src={item.poster_url || "/placeholder.svg"}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.year} · {item.type === "series" ? "Serie" : "Película"} · {item.genres?.slice(0, 2).join(", ")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isAlreadyFavorite ? "secondary" : "default"}
                      onClick={() => handleAdd(item)}
                      disabled={isAlreadyFavorite}
                    >
                      {isAlreadyFavorite ? (
                        "Añadida"
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Añadir
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

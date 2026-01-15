import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <Film className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">
              Cine<span className="text-gold">Match</span>
            </span>
          </div>

          {/* Info */}
          <p className="text-sm text-muted-foreground text-center">
            Rankings basados en Forocoches, FilmAffinity y Reddit
          </p>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © 2024 CineMatch
          </p>
        </div>
      </div>
    </footer>
  );
}

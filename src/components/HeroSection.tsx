import { Sparkles, TrendingUp, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative py-12 md:py-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative container text-center space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-up">
          Descubre qué ver
          <span className="text-gradient-gold block mt-2">sin perder tiempo</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Rankings basados en opiniones reales de comunidades especializadas. 
          Sin algoritmos ocultos, solo lo mejor valorado.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 pt-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">Top 10</p>
              <p className="text-sm text-muted-foreground">Rankings fiables</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">+100K</p>
              <p className="text-sm text-muted-foreground">Votos analizados</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">3 Fuentes</p>
              <p className="text-sm text-muted-foreground">Agregadas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

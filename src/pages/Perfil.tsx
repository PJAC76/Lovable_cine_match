import { Layout } from "@/components/Layout";
import { User, LogIn, LogOut, Settings, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Perfil = () => {
  // Mock user state - in real app, this would come from auth
  const isLoggedIn = false;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {isLoggedIn ? "Pedro García" : "Invitado"}
          </h1>
          <p className="text-muted-foreground">
            {isLoggedIn ? "pedro@email.com" : "Inicia sesión para guardar tus preferencias"}
          </p>
        </div>

        {/* Auth Card */}
        {!isLoggedIn && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-primary" />
                Accede a tu cuenta
              </CardTitle>
              <CardDescription>
                Guarda tus favoritas y recibe recomendaciones personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="lg">
                Iniciar sesión
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Crear cuenta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Ajustes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <span>Preferencias de género</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <span>Notificaciones</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <span>Privacidad</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            {isLoggedIn && (
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-destructive">
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </span>
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Perfil;

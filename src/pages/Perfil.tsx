import { useState } from "react";
import { Layout } from "@/components/Layout";
import { User, LogIn, LogOut, Settings, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Perfil = () => {
  const { user, loading, isAuthenticated, signIn, signUp, signOut } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("¡Bienvenido de nuevo!");
      } else {
        await signUp(email, password);
        toast.success("¡Cuenta creada correctamente!");
      }
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Error de autenticación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada");
    } catch (error: any) {
      toast.error("Error al cerrar sesión");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {isAuthenticated ? user?.email?.split("@")[0] : "Invitado"}
          </h1>
          <p className="text-muted-foreground">
            {isAuthenticated ? user?.email : "Inicia sesión para guardar tus preferencias"}
          </p>
        </div>

        {/* Auth Card */}
        {!isAuthenticated && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-primary" />
                {isLogin ? "Iniciar sesión" : "Crear cuenta"}
              </CardTitle>
              <CardDescription>
                Guarda tus favoritas y recibe recomendaciones personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                    title="La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas y números"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres con mayúsculas, minúsculas y números
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isLogin ? "Iniciar sesión" : "Crear cuenta"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                </Button>
              </form>
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
            {isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-destructive"
              >
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

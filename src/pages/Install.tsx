import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if already installed
  if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    });

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;

  return (
    <Layout>
      <div className="container max-w-lg py-12">
        <div className="text-center space-y-6">
          <img
            src="/pwa-192x192.png"
            alt="RankingApp"
            className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
          />

          <div>
            <h1 className="text-3xl font-bold mb-2">Instalar RankingApp</h1>
            <p className="text-muted-foreground">
              Añade la app a tu pantalla de inicio para un acceso más rápido
            </p>
          </div>

          {isStandalone || isInstalled ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-500 font-medium">
                ✓ App ya instalada
              </p>
            </div>
          ) : isIOS ? (
            <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
              <h2 className="font-semibold">Cómo instalar en iOS:</h2>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    1
                  </span>
                  <span>
                    Pulsa el botón <Share className="w-4 h-4 inline" /> en Safari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    2
                  </span>
                  <span>Desplázate y selecciona "Añadir a pantalla de inicio"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    3
                  </span>
                  <span>Pulsa "Añadir" para confirmar</span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button size="lg" onClick={handleInstall} className="w-full">
              <Download className="w-5 h-5 mr-2" />
              Instalar App
            </Button>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
              <h2 className="font-semibold">Cómo instalar en Android:</h2>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    1
                  </span>
                  <span>Abre el menú del navegador (⋮)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    2
                  </span>
                  <span>Selecciona "Instalar app" o "Añadir a pantalla de inicio"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    3
                  </span>
                  <span>Confirma la instalación</span>
                </li>
              </ol>
            </div>
          )}

          <div className="pt-4">
            <h3 className="font-semibold mb-3">Ventajas de instalar:</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>✓ Acceso rápido desde tu pantalla de inicio</li>
              <li>✓ Funciona sin conexión</li>
              <li>✓ Experiencia de app nativa</li>
              <li>✓ Carga más rápida</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

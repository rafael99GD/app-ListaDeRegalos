import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Zap } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Comprobar si ya está en modo standalone (PWA instalada)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Comprobar si fue desestimado en los últimos 7 días
    const dismissedTimestamp = localStorage.getItem('wishlist_pwa_dismissed_at');
    if (dismissedTimestamp) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTimestamp, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // 3. Detectar si es iOS Safari
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);

    if (isIos && isSafari) {
      setIsIosDevice(true);
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }

    // 4. Capturar evento nativo en Chromium / Android / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setIsVisible(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem('wishlist_pwa_dismissed_at');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIosDevice) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error al solicitar instalación PWA:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIosGuide(false);
    localStorage.setItem('wishlist_pwa_dismissed_at', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Aviso de instalación de la aplicación"
      className="fixed z-40 bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-zinc-800 text-zinc-100">
        <div className="flex items-start gap-3">
          {/* Icono de la App */}
          <div className="relative shrink-0 w-11 h-11 rounded-lg bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden">
            <img
              src="/pwa-192x192.png"
              alt="Wishlist Hub"
              className="w-full h-full object-cover rounded-md"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <Zap className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-sky-400 fill-sky-400" />
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-zinc-100 leading-tight">
                Wishlist Hub App
              </h4>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-sky-950/80 text-sky-400 border border-sky-800/60">
                PWA
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-snug">
              Instala la aplicación para una navegación rápida a pantalla completa y acceso offline.
            </p>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleDismiss}
            aria-label="Cerrar aviso de instalación"
            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guía iOS */}
        {showIosGuide ? (
          <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs space-y-2 text-zinc-300">
            <p className="font-medium text-sky-400 flex items-center gap-1.5">
              📱 Instalación en Safari iOS:
            </p>
            <ol className="space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300 shrink-0">
                  1
                </span>
                <span>
                  Pulsa el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" /> en la barra inferior.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300 shrink-0">
                  2
                </span>
                <span>
                  Selecciona <strong>Añadir a pantalla de inicio</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" />.
                </span>
              </li>
            </ol>
            <div className="pt-1 flex justify-end">
              <button
                onClick={handleDismiss}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        ) : (
          /* Acciones Android / Desktop */
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-end gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-sky-400 hover:bg-sky-300 rounded-lg shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar app</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

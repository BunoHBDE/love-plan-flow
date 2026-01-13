import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Cookie, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const COOKIE_CONSENT_KEY = 'ayllah_cookie_consent';

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true, // Always true, cannot be changed
  functional: true,
  analytics: true,
  marketing: false,
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptEssential = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(essentialOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Main Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card border border-border rounded-2xl shadow-medium p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-xl bg-accent/20 items-center justify-center">
                <Cookie className="w-6 h-6 text-accent" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-1">
                    Utilizamos cookies 🍪
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Usamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. 
                    Ao clicar em "Aceitar todos", você concorda com o uso de cookies. 
                    Saiba mais em nossa{' '}
                    <Link to="/cookies" className="text-accent hover:underline">
                      Política de Cookies
                    </Link>
                    .
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button variant="gold" onClick={handleAcceptAll}>
                    Aceitar todos
                  </Button>
                  <Button variant="outline" onClick={handleAcceptEssential}>
                    Apenas essenciais
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Personalizar
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleAcceptEssential}
                className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-accent" />
              Preferências de Cookies
            </DialogTitle>
            <DialogDescription>
              Personalize quais cookies você deseja permitir. Cookies essenciais são necessários para o funcionamento do site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Essential */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Cookies Essenciais</Label>
                <p className="text-sm text-muted-foreground">
                  Necessários para o funcionamento básico do site. Não podem ser desativados.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Functional */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Cookies de Funcionalidade</Label>
                <p className="text-sm text-muted-foreground">
                  Permitem lembrar suas preferências e configurações.
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, functional: checked }))
                }
              />
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Cookies de Análise</Label>
                <p className="text-sm text-muted-foreground">
                  Nos ajudam a entender como você usa o site para melhorá-lo.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Cookies de Marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Usados para exibir anúncios relevantes para você.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={handleAcceptEssential}>
              Recusar opcionais
            </Button>
            <Button variant="gold" className="flex-1" onClick={handleSavePreferences}>
              Salvar preferências
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Saiba mais em nossa{' '}
            <Link to="/cookies" className="text-accent hover:underline">
              Política de Cookies
            </Link>
            {' '}e{' '}
            <Link to="/privacidade" className="text-accent hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

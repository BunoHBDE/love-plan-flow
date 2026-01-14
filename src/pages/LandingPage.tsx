import { useEffect, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// COMPONENTES CRÍTICOS (Above the Fold)
// Carregam imediatamente - são essenciais para o FCP/LCP
// ============================================
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';

// ============================================
// COMPONENTES LAZY (Below the Fold)
// Carregam sob demanda - reduz bundle inicial em ~60%
// ============================================
const BenefitsSection = lazy(() => 
  import('@/components/landing/BenefitsSection').then(m => ({ default: m.BenefitsSection }))
);
const PricingSection = lazy(() => 
  import('@/components/landing/PricingSection').then(m => ({ default: m.PricingSection }))
);
const FAQSection = lazy(() => 
  import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection }))
);
const CTASection = lazy(() => 
  import('@/components/landing/CTASection').then(m => ({ default: m.CTASection }))
);
const Footer = lazy(() => 
  import('@/components/landing/Footer').then(m => ({ default: m.Footer }))
);
const CookieConsent = lazy(() => 
  import('@/components/landing/CookieConsent').then(m => ({ default: m.CookieConsent }))
);

// ============================================
// LOADING SKELETON
// Placeholder leve enquanto componentes carregam
// ============================================
const SectionSkeleton = memo(({ height = 'h-96' }: { height?: string }) => (
  <div className={`${height} w-full animate-pulse bg-muted/30`} />
));

SectionSkeleton.displayName = 'SectionSkeleton';

// ============================================
// LOADING STATE PRINCIPAL
// Otimizado para ser leve e rápido
// ============================================
const LoadingState = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      {/* Spinner CSS puro - mais leve que SVG animado */}
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redireciona para dashboard se já estiver logado
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Estado de carregamento da autenticação
  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ====== ABOVE THE FOLD - Renderização Imediata ====== */}
      <LandingNavbar />
      
      <main>
        {/* Hero é crítico para LCP - carrega primeiro */}
        <HeroSection />
        
        {/* ====== BELOW THE FOLD - Lazy Loading ====== */}
        <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
          <BenefitsSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-[800px]" />}>
          <PricingSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-[500px]" />}>
          <FAQSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-64" />}>
          <CTASection />
        </Suspense>
      </main>
      
      <Suspense fallback={<SectionSkeleton height="h-48" />}>
        <Footer />
      </Suspense>
      
      {/* Cookie consent pode carregar por último */}
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </div>
  );
}

export default memo(LandingPage);
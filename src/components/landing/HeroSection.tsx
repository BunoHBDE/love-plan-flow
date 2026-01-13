import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const highlights = [
    '14 dias grátis',
    'Sem cartão de crédito',
    'Cancele quando quiser',
  ];

  return (
    <section className="pt-24 md:pt-32 pb-16 md:pb-24 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-6 animate-fade-in">
            <span className="text-sm font-medium">✨ Sistema completo de gestão</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6 animate-slide-up">
            Simplifique a gestão do seu{' '}
            <span className="text-gradient-gold">espaço de eventos</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Orçamentos profissionais, controle de visitas e disponibilidade em tempo real.
            Tudo em um único lugar para você fechar mais contratos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Button variant="gold" size="xl" asChild>
              <Link to="/auth?mode=signup" className="flex items-center gap-2">
                Experimente 14 dias grátis
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#precos">Ver preços</a>
            </Button>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-secondary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image/Mockup Placeholder */}
        <div className="mt-12 md:mt-16 max-w-5xl mx-auto animate-scale-in" style={{ animationDelay: '400ms' }}>
          <div className="relative rounded-2xl overflow-hidden shadow-medium border border-border bg-card">
            <div className="aspect-[16/9] flex items-center justify-center bg-gradient-card">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <p className="text-muted-foreground">Preview do Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

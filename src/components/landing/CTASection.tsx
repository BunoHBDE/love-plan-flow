import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeInUp, ScaleIn } from './AnimatedSection';

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInUp>
            <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
              Pronto para transformar a gestão do seu espaço?
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Junte-se a centenas de gestores de eventos que já simplificaram seu dia a dia com a Ayllah.
            </p>
          </FadeInUp>
          <ScaleIn delay={0.2}>
            <Button 
              variant="gold" 
              size="xl" 
              asChild
              className="shadow-gold"
            >
              <Link to="/cadastro" className="flex items-center gap-2">
                Começar Meu Teste Grátis
                <ArrowRight size={20} />
              </Link>
            </Button>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}

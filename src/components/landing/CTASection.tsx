import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
            Pronto para transformar a gestão do seu espaço?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Junte-se a centenas de gestores de eventos que já simplificaram seu dia a dia com o EventosPro.
          </p>
          <Button 
            variant="gold" 
            size="xl" 
            asChild
            className="shadow-gold"
          >
            <Link to="/auth?mode=signup" className="flex items-center gap-2">
              Começar Meu Teste Grátis
              <ArrowRight size={20} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

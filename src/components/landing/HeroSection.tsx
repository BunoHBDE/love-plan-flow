import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const highlights = [
    '14 dias grátis',
    'Sem cartão de crédito',
    'Cancele quando quiser',
  ];

  return (
    <section className="pt-24 md:pt-32 pb-16 md:pb-24 bg-gradient-hero overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-6"
          >
            <span className="text-sm font-medium">✨ Sistema completo de gestão</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6"
          >
            Simplifique a gestão do seu{' '}
            <span className="text-gradient-gold">espaço de eventos</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Orçamentos profissionais, controle de visitas e disponibilidade em tempo real.
            Tudo em um único lugar para você fechar mais contratos.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Button variant="gold" size="xl" asChild>
              <Link to="/auth?mode=signup" className="flex items-center gap-2">
                Experimente 14 dias grátis
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#precos">Ver preços</a>
            </Button>
          </motion.div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground"
          >
            {highlights.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="text-secondary" />
                <span>{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Hero Image/Mockup Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          className="mt-12 md:mt-16 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-medium border border-border bg-card">
            <div className="aspect-[16/9] flex items-center justify-center bg-gradient-card">
              <div className="text-center p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8, type: 'spring' }}
                  className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4"
                >
                  <span className="text-3xl">📊</span>
                </motion.div>
                <p className="text-muted-foreground">Preview do Dashboard</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

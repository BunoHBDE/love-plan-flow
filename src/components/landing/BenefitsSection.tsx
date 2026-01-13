import { FileText, Calendar, CalendarCheck, Users } from 'lucide-react';

const benefits = [
  {
    icon: FileText,
    title: 'Orçamentos Profissionais',
    description: 'Crie e envie orçamentos personalizados em PDF com sua marca. Impressione clientes desde o primeiro contato.',
  },
  {
    icon: Calendar,
    title: 'Controle de Visitas',
    description: 'Agende, acompanhe e gerencie todas as visitas ao seu espaço. Nunca perca uma oportunidade.',
  },
  {
    icon: CalendarCheck,
    title: 'Disponibilidade em Tempo Real',
    description: 'Calendário visual de datas disponíveis e bloqueadas. Evite conflitos e overbooking.',
  },
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description: 'Base de dados centralizada com histórico completo. Conheça melhor seu público.',
  },
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-primary mb-4">
            Tudo que você precisa para{' '}
            <span className="text-gradient-gold">fechar mais eventos</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Funcionalidades pensadas para quem gerencia espaços de eventos e quer profissionalizar seu atendimento.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-accent hover:shadow-soft transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/30 transition-colors">
                <benefit.icon size={24} className="text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

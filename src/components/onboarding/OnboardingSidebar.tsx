import { FileText, Calendar, FileCheck, CalendarDays, CheckCircle2 } from 'lucide-react';

const benefits = [
  { icon: FileText, text: 'Gere orçamentos profissionais' },
  { icon: FileCheck, text: 'Contratos em segundos' },
  { icon: Calendar, text: 'Controle visitas' },
  { icon: CalendarDays, text: 'Visualize datas disponíveis em tempo real' },
];

export function OnboardingSidebar() {
  return (
    <aside className="hidden lg:flex w-[420px] bg-primary text-primary-foreground flex-col justify-center p-12 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10 space-y-8">
        {/* Main heading */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            Simplifique a gestão do seu{' '}
            <span className="text-accent">espaço de eventos</span>
          </h2>
        </div>

        {/* Benefits list */}
        <ul className="space-y-4">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <benefit.icon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-primary-foreground/90 pt-1">{benefit.text}</span>
            </li>
          ))}
        </ul>

        {/* Closing statement */}
        <div className="pt-4 border-t border-primary-foreground/10">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Tudo em um único lugar para você{' '}
              <span className="text-accent font-semibold">fechar mais contratos</span>.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

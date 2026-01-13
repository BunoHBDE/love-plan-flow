import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FadeInUp, StaggerContainer, StaggerItem } from './AnimatedSection';

const faqs = [
  {
    question: 'Como funciona o período de teste gratuito?',
    answer: 'Você tem 14 dias para testar todas as funcionalidades da Ayllah sem precisar cadastrar cartão de crédito. Ao final do período, você pode escolher assinar ou simplesmente parar de usar.',
  },
  {
    question: 'Posso cancelar minha assinatura a qualquer momento?',
    answer: 'Sim! Não há fidelidade ou multa. Você pode cancelar sua assinatura quando quiser diretamente pelo painel de configurações. O acesso continua até o fim do período já pago.',
  },
  {
    question: 'Quantos orçamentos posso criar?',
    answer: 'Com o Plano Pro, você pode criar orçamentos ilimitados. Não há limite de clientes, visitas ou qualquer outra funcionalidade do sistema.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Absolutamente! Utilizamos criptografia de ponta a ponta e servidores seguros. Seus dados são seus e nunca serão compartilhados com terceiros.',
  },
  {
    question: 'O sistema funciona em celular e tablet?',
    answer: 'Sim! A Ayllah é totalmente responsiva e funciona perfeitamente em qualquer dispositivo — computador, tablet ou smartphone.',
  },
  {
    question: 'Preciso instalar algum programa?',
    answer: 'Não! A Ayllah funciona 100% no navegador. Basta acessar pelo seu navegador favorito, fazer login e começar a usar. Funciona em Chrome, Safari, Firefox e Edge.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <FadeInUp className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-primary mb-4">
            Perguntas{' '}
            <span className="text-gradient-gold">Frequentes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Tire suas dúvidas sobre a Ayllah
          </p>
        </FadeInUp>

        {/* FAQ Accordion */}
        <StaggerContainer className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <StaggerItem key={index} index={index}>
                <AccordionItem 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-accent data-[state=open]:shadow-soft transition-all duration-300"
                >
                  <AccordionTrigger className="text-left text-primary font-medium hover:text-accent hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </StaggerItem>
            ))}
          </Accordion>
        </StaggerContainer>
      </div>
    </section>
  );
}

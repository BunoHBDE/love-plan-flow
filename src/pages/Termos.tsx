import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Termos() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link to="/" className="text-xl font-semibold text-primary">
              Ayllah
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8">
          Termos de Uso
        </h1>

        <div className="prose prose-lg max-w-none text-foreground">
          <p className="text-muted-foreground mb-6">
            Última atualização: Janeiro de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground mb-4">
              Ao acessar e utilizar a plataforma Ayllah, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground mb-4">
              A Ayllah é uma plataforma de gestão para espaços de eventos que oferece:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Criação e gestão de orçamentos profissionais</li>
              <li>Controle de visitas e agendamentos</li>
              <li>Gestão de disponibilidade de datas</li>
              <li>Cadastro e gerenciamento de clientes</li>
              <li>Configurações personalizadas de preços e serviços</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground mb-4">
              Para utilizar nossos serviços, você deve criar uma conta fornecendo informações precisas e completas. 
              Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
            </p>
            <p className="text-muted-foreground mb-4">
              Você concorda em notificar imediatamente a Ayllah sobre qualquer uso não autorizado de sua conta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">4. Período de Teste</h2>
            <p className="text-muted-foreground mb-4">
              Oferecemos um período de teste gratuito de 14 dias. Durante este período, você terá acesso a todas as 
              funcionalidades da plataforma. Ao final do período de teste, será necessário assinar um plano para 
              continuar utilizando os serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">5. Pagamentos e Assinaturas</h2>
            <p className="text-muted-foreground mb-4">
              Os pagamentos são processados de forma segura através de nosso parceiro de pagamentos. 
              As assinaturas são renovadas automaticamente, podendo ser canceladas a qualquer momento 
              através das configurações da conta.
            </p>
            <p className="text-muted-foreground mb-4">
              Em caso de cancelamento, o acesso continua disponível até o fim do período já pago.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">6. Uso Aceitável</h2>
            <p className="text-muted-foreground mb-4">
              Você concorda em não utilizar a plataforma para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Violar qualquer lei ou regulamento aplicável</li>
              <li>Transmitir vírus ou código malicioso</li>
              <li>Tentar acessar áreas não autorizadas do sistema</li>
              <li>Interferir no funcionamento normal da plataforma</li>
              <li>Coletar dados de outros usuários sem autorização</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">7. Propriedade Intelectual</h2>
            <p className="text-muted-foreground mb-4">
              Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones e software, 
              é propriedade da Ayllah e está protegido por leis de direitos autorais.
            </p>
            <p className="text-muted-foreground mb-4">
              Os dados inseridos por você na plataforma permanecem de sua propriedade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground mb-4">
              A Ayllah não se responsabiliza por danos indiretos, incidentais ou consequenciais 
              decorrentes do uso ou incapacidade de uso da plataforma.
            </p>
            <p className="text-muted-foreground mb-4">
              Nos esforçamos para manter a plataforma disponível 24/7, mas não garantimos 
              disponibilidade ininterrupta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">9. Modificações dos Termos</h2>
            <p className="text-muted-foreground mb-4">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por email ou através da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">10. Contato</h2>
            <p className="text-muted-foreground mb-4">
              Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do email: 
              <a href="mailto:contato@ayllah.com" className="text-accent hover:underline ml-1">
                contato@ayllah.com
              </a>
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-border">
          <Button variant="outline" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para a página inicial
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacidade() {
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
          Política de Privacidade
        </h1>

        <div className="prose prose-lg max-w-none text-foreground">
          <p className="text-muted-foreground mb-6">
            Última atualização: Janeiro de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">1. Introdução</h2>
            <p className="text-muted-foreground mb-4">
              A Ayllah está comprometida com a proteção da sua privacidade. Esta Política de Privacidade 
              explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais em 
              conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">2. Dados que Coletamos</h2>
            <p className="text-muted-foreground mb-4">
              Coletamos os seguintes tipos de informações:
            </p>
            
            <h3 className="text-lg font-medium text-primary mb-2">2.1 Dados de Cadastro</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Nome completo</li>
              <li>Endereço de email</li>
              <li>Número de WhatsApp</li>
              <li>Senha (armazenada de forma criptografada)</li>
              <li>Informações da empresa (nome, CNPJ, endereço)</li>
            </ul>

            <h3 className="text-lg font-medium text-primary mb-2">2.2 Dados de Uso</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Informações de clientes cadastrados por você</li>
              <li>Orçamentos e propostas criados</li>
              <li>Registros de visitas</li>
              <li>Configurações de preços e serviços</li>
            </ul>

            <h3 className="text-lg font-medium text-primary mb-2">2.3 Dados Técnicos</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Endereço IP</li>
              <li>Tipo de navegador e dispositivo</li>
              <li>Páginas acessadas e tempo de permanência</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">3. Como Usamos Seus Dados</h2>
            <p className="text-muted-foreground mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Fornecer e manter nossos serviços</li>
              <li>Processar pagamentos e assinaturas</li>
              <li>Enviar comunicações importantes sobre sua conta</li>
              <li>Melhorar nossa plataforma e desenvolver novos recursos</li>
              <li>Fornecer suporte ao cliente</li>
              <li>Enviar atualizações e novidades (com seu consentimento)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">4. Base Legal para Tratamento</h2>
            <p className="text-muted-foreground mb-4">
              O tratamento dos seus dados pessoais é realizado com base em:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Execução de contrato:</strong> para fornecer os serviços contratados</li>
              <li><strong>Consentimento:</strong> para envio de comunicações de marketing</li>
              <li><strong>Interesse legítimo:</strong> para melhorias na plataforma e prevenção de fraudes</li>
              <li><strong>Obrigação legal:</strong> para cumprimento de requisitos fiscais e regulatórios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground mb-4">
              Não vendemos seus dados pessoais. Podemos compartilhar informações com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Processadores de pagamento:</strong> para processar transações financeiras</li>
              <li><strong>Provedores de infraestrutura:</strong> para hospedagem e armazenamento de dados</li>
              <li><strong>Autoridades legais:</strong> quando exigido por lei</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Todos os parceiros são contratualmente obrigados a proteger seus dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">6. Segurança dos Dados</h2>
            <p className="text-muted-foreground mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares</li>
              <li>Servidores seguros com certificação</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">7. Seus Direitos</h2>
            <p className="text-muted-foreground mb-4">
              De acordo com a LGPD, você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Acesso:</strong> solicitar cópia dos seus dados pessoais</li>
              <li><strong>Correção:</strong> corrigir dados incompletos ou inexatos</li>
              <li><strong>Eliminação:</strong> solicitar exclusão dos seus dados</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> retirar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> se opor a determinados tratamentos</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Para exercer seus direitos, entre em contato conosco através do email abaixo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">8. Retenção de Dados</h2>
            <p className="text-muted-foreground mb-4">
              Mantemos seus dados pessoais pelo tempo necessário para fornecer nossos serviços 
              e cumprir obrigações legais. Após o encerramento da conta, os dados são mantidos 
              por até 5 anos para fins fiscais e legais, sendo então anonimizados ou excluídos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">9. Transferência Internacional</h2>
            <p className="text-muted-foreground mb-4">
              Seus dados podem ser processados em servidores localizados fora do Brasil. 
              Garantimos que qualquer transferência internacional de dados atenda aos requisitos 
              da LGPD e ofereça proteção adequada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. 
              Alterações significativas serão comunicadas por email ou através da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">11. Contato</h2>
            <p className="text-muted-foreground mb-4">
              Para questões sobre privacidade ou para exercer seus direitos, entre em contato com 
              nosso Encarregado de Proteção de Dados (DPO):
            </p>
            <p className="text-muted-foreground mb-4">
              Email: <a href="mailto:privacidade@ayllah.com" className="text-accent hover:underline">privacidade@ayllah.com</a>
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

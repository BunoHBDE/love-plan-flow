import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Cookies() {
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
          Política de Cookies
        </h1>

        <div className="prose prose-lg max-w-none text-foreground">
          <p className="text-muted-foreground mb-6">
            Última atualização: Janeiro de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">1. O que são Cookies?</h2>
            <p className="text-muted-foreground mb-4">
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você 
              visita um site. Eles são amplamente utilizados para fazer os sites funcionarem de 
              forma mais eficiente, bem como para fornecer informações aos proprietários do site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">2. Como Usamos Cookies</h2>
            <p className="text-muted-foreground mb-4">
              A Ayllah utiliza cookies para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Manter você conectado à sua conta</li>
              <li>Lembrar suas preferências e configurações</li>
              <li>Melhorar a segurança da plataforma</li>
              <li>Analisar como nosso site é utilizado</li>
              <li>Personalizar sua experiência</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">3. Tipos de Cookies que Utilizamos</h2>
            
            <div className="bg-card border border-border rounded-xl p-6 mb-4">
              <h3 className="text-lg font-medium text-primary mb-2">Cookies Essenciais</h3>
              <p className="text-muted-foreground text-sm mb-2">
                <strong>Necessários para o funcionamento básico</strong>
              </p>
              <p className="text-muted-foreground text-sm">
                Estes cookies são necessários para que o site funcione corretamente. 
                Incluem cookies de autenticação e segurança. Não podem ser desativados.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-4">
              <h3 className="text-lg font-medium text-primary mb-2">Cookies de Funcionalidade</h3>
              <p className="text-muted-foreground text-sm mb-2">
                <strong>Melhoram sua experiência</strong>
              </p>
              <p className="text-muted-foreground text-sm">
                Permitem que o site lembre suas escolhas (como idioma ou região) e 
                forneça recursos personalizados. Podem ser desativados, mas isso 
                pode afetar a funcionalidade.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-4">
              <h3 className="text-lg font-medium text-primary mb-2">Cookies de Análise</h3>
              <p className="text-muted-foreground text-sm mb-2">
                <strong>Nos ajudam a melhorar</strong>
              </p>
              <p className="text-muted-foreground text-sm">
                Coletam informações sobre como você usa nosso site, quais páginas visita 
                e se encontra erros. Todas as informações são agregadas e, portanto, anônimas.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-4">
              <h3 className="text-lg font-medium text-primary mb-2">Cookies de Marketing</h3>
              <p className="text-muted-foreground text-sm mb-2">
                <strong>Para comunicações relevantes</strong>
              </p>
              <p className="text-muted-foreground text-sm">
                Podem ser utilizados para rastrear visitantes em sites e exibir anúncios 
                relevantes. Atualmente, não utilizamos cookies de marketing de terceiros.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">4. Cookies de Terceiros</h2>
            <p className="text-muted-foreground mb-4">
              Alguns cookies são definidos por serviços de terceiros que aparecem em nossas páginas:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Supabase:</strong> Autenticação e gerenciamento de sessão</li>
              <li><strong>Stripe:</strong> Processamento de pagamentos (quando aplicável)</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Esses serviços têm suas próprias políticas de cookies e privacidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">5. Como Gerenciar Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Você pode controlar e/ou excluir cookies conforme desejar. A maioria dos navegadores 
              permite que você:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Veja quais cookies estão armazenados e exclua-os individualmente</li>
              <li>Bloqueie cookies de terceiros</li>
              <li>Bloqueie cookies de sites específicos</li>
              <li>Bloqueie todos os cookies</li>
              <li>Exclua todos os cookies ao fechar o navegador</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Para gerenciar cookies no seu navegador:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>
                <strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies
              </li>
              <li>
                <strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies
              </li>
              <li>
                <strong>Safari:</strong> Preferências → Privacidade → Cookies
              </li>
              <li>
                <strong>Edge:</strong> Configurações → Cookies e permissões do site
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">6. Consequências da Desativação</h2>
            <p className="text-muted-foreground mb-4">
              Se você optar por desativar cookies, algumas funcionalidades do site podem não 
              funcionar corretamente, incluindo:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Você pode precisar fazer login repetidamente</li>
              <li>Suas preferências podem não ser salvas</li>
              <li>Alguns recursos podem não funcionar como esperado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">7. Armazenamento Local</h2>
            <p className="text-muted-foreground mb-4">
              Além de cookies, também utilizamos armazenamento local (localStorage) para 
              manter suas preferências e dados de sessão. Essas informações permanecem no 
              seu dispositivo até que você as exclua manualmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">8. Atualizações desta Política</h2>
            <p className="text-muted-foreground mb-4">
              Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças 
              em nossas práticas ou por razões operacionais, legais ou regulatórias.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">9. Contato</h2>
            <p className="text-muted-foreground mb-4">
              Se você tiver dúvidas sobre nossa Política de Cookies, entre em contato:
            </p>
            <p className="text-muted-foreground mb-4">
              Email: <a href="mailto:contato@ayllah.com" className="text-accent hover:underline">contato@ayllah.com</a>
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

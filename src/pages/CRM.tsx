import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SubscriptionGate } from "@/components/subscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrmConfig } from "@/hooks/useCrmConfig";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { CrmLista } from "@/components/crm/CrmLista";
import { CrmKanban } from "@/components/crm/CrmKanban";
import { CrmPainel } from "@/components/crm/CrmPainel";
import { LeadDrawer } from "@/components/crm/LeadDrawer";

export default function CRM() {
  const { config, loading: configLoading, error: configError } = useCrmConfig();
  const acoes = useCrmLeads(config);
  const { leads, loading: leadsLoading } = acoes;

  const [leadAberto, setLeadAberto] = useState<string | null>(null);

  const leadSelecionado = leads.find((l) => l.id === leadAberto) ?? null;
  const carregando = configLoading || leadsLoading;

  return (
    <MainLayout>
      <SubscriptionGate>
        <div className="space-y-6">
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-bold text-foreground">
              CRM
            </h1>
            <p className="mt-1 text-muted-foreground">
              O atendimento inteiro: quem precisa de você, o que fazer e quando.
            </p>
          </div>

          {configError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
              <p className="font-medium text-destructive">
                Não foi possível carregar a configuração do CRM.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(configError as Error).message}
              </p>
            </div>
          ) : carregando || !config ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="atendimento" className="space-y-6">
              <TabsList>
                <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
                <TabsTrigger value="kanban">Kanban</TabsTrigger>
                <TabsTrigger value="painel">Painel</TabsTrigger>
              </TabsList>

              <TabsContent value="atendimento" className="mt-0">
                <CrmLista
                  leads={leads}
                  config={config}
                  acoes={acoes}
                  onAbrirLead={setLeadAberto}
                />
              </TabsContent>

              <TabsContent value="kanban" className="mt-0">
                <CrmKanban
                  leads={leads}
                  config={config}
                  acoes={acoes}
                  onAbrirLead={setLeadAberto}
                />
              </TabsContent>

              <TabsContent value="painel" className="mt-0">
                <CrmPainel leads={leads} config={config} />
              </TabsContent>
            </Tabs>
          )}

          {config && (
            <LeadDrawer
              lead={leadSelecionado}
              config={config}
              acoes={acoes}
              onClose={() => setLeadAberto(null)}
            />
          )}
        </div>
      </SubscriptionGate>
    </MainLayout>
  );
}

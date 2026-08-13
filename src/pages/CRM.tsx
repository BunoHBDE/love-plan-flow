import { useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SubscriptionGate } from "@/components/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrmConfig } from "@/hooks/useCrmConfig";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { CrmFilaDoDia } from "@/components/crm/CrmFilaDoDia";
import { CrmKanban } from "@/components/crm/CrmKanban";
import { CrmPainel } from "@/components/crm/CrmPainel";
import { LeadDrawer } from "@/components/crm/LeadDrawer";
import { NovoLeadDialog } from "@/components/crm/NovoLeadDialog";

export default function CRM() {
  const { config, loading: configLoading, error: configError } = useCrmConfig();
  const acoes = useCrmLeads(config);
  const { leads, loading: leadsLoading } = acoes;

  const [busca, setBusca] = useState("");
  const [leadAberto, setLeadAberto] = useState<string | null>(null);
  const [novoLeadAberto, setNovoLeadAberto] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return leads;
    return leads.filter(
      (lead) =>
        lead.nome.toLowerCase().includes(termo) ||
        lead.telefone.includes(termo),
    );
  }, [leads, busca]);

  const leadSelecionado = leads.find((l) => l.id === leadAberto) ?? null;
  const carregando = configLoading || leadsLoading;

  return (
    <MainLayout>
      <SubscriptionGate>
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                CRM
              </h1>
              <p className="mt-1 text-muted-foreground">
                O atendimento inteiro: quem precisa de você, o que fazer e
                quando.
              </p>
            </div>

            <Button
              variant="gold"
              size="lg"
              onClick={() => setNovoLeadAberto(true)}
              disabled={!config}
            >
              <Plus className="h-5 w-5" />
              Novo Lead
            </Button>
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
            <Tabs defaultValue="fila" className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="fila">Fila do dia</TabsTrigger>
                  <TabsTrigger value="kanban">Kanban</TabsTrigger>
                  <TabsTrigger value="painel">Painel</TabsTrigger>
                </TabsList>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome ou telefone"
                    className="pl-9"
                  />
                </div>
              </div>

              <TabsContent value="fila" className="mt-0">
                <CrmFilaDoDia
                  leads={filtrados}
                  config={config}
                  acoes={acoes}
                  onAbrirLead={setLeadAberto}
                />
              </TabsContent>

              <TabsContent value="kanban" className="mt-0">
                <CrmKanban
                  leads={filtrados}
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
            <>
              <NovoLeadDialog
                open={novoLeadAberto}
                onOpenChange={setNovoLeadAberto}
                config={config}
                salvando={acoes.criarLead.isPending}
                onSalvar={(input) =>
                  acoes.criarLead.mutate(input, {
                    onSuccess: () => setNovoLeadAberto(false),
                  })
                }
              />

              <LeadDrawer
                lead={leadSelecionado}
                config={config}
                acoes={acoes}
                onClose={() => setLeadAberto(null)}
              />
            </>
          )}
        </div>
      </SubscriptionGate>
    </MainLayout>
  );
}

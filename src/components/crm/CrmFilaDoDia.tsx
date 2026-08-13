import { useMemo } from "react";
import {
  AlarmClock,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";
import { compararFila } from "@/lib/crm/engine";
import { hoje, somarDias } from "@/lib/crm/dates";
import type { CrmLeadComputed } from "@/types/crm.types";
import { QuandoBadge, SituacaoBadge, WhatsAppButton } from "./CrmBadges";
import { AcaoRapidaMenu } from "./AcaoRapida";
import type { useCrmLeads } from "@/hooks/useCrmLeads";
import type { CrmConfig } from "@/types/crm.types";

/**
 * A fila do dia: quem precisa de você, em ordem. Trabalhe de cima para baixo
 * e pare quando chegar numa data futura.
 */
export function CrmFilaDoDia({
  leads,
  config,
  acoes,
  onAbrirLead,
}: {
  leads: CrmLeadComputed[];
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  onAbrirLead: (id: string) => void;
}) {
  const { fila, atrasados, paraHoje, proximos7, total } = useMemo(() => {
    const hojeISO = hoje();
    const limite7 = somarDias(hojeISO, 7);

    const abertos = leads
      .filter((lead) => lead.derived.quando !== null)
      .sort(compararFila);

    return {
      fila: abertos,
      atrasados: abertos.filter((l) => l.derived.urgencia === "atrasado").length,
      paraHoje: abertos.filter((l) => l.derived.urgencia === "hoje").length,
      proximos7: abertos.filter(
        (l) => l.derived.quando! > hojeISO && l.derived.quando! <= limite7,
      ).length,
      total: abertos.length,
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Atrasados"
          value={atrasados}
          subtitle="Passaram da data"
          icon={<AlarmClock className="h-6 w-6 text-primary-foreground" />}
        />
        <StatCard
          title="Para hoje"
          value={paraHoje}
          subtitle="Vencem hoje"
          icon={<CalendarClock className="h-6 w-6 text-primary-foreground" />}
        />
        <StatCard
          title="Próximos 7 dias"
          value={proximos7}
          subtitle="Já agendados"
          icon={<CalendarDays className="h-6 w-6 text-primary-foreground" />}
        />
        <StatCard
          title="Total em aberto"
          value={total}
          subtitle="Leads ativos"
          icon={<ListTodo className="h-6 w-6 text-primary-foreground" />}
        />
      </div>

      {fila.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <p className="mt-3 font-medium">Nenhuma ação pendente</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos os leads em aberto já foram atendidos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-36">Quando</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead className="w-56">Situação</TableHead>
                <TableHead>Próximo passo</TableHead>
                <TableHead className="w-14" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fila.map((lead, indice) => (
                <TableRow
                  key={lead.id}
                  className={cn(
                    "cursor-pointer",
                    lead.derived.urgencia === "atrasado" && "bg-destructive/5",
                    lead.derived.urgencia === "hoje" && "bg-warning/5",
                  )}
                  onClick={() => onAbrirLead(lead.id)}
                >
                  <TableCell className="text-muted-foreground">
                    {indice + 1}
                  </TableCell>
                  <TableCell>
                    <QuandoBadge
                      quando={lead.derived.quando}
                      urgencia={lead.derived.urgencia}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{lead.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.telefone}
                    </p>
                  </TableCell>
                  <TableCell>
                    <SituacaoBadge
                      situacao={lead.derived.situacao}
                      etapa={lead.derived.etapaAtual?.nome}
                    />
                    {lead.derived.diasEmSilencio !== null &&
                      lead.derived.diasEmSilencio > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          há {lead.derived.diasEmSilencio} dia
                          {lead.derived.diasEmSilencio === 1 ? "" : "s"}
                        </p>
                      )}
                  </TableCell>

                  {/* A ação fica junto do passo que ela resolve, e não na
                      borda da tabela, longe do que se está lendo. */}
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-3">
                      <span>{lead.derived.proximoPasso}</span>
                      <AcaoRapidaMenu
                        lead={lead}
                        config={config}
                        acoes={acoes}
                        onAbrirLead={onAbrirLead}
                      />
                    </div>
                  </TableCell>

                  <TableCell>
                    <WhatsAppButton telefone={lead.telefone} size="icon" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

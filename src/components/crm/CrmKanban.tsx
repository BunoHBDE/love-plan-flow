import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarData } from "@/lib/crm/dates";
import {
  COLUNA_GANHO,
  COLUNA_PERDIDO,
  type CrmConfig,
  type CrmLeadComputed,
} from "@/types/crm.types";
import { QuandoBadge } from "./CrmBadges";
import { AcaoRapidaMenu } from "./AcaoRapida";
import type { useCrmLeads } from "@/hooks/useCrmLeads";

interface Coluna {
  id: string;
  titulo: string;
  variante: "etapa" | "ganho" | "perdido";
}

export function CrmKanban({
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
  // Perdidos é arquivo morto do dia a dia e, com oito etapas, custa uma tela
  // inteira de rolagem. Fica recolhido até você pedir. "Contratou" continua
  // à vista: é a boa notícia.
  const [mostrarPerdidos, setMostrarPerdidos] = useState(false);

  const totalPerdidos = leads.filter(
    (lead) => lead.derived.coluna === COLUNA_PERDIDO,
  ).length;

  const colunas: Coluna[] = [
    ...config.stages.map((stage, i) => ({
      id: stage.id,
      titulo: `${i + 1} · ${stage.nome}`,
      variante: "etapa" as const,
    })),
    { id: COLUNA_GANHO, titulo: "Contratou", variante: "ganho" as const },
    ...(mostrarPerdidos
      ? [{ id: COLUNA_PERDIDO, titulo: "Perdidos", variante: "perdido" as const }]
      : []),
  ];

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {colunas.map((coluna) => {
          const daColuna = leads
            .filter((lead) => lead.derived.coluna === coluna.id)
            .sort((a, b) => {
              const qa = a.derived.quando ?? "9999-12-31";
              const qb = b.derived.quando ?? "9999-12-31";
              return qa === qb ? a.nome.localeCompare(b.nome, "pt-BR") : qa < qb ? -1 : 1;
            });

          return (
            <div key={coluna.id} className="w-72 shrink-0">
              <div
                className={cn(
                  "flex items-center justify-between rounded-t-lg border border-b-0 px-3 py-2",
                  coluna.variante === "ganho" && "border-success/30 bg-success/10",
                  coluna.variante === "perdido" && "border-border bg-muted/60",
                  coluna.variante === "etapa" && "border-border bg-card",
                )}
              >
                <h3 className="text-sm font-semibold truncate">{coluna.titulo}</h3>
                <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {daColuna.length}
                </span>
              </div>

              <div className="min-h-[120px] space-y-2 rounded-b-lg border border-border bg-muted/20 p-2">
                {daColuna.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                    Nenhum lead
                  </p>
                ) : (
                  daColuna.map((lead) => (
                    <CardLead
                      key={lead.id}
                      lead={lead}
                      config={config}
                      acoes={acoes}
                      onAbrirLead={onAbrirLead}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setMostrarPerdidos((aberto) => !aberto)}
          aria-expanded={mostrarPerdidos}
          className="flex w-11 shrink-0 flex-col items-center gap-2 self-start rounded-lg border border-dashed border-border bg-muted/20 py-3 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {mostrarPerdidos ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronLeft className="h-4 w-4 shrink-0" />
          )}
          <span className="text-xs font-medium [writing-mode:vertical-rl]">
            {mostrarPerdidos ? "Ocultar" : `Perdidos (${totalPerdidos})`}
          </span>
        </button>
      </div>
    </div>
  );
}

function CardLead({
  lead,
  config,
  acoes,
  onAbrirLead,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  onAbrirLead: (id: string) => void;
}) {
  const { derived } = lead;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAbrirLead(lead.id)}
      onKeyDown={(evento) => {
        // Só teclas dadas no próprio card abrem a gaveta: o que vem de um
        // menu aberto dentro dele sobe pela árvore do React e não deve
        // contar — o espaço, ainda por cima, seria digitado num campo.
        if (evento.target !== evento.currentTarget) return;
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          onAbrirLead(lead.id);
        }
      }}
      className={cn(
        "w-full cursor-pointer rounded-lg border bg-card p-3 text-left transition-all hover:shadow-soft",
        derived.urgencia === "atrasado"
          ? "border-destructive/40"
          : derived.urgencia === "hoje"
            ? "border-warning/50"
            : "border-border",
      )}
    >
      <p className="font-medium truncate">{lead.nome}</p>

      {derived.proximoPasso ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {derived.proximoPasso}
          </p>
          <div className="mt-2">
            <QuandoBadge quando={derived.quando} urgencia={derived.urgencia} />
          </div>

          {/* Ocupa a largura do card: fica no corpo, não espremida na borda. */}
          <AcaoRapidaMenu
            lead={lead}
            config={config}
            acoes={acoes}
            onAbrirLead={onAbrirLead}
            className="mt-3 w-full"
          />
        </>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Encerrado
          {lead.encerrado_em && ` em ${formatarData(lead.encerrado_em)}`}
        </p>
      )}

      {derived.diasEmSilencio !== null && derived.diasEmSilencio > 0 && (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {derived.diasEmSilencio} dia
          {derived.diasEmSilencio === 1 ? "" : "s"} em silêncio
        </p>
      )}
    </div>
  );
}

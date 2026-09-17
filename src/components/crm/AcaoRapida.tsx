/**
 * AÇÃO RÁPIDA
 *
 * Resolve o próximo passo do lead sem sair de onde você está. Qual controle
 * resolve o quê vem do motor (`derived.acao`), então esta peça não repete a
 * lógica de decisão — ela só desenha o que o motor apontou.
 *
 * O caso comum é um botão só: **Avançar**. O menu ao lado guarda o que é
 * exceção — voltar uma etapa e encerrar o lead — porque essas duas você faz
 * poucas vezes por dia e avançar você faz o tempo todo.
 *
 * Três formas: `AcaoRapidaBotoes` para a gaveta, `AcaoRapidaMenu` para os
 * cards do Kanban e `AcaoRapidaLinha` para a lista de atendimento.
 */

import { useState } from "react";
import {
  ChevronDown,
  CalendarClock,
  CornerUpLeft,
  XCircle,
  ArrowRight,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { cn } from "@/lib/utils";
import type { AtualizarLeadInput, useCrmLeads } from "@/hooks/useCrmLeads";
import {
  COMPARECEU_LABELS,
  type Compareceu,
  type CrmConfig,
  type CrmLeadComputed,
  type Encerramento,
} from "@/types/crm.types";
import { EncerrarLead } from "./EncerrarLead";

const COMPARECEU_OPCOES: Compareceu[] = ["sim", "nao", "remarcou"];

interface Props {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  onAbrirLead: (id: string) => void;
  className?: string;
}

/**
 * O menu de exceções, compartilhado pelas três formas. "Voltar" só aparece se
 * houver para onde voltar — na primeira etapa ele não faz sentido nenhum.
 */
function MenuExcecoes({
  lead,
  config,
  acoes,
  gatilho,
  onEncerrar,
}: Omit<Props, "onAbrirLead"> & {
  gatilho: React.ReactNode;
  /** Abre o diálogo de encerramento no desfecho pedido. */
  onEncerrar: (inicial: Encerramento) => void;
}) {
  const atual = lead.derived.etapaAtual;
  const indice = config.stages.findIndex((s) => s.id === atual?.id);
  const anteriores = indice > 0 ? config.stages.slice(0, indice) : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        {gatilho}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="w-56"
      >
        {anteriores.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Voltar para
            </DropdownMenuLabel>
            {/* De trás para frente: voltar uma etapa é o caso comum, e ele
                fica no topo em vez de no fim de uma lista crescente. */}
            {[...anteriores].reverse().map((stage) => (
              <DropdownMenuItem
                key={stage.id}
                onSelect={() =>
                  acoes.voltar.mutate({ lead, stageId: stage.id })
                }
              >
                <CornerUpLeft className="h-4 w-4 opacity-60" />
                {stage.nome}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Fechar mora aqui, e não só na última etapa, porque nem todo
            contrato espera o funil inteiro: quem fecha logo depois da
            proposta precisa ter onde registrar isso. */}
        <DropdownMenuItem onSelect={() => onEncerrar("contratou")}>
          <Handshake className="h-4 w-4 opacity-60" />
          Fechou o contrato
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => onEncerrar("recusou")}
          className="text-destructive"
        >
          <XCircle className="h-4 w-4" />
          Encerrar o atendimento
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** O seletor de comparecimento, quando o passo é confirmar a visita. */
function Compareceu({
  lead,
  acoes,
  className,
}: Pick<Props, "lead" | "acoes" | "className">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant="outline"
          className={cn("h-8 justify-between", className)}
        >
          <span className="truncate">Compareceu?</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {COMPARECEU_OPCOES.map((valor) => (
          <DropdownMenuItem
            key={valor}
            onSelect={() =>
              acoes.atualizarLead.mutate({
                id: lead.id,
                patch: { compareceu: valor },
              })
            }
          >
            {COMPARECEU_LABELS[valor]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ==========================================
// VERSÃO EXPANDIDA — gaveta
// ==========================================

export function AcaoRapidaBotoes({
  lead,
  config,
  acoes,
  salvar,
}: Omit<Props, "onAbrirLead" | "className"> & {
  salvar: (patch: AtualizarLeadInput) => void;
}) {
  const [encerrando, setEncerrando] = useState<Encerramento | null>(null);
  const acao = lead.derived.acao;
  const proxima = lead.derived.proximaEtapa;

  if (lead.derived.encerrado) {
    return (
      <div className="mt-3 border-t border-border/60 pt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => acoes.encerrar.mutate({ lead, encerramento: null })}
        >
          Reabrir o atendimento
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
      {/* Reagendamento precisa de data, não de opções. */}
      {acao?.tipo === "agendamento" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Nova data da visita:</p>
          <DatePickerField
            value={lead.data_agendamento ?? ""}
            onChange={(valor) =>
              salvar({
                data_agendamento: valor || null,
                compareceu: valor ? "pendente" : lead.compareceu,
              })
            }
            placeholder="Escolher a nova data"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {acao?.tipo === "compareceu" && (
          <Compareceu lead={lead} acoes={acoes} />
        )}

        {proxima ? (
          <Button size="sm" onClick={() => acoes.avancar.mutate({ lead })}>
            <ArrowRight className="h-3.5 w-3.5" />
            Avançar para {proxima.nome}
          </Button>
        ) : (
          // Última etapa: não há para onde avançar, o que falta é a
          // assinatura. É o desfecho que o funil inteiro persegue, então
          // ganha o botão primário em vez de ficar atrás do chevron.
          <Button
            size="sm"
            className="bg-success text-success-foreground hover:bg-success/90"
            onClick={() => setEncerrando("contratou")}
          >
            <Handshake className="h-3.5 w-3.5" />
            Fechou o contrato
          </Button>
        )}

        <MenuExcecoes
          lead={lead}
          config={config}
          acoes={acoes}
          onEncerrar={setEncerrando}
          gatilho={
            <Button size="sm" variant="outline" className="px-2">
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          }
        />
      </div>

      <EncerrarLead
        lead={lead}
        config={config}
        acoes={acoes}
        aberto={encerrando !== null}
        inicial={encerrando ?? "recusou"}
        onFechar={() => setEncerrando(null)}
      />
    </div>
  );
}

// ==========================================
// VERSÃO COMPACTA — cards do Kanban
// ==========================================

export function AcaoRapidaMenu({
  lead,
  config,
  acoes,
  onAbrirLead,
  className,
}: Props) {
  const [encerrando, setEncerrando] = useState<Encerramento | null>(null);
  const acao = lead.derived.acao;

  if (lead.derived.encerrado) return null;

  // Reagendar exige calendário: o card manda abrir a gaveta.
  if (acao?.tipo === "agendamento") {
    return (
      <Button
        size="sm"
        variant="outline"
        className={cn("h-8", className)}
        onClick={(evento) => {
          evento.stopPropagation();
          onAbrirLead(lead.id);
        }}
      >
        <CalendarClock className="h-3.5 w-3.5" />
        Reagendar
      </Button>
    );
  }

  if (acao?.tipo === "compareceu") {
    return <Compareceu lead={lead} acoes={acoes} className={className} />;
  }

  return (
    <>
      <MenuExcecoes
        lead={lead}
        config={config}
        acoes={acoes}
        onEncerrar={setEncerrando}
        gatilho={
          <Button
            size="sm"
            variant="outline"
            className={cn("h-8 justify-between", className)}
          >
            <span className="truncate">
              {lead.derived.proximaEtapa?.nome ?? "Fechar contrato"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </Button>
        }
      />
      <EncerrarLead
        lead={lead}
        config={config}
        acoes={acoes}
        aberto={encerrando !== null}
        inicial={encerrando ?? "recusou"}
        onFechar={() => setEncerrando(null)}
      />
    </>
  );
}

// ==========================================
// VERSÃO DE LINHA — botão primário + menu
// ==========================================

/**
 * O caso comum vira um botão só. Avançar é o que se faz dezenas de vezes por
 * dia; o resto mora atrás do chevron.
 */
export function AcaoRapidaLinha({
  lead,
  config,
  acoes,
  onAbrirLead,
}: Omit<Props, "className">) {
  const [encerrando, setEncerrando] = useState<Encerramento | null>(null);
  const acao = lead.derived.acao;
  const proxima = lead.derived.proximaEtapa;

  if (lead.derived.encerrado) return null;

  if (acao?.tipo === "agendamento") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-8"
        onClick={(evento) => {
          evento.stopPropagation();
          onAbrirLead(lead.id);
        }}
      >
        <CalendarClock className="h-3.5 w-3.5" />
        Reagendar
      </Button>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      {acao?.tipo === "compareceu" ? (
        <Compareceu lead={lead} acoes={acoes} />
      ) : proxima ? (
        <Button
          size="sm"
          className="h-8 min-w-0 max-w-full gap-1 px-2.5"
          onClick={(evento) => {
            evento.stopPropagation();
            acoes.avancar.mutate({ lead });
          }}
        >
          {/* Nome da etapa pode ser longo ("Convite para Visita") — trunca em
              vez de empurrar o botão, que numa lista em grade alargaria só a
              coluna daquela linha. */}
          <span className="truncate">{proxima.nome}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Button>
      ) : (
        <Button
          size="sm"
          className="h-8 bg-success text-success-foreground hover:bg-success/90"
          onClick={(evento) => {
            evento.stopPropagation();
            setEncerrando("contratou");
          }}
        >
          <Handshake className="h-3.5 w-3.5" />
          Fechar
        </Button>
      )}

      <MenuExcecoes
        lead={lead}
        config={config}
        acoes={acoes}
        onEncerrar={setEncerrando}
        gatilho={
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2"
            aria-label="Outras ações"
          >
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        }
      />

      <EncerrarLead
        lead={lead}
        config={config}
        acoes={acoes}
        aberto={encerrando !== null}
        inicial={encerrando ?? "recusou"}
        onFechar={() => setEncerrando(null)}
      />
    </div>
  );
}

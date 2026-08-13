/**
 * AÇÃO RÁPIDA
 *
 * Resolve o próximo passo do lead sem sair de onde você está. Qual controle
 * resolve o quê vem do motor (`derived.acao`), então esta peça não repete a
 * lógica de decisão — ela só desenha o que o motor apontou.
 *
 * Duas formas: `AcaoRapidaBotoes` para a gaveta, onde há espaço, e
 * `AcaoRapidaMenu` para os cards da fila e do Kanban.
 */

import { Check, ChevronDown, CalendarClock } from "lucide-react";
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
  type Semantica,
} from "@/types/crm.types";

const COMPARECEU_OPCOES: Compareceu[] = ["sim", "nao", "remarcou"];

/**
 * O resultado mais provável da etapa, dado onde ela está agora. Vira botão
 * direto, para que o caso comum custe um clique em vez de abrir o menu.
 *
 *   esperando resposta  → o lead respondeu
 *   em silêncio         → o lead voltou
 *   etapa ainda vazia   → você acabou de mandar a mensagem
 *
 * Pendências (negociação, faltou) não têm desfecho provável: só menu.
 */
function semanticaProvavel(atual: Semantica | null): Semantica | null {
  if (atual === null) return "aguardando";
  if (atual === "aguardando") return "respondeu";
  if (atual === "silencio") return "voltou_fup";
  return null;
}

/**
 * Traduz a ação apontada pelo motor nas opções que a interface oferece.
 * Devolve null quando a ação precisa de um seletor de data, não de opções.
 */
function opcoesDaAcao(lead: CrmLeadComputed, config: CrmConfig) {
  const acao = lead.derived.acao;
  if (!acao) return null;

  if (acao.tipo === "etapa") {
    const stage = config.stages.find((s) => s.id === acao.stageId);
    if (!stage) return null;

    const registro = lead.etapas.find((e) => e.stage_id === stage.id);
    const atual =
      stage.outcomes.find((o) => o.id === registro?.outcome_id) ?? null;

    const provavel = semanticaProvavel(atual?.semantica ?? null);
    const sugerida = provavel
      ? stage.outcomes.find((o) => o.semantica === provavel)
      : undefined;

    return {
      titulo: stage.nome,
      sugerida: sugerida
        ? { chave: sugerida.id, label: sugerida.label }
        : undefined,
      itens: stage.outcomes.map((outcome) => ({
        chave: outcome.id,
        label: outcome.label,
        ativo: registro?.outcome_id === outcome.id,
      })),
      aplicar: (chave: string, acoes: ReturnType<typeof useCrmLeads>) =>
        acoes.registrarEtapa.mutate({
          lead,
          stageId: stage.id,
          outcomeId: chave,
        }),
    };
  }

  if (acao.tipo === "compareceu") {
    return {
      titulo: "Compareceu?",
      sugerida: { chave: "sim", label: "Compareceu" },
      itens: COMPARECEU_OPCOES.map((valor) => ({
        chave: valor,
        label: COMPARECEU_LABELS[valor],
        ativo: lead.compareceu === valor,
      })),
      aplicar: (chave: string, acoes: ReturnType<typeof useCrmLeads>) =>
        acoes.atualizarLead.mutate({
          id: lead.id,
          patch: { compareceu: chave as Compareceu },
        }),
    };
  }

  return null;
}

// ==========================================
// VERSÃO EXPANDIDA — gaveta
// ==========================================

export function AcaoRapidaBotoes({
  lead,
  config,
  acoes,
  salvar,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  salvar: (patch: AtualizarLeadInput) => void;
}) {
  const acao = lead.derived.acao;
  if (!acao) return null;

  // Reagendamento precisa de data, não de opções.
  if (acao.tipo === "agendamento") {
    return (
      <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
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
    );
  }

  const opcoes = opcoesDaAcao(lead, config);
  if (!opcoes) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
      <p className="text-xs text-muted-foreground">
        Registrar em {opcoes.titulo}:
      </p>
      <div className="flex flex-wrap gap-2">
        {opcoes.itens.map((item) => (
          <Button
            key={item.chave}
            size="sm"
            variant={item.ativo ? "default" : "outline"}
            onClick={() => opcoes.aplicar(item.chave, acoes)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// VERSÃO COMPACTA — cards da fila e do Kanban
// ==========================================

export function AcaoRapidaMenu({
  lead,
  config,
  acoes,
  onAbrirLead,
  className,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  onAbrirLead: (id: string) => void;
  className?: string;
}) {
  const acao = lead.derived.acao;
  if (!acao) return null;

  // Reagendar exige calendário: o card manda abrir a gaveta.
  if (acao.tipo === "agendamento") {
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

  const opcoes = opcoesDaAcao(lead, config);
  if (!opcoes) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        {/* `justify-between` só tem efeito quando o botão ocupa a largura
            toda; inline, o conteúdo continua colado. */}
        <Button
          size="sm"
          variant="outline"
          className={cn("h-8 justify-between", className)}
        >
          <span className="truncate">{opcoes.titulo}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="w-52"
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Registrar em {opcoes.titulo}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opcoes.itens.map((item) => (
          <DropdownMenuItem
            key={item.chave}
            onSelect={() => opcoes.aplicar(item.chave, acoes)}
            className="justify-between"
          >
            {item.label}
            {item.ativo && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ==========================================
// VERSÃO DE LINHA — botão primário + menu
// ==========================================

/**
 * O caso comum vira um botão só. O menu ao lado guarda os outros desfechos,
 * para não obrigar a abrir uma lista quando a resposta é a esperada.
 */
export function AcaoRapidaLinha({
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
  const acao = lead.derived.acao;
  if (!acao) return null;

  if (acao.tipo === "agendamento") {
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

  const opcoes = opcoesDaAcao(lead, config);
  if (!opcoes) return null;

  return (
    <div className="flex items-center gap-1.5">
      {opcoes.sugerida && (
        <Button
          size="sm"
          className="h-8"
          onClick={(evento) => {
            evento.stopPropagation();
            opcoes.aplicar(opcoes.sugerida!.chave, acoes);
          }}
        >
          {opcoes.sugerida.label}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2"
            aria-label={`Outros resultados de ${opcoes.titulo}`}
          >
            {!opcoes.sugerida && (
              <span className="truncate">{opcoes.titulo}</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          onClick={(e) => e.stopPropagation()}
          className="w-52"
        >
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Registrar em {opcoes.titulo}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {opcoes.itens.map((item) => (
            <DropdownMenuItem
              key={item.chave}
              onSelect={() => opcoes.aplicar(item.chave, acoes)}
              className="justify-between"
            >
              {item.label}
              {item.ativo && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

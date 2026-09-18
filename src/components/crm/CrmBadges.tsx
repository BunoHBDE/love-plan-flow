import { useState } from "react";
import { Bot, Check, Copy, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { diffDias, formatarData, formatarDataCurta, hoje } from "@/lib/crm/dates";
import {
  SITUACAO_DOT_STYLES,
  SITUACAO_LABELS,
  SITUACAO_TEXT_STYLES,
  type CrmDerived,
  type Situacao,
  type Urgencia,
} from "@/types/crm.types";

/**
 * Nesta página, borda significa "clicável". Os badges abaixo são informação
 * pura, então não têm borda.
 *
 * A situação do lead: um ponto colorido e o texto, sem pílula de fundo — é o
 * indicador mais lido da linha, então fica leve. Quando o atendimento está em
 * aberto, pode vir com a etapa em que ele parou — "Aguardando · Proposta".
 * Leads encerrados não têm etapa atual, então mostram só a situação.
 */
export function SituacaoBadge({
  situacao,
  etapa,
  className,
}: {
  situacao: Situacao;
  etapa?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 overflow-hidden text-sm font-medium whitespace-nowrap",
        SITUACAO_TEXT_STYLES[situacao],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          SITUACAO_DOT_STYLES[situacao],
        )}
      />
      <span className="truncate">{SITUACAO_LABELS[situacao]}</span>
      {etapa && (
        <>
          <span className="shrink-0 opacity-40">·</span>
          <span className="truncate font-semibold">{etapa}</span>
        </>
      )}
    </span>
  );
}

/** A etapa atual do lead, como uma pílula neutra — a coluna "Fase" da lista. */
export function FaseBadge({
  nome,
  className,
}: {
  nome: string | null;
  className?: string;
}) {
  if (!nome) {
    return <span className={cn("text-sm text-muted-foreground", className)}>—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {nome}
    </span>
  );
}

/**
 * A coluna "Próxima etapa": a etapa seguinte no funil e o prazo dela, com uma
 * cor por urgência — igual à barra de urgência do "Quando", mas como texto
 * solto, pensada para caber numa célula da lista em vez de um badge isolado.
 *
 * Quando há uma visita marcada (`situacao === "agendou"`), o prazo vira uma
 * contagem regressiva ("em 3 dias"): é o compromisso da agenda, não o prazo
 * de silêncio da etapa, e merece o aviso mesmo estando alguns dias à frente.
 */
export function ProximaEtapaCelula({
  derived,
  className,
}: {
  derived: CrmDerived;
  className?: string;
}) {
  const { encerrado, proximaEtapa, quando, urgencia, situacao } = derived;

  if (encerrado) {
    return <span className={cn("text-sm text-muted-foreground", className)}>Encerrado</span>;
  }

  const nomeEtapa = proximaEtapa?.nome ?? "Fechar contrato";
  const prazo = textoDoPrazo(quando, urgencia, situacao);

  return (
    <div className={className}>
      <p className="truncate text-sm">{nomeEtapa}</p>
      <p className={cn("mt-0.5 truncate text-xs font-medium", prazo.className)}>
        {prazo.texto}
      </p>
    </div>
  );
}

function textoDoPrazo(
  quando: string | null,
  urgencia: Urgencia | null,
  situacao: Situacao,
): { texto: string; className: string } {
  if (!quando || !urgencia) {
    return { texto: "—", className: "text-muted-foreground" };
  }
  if (urgencia === "atrasado") {
    return { texto: `atrasado (${formatarDataCurta(quando)})`, className: "text-destructive" };
  }
  if (urgencia === "hoje") {
    return { texto: `hoje (${formatarDataCurta(quando)})`, className: "text-warning-foreground" };
  }
  // Fora do prazo de silêncio: um compromisso marcado ainda merece destaque
  // conforme se aproxima, mesmo alguns dias antes de vencer.
  if (situacao === "agendou") {
    const dias = diffDias(hoje(), quando);
    return {
      texto: `em ${dias} dia${dias === 1 ? "" : "s"} (${formatarDataCurta(quando)})`,
      className: "text-warning-foreground",
    };
  }
  return { texto: `até ${formatarDataCurta(quando)}`, className: "text-muted-foreground" };
}

/**
 * Marca um campo como preenchido pela IA e ainda não editado por ninguém
 * depois. Some sozinho assim que o campo é editado à mão — não é um estado
 * para desmarcar, é só o reflexo de `lead.campos_ia` (ver `useCrmLeads`).
 */
export function IaBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
            className,
          )}
        >
          <Bot className="h-2.5 w-2.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Preenchido pela IA — editar substitui
      </TooltipContent>
    </Tooltip>
  );
}

/** Copia o telefone para a área de transferência — o atalho ao lado do número. */
export function CopiarTelefoneButton({
  telefone,
  className,
}: {
  telefone: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      aria-label="Copiar número"
      onClick={(evento) => {
        evento.stopPropagation();
        void navigator.clipboard.writeText(telefone).then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        });
      }}
      className={cn(
        "shrink-0 text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {copiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

const URGENCIA_STYLES: Record<Urgencia, string> = {
  atrasado: "bg-destructive/15 text-destructive",
  hoje: "bg-warning/25 text-warning-foreground",
  futuro: "bg-muted text-muted-foreground",
};

const URGENCIA_LABELS: Record<Urgencia, string> = {
  atrasado: "Atrasado",
  hoje: "Hoje",
  futuro: "",
};

/** Mostra a data da ação, destacada quando está atrasada ou é para hoje. */
export function QuandoBadge({
  quando,
  urgencia,
  className,
}: {
  quando: string | null;
  urgencia: Urgencia | null;
  className?: string;
}) {
  if (!quando || !urgencia) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        URGENCIA_STYLES[urgencia],
        className,
      )}
    >
      {URGENCIA_LABELS[urgencia] && <strong>{URGENCIA_LABELS[urgencia]}</strong>}
      {formatarData(quando)}
    </span>
  );
}

/** Abre a conversa no WhatsApp — o atalho que a planilha não tinha. */
export function WhatsAppButton({
  telefone,
  size = "sm",
  className,
}: {
  telefone: string;
  size?: "sm" | "icon";
  className?: string;
}) {
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return null;

  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;

  return (
    <Button
      variant="outline"
      size={size}
      className={className}
      asChild
      onClick={(event) => event.stopPropagation()}
    >
      <a
        href={`https://wa.me/${numero}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir conversa no WhatsApp com ${telefone}`}
      >
        <MessageCircle className="h-4 w-4" />
        {size === "sm" && <span>WhatsApp</span>}
      </a>
    </Button>
  );
}

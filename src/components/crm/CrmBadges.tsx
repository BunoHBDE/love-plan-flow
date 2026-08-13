import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/crm/dates";
import {
  SITUACAO_LABELS,
  SITUACAO_STYLES,
  type Situacao,
  type Urgencia,
} from "@/types/crm.types";

/**
 * Nesta página, borda significa "clicável". Os badges abaixo são informação
 * pura, então não têm borda — só o fundo suave que os separa do texto.
 *
 * A situação do lead e, quando o atendimento está em aberto, a etapa em que
 * ele parou — "Em conversa · Proposta". Leads encerrados não têm etapa atual,
 * então mostram só a situação.
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        SITUACAO_STYLES[situacao],
        className,
      )}
    >
      {SITUACAO_LABELS[situacao]}
      {etapa && (
        <>
          <span className="mx-1.5 opacity-40">·</span>
          <span className="font-semibold">{etapa}</span>
        </>
      )}
    </span>
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
}: {
  telefone: string;
  size?: "sm" | "icon";
}) {
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return null;

  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;

  return (
    <Button
      variant="outline"
      size={size}
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

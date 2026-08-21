/**
 * REVISÃO DAS SUGESTÕES DA IA
 *
 * Uma linha por lead: o que a IA leu da conversa, o que isso mudaria no CRM e
 * os botões para aprovar ou descartar. O que já foi aplicado continua na lista,
 * com o botão de desfazer — a gravação guarda o valor anterior de cada campo.
 */

import { useMemo, useState } from "react";
import { Check, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  diffDaSugestao,
  useIaRevisao,
  type SugestaoRevisao,
} from "@/hooks/useIaRevisao";

type Filtro = "pendente" | "aplicada" | "rejeitada";

/** Verde só a partir de 0.90 — é o corte que a gravação automática usa. */
function corDaConfianca(c: number | null): string {
  if (c === null) return "bg-muted text-muted-foreground";
  if (c >= 0.9) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (c >= 0.7) return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "bg-destructive/10 text-destructive";
}

function valorLegivel(v: unknown): string {
  if (v === null || v === undefined || v === "") return "vazio";
  return String(v);
}

function CartaoSugestao({
  s,
  acoes,
}: {
  s: SugestaoRevisao;
  acoes: ReturnType<typeof useIaRevisao>;
}) {
  const diff = useMemo(() => diffDaSugestao(s), [s]);
  const ocupado =
    acoes.aprovar.isPending || acoes.rejeitar.isPending || acoes.desfazer.isPending;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{s.lead_nome}</span>
            <Badge variant="secondary" className={corDaConfianca(s.confianca)}>
              {s.confianca === null ? "sem nota" : `confiança ${s.confianca}`}
            </Badge>
            {s.precisa_revisao && <Badge variant="outline">precisa revisão</Badge>}
            {s.qualificacao === "desqualificado" && (
              <Badge variant="outline" className="border-destructive/40 text-destructive">
                desqualificado
              </Badge>
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {s.etapa}
            {s.resultado_label ? `: ${s.resultado_label}` : ""}
            {s.qtd_mensagens ? ` · ${s.qtd_mensagens} mensagens lidas` : ""}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {s.status === "pendente" && (
            <>
              <Button
                size="sm"
                disabled={ocupado || diff.length === 0}
                onClick={() => acoes.aprovar.mutate(s.lead_id)}
              >
                <Check className="mr-1 h-4 w-4" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={ocupado}
                onClick={() => acoes.rejeitar.mutate(s.sugestao_id)}
              >
                <X className="mr-1 h-4 w-4" />
                Descartar
              </Button>
            </>
          )}

          {s.status === "aplicada" && s.evento_id && (
            <Button
              size="sm"
              variant="outline"
              disabled={ocupado}
              onClick={() => acoes.desfazer.mutate(s.evento_id as string)}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Desfazer
            </Button>
          )}
        </div>
      </div>

      {s.justificativa && (
        <p className="mt-3 border-l-2 border-border pl-3 text-sm italic text-muted-foreground">
          {s.justificativa}
        </p>
      )}

      {diff.length > 0 ? (
        <div className="mt-3 space-y-1">
          {diff.map((d) => (
            <div key={d.campo} className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="w-40 shrink-0 text-muted-foreground">{d.campo}</span>
              <span className="text-muted-foreground line-through">
                {valorLegivel(d.antes)}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium text-foreground">{valorLegivel(d.depois)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {s.status === "pendente"
            ? "O CRM já está igual ao que a IA sugere — não há nada para aplicar."
            : "Aplicada sem alterações: o CRM já batia com a sugestão."}
        </p>
      )}
    </Card>
  );
}

export function RevisaoIA() {
  const acoes = useIaRevisao();
  const [filtro, setFiltro] = useState<Filtro>("pendente");
  const [soAltaConfianca, setSoAltaConfianca] = useState(false);

  const contagem = useMemo(() => {
    const c: Record<string, number> = { pendente: 0, aplicada: 0, rejeitada: 0 };
    acoes.sugestoes.forEach((s) => {
      c[s.status] = (c[s.status] ?? 0) + 1;
    });
    return c;
  }, [acoes.sugestoes]);

  const visiveis = useMemo(
    () =>
      acoes.sugestoes
        .filter((s) => s.status === filtro)
        .filter((s) => !soAltaConfianca || (s.confianca ?? 0) >= 0.9)
        // Maior confiança primeiro: é por onde vale a pena começar a revisar.
        .sort((a, b) => (b.confianca ?? 0) - (a.confianca ?? 0)),
    [acoes.sugestoes, filtro, soAltaConfianca],
  );

  if (acoes.erro) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <p className="font-medium text-destructive">
          Não foi possível carregar as sugestões da IA.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{acoes.erro.message}</p>
      </div>
    );
  }

  if (acoes.carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <TabsList>
            <TabsTrigger value="pendente">
              Pendentes ({contagem.pendente ?? 0})
            </TabsTrigger>
            <TabsTrigger value="aplicada">
              Aplicadas ({contagem.aplicada ?? 0})
            </TabsTrigger>
            <TabsTrigger value="rejeitada">
              Descartadas ({contagem.rejeitada ?? 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant={soAltaConfianca ? "default" : "outline"}
          size="sm"
          onClick={() => setSoAltaConfianca((v) => !v)}
        >
          <Sparkles className="mr-1 h-4 w-4" />
          Só confiança ≥ 0.90
        </Button>
      </div>

      {visiveis.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nada aqui com esse filtro.
        </Card>
      ) : (
        <div className="space-y-3">
          {visiveis.map((s) => (
            <CartaoSugestao key={s.sugestao_id} s={s} acoes={acoes} />
          ))}
        </div>
      )}
    </div>
  );
}

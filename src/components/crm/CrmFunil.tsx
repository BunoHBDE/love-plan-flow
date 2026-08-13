/**
 * FUNIL EM BARRAS
 *
 * As etapas são uma sequência, não categorias soltas: a cor é um matiz só, em
 * passos de claridade (rampa ordinal), para que a posição no funil se leia na
 * própria cor. A rampa vive em `--funil-1..6` no index.css e foi validada
 * contra a superfície do card nos dois modos.
 *
 * As linhas derivadas (visitas, contratos) não são etapas do funil — são
 * desfechos dentro dele. Por isso saem das barras e viram números de destaque
 * embaixo, onde a taxa de conversão é o que importa.
 */

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { pct, type LinhaFunil } from "@/lib/crm/metrics";

/** Distribui as linhas nos 6 passos da rampa, sempre sem inverter a ordem. */
function passoDaRampa(indice: number, total: number): number {
  if (total <= 1) return 1;
  return Math.min(6, Math.max(1, Math.round(1 + (indice / (total - 1)) * 5)));
}

export function CrmFunil({ linhas }: { linhas: LinhaFunil[] }) {
  // "Novos contatos" é o denominador, não um degrau: todo lead nasce com a
  // primeira etapa preenchida, então ele repetiria a barra de cima. Vira a
  // referência de 100%, declarada acima do gráfico.
  const [total, ...etapas] = linhas.filter((l) => !l.derivada);
  const desfechos = linhas.filter((l) => l.derivada);

  const topo = total?.chegaram ?? 0;

  if (topo === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhum lead no período.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          De <strong className="text-foreground">{topo}</strong> leads que
          entraram no período:
        </p>

        {etapas.map((linha, indice) => (
          <Barra
            key={linha.label}
            linha={linha}
            topo={topo}
            passo={passoDaRampa(indice, etapas.length)}
          />
        ))}
      </div>

      {desfechos.length > 0 && (
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          {desfechos.map((linha) => (
            <Desfecho key={linha.label} linha={linha} />
          ))}
        </div>
      )}
    </div>
  );
}

function Barra({
  linha,
  topo,
  passo,
}: {
  linha: LinhaFunil;
  topo: number;
  passo: number;
}) {
  const proporcao = topo > 0 ? linha.chegaram / topo : 0;

  return (
    <div className="grid grid-cols-[minmax(7rem,11rem)_1fr_auto] items-center gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{linha.label}</p>
        {linha.taxa !== null && (
          <p className="truncate text-xs text-muted-foreground">
            {pct(linha.taxa)} responderam
          </p>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          {/* Trilho recessivo: dá a referência do topo do funil sem competir. */}
          <div className="h-5 w-full rounded-r-[4px] bg-muted/50">
            <div
              className="h-full rounded-r-[4px] transition-all"
              style={{
                width: `${Math.max(proporcao * 100, linha.chegaram > 0 ? 1.5 : 0)}%`,
                backgroundColor: `var(--funil-${passo})`,
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{linha.label}</p>
          <p>{linha.chegaram} chegaram aqui</p>
          {linha.responderam !== null && <p>{linha.responderam} responderam</p>}
          {linha.ignoraram !== null && <p>{linha.ignoraram} ignoraram</p>}
        </TooltipContent>
      </Tooltip>

      <div className="w-20 text-right">
        <span className="text-sm font-semibold tabular-nums">
          {linha.chegaram}
        </span>
        <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
          {pct(linha.pctTotal)}
        </span>
      </div>
    </div>
  );
}

function Desfecho({ linha }: { linha: LinhaFunil }) {
  const destaque = linha.label === "Contratos assinados";

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        destaque ? "border-success/30 bg-success/5" : "border-border bg-muted/30",
      )}
    >
      <p className="text-xs text-muted-foreground">{linha.label}</p>
      <p className="mt-0.5 text-2xl font-display font-semibold">
        {linha.chegaram}
      </p>
      {/* Todo card tem uma segunda linha, para que a fileira fique pareja. */}
      <p className="text-xs text-muted-foreground">
        {linha.taxa !== null
          ? `${pct(linha.taxa)} ${
              linha.label === "Visitas realizadas"
                ? "de comparecimento"
                : "das visitas realizadas"
            }`
          : `${pct(linha.pctTotal)} dos leads`}
      </p>
    </div>
  );
}

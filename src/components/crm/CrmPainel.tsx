import { useMemo, useState } from "react";
import { BarChart3, TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { cn } from "@/lib/utils";
import {
  calcularFunil,
  calcularGargalo,
  calcularMotivos,
  calcularOrigens,
  dias,
  num,
  pct,
} from "@/lib/crm/metrics";
import { hoje, paraDate, somarDias } from "@/lib/crm/dates";
import type { CrmConfig, CrmLeadComputed } from "@/types/crm.types";
import { CrmFunil } from "./CrmFunil";

type PeriodoId =
  | "dia"
  | "7dias"
  | "semana"
  | "mes"
  | "30dias"
  | "60dias"
  | "90dias"
  | "personalizado";

/** Atalhos de período. Todos terminam hoje; só o começo muda. */
const PERIODOS: {
  id: Exclude<PeriodoId, "personalizado">;
  label: string;
  inicio: (hojeISO: string) => string;
}[] = [
  { id: "dia", label: "Hoje", inicio: (h) => h },
  // "N dias" conta hoje como o último dia: 7 dias = hoje e os 6 anteriores.
  { id: "7dias", label: "7 dias", inicio: (h) => somarDias(h, -6) },
  {
    id: "semana",
    label: "Semana",
    // A semana começa na segunda-feira.
    inicio: (h) => somarDias(h, -((paraDate(h).getDay() + 6) % 7)),
  },
  { id: "mes", label: "Mês", inicio: (h) => `${h.slice(0, 8)}01` },
  { id: "30dias", label: "30 dias", inicio: (h) => somarDias(h, -29) },
  { id: "60dias", label: "60 dias", inicio: (h) => somarDias(h, -59) },
  { id: "90dias", label: "90 dias", inicio: (h) => somarDias(h, -89) },
];

const PERIODO_INICIAL: PeriodoId = "30dias";

export function CrmPainel({
  leads,
  config,
}: {
  leads: CrmLeadComputed[];
  config: CrmConfig;
}) {
  const [periodo, setPeriodo] = useState<PeriodoId>(PERIODO_INICIAL);
  const [de, setDe] = useState(() => {
    const atalho = PERIODOS.find((p) => p.id === PERIODO_INICIAL)!;
    return atalho.inicio(hoje());
  });
  const [ate, setAte] = useState(() => hoje());
  const [funilComoTabela, setFunilComoTabela] = useState(false);

  // O painel filtra pela data de entrada do lead, como na planilha.
  const filtrados = useMemo(
    () => leads.filter((l) => l.entrada >= de && l.entrada <= ate),
    [leads, de, ate],
  );

  const escolherPeriodo = (atalho: (typeof PERIODOS)[number]) => {
    const fim = hoje();
    setPeriodo(atalho.id);
    setDe(atalho.inicio(fim));
    setAte(fim);
  };

  // Editar uma data à mão vira período personalizado. O começo nunca passa do
  // fim: arrastar uma ponta para além da outra leva a outra junto.
  const mudarDe = (valor: string) => {
    if (!valor) return;
    setPeriodo("personalizado");
    setDe(valor);
    if (valor > ate) setAte(valor);
  };
  const mudarAte = (valor: string) => {
    if (!valor) return;
    setPeriodo("personalizado");
    setAte(valor);
    if (valor < de) setDe(valor);
  };

  const funil = useMemo(
    () => calcularFunil(filtrados, config.stages),
    [filtrados, config.stages],
  );
  const gargalo = useMemo(
    () => calcularGargalo(filtrados, config.stages),
    [filtrados, config.stages],
  );
  const motivos = useMemo(
    () => calcularMotivos(filtrados, config.stages),
    [filtrados, config.stages],
  );
  const origens = useMemo(
    () => calcularOrigens(filtrados, config),
    [filtrados, config],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Período do painel"
        >
          {PERIODOS.map((atalho) => (
            <Button
              key={atalho.id}
              type="button"
              size="sm"
              variant={periodo === atalho.id ? "default" : "outline"}
              aria-pressed={periodo === atalho.id}
              onClick={() => escolherPeriodo(atalho)}
            >
              {atalho.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={periodo === "personalizado" ? "default" : "outline"}
            aria-pressed={periodo === "personalizado"}
            onClick={() => setPeriodo("personalizado")}
          >
            Escolher período
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label className="text-sm">De</Label>
            <DatePickerField
              value={de}
              onChange={mudarDe}
              className="w-[180px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Até</Label>
            <DatePickerField
              value={ate}
              onChange={mudarAte}
              className="w-[180px]"
            />
          </div>
          <p className="text-sm text-muted-foreground sm:ml-auto sm:pb-2">
            {filtrados.length} lead{filtrados.length === 1 ? "" : "s"} pela data
            de entrada
          </p>
        </div>
      </div>

      {/* 1 · FUNIL */}
      <Bloco
        titulo="1 · Funil"
        descricao={"\n"}
        acao={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFunilComoTabela((atual) => !atual)}
          >
            {funilComoTabela ? (
              <>
                <BarChart3 className="h-4 w-4" />
                Ver em barras
              </>
            ) : (
              <>
                <TableIcon className="h-4 w-4" />
                Ver tabela
              </>
            )}
          </Button>
        }
      >
        {funilComoTabela ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Chegaram</TableHead>
                <TableHead className="text-right">Avançaram</TableHead>
                <TableHead className="text-right">Perderam aqui</TableHead>
                <TableHead className="text-right">Taxa de avanço</TableHead>
                <TableHead className="text-right">% do total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funil.map((linha) => (
                <TableRow key={linha.label}>
                  <TableCell
                    className={cn(
                      linha.derivada && "pl-8 text-muted-foreground",
                      !linha.derivada && "font-medium",
                    )}
                  >
                    {linha.derivada && "→ "}
                    {linha.label}
                  </TableCell>
                  <TableCell className="text-right">{linha.chegaram}</TableCell>
                  <TableCell className="text-right">
                    {num(linha.avancaram)}
                  </TableCell>
                  <TableCell className="text-right">
                    {num(linha.perderam)}
                  </TableCell>
                  <TableCell className="text-right">{pct(linha.taxa)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {pct(linha.pctTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CrmFunil linhas={funil} />
        )}
      </Bloco>

      {/* 2 · GARGALO */}
      <Bloco
        titulo="2 · Onde o atendimento trava"
        descricao={"\n"}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-right">Chegaram</TableHead>
              <TableHead className="text-right">Avançaram</TableHead>
              <TableHead className="text-right">Fecharam</TableHead>
              <TableHead className="text-right">Queda</TableHead>
              <TableHead className="text-right">Perderam aqui</TableHead>
              <TableHead className="text-right">Parados</TableHead>
              <TableHead className="text-right">Em silêncio</TableHead>
              <TableHead className="text-right">Parados há</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gargalo.map((linha) => (
              <TableRow
                key={linha.stageId}
                className={cn(linha.gargalo && "bg-destructive/5")}
              >
                <TableCell
                  className={cn("whitespace-nowrap", linha.gargalo && "font-medium")}
                >
                  {linha.label}
                  {linha.gargalo && (
                    <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                      gargalo
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">{linha.chegaram}</TableCell>
                <TableCell className="text-right">{linha.avancaram}</TableCell>
                <TableCell className="text-right">
                  {linha.fecharam > 0 ? (
                    <span className="font-medium text-success">
                      {linha.fecharam}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right",
                    linha.gargalo ? "font-semibold text-destructive" : "text-muted-foreground",
                  )}
                >
                  {pct(linha.queda)}
                </TableCell>
                <TableCell className="text-right">{linha.perderam}</TableCell>
                <TableCell className="text-right font-medium">
                  {linha.parados}
                </TableCell>
                <TableCell className="text-right">
                  {linha.emSilencio > 0 ? (
                    <span className="text-warning-foreground">
                      {linha.emSilencio}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {dias(linha.diasMediana)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Bloco>

      {/* 3 · MOTIVOS DA PERDA */}
      <Bloco
        titulo="3 · Por que você perde, e onde"
        descricao={"\n"}
      >
        {motivos.total === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma perda registrada no período.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motivo</TableHead>
                  {config.stages.map((stage, i) => (
                    <TableHead
                      key={stage.id}
                      className="text-right"
                      title={stage.nome}
                    >
                      {i + 1}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {motivos.linhas.map((linha) => (
                  <TableRow key={linha.label}>
                    <TableCell className="whitespace-nowrap">
                      {linha.label}
                    </TableCell>
                    {linha.porEtapa.map((valor, i) => (
                      <TableCell
                        key={config.stages[i].id}
                        className={cn(
                          "text-right",
                          valor === 0 && "text-muted-foreground/40",
                        )}
                      >
                        {valor === 0 ? "·" : valor}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">
                      {linha.total}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {pct(linha.pct)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              Colunas numeradas na ordem das etapas:{" "}
              {config.stages.map((s, i) => `${i + 1} ${s.nome}`).join(" · ")}
            </p>
            {motivos.semMotivo > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {motivos.semMotivo} perda{motivos.semMotivo === 1 ? "" : "s"} sem
                motivo — são leads encerrados antes de o motivo passar a ser
                obrigatório.
              </p>
            )}
          </>
        )}
      </Bloco>

      {/* 3 · POR ORIGEM */}
      <Bloco
        titulo="4 · Desempenho por origem"
        descricao={"\n"}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Visitaram</TableHead>
              <TableHead className="text-right">Assinaram</TableHead>
              <TableHead className="text-right">Lead → visita</TableHead>
              <TableHead className="text-right">Lead → contrato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {origens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum lead no período.
                </TableCell>
              </TableRow>
            ) : (
              origens.map((linha) => (
                <TableRow key={linha.label}>
                  <TableCell>{linha.label}</TableCell>
                  <TableCell className="text-right">{linha.leads}</TableCell>
                  <TableCell className="text-right">{linha.visitaram}</TableCell>
                  <TableCell className="text-right">{linha.assinaram}</TableCell>
                  <TableCell className="text-right">
                    {pct(linha.leadParaVisita)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {pct(linha.leadParaContrato)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Bloco>
    </div>
  );
}

function Bloco({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">{titulo}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {descricao}
          </p>
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </div>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

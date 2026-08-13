import { useMemo, useState } from "react";
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
  calcularIgnoradas,
  calcularOrigens,
  num,
  pct,
} from "@/lib/crm/metrics";
import type { CrmConfig, CrmLeadComputed } from "@/types/crm.types";

export function CrmPainel({
  leads,
  config,
}: {
  leads: CrmLeadComputed[];
  config: CrmConfig;
}) {
  const anoAtual = new Date().getFullYear();
  const [de, setDe] = useState(`${anoAtual}-01-01`);
  const [ate, setAte] = useState(`${anoAtual}-12-31`);

  // O painel filtra pela data de entrada do lead, como na planilha.
  const filtrados = useMemo(
    () => leads.filter((l) => l.entrada >= de && l.entrada <= ate),
    [leads, de, ate],
  );

  const funil = useMemo(
    () => calcularFunil(filtrados, config.stages),
    [filtrados, config.stages],
  );
  const ignoradas = useMemo(
    () => calcularIgnoradas(filtrados, config.stages),
    [filtrados, config.stages],
  );
  const origens = useMemo(
    () => calcularOrigens(filtrados, config),
    [filtrados, config],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label className="text-sm">Período — de</Label>
          <DatePickerField value={de} onChange={setDe} className="w-[180px]" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Período — até</Label>
          <DatePickerField value={ate} onChange={setAte} className="w-[180px]" />
        </div>
        <p className="text-sm text-muted-foreground sm:ml-auto sm:pb-2">
          {filtrados.length} lead{filtrados.length === 1 ? "" : "s"} pela data de
          entrada
        </p>
      </div>

      {/* 1 · FUNIL */}
      <Bloco
        titulo="1 · Funil"
        descricao="Quantos leads passam por cada etapa. Uma queda forte numa etapa é problema da mensagem daquela etapa, não do lead."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-right">Chegaram</TableHead>
              <TableHead className="text-right">Responderam</TableHead>
              <TableHead className="text-right">Ignoraram</TableHead>
              <TableHead className="text-right">Taxa de resposta</TableHead>
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
                  {num(linha.responderam)}
                </TableCell>
                <TableCell className="text-right">
                  {num(linha.ignoraram)}
                </TableCell>
                <TableCell className="text-right">{pct(linha.taxa)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {pct(linha.pctTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Bloco>

      {/* 2 · MENSAGENS IGNORADAS */}
      <Bloco
        titulo="2 · Mensagens ignoradas por etapa"
        descricao="Aponta qual mensagem reescrever primeiro. Conta mensagens, não leads — um lead que ficou em silêncio, voltou e sumiu de novo aparece duas vezes."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-right">Vezes ignorada</TableHead>
              <TableHead className="text-right">% das ignoradas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ignoradas.linhas.map((linha) => (
              <TableRow key={linha.label}>
                <TableCell>{linha.label}</TableCell>
                <TableCell className="text-right">{linha.vezes}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {pct(linha.pct)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-medium">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{ignoradas.total}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </Bloco>

      {/* 3 · POR ORIGEM */}
      <Bloco
        titulo="3 · Desempenho por origem"
        descricao="Compare os canais pela taxa lead → contrato, não pelo volume de leads."
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
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{descricao}</p>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

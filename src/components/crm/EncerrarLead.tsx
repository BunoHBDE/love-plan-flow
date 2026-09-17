/**
 * ENCERRAR O ATENDIMENTO
 *
 * Os três jeitos de um atendimento acabar, e o painel precisa saber distinguir
 * os três:
 *
 *   Contratou       — fechou. É o desfecho que o funil inteiro persegue.
 *   Recusou         — o lead desistiu de você (preço, escolheu outro lugar)
 *   Não qualificado — você descartou o lead (mais de 100 convidados, fora do escopo)
 *
 * As duas perdas são de natureza oposta: misturá-las estraga a taxa de
 * conversão, porque uma é falha de venda e a outra é acerto de triagem.
 *
 * **Ganhar não é avançar, é encerrar bem.** Por isso o contrato fechado mora
 * aqui e não como uma etapa: uma etapa "Contrato fechado" seria um estado
 * terminal disfarçado, em que o lead ficaria parado para sempre e o relógio do
 * silêncio correria contra quem já assinou.
 *
 * O motivo é OBRIGATÓRIO nas perdas, e é a razão de esta tela existir. No
 * modelo antigo a objeção era um campo solto na gaveta, que quase ninguém
 * preenchia: 289 recusas na base, 13 com motivo. Pedir aqui, no momento em que
 * a informação está fresca, é o que transforma a perda em dado. Quem contratou
 * não tem objeção a registrar, então ali o campo nem aparece.
 *
 * A etapa onde o lead estava é gravada junto, pelo hook — e vale para os três.
 * É ela que responde "onde estamos perdendo" e "quantos fecharam sem visita".
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { useCrmLeads } from "@/hooks/useCrmLeads";
import type {
  CrmConfig,
  CrmLeadComputed,
  Encerramento,
} from "@/types/crm.types";

const DESFECHOS: { valor: Encerramento; label: string; ajuda: string }[] = [
  {
    valor: "contratou",
    label: "Contratou",
    ajuda: "Fechou com o Sítio. Sai do atendimento pela porta da frente.",
  },
  {
    valor: "recusou",
    label: "Recusou",
    ajuda: "O lead desistiu — preço, escolheu outro lugar, mudou de ideia.",
  },
  {
    valor: "desqualificado",
    label: "Não qualificado",
    ajuda: "Você descartou — não serve para o espaço.",
  },
];

export function EncerrarLead({
  lead,
  acoes,
  aberto,
  inicial = "recusou",
  onFechar,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  aberto: boolean;
  /** Com qual desfecho o diálogo abre, conforme o botão que o chamou. */
  inicial?: Encerramento;
  onFechar: () => void;
}) {
  const [tipo, setTipo] = useState<Encerramento>(inicial);
  const [motivo, setMotivo] = useState<string>("");

  // Reabrir o diálogo para outro lead não pode herdar a escolha do anterior.
  useEffect(() => {
    if (aberto) {
      setTipo(inicial);
      setMotivo("");
    }
  }, [aberto, inicial, lead.id]);

  const ganhou = tipo === "contratou";
  const etapa = lead.derived.etapaAtual?.nome;

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>
            {ganhou ? "Fechar o contrato" : "Encerrar o atendimento"}
          </DialogTitle>
          <DialogDescription>
            {lead.nome}
            {etapa ? ` — ${ganhou ? "fechou em" : "parado em"} ${etapa}.` : "."}{" "}
            A etapa fica registrada junto, é assim que o painel mostra onde você
            {ganhou ? " fecha" : " perde"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <RadioGroup
            value={tipo}
            onValueChange={(v) => setTipo(v as Encerramento)}
            className="gap-3"
          >
            {DESFECHOS.map((desfecho) => (
              <div key={desfecho.valor} className="flex items-start gap-3">
                <RadioGroupItem
                  value={desfecho.valor}
                  id={`desfecho-${desfecho.valor}`}
                  className="mt-1"
                />
                <div className="grid gap-0.5">
                  <Label
                    htmlFor={`desfecho-${desfecho.valor}`}
                    className="cursor-pointer"
                  >
                    {desfecho.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {desfecho.ajuda}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          {/* Quem contratou não tem objeção a registrar. */}
          {!ganhou && (
            <div className="space-y-2">
              <Label htmlFor="encerrar-motivo-objecao">Motivo / objeção</Label>
              <Textarea
                id="encerrar-motivo-objecao"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Preço, escolheu outro lugar, mudou de ideia..."
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            variant={ganhou ? "default" : "destructive"}
            className={cn(ganhou && "bg-success text-success-foreground hover:bg-success/90")}
            disabled={!ganhou && !motivo.trim()}
            onClick={() => {
              acoes.encerrar.mutate({
                lead,
                encerramento: tipo,
                motivo: ganhou ? null : motivo.trim(),
              });
              onFechar();
            }}
          >
            {ganhou ? "Fechar contrato" : "Encerrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

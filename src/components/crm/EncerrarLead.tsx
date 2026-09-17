/**
 * ENCERRAR O ATENDIMENTO
 *
 * Duas perdas que o painel precisa saber distinguir:
 *
 *   Recusou       — o lead desistiu de você (preço, escolheu outro lugar)
 *   Não qualificado — você descartou o lead (mais de 100 convidados, fora do escopo)
 *
 * São de natureza oposta: misturá-las estraga a taxa de conversão, porque uma
 * é falha de venda e a outra é acerto de triagem.
 *
 * O motivo é OBRIGATÓRIO, e é a razão de esta tela existir. No modelo antigo
 * a objeção era um campo solto na gaveta, que quase ninguém preenchia: 289
 * recusas na base, 13 com motivo. Pedir aqui, no momento em que a informação
 * está fresca, é o que transforma a perda em dado.
 *
 * A etapa onde o lead estava é gravada junto, pelo hook — é ela que responde
 * "onde estamos perdendo", que antes era impossível saber.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { useCrmLeads } from "@/hooks/useCrmLeads";
import type {
  CrmConfig,
  CrmLeadComputed,
  Encerramento,
} from "@/types/crm.types";

type Perda = Extract<Encerramento, "recusou" | "desqualificado">;

const PERDAS: { valor: Perda; label: string; ajuda: string }[] = [
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
  config,
  acoes,
  aberto,
  onFechar,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  aberto: boolean;
  onFechar: () => void;
}) {
  const [tipo, setTipo] = useState<Perda>("recusou");
  const [motivo, setMotivo] = useState<string>("");

  // Reabrir o diálogo para outro lead não pode herdar a escolha do anterior.
  useEffect(() => {
    if (aberto) {
      setTipo("recusou");
      setMotivo("");
    }
  }, [aberto, lead.id]);

  const etapa = lead.derived.etapaAtual?.nome;

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Encerrar o atendimento</DialogTitle>
          <DialogDescription>
            {lead.nome}
            {etapa ? ` — parado em ${etapa}.` : "."} A etapa fica registrada
            junto com o motivo, é assim que o painel mostra onde você perde.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <RadioGroup
            value={tipo}
            onValueChange={(v) => setTipo(v as Perda)}
            className="gap-3"
          >
            {PERDAS.map((perda) => (
              <div key={perda.valor} className="flex items-start gap-3">
                <RadioGroupItem
                  value={perda.valor}
                  id={`perda-${perda.valor}`}
                  className="mt-1"
                />
                <div className="grid gap-0.5">
                  <Label
                    htmlFor={`perda-${perda.valor}`}
                    className="cursor-pointer"
                  >
                    {perda.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{perda.ajuda}</p>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="motivo-objecao">Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger id="motivo-objecao">
                <SelectValue placeholder="Escolha o motivo" />
              </SelectTrigger>
              <SelectContent>
                {config.motivos.map((m) => (
                  <SelectItem key={m.id} value={m.label}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!motivo}
            onClick={() => {
              acoes.encerrar.mutate({ lead, encerramento: tipo, motivo });
              onFechar();
            }}
          >
            Encerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

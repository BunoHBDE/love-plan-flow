/**
 * FUP NA LINHA
 *
 * Botão da coluna Ações que registra um follow-up: 3, 7, 14 dias ou um prazo
 * livre. Escolher o prazo não grava na hora — abre uma confirmação, que avisa
 * quando o lead ainda não respondeu ao FUP anterior. Confirmado, a "Data da
 * Próxima Mensagem" vira hoje + N dias e o FUP entra no histórico (`crm_fups`).
 */

import { useState } from "react";
import { AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatarData, hoje, somarDias } from "@/lib/crm/dates";
import type { FupDoLead } from "@/hooks/useCrmFups";
import type { CrmLeadComputed } from "@/types/crm.types";

const PRAZOS_PADRAO = [3, 7, 14];
const MAX_DIAS = 365;

export function FupBotao({
  lead,
  fup,
  onRegistrar,
}: {
  lead: CrmLeadComputed;
  fup: FupDoLead | undefined;
  onRegistrar: (dias: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [livre, setLivre] = useState("");
  /** Prazo aguardando confirmação; null = sem confirmação aberta. */
  const [pendente, setPendente] = useState<number | null>(null);

  // Lead encerrado não tem próximo passo para adiar.
  if (lead.encerramento) return null;

  const diasLivre = Number(livre);
  const livreValido =
    livre.trim() !== "" &&
    Number.isInteger(diasLivre) &&
    diasLivre >= 1 &&
    diasLivre <= MAX_DIAS;

  const pedirConfirmacao = (dias: number) => {
    setAberto(false);
    setLivre("");
    setPendente(dias);
  };

  const aberta = fup?.aberto ?? null;

  return (
    // A linha inteira é clicável (abre a gaveta) e o Enter também: o clique e
    // a tecla não podem vazar daqui — nem o do popover, nem o da confirmação,
    // que sobe pela árvore do React mesmo estando num portal.
    <span
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="shrink-0"
    >
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={aberta ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1 px-2 text-xs font-semibold"
            title={
              aberta
                ? `Em FUP de ${aberta.dias} dias, sem resposta. Clique para um novo FUP.`
                : "Registrar follow-up"
            }
          >
            <AlarmClock className="h-3.5 w-3.5" />
            FUP{aberta ? ` ${aberta.dias}d` : ""}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 space-y-3">
          <p className="text-sm font-medium">Follow-up em quantos dias?</p>
          <div className="grid grid-cols-3 gap-2">
            {PRAZOS_PADRAO.map((dias) => (
              <Button
                key={dias}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => pedirConfirmacao(dias)}
              >
                {dias} dias
              </Button>
            ))}
          </div>
          <form
            className="space-y-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (livreValido) pedirConfirmacao(diasLivre);
            }}
          >
            <Label htmlFor={`fup-livre-${lead.id}`} className="text-xs">
              Outro prazo (dias)
            </Label>
            <div className="flex gap-2">
              <Input
                id={`fup-livre-${lead.id}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DIAS}
                value={livre}
                onChange={(e) => setLivre(e.target.value)}
                placeholder="Ex.: 10"
                className="h-8"
              />
              <Button type="submit" size="sm" disabled={!livreValido}>
                OK
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={pendente !== null}
        onOpenChange={(abrir) => !abrir && setPendente(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Registrar FUP de {pendente} {pendente === 1 ? "dia" : "dias"}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {aberta && (
                  <p className="rounded-md border border-amber-300 bg-amber-50 p-2 font-medium text-amber-900">
                    Este lead não respondeu ao último FUP ({aberta.dias} dias,
                    feito em {formatarData(aberta.iniciado_em.slice(0, 10))}).
                    Deseja confirmar um novo FUP?
                  </p>
                )}
                <p>
                  A próxima mensagem será em{" "}
                  <strong>
                    {pendente !== null
                      ? formatarData(somarDias(hoje(), pendente))
                      : ""}
                  </strong>
                  .
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              onClick={() => {
                if (pendente !== null) onRegistrar(pendente);
                setPendente(null);
              }}
            >
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}

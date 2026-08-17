/**
 * CADASTRO RÁPIDO
 *
 * O contato novo chega a qualquer hora do dia, e quase sempre em lote. Por
 * isso o cadastro é uma linha da própria lista, não um diálogo: depois de
 * salvar, os campos limpam e o foco volta para o nome — o próximo contato
 * entra sem tirar a mão do teclado.
 */

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { formatarData, hoje } from "@/lib/crm/dates";
import {
  PHONE_MAX_LENGTH,
  formatPhone,
  handlePhonePaste,
  isValidPhone,
  phoneDigits,
} from "@/lib/masks";
import type { useCrmLeads } from "@/hooks/useCrmLeads";
import type { CrmConfig, CrmLeadComputed } from "@/types/crm.types";

export function CadastroRapido({
  config,
  leads,
  acoes,
  onAbrirLead,
}: {
  config: CrmConfig;
  leads: CrmLeadComputed[];
  acoes: ReturnType<typeof useCrmLeads>;
  onAbrirLead: (id: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [origem, setOrigem] = useState("");
  // Já vem como hoje, que é o caso normal. Editável porque o lote atrasado
  // existe: o contato de ontem cadastrado hoje precisa da data de ontem, ou
  // o relógio do follow-up começa errado.
  const [entrada, setEntrada] = useState(hoje());
  const campoNome = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) campoNome.current?.focus();
  }, [aberto]);

  // Aviso de duplicado: o mesmo casal costuma chamar mais de uma vez.
  // Compara por dígitos, então acha o duplicado mesmo se o antigo tiver
  // entrado sem máscara.
  const digitos = phoneDigits(telefone);
  const duplicado =
    digitos.length >= 8
      ? leads.find((lead) => phoneDigits(lead.telefone).endsWith(digitos))
      : undefined;

  // O telefone é o único jeito de falar com o lead: um número pela metade
  // não pode ser salvo.
  const telefoneCompleto = isValidPhone(telefone);
  const telefoneIncompleto = telefone.trim() !== "" && !telefoneCompleto;

  // A entrada é a data da sua primeira mensagem, então não existe no futuro:
  // seria um prazo de follow-up contando para trás.
  const entradaNoFuturo = entrada > hoje();

  const podeSalvar =
    nome.trim() !== "" && telefoneCompleto && entrada !== "" && !entradaNoFuturo;

  const salvar = () => {
    if (!podeSalvar) return;

    acoes.criarLead.mutate(
      { nome, telefone, origem: origem || null, entrada },
      {
        onSuccess: () => {
          // Origem e entrada se mantêm: um lote costuma vir do mesmo canal e
          // do mesmo dia.
          setNome("");
          setTelefone("");
          campoNome.current?.focus();
        },
      },
    );
  };

  const aoTeclar = (evento: React.KeyboardEvent) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      salvar();
    }
    if (evento.key === "Escape") setAberto(false);
  };

  if (!aberto) {
    return (
      <Button variant="gold" onClick={() => setAberto(true)}>
        <Plus className="h-4 w-4" />
        Novo lead
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-gold/40 bg-card p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          ref={campoNome}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={aoTeclar}
          placeholder="Nome dos noivos"
          className="sm:flex-1"
        />
        <Input
          value={telefone}
          onChange={(e) => setTelefone(formatPhone(e.target.value))}
          onPaste={(e) => handlePhonePaste(e, setTelefone)}
          onKeyDown={aoTeclar}
          placeholder="(11) 99999-9999"
          inputMode="tel"
          maxLength={PHONE_MAX_LENGTH}
          aria-invalid={telefoneIncompleto}
          className="sm:w-44"
        />
        <Select value={origem} onValueChange={setOrigem}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            {config.origens.map((item) => (
              <SelectItem key={item.id} value={item.label}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePickerField
          value={entrada}
          onChange={setEntrada}
          placeholder="Entrada"
          className="sm:w-40"
        />

        <div className="flex gap-2">
          <Button
            variant="gold"
            onClick={salvar}
            disabled={!podeSalvar || acoes.criarLead.isPending}
          >
            Cadastrar
          </Button>
          <Button variant="ghost" onClick={() => setAberto(false)}>
            Fechar
          </Button>
        </div>
      </div>

      {entradaNoFuturo ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          A entrada é o dia em que o contato chegou, então não pode ser depois
          de hoje.
        </p>
      ) : telefoneIncompleto ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          Falta número: o WhatsApp precisa do DDD e de 8 ou 9 dígitos.
        </p>
      ) : duplicado ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-warning-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          Este WhatsApp já está em{" "}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={() => onAbrirLead(duplicado.id)}
          >
            {duplicado.nome}
          </button>
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Enter cadastra e já libera o próximo. A primeira etapa entra como
          “aguardando”.
          {/* A entrada não volta para hoje sozinha: se ficou em outro dia, é
              melhor dizer, senão o lote seguinte entra com a data errada. */}
          {entrada !== hoje() && (
            <>
              {" "}
              A entrada segue em{" "}
              <strong className="font-semibold">{formatarData(entrada)}</strong>{" "}
              até você trocar.
            </>
          )}
        </p>
      )}
    </div>
  );
}

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
import { hoje } from "@/lib/crm/dates";
import type { useCrmLeads } from "@/hooks/useCrmLeads";
import type { CrmConfig, CrmLeadComputed } from "@/types/crm.types";

const so_digitos = (valor: string) => valor.replace(/\D/g, "");

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
  const campoNome = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) campoNome.current?.focus();
  }, [aberto]);

  // Aviso de duplicado: o mesmo casal costuma chamar mais de uma vez.
  const digitos = so_digitos(telefone);
  const duplicado =
    digitos.length >= 8
      ? leads.find((lead) => so_digitos(lead.telefone).endsWith(digitos))
      : undefined;

  const podeSalvar = nome.trim() !== "" && telefone.trim() !== "";

  const salvar = () => {
    if (!podeSalvar) return;

    acoes.criarLead.mutate(
      { nome, telefone, origem: origem || null, entrada: hoje() },
      {
        onSuccess: () => {
          // Origem se mantém: um lote costuma vir do mesmo canal.
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
          onChange={(e) => setTelefone(e.target.value)}
          onKeyDown={aoTeclar}
          placeholder="WhatsApp"
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

      {duplicado ? (
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
          Enter cadastra e já libera o próximo. A entrada fica como hoje e a
          primeira etapa entra como “aguardando”.
        </p>
      )}
    </div>
  );
}

/**
 * QUALIFICAÇÃO DO LEAD
 *
 * Nome dos noivos, data do casamento e número de convidados são o que decide
 * se o lead é qualificado, e saem todos na etapa de perguntas. Por isso vivem
 * juntos numa peça só, usada tanto na gaveta quanto direto na linha da lista —
 * ali eles se preenchem enquanto a conversa acontece.
 */

import { useEffect, useState } from "react";
import { CalendarHeart, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { MONTHS, getYearsArray } from "@/constants/visits";
import { cn } from "@/lib/utils";
import { resumoCurto } from "@/lib/crm/lead";
import type { AtualizarLeadInput, useCrmLeads } from "@/hooks/useCrmLeads";
import type { CrmLead, CrmLeadComputed } from "@/types/crm.types";

const SEM_VALOR = "__nenhum";

// ==========================================
// DATA DO CASAMENTO
// ==========================================

export function DataDoCasamento({
  lead,
  salvar,
  idPrefixo,
}: {
  lead: CrmLead;
  salvar: (patch: AtualizarLeadInput) => void;
  /** Os rádios precisam de ids únicos quando a peça aparece duas vezes. */
  idPrefixo: string;
}) {
  const comData = lead.data_evento_status !== "sem_data";

  return (
    <div className="space-y-3">
      <Label className="text-sm">Data do casamento</Label>

      <RadioGroup
        value={lead.data_evento_status}
        onValueChange={(valor) =>
          salvar(
            valor === "com_data"
              ? {
                  data_evento_status: "com_data",
                  mes_evento: null,
                  ano_evento: null,
                }
              : { data_evento_status: "sem_data", data_evento: null },
          )
        }
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="com_data" id={`${idPrefixo}-com-data`} />
          <Label
            htmlFor={`${idPrefixo}-com-data`}
            className="cursor-pointer text-sm"
          >
            Data definida
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sem_data" id={`${idPrefixo}-sem-data`} />
          <Label
            htmlFor={`${idPrefixo}-sem-data`}
            className="cursor-pointer text-sm"
          >
            Ainda sem data
          </Label>
        </div>
      </RadioGroup>

      {comData ? (
        <DatePickerField
          value={lead.data_evento ?? ""}
          onChange={(valor) => salvar({ data_evento: valor || null })}
          placeholder="Escolher a data"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={lead.mes_evento ?? SEM_VALOR}
            onValueChange={(valor) =>
              salvar({ mes_evento: valor === SEM_VALOR ? null : valor })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEM_VALOR}>—</SelectItem>
              {MONTHS.map((mes) => (
                <SelectItem key={mes.value} value={mes.value}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={lead.ano_evento ?? SEM_VALOR}
            onValueChange={(valor) =>
              salvar({ ano_evento: valor === SEM_VALOR ? null : valor })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEM_VALOR}>—</SelectItem>
              {getYearsArray().map((ano) => (
                <SelectItem key={ano} value={ano}>
                  {ano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// ==========================================
// NA LINHA DA LISTA
// ==========================================

/**
 * Mostra o que já se sabe e abre o formulário no clique. Quando ainda não há
 * nada, o próprio vazio convida a preencher — é o gancho para registrar as
 * respostas da etapa de perguntas sem sair da lista.
 */
export function QualificacaoNaLinha({
  lead,
  acoes,
  className,
}: {
  lead: CrmLeadComputed;
  acoes: ReturnType<typeof useCrmLeads>;
  className?: string;
}) {
  const resumo = resumoCurto(lead);

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {/* Sempre com borda: nesta página borda quer dizer "isto é um
            botão". Antes, quando havia dados, ele virava texto solto e
            ninguém adivinhava que dava para clicar. */}
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors",
            "hover:border-gold hover:bg-muted hover:text-foreground",
            resumo
              ? "border-border text-muted-foreground"
              : "border-dashed border-border text-muted-foreground/70",
            className,
          )}
        >
          <CalendarHeart className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{resumo || "Dados do casamento"}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-80 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <FormularioQualificacao lead={lead} acoes={acoes} idPrefixo="linha" />
      </PopoverContent>
    </Popover>
  );
}

// ==========================================
// FORMULÁRIO
// ==========================================

/**
 * Os três campos que qualificam o lead. O nome mora em `clients`, os outros
 * dois em `crm_leads` — por isso as duas mutações diferentes.
 */
export function FormularioQualificacao({
  lead,
  acoes,
  idPrefixo,
}: {
  lead: CrmLeadComputed;
  acoes: ReturnType<typeof useCrmLeads>;
  idPrefixo: string;
}) {
  const [nome, setNome] = useState(lead.nome);
  const [convidados, setConvidados] = useState(
    lead.convidados?.toString() ?? "",
  );

  useEffect(() => {
    setNome(lead.nome);
    setConvidados(lead.convidados?.toString() ?? "");
  }, [lead.id, lead.nome, lead.convidados]);

  const salvar = (patch: AtualizarLeadInput) =>
    acoes.atualizarLead.mutate({ id: lead.id, patch });

  const salvarNome = () => {
    const limpo = nome.trim();
    if (limpo && limpo !== lead.nome) {
      acoes.atualizarContato.mutate({
        clientId: lead.client_id,
        patch: { nome: limpo },
      });
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefixo}-nome`} className="text-sm">
          Nome dos noivos
        </Label>
        <Input
          id={`${idPrefixo}-nome`}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={salvarNome}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </div>

      <DataDoCasamento lead={lead} salvar={salvar} idPrefixo={idPrefixo} />

      <div className="space-y-2">
        <Label
          htmlFor={`${idPrefixo}-convidados`}
          className="flex items-center gap-1.5 text-sm"
        >
          <Users className="h-3.5 w-3.5" />
          Convidados
        </Label>
        <Input
          id={`${idPrefixo}-convidados`}
          type="number"
          min={0}
          value={convidados}
          onChange={(e) => setConvidados(e.target.value)}
          onBlur={() =>
            salvar({ convidados: convidados ? Number(convidados) : null })
          }
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </div>
    </>
  );
}

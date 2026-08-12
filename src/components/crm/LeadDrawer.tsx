import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, RotateCcw, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { MONTHS, getYearsArray } from "@/constants/visits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatarData } from "@/lib/crm/dates";
import type { AtualizarLeadInput, useCrmLeads } from "@/hooks/useCrmLeads";
import {
  COMPARECEU_LABELS,
  FOLLOWUP_LABELS,
  type Compareceu,
  type CrmConfig,
  type CrmLeadComputed,
  type FollowupResultado,
} from "@/types/crm.types";
import { QuandoBadge, SituacaoBadge, WhatsAppButton } from "./CrmBadges";

const SEM_VALOR = "__nenhum";

interface LeadDrawerProps {
  lead: CrmLeadComputed | null;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  onClose: () => void;
}

export function LeadDrawer({ lead, config, acoes, onClose }: LeadDrawerProps) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  return (
    <>
      <Sheet open={!!lead} onOpenChange={(aberto) => !aberto && onClose()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {lead && (
            <ConteudoDrawer
              lead={lead}
              config={config}
              acoes={acoes}
              onExcluir={() => setConfirmandoExclusao(true)}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmandoExclusao}
        onOpenChange={setConfirmandoExclusao}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este lead do CRM?</AlertDialogTitle>
            <AlertDialogDescription>
              O histórico de atendimento, etapas e follow-ups de{" "}
              <strong>{lead?.nome}</strong> será apagado. O cadastro do cliente
              continua na página Clientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (lead) acoes.excluirLead.mutate(lead.id);
                setConfirmandoExclusao(false);
                onClose();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ==========================================
// CONTEÚDO
// ==========================================

function ConteudoDrawer({
  lead,
  config,
  acoes,
  onExcluir,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  onExcluir: () => void;
}) {
  const { derived } = lead;

  const salvar = (patch: Parameters<typeof acoes.atualizarLead.mutate>[0]["patch"]) =>
    acoes.atualizarLead.mutate({ id: lead.id, patch });

  return (
    <div className="space-y-6">
      <SheetHeader className="space-y-3 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="font-display text-2xl truncate">
              {lead.nome}
            </SheetTitle>
            <SheetDescription className="mt-0.5">
              {lead.telefone} · entrou em {formatarData(lead.entrada)}
            </SheetDescription>
          </div>
          <SituacaoBadge situacao={derived.situacao} />
        </div>
        <WhatsAppButton telefone={lead.telefone} />
      </SheetHeader>

      <ProximoPasso
        lead={lead}
        config={config}
        acoes={acoes}
        salvar={salvar}
      />

      <Secao titulo="Atendimento">
        {config.stages.map((stage, indice) => {
          const registro = lead.etapas.find((e) => e.stage_id === stage.id);
          const travada = derived.etapaTravada?.id === stage.id;

          return (
            <CampoSelect
              key={stage.id}
              label={`${indice + 1} · ${stage.nome}`}
              destaque={travada}
              value={registro?.outcome_id ?? SEM_VALOR}
              onChange={(valor) =>
                acoes.registrarEtapa.mutate({
                  lead,
                  stageId: stage.id,
                  outcomeId: valor === SEM_VALOR ? null : valor,
                })
              }
              opcoes={stage.outcomes.map((o) => ({
                value: o.id,
                label: o.label,
              }))}
            />
          );
        })}
      </Secao>

      <BlocoAgendamento lead={lead} config={config} salvar={salvar} />

      <BlocoFollowup lead={lead} config={config} acoes={acoes} />

      <BlocoDados lead={lead} config={config} acoes={acoes} salvar={salvar} />

      <Separator />

      <Button
        variant="ghost"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onExcluir}
      >
        <Trash2 className="h-4 w-4" />
        Excluir lead
      </Button>
    </div>
  );
}

// ==========================================
// PRÓXIMO PASSO
// ==========================================

function ProximoPasso({
  lead,
  config,
  acoes,
  salvar,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  salvar: (patch: AtualizarLeadInput) => void;
}) {
  const { derived } = lead;
  const [editandoData, setEditandoData] = useState(false);

  // Ao trocar de lead, fecha o editor de data.
  useEffect(() => setEditandoData(false), [lead.id]);

  if (!derived.proximoPasso) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Atendimento encerrado
          {lead.encerrado_em && ` em ${formatarData(lead.encerrado_em)}`}.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        derived.urgencia === "atrasado"
          ? "border-destructive/30 bg-destructive/5"
          : derived.urgencia === "hoje"
            ? "border-warning/40 bg-warning/10"
            : "border-border bg-muted/40",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Próximo passo</p>
            <p className="font-medium truncate">{derived.proximoPasso}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditandoData((atual) => !atual)}
          title="Ajustar a data"
          className="shrink-0 rounded-full transition-opacity hover:opacity-80"
        >
          <QuandoBadge quando={derived.quando} urgencia={derived.urgencia} />
        </button>
      </div>

      {editandoData && (
        <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
          <Label className="text-xs text-muted-foreground">
            Data do próximo passo
          </Label>
          <DatePickerField
            value={derived.quando ?? ""}
            onChange={(valor) => salvar({ quando_manual: valor || null })}
          />
          {derived.quandoManual ? (
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => salvar({ quando_manual: null })}
            >
              <RotateCcw className="h-3 w-3" />
              Voltar para a data calculada
              {derived.quandoCalculado &&
                ` (${formatarData(derived.quandoCalculado)})`}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Calculada pelos prazos. Escolher outra data vale só para este
              passo — ao avançar o atendimento, o cálculo volta a valer.
            </p>
          )}
        </div>
      )}

      {derived.etapaTravada && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          Travado em <strong>{derived.etapaTravada.nome}</strong> — em silêncio
          há {derived.diasEmSilencio} dia
          {derived.diasEmSilencio === 1 ? "" : "s"}
        </p>
      )}

      <AcaoRapida lead={lead} config={config} acoes={acoes} salvar={salvar} />
    </div>
  );
}

/**
 * Resolve o próximo passo ali mesmo, sem rolar a gaveta atrás do controle
 * certo. Qual controle resolve o quê vem do motor, não daqui.
 */
function AcaoRapida({
  lead,
  config,
  acoes,
  salvar,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  salvar: (patch: AtualizarLeadInput) => void;
}) {
  const acao = lead.derived.acao;
  if (!acao) return null;

  const moldura = (dica: string, children: React.ReactNode) => (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
      <p className="text-xs text-muted-foreground">{dica}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  if (acao.tipo === "etapa") {
    const stage = config.stages.find((s) => s.id === acao.stageId);
    if (!stage) return null;

    const atual = lead.etapas.find((e) => e.stage_id === stage.id);

    return moldura(
      `Registrar em ${stage.nome}:`,
      stage.outcomes.map((outcome) => (
        <Button
          key={outcome.id}
          size="sm"
          variant={atual?.outcome_id === outcome.id ? "default" : "outline"}
          onClick={() =>
            acoes.registrarEtapa.mutate({
              lead,
              stageId: stage.id,
              outcomeId: outcome.id,
            })
          }
        >
          {outcome.label}
        </Button>
      )),
    );
  }

  if (acao.tipo === "followup") {
    const atual = lead.followups.find(
      (f) => f.ciclo === lead.fup_ciclo && f.numero === acao.numero,
    );

    return moldura(
      `Registrar o FUP ${acao.numero}:`,
      (Object.keys(FOLLOWUP_LABELS) as FollowupResultado[]).map((resultado) => (
        <Button
          key={resultado}
          size="sm"
          variant={atual?.resultado === resultado ? "default" : "outline"}
          onClick={() =>
            acoes.registrarFollowup.mutate({
              lead,
              numero: acao.numero,
              resultado,
            })
          }
        >
          {FOLLOWUP_LABELS[resultado]}
        </Button>
      )),
    );
  }

  if (acao.tipo === "compareceu") {
    return moldura(
      "O casal compareceu?",
      (["sim", "nao", "remarcou"] as Compareceu[]).map((valor) => (
        <Button
          key={valor}
          size="sm"
          variant={lead.compareceu === valor ? "default" : "outline"}
          onClick={() => salvar({ compareceu: valor })}
        >
          {COMPARECEU_LABELS[valor]}
        </Button>
      )),
    );
  }

  // Reagendamento: escolher a nova data devolve a visita para "pendente".
  return (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
      <p className="text-xs text-muted-foreground">Nova data da visita:</p>
      <DatePickerField
        value={lead.data_agendamento ?? ""}
        onChange={(valor) =>
          salvar({
            data_agendamento: valor || null,
            compareceu: valor ? "pendente" : lead.compareceu,
          })
        }
        placeholder="Escolher a nova data"
      />
    </div>
  );
}

// ==========================================
// BLOCOS
// ==========================================

function BlocoAgendamento({
  lead,
  config,
  salvar,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  salvar: (patch: { data_agendamento?: string | null; compareceu?: Compareceu | null }) => void;
}) {
  // O bloco só aparece depois que alguma etapa marcou um agendamento.
  const agendou = config.stages.some((stage) =>
    stage.outcomes.some(
      (outcome) =>
        outcome.semantica === "agendou" &&
        lead.etapas.some((e) => e.outcome_id === outcome.id),
    ),
  );

  if (!agendou && !lead.data_agendamento && !lead.compareceu) return null;

  return (
    <Secao titulo="Visita">
      <div className="space-y-2">
        <Label className="text-sm">Data da visita</Label>
        <DatePickerField
          value={lead.data_agendamento ?? ""}
          onChange={(valor) => salvar({ data_agendamento: valor || null })}
          placeholder="Escolher a data"
        />
      </div>

      <CampoSelect
        label="Compareceu?"
        value={lead.compareceu ?? SEM_VALOR}
        onChange={(valor) =>
          salvar({
            compareceu: valor === SEM_VALOR ? null : (valor as Compareceu),
          })
        }
        opcoes={Object.entries(COMPARECEU_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
      />
    </Secao>
  );
}

function BlocoFollowup({
  lead,
  config,
  acoes,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
}) {
  const { derived } = lead;
  const temHistorico = lead.followups.length > 0;

  if (derived.situacao !== "em_followup" && !temHistorico) return null;

  return (
    <Secao
      titulo="Follow-up"
      descricao={
        derived.silencioDesde
          ? `Silêncio desde ${formatarData(derived.silencioDesde)}. As quatro datas contam a partir daí — nunca do follow-up anterior.`
          : undefined
      }
    >
      {config.settings.fup_dias.map((dias, indice) => {
        const numero = indice + 1;
        const registro = lead.followups.find(
          (f) => f.ciclo === lead.fup_ciclo && f.numero === numero,
        );
        const previsto = derived.fupPrevistos[indice];
        const eProximo = derived.proximoFup === numero;

        return (
          <CampoSelect
            key={numero}
            label={`FUP ${numero} · ${dias}d`}
            sublabel={previsto ? formatarData(previsto) : undefined}
            destaque={eProximo}
            value={registro?.resultado ?? SEM_VALOR}
            onChange={(valor) =>
              acoes.registrarFollowup.mutate({
                lead,
                numero,
                resultado:
                  valor === SEM_VALOR ? null : (valor as FollowupResultado),
              })
            }
            opcoes={Object.entries(FOLLOWUP_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        );
      })}

      {lead.fup_ciclo > 1 && (
        <p className="text-xs text-muted-foreground">
          Este é o {lead.fup_ciclo}º ciclo de follow-up deste lead. Os ciclos
          anteriores ficam guardados no histórico.
        </p>
      )}
    </Secao>
  );
}

function BlocoDados({
  lead,
  config,
  acoes,
  salvar,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  salvar: (patch: AtualizarLeadInput) => void;
}) {
  const [convidados, setConvidados] = useState(
    lead.convidados?.toString() ?? "",
  );
  const [observacoes, setObservacoes] = useState(lead.observacoes ?? "");
  const [telefone, setTelefone] = useState(lead.telefone);

  // Ao trocar de lead, recarrega os campos de texto.
  useEffect(() => {
    setConvidados(lead.convidados?.toString() ?? "");
    setObservacoes(lead.observacoes ?? "");
    setTelefone(lead.telefone);
  }, [lead.id, lead.convidados, lead.observacoes, lead.telefone]);

  return (
    <Secao titulo="Dados">
      <CampoSelect
        label="Origem"
        value={lead.origem ?? SEM_VALOR}
        onChange={(valor) =>
          salvar({ origem: valor === SEM_VALOR ? null : valor })
        }
        opcoes={config.origens.map((o) => ({ value: o.label, label: o.label }))}
      />

      <div className="space-y-2">
        <Label className="text-sm">WhatsApp</Label>
        <Input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          onBlur={() => {
            if (telefone.trim() && telefone !== lead.telefone) {
              acoes.atualizarContato.mutate({
                clientId: lead.client_id,
                patch: { telefone: telefone.trim() },
              });
            }
          }}
        />
      </div>

      <DataDoCasamento lead={lead} salvar={salvar} />

      <div className="space-y-2">
        <Label className="text-sm">Convidados</Label>
        <Input
          type="number"
          min={0}
          value={convidados}
          onChange={(e) => setConvidados(e.target.value)}
          onBlur={() =>
            salvar({ convidados: convidados ? Number(convidados) : null })
          }
        />
      </div>

      <CampoSelect
        label="Motivo / objeção"
        value={lead.motivo_objecao ?? SEM_VALOR}
        onChange={(valor) =>
          salvar({ motivo_objecao: valor === SEM_VALOR ? null : valor })
        }
        opcoes={config.motivos.map((m) => ({ value: m.label, label: m.label }))}
      />

      <div className="space-y-2">
        <Label className="text-sm">Última mensagem minha</Label>
        <DatePickerField
          value={lead.ultima_msg ?? ""}
          onChange={(valor) =>
            salvar({ ultima_msg: valor || null, ultima_msg_manual: true })
          }
        />
        <p className="text-xs text-muted-foreground">
          {lead.ultima_msg_manual
            ? "Definida manualmente — o sistema não vai mais atualizar sozinho."
            : "Atualizada sozinha a cada mensagem de etapa enviada. Enviar follow-up não mexe nela."}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Observações</Label>
        <Textarea
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          onBlur={() => salvar({ observacoes: observacoes.trim() || null })}
        />
      </div>
    </Secao>
  );
}

/**
 * A data do casamento pode estar fechada ou ainda ser só uma previsão de
 * mês e ano — na prática, a maioria dos leads chega sem data definida.
 */
function DataDoCasamento({
  lead,
  salvar,
}: {
  lead: CrmLeadComputed;
  salvar: (patch: AtualizarLeadInput) => void;
}) {
  const comData = lead.data_evento_status !== "sem_data";
  const anos = getYearsArray();

  return (
    <div className="space-y-3">
      <Label className="text-sm">Data do casamento</Label>

      <RadioGroup
        value={lead.data_evento_status}
        onValueChange={(valor) =>
          salvar(
            valor === "com_data"
              ? { data_evento_status: "com_data", mes_evento: null, ano_evento: null }
              : { data_evento_status: "sem_data", data_evento: null },
          )
        }
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="com_data" id="crm-data-definida" />
          <Label htmlFor="crm-data-definida" className="cursor-pointer text-sm">
            Data definida
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sem_data" id="crm-data-indefinida" />
          <Label htmlFor="crm-data-indefinida" className="cursor-pointer text-sm">
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
              {anos.map((ano) => (
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
// PEÇAS DE FORMULÁRIO
// ==========================================

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-semibold">{titulo}</h3>
        {descricao && (
          <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function CampoSelect({
  label,
  sublabel,
  value,
  onChange,
  opcoes,
  destaque,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (valor: string) => void;
  opcoes: { value: string; label: string }[];
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm truncate",
            destaque ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn("w-[190px] shrink-0", destaque && "border-warning")}
        >
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SEM_VALOR}>—</SelectItem>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

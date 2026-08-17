import { useEffect, useState } from "react";
import { AlertCircle, Archive, ArrowRight, RotateCcw, Trash2 } from "lucide-react";
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
import { DatePickerField } from "@/components/ui/DatePickerField";
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
import {
  PHONE_MAX_LENGTH,
  formatPhone,
  handlePhonePaste,
  isValidPhone,
} from "@/lib/masks";
import type { AtualizarLeadInput, useCrmLeads } from "@/hooks/useCrmLeads";
import {
  COMPARECEU_LABELS,
  type Compareceu,
  type CrmConfig,
  type CrmLeadComputed,
} from "@/types/crm.types";
import { QuandoBadge, SituacaoBadge, WhatsAppButton } from "./CrmBadges";
import { AcaoRapidaBotoes } from "./AcaoRapida";
import { FormularioQualificacao } from "./Qualificacao";

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
              O histórico de atendimento e as etapas de{" "}
              <strong>{lead?.nome}</strong> serão apagados. O cadastro do
              cliente continua na página Clientes.
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
              Entrou em {formatarData(lead.entrada)}
            </SheetDescription>
          </div>
          <SituacaoBadge
            situacao={derived.situacao}
            etapa={derived.etapaAtual?.nome}
          />
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

      <Secao
        titulo="Qualificação"
        descricao="O que decide se o lead é qualificado. Sai na etapa de perguntas."
      >
        <FormularioQualificacao lead={lead} acoes={acoes} idPrefixo="gaveta" />
      </Secao>

      <BlocoDados lead={lead} config={config} acoes={acoes} salvar={salvar} />

      <Separator />

      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Saída para o lead que sumiu de vez: sai da fila, guarda o histórico. */}
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => salvar({ arquivado: true })}
        >
          <Archive className="h-4 w-4" />
          Arquivar
        </Button>
        <Button
          variant="ghost"
          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onExcluir}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
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

      <AcaoRapidaBotoes
        lead={lead}
        config={config}
        acoes={acoes}
        salvar={salvar}
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
  const [observacoes, setObservacoes] = useState(lead.observacoes ?? "");
  const [telefone, setTelefone] = useState(formatPhone(lead.telefone));
  const [email, setEmail] = useState(lead.email ?? "");

  // Ao trocar de lead, recarrega os campos de texto.
  useEffect(() => {
    setObservacoes(lead.observacoes ?? "");
    setTelefone(formatPhone(lead.telefone));
    setEmail(lead.email ?? "");
  }, [lead.id, lead.observacoes, lead.telefone, lead.email]);

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
        {/* O cadastro rápido já escolhe a entrada; aqui é a correção depois. */}
        <Label className="text-sm">Entrada</Label>
        <DatePickerField
          value={lead.entrada}
          onChange={(valor) => valor && salvar({ entrada: valor })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">WhatsApp</Label>
        <Input
          value={telefone}
          onChange={(e) => setTelefone(formatPhone(e.target.value))}
          onPaste={(e) => handlePhonePaste(e, setTelefone)}
          inputMode="tel"
          placeholder="(11) 99999-9999"
          maxLength={PHONE_MAX_LENGTH}
          aria-invalid={telefone.trim() !== "" && !isValidPhone(telefone)}
          onBlur={() => {
            // Número pela metade não é salvo: o campo volta ao valor atual
            // em vez de gravar algo com que ninguém consegue falar.
            if (!isValidPhone(telefone)) {
              setTelefone(formatPhone(lead.telefone));
              return;
            }
            if (telefone !== lead.telefone) {
              acoes.atualizarContato.mutate({
                clientId: lead.client_id,
                patch: { telefone },
              });
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">E-mail</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            if (email.trim() !== (lead.email ?? "")) {
              acoes.atualizarContato.mutate({
                clientId: lead.client_id,
                patch: { email: email.trim() || null },
              });
            }
          }}
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

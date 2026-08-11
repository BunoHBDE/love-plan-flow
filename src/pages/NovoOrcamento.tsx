import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  User,
  Calendar,
  Package as PackageIcon,
  FileText,
  ArrowLeft,
  Save,
  Plus,
  Loader2,
  ChevronDown,
  Percent,
  CreditCard,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Circle,
  X,
  Check,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ClientFormDialog, ClientFormData } from "@/components/clients/ClientFormDialog";
import { useClientsOptimized as useClients, type Client, type ClientInsert } from "@/hooks/useClientsOptimized";
import { useQuotesOptimized as useQuotes } from "@/hooks/useQuotesOptimized";
import { PaymentTermsForm, type PaymentTermsData } from "@/components/quotes/PaymentTermsForm";
import { ExtrasForm, type ExtraItem, calcularTotalExtras } from "@/components/quotes/ExtrasForm";
import { DiscountForm, type DiscountData } from "@/components/quotes/DiscountForm";
import { QuoteItemsSection, type QuoteItemsSelections, initialQuoteItemsSelections } from "@/components/quotes/QuoteItemsSection";
import { QuotePriceSummary } from "@/components/quotes/QuotePriceSummary";
import { useSpaceSettings } from "@/hooks/useSpaceSettings";
import { useBuffetSettings } from "@/hooks/useBuffetSettings";
import { useServiceSettings } from "@/hooks/useServiceSettings";
import { usePackageSettings } from "@/hooks/usePackageSettings";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import {
  calcularPrecoEspaco,
  calcularPrecoBuffet,
  calcularPrecoServico,
  calcularComposicaoPreco,
  getDiaSemana,
  getAnoFromDate,
} from "@/lib/pricingCalculator";
import type { QuoteItem, QuoteComposicao } from "@/types/quote.types";

const tiposEvento = [
  { value: "casamento", label: "Casamento" },
  { value: "debutante", label: "Debutante" },
  { value: "corporativo", label: "Corporativo" },
  { value: "aniversario", label: "Aniversário" },
];


// Anel proporcional de progresso "Para finalizar" (hover mostra as pendências)
function FinalizacaoRing({
  checklist,
}: {
  checklist: { label: string; done: boolean }[];
}) {
  const total = checklist.length;
  const done = checklist.filter((i) => i.done).length;
  const percent = total > 0 ? done / total : 0;
  const pronto = total > 0 && done === total;
  const pendentes = checklist.filter((i) => !i.done);

  const r = 16;
  const c = 2 * Math.PI * r;

  return (
    <HoverCard openDelay={80} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Para finalizar: ${done} de ${total} concluídos`}
        >
          <svg viewBox="0 0 40 40" className="h-11 w-11 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r={r}
              fill="none"
              strokeWidth="4"
              style={{ stroke: "hsl(var(--border))" }}
            />
            <circle
              cx="20"
              cy="20"
              r={r}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                stroke: pronto ? "hsl(var(--success))" : "hsl(var(--primary))",
                strokeDasharray: c,
                strokeDashoffset: c * (1 - percent),
                transition: "stroke-dashoffset 0.35s ease",
              }}
            />
          </svg>
          <span className="absolute flex items-center justify-center text-[10px] font-semibold text-foreground">
            {pronto ? <Check className="h-4 w-4 text-success" /> : `${Math.round(percent * 100)}%`}
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64">
        <p className="mb-2 text-sm font-medium">
          {pronto
            ? "Tudo pronto para finalizar"
            : `Para finalizar (${pendentes.length} pendente${pendentes.length > 1 ? "s" : ""})`}
        </p>
        <ul className="space-y-1.5">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={item.done ? "text-muted-foreground" : "text-foreground"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Hooks de dados
  const { searchClients, createClient } = useClients();
  const { createQuote } = useQuotes();
  const { spaces } = useSpaceSettings();
  const { buffets } = useBuffetSettings();
  const { services } = useServiceSettings();
  const { packages } = usePackageSettings();
  const { settings: paymentSettings } = usePaymentSettings();

  // =============================================================================
  // ESTADOS
  // =============================================================================

  // Cliente
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [termoBuscaCliente, setTermoBuscaCliente] = useState("");
  const [listaResultadosCliente, setListaResultadosCliente] = useState<Client[]>([]);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  // Dados do cliente selecionado
  const [nomeCliente, setNomeCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  // Evento
  const [tipoEvento, setTipoEvento] = useState("");
  const [dataStatus, setDataStatus] = useState<"com_data" | "sem_data">("com_data");
  const [dataEvento, setDataEvento] = useState("");
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [anoEvento, setAnoEvento] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });
  const [validadeOrcamento, setValidadeOrcamento] = useState("");
  const [nConvidados, setNConvidados] = useState(0);

  // NOVO: Seleções de itens (unificado)
  const [itemSelections, setItemSelections] = useState<QuoteItemsSelections>(
    initialQuoteItemsSelections
  );

  // Composição de preço (calculado)
  const [composicao, setComposicao] = useState<QuoteComposicao | null>(null);

  // Observações
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");

  // Extras
  const [extras, setExtras] = useState<ExtraItem[]>([]);

  // Desconto manual
  const [discount, setDiscount] = useState<DiscountData>({
    descricao: "",
    percentual: 0,
    valor: 0,
  });

  // Condições de pagamento
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsData>({
    percentualSinal: paymentSettings?.percentual_minimo_sinal || 10,
    valorSinal: 0,
    numeroParcelas: 1,
    diaVencimento: paymentSettings?.dia_vencimento_padrao || 10,
    parcelas: [],
  });
  const [hasPaymentErrors, setHasPaymentErrors] = useState(false);

  // =============================================================================
  // EFEITOS
  // =============================================================================

  // Pre-fill data do evento da URL
  useEffect(() => {
    const dataEventoParam = searchParams.get("data_evento");
    if (dataEventoParam) {
      setDataStatus("com_data");
      setDataEvento(dataEventoParam);
    }
  }, [searchParams]);

  // Atualizar configurações de pagamento quando carregarem
  useEffect(() => {
    if (paymentSettings) {
      setPaymentTerms((prev) => ({
        ...prev,
        percentualSinal: paymentSettings.percentual_minimo_sinal,
        diaVencimento: paymentSettings.dia_vencimento_padrao,
      }));
    }
  }, [paymentSettings]);

  // Atualizar dia da semana quando data muda
  useEffect(() => {
    if (dataStatus === "com_data" && dataEvento) {
      const dia = getDiaSemana(dataEvento);
      setDiaSemana(dia);
      const year = getAnoFromDate(dataEvento);
      setAnoEvento(year);
    }
  }, [dataEvento, dataStatus]);

  // Validade padrão (30 dias)
  useEffect(() => {
    const defaultValidity = new Date();
    defaultValidity.setDate(defaultValidity.getDate() + 30);
    setValidadeOrcamento(defaultValidity.toISOString().split("T")[0]);
  }, []);

  // =============================================================================
  // CÁLCULO DE PREÇOS (useMemo para performance)
  // =============================================================================

  // Encontrar pacote selecionado
  const selectedPackage = useMemo(() => {
    if (!itemSelections.pacoteId) return null;
    return packages.find((p) => p.id === itemSelections.pacoteId) || null;
  }, [itemSelections.pacoteId, packages]);

  // Calcular composição de preço
  useEffect(() => {
    const { espacoId, buffetId, servicoIds, serviceQuantities } = itemSelections;

    // Precisa ter pelo menos um item e número de convidados
    if ((!espacoId && !buffetId && servicoIds.length === 0) || nConvidados <= 0) {
      setComposicao(null);
      return;
    }

    const itens: QuoteItem[] = [];

    // Calcular preço do espaço
    if (espacoId && diaSemana) {
      const espaco = spaces.find((s) => s.id === espacoId);
      if (espaco) {
        const precoEspaco = calcularPrecoEspaco(espaco, diaSemana, nConvidados);
        if (precoEspaco) {
          itens.push(precoEspaco);
        }
      }
    }

    // Calcular preço do buffet
    if (buffetId) {
      const buffet = buffets.find((b) => b.id === buffetId);
      if (buffet) {
        const precoBuffet = calcularPrecoBuffet(buffet, nConvidados);
        if (precoBuffet) {
          itens.push(precoBuffet);
        }
      }
    }

    // Calcular preço dos serviços
    servicoIds.forEach((servicoId) => {
      const servico = services.find((s) => s.id === servicoId);
      if (servico) {
        const preco = servico.precos?.[0];
        let quantidade = nConvidados;

        if (preco && preco.tipo === "variavel") {
          const unidade = preco.unidade?.toLowerCase() || "";
          const isPessoaUnidade =
            unidade === "pessoa" ||
            unidade === "pessoas" ||
            unidade === "convidado" ||
            unidade === "convidados";

          if (!isPessoaUnidade) {
            quantidade = serviceQuantities[servicoId] || 1;
          }
        }

        const precoServico = calcularPrecoServico(servico, quantidade);
        if (precoServico) {
          itens.push(precoServico);
        }
      }
    });

    // Calcular composição final com pacote (se houver)
    const novaComposicao = calcularComposicaoPreco(
      itens,
      selectedPackage,
      extras,
      nConvidados
    );
    setComposicao(novaComposicao);
  }, [
  itemSelections.espacoId,
  itemSelections.buffetId,
  itemSelections.servicoIds,
  itemSelections.serviceQuantities,
  itemSelections.pacoteId,
  diaSemana,
  nConvidados,
  extras,
  selectedPackage,
  ]);

  // Package info para o resumo
  const packageInfoForSummary = useMemo(() => {
    if (!selectedPackage) return null;
    return {
      nome: selectedPackage.nome,
      descontoFixo: selectedPackage.desconto_percentual,
      descontoVariavel: selectedPackage.desconto_percentual_variavel,
      itensIds: [
        ...itemSelections.packageLockedItems.servicoIds,
        itemSelections.packageLockedItems.espacoId,
        itemSelections.packageLockedItems.buffetId,
      ].filter(Boolean) as string[],
    };
  }, [selectedPackage, itemSelections.packageLockedItems]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleBuscarCliente = async () => {
    if (!termoBuscaCliente.trim()) {
      toast({
        title: "Digite algo para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    const resultados = await searchClients(termoBuscaCliente);
    setListaResultadosCliente(resultados);
    setIsSearching(false);

    if (resultados.length === 0) {
      toast({
        title: "Nenhum cliente encontrado",
        description: "Tente outro termo de busca ou cadastre um novo cliente.",
      });
    }
  };

  const handleSelecionarCliente = (cliente: Client) => {
    setClienteId(cliente.id);
    setNomeCliente(cliente.nome);
    setEmail(cliente.email || "");
    setTelefone(cliente.telefone);
    setCpf(cliente.cpf || "");
    setListaResultadosCliente([]);
    setTermoBuscaCliente("");

    toast({
      title: "Cliente selecionado",
      description: cliente.nome,
    });
  };

  const handleLimparCliente = () => {
    setClienteId(null);
    setNomeCliente("");
    setEmail("");
    setTelefone("");
    setCpf("");
    setListaResultadosCliente([]);
    setTermoBuscaCliente("");
  };

  const handleClientCreated = async (clientData: ClientFormData & { id: string }) => {
    const newClient: ClientInsert = {
      nome: clientData.name,
      email: clientData.email || null,
      telefone: clientData.phone,
      cpf: clientData.cpf || null,
      cep: clientData.address.cep || null,
      rua: clientData.address.street || null,
      numero: clientData.address.number || null,
      complemento: clientData.address.complement || null,
      bairro: clientData.address.neighborhood || null,
      cidade: clientData.address.city || null,
      estado_uf: clientData.address.state || null,
    };

    const createdClient = await createClient(newClient);

    if (createdClient) {
      handleSelecionarCliente(createdClient);
    }

    setIsClientDialogOpen(false);
  };

  const handleSalvarOrcamento = async (status: "rascunho" | "enviado") => {
    const { espacoId, buffetId, servicoIds, serviceQuantities, pacoteId } = itemSelections;

    // Cliente é sempre obrigatório — mesmo em rascunho, para saber de quem é o orçamento
    if (!clienteId) {
      toast({
        title: "Selecione um cliente",
        description: "Busque e selecione um cliente existente ou cadastre um novo.",
        variant: "destructive",
      });
      return;
    }

    // Validações completas apenas ao finalizar o orçamento.
    // Rascunhos podem ser salvos incompletos (sem itens, convidados ou valor calculado).
    if (status === "enviado") {
      if (!espacoId && !buffetId && servicoIds.length === 0 && !pacoteId) {
        toast({
          title: "Selecione ao menos um item",
          description: "Selecione espaço, buffet, serviços ou pacote.",
          variant: "destructive",
        });
        return;
      }

      if (nConvidados <= 0) {
        toast({
          title: "Número de convidados inválido",
          description: "Informe um número maior que zero.",
          variant: "destructive",
        });
        return;
      }

      if (espacoId && !diaSemana) {
        toast({
          title: "Defina o dia da semana",
          description: "O dia da semana é necessário para calcular o preço do espaço.",
          variant: "destructive",
        });
        return;
      }

      // Validar quantidades de serviços
      for (const servicoId of servicoIds) {
        const servico = services.find((s) => s.id === servicoId);
        if (servico) {
          const preco = servico.precos?.[0];
          if (preco && preco.tipo === "variavel") {
            const unidade = preco.unidade?.toLowerCase() || "";
            const isPessoaUnidade =
              unidade === "pessoa" ||
              unidade === "pessoas" ||
              unidade === "convidado" ||
              unidade === "convidados";

            if (!isPessoaUnidade) {
              const quantidade = serviceQuantities[servicoId] || 0;
              if (quantidade < 1) {
                toast({
                  title: "Quantidade inválida",
                  description: `Informe a quantidade de ${preco.unidade || "unidades"} para "${servico.nome}".`,
                  variant: "destructive",
                });
                return;
              }
            }
          }
        }
      }

      if (!composicao || composicao.total_geral <= 0) {
        toast({
          title: "Valor inválido",
          description: "O orçamento precisa ter um valor calculado.",
          variant: "destructive",
        });
        return;
      }

      if (hasPaymentErrors) {
        toast({
          title: "Erro nas condições de pagamento",
          description: "Corrija os erros antes de salvar o orçamento.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);

    const valorTotalFinal = composicao
      ? composicao.total_geral - (discount?.valor || 0)
      : 0;

    const quote = await createQuote({
      client_id: clienteId,
      tipo_evento: tipoEvento || null,
      data_status: dataStatus,
      data_evento: dataStatus === "com_data" && dataEvento ? dataEvento : null,
      dia_semana: diaSemana,
      ano_evento: anoEvento,
      n_convidados: nConvidados,

      // Referências às configurações
      espaco_id: espacoId,
      buffet_id: buffetId,
      servico_ids: servicoIds.length > 0 ? servicoIds : null,
      pacote_id: pacoteId,

      // Quantidades customizadas de serviços
      servico_quantidades: servicoIds.length > 0 ? serviceQuantities : null,

      // Composição de preço
      composicao_preco: composicao,

      // Desconto manual
      desconto_descricao: discount?.descricao || null,
      desconto_percentual: discount?.percentual || 0,
      desconto_valor: discount?.valor || 0,

      // Valores (mantidos para compatibilidade)
      pacote: pacoteId || "",
      menu_buffet: buffetId || null,
      valor_total: valorTotalFinal,

      validade: validadeOrcamento || null,
      status,
      observacoes_internas: observacoesInternas || null,
      observacoes_cliente: observacoesCliente || null,
      percentual_sinal: paymentTerms.percentualSinal,
      valor_sinal: paymentTerms.valorSinal,
      numero_parcelas: paymentTerms.numeroParcelas,
      dia_vencimento: paymentTerms.diaVencimento,
      parcelas_json: paymentTerms.parcelas,
      extras_json: extras,
    });

    setIsSaving(false);

    if (quote) {
      navigate("/orcamentos");
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  // Dentro do componente NovoOrcamento()
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Valor final com desconto
  const valorFinal = useMemo(() => {
    if (!composicao) return 0;
    return composicao.total_geral - (discount?.valor || 0);
  }, [composicao, discount?.valor]);

  // Dados que ainda faltam para finalizar o orçamento (exibidos ao salvar rascunho)
  const draftPendencias = useMemo(() => {
    const pend: string[] = [];
    const { espacoId, buffetId, servicoIds, pacoteId } = itemSelections;

    if (!espacoId && !buffetId && servicoIds.length === 0 && !pacoteId) {
      pend.push("Nenhum item selecionado (espaço, buffet, serviços ou pacote)");
    }
    if (nConvidados <= 0) {
      pend.push("Número de convidados não informado");
    }
    // Em modo "com data" o dia da semana vem da data; em "a definir" é escolhido direto.
    if (dataStatus === "com_data") {
      if (!dataEvento) {
        pend.push("Data do evento não definida");
      }
    } else if (espacoId && !diaSemana) {
      pend.push("Dia da semana não definido (necessário para o preço do espaço)");
    }
    if (!composicao || composicao.total_geral <= 0) {
      pend.push("Valor total ainda não calculado");
    }

    return pend;
  }, [itemSelections, nConvidados, dataStatus, dataEvento, diaSemana, composicao]);

  // Itens selecionados sem número de convidados: convidados é o principal driver do preço
  const convidadosPendente = useMemo(() => {
    const { espacoId, buffetId, servicoIds, pacoteId } = itemSelections;
    const temItens = !!(espacoId || buffetId || servicoIds.length > 0 || pacoteId);
    return temItens && nConvidados <= 0;
  }, [itemSelections, nConvidados]);

  // Espaço selecionado em modo "com data" mas sem data escolhida:
  // a data é necessária porque o preço do espaço depende do dia da semana.
  const dataPendente = useMemo(() => {
    return dataStatus === "com_data" && !dataEvento && !!itemSelections.espacoId;
  }, [dataStatus, dataEvento, itemSelections.espacoId]);

  // Mensagem contextual do resumo quando ainda não há valor calculado,
  // apontando para o dado que realmente está faltando.
  const resumoEmptyState = useMemo(() => {
    const { espacoId, buffetId, servicoIds, pacoteId } = itemSelections;
    const temItens = !!(espacoId || buffetId || servicoIds.length > 0 || pacoteId);

    if (!temItens) {
      return {
        Icon: PackageIcon,
        message: "Selecione os itens do orçamento para calcular o valor",
      };
    }
    if (nConvidados <= 0) {
      return {
        Icon: Users,
        message: "Informe o número de convidados para calcular o valor",
      };
    }
    // O espaço precisa do dia da semana. Em modo "com data" ele vem da data
    // do evento; em modo "a definir" o usuário seleciona o dia diretamente.
    if (espacoId && !diaSemana) {
      if (dataStatus === "com_data") {
        return {
          Icon: Calendar,
          message: "Informe a data do evento para calcular o preço do espaço",
        };
      }
      return {
        Icon: Calendar,
        message: "Defina o dia da semana para calcular o preço do espaço",
      };
    }
    return {
      Icon: PackageIcon,
      message: "Ajuste os itens selecionados para calcular o valor",
    };
  }, [itemSelections, nConvidados, diaSemana, dataStatus]);

  // Checklist de requisitos para finalizar (feedback proativo, ao lado do CTA).
  // Cada item reflete uma validação real do fluxo de finalização.
  const finalizacaoChecklist = useMemo(() => {
    const { espacoId, buffetId, servicoIds, pacoteId } = itemSelections;
    const temItens = !!(espacoId || buffetId || servicoIds.length > 0 || pacoteId);

    const items: { label: string; done: boolean }[] = [
      { label: "Cliente selecionado", done: !!clienteId },
      { label: "Itens do orçamento", done: temItens },
      { label: "Número de convidados", done: nConvidados > 0 },
    ];

    // Data/dia só é obrigatório quando há espaço (o preço depende do dia da semana).
    if (espacoId) {
      if (dataStatus === "com_data") {
        items.push({ label: "Data do evento", done: !!dataEvento });
      } else {
        items.push({ label: "Dia da semana", done: !!diaSemana });
      }
    }

    // Valor calculado (fecha o ciclo dos itens acima).
    items.push({
      label: "Valor calculado",
      done: !!composicao && composicao.total_geral > 0,
    });

    // Só aparece quando há erro a corrigir nas condições de pagamento.
    if (hasPaymentErrors) {
      items.push({ label: "Condições de pagamento", done: false });
    }

    return items;
  }, [
    itemSelections,
    clienteId,
    nConvidados,
    dataStatus,
    dataEvento,
    diaSemana,
    composicao,
    hasPaymentErrors,
  ]);

  const pendenciasFinalizacao = useMemo(
    () => finalizacaoChecklist.filter((i) => !i.done).length,
    [finalizacaoChecklist]
  );

  const prontoParaFinalizar = pendenciasFinalizacao === 0;

  // Formulário "sujo": usuário já preencheu algo que seria perdido ao sair.
  // Campos auto-preenchidos (validade, pagamento) são ignorados de propósito.
  const isDirty = useMemo(() => {
    const { espacoId, buffetId, servicoIds, pacoteId } = itemSelections;
    const temItens = !!(espacoId || buffetId || servicoIds.length > 0 || pacoteId);
    return (
      !!clienteId ||
      !!tipoEvento ||
      nConvidados > 0 ||
      temItens ||
      observacoesInternas.trim() !== "" ||
      observacoesCliente.trim() !== "" ||
      extras.length > 0 ||
      discount.valor > 0 ||
      discount.descricao.trim() !== ""
    );
  }, [
    clienteId,
    tipoEvento,
    nConvidados,
    itemSelections,
    observacoesInternas,
    observacoesCliente,
    extras,
    discount,
  ]);

  // Aviso nativo ao fechar/recarregar a aba com alterações não salvas
  useEffect(() => {
    if (!isDirty || isSaving) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSaving]);

  // Botão voltar: confirma antes de descartar alterações não salvas
  const handleVoltar = () => {
    if (isDirty && !isSaving) {
      setIsLeaveDialogOpen(true);
    } else {
      navigate("/orcamentos");
    }
  };

  // Ao clicar em "Salvar Rascunho": exige cliente e abre o pop-up de confirmação
  const handleDraftClick = () => {
    if (!clienteId) {
      toast({
        title: "Selecione um cliente",
        description: "É necessário selecionar um cliente, mesmo para salvar um rascunho.",
        variant: "destructive",
      });
      return;
    }
    setIsDraftDialogOpen(true);
  };

  const handleConfirmDraft = () => {
    setIsDraftDialogOpen(false);
    handleSalvarOrcamento("rascunho");
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header Compacto */}
        <div className="flex items-center gap-4 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoltar}
            aria-label="Voltar para orçamentos"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <Breadcrumb className="mb-0.5">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button type="button" onClick={handleVoltar}>
                      Orçamentos
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Novo orçamento</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-xl font-display font-bold text-foreground">
              Novo Orçamento
            </h1>
          </div>
        </div>

        {/* ========== BARRA FIXA DE AÇÃO (topo) ========== */}
        <div className="sticky top-16 md:top-2 z-20 mx-auto w-full max-w-5xl rounded-xl border border-border bg-card px-3 py-2 shadow-md md:px-4 md:py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <FinalizacaoRing checklist={finalizacaoChecklist} />
              <div className="min-w-0">
                <p className="text-[11px] leading-none text-muted-foreground">Valor total</p>
                <p className="truncate text-lg font-bold leading-tight text-primary md:text-xl">
                  {valorFinal > 0 ? formatCurrency(valorFinal) : "R$ 0,00"}
                </p>
                {nConvidados > 0 && valorFinal > 0 && (
                  <p className="text-[11px] leading-none text-muted-foreground">
                    {formatCurrency(valorFinal / nConvidados)}/convidado
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDraftClick}
                disabled={isSaving}
                aria-label="Salvar como rascunho"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden md:inline">Salvar rascunho</span>
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => handleSalvarOrcamento("enviado")}
                disabled={isSaving || !prontoParaFinalizar}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-1.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline">Finalizar orçamento</span>
                <span className="sm:hidden">Finalizar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ========== FORMULÁRIO (coluna única) ========== */}
        <div className="mx-auto w-full max-w-5xl space-y-4">
          {/* Block 1 - Cliente */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Dados do Cliente</h2>
            </div>

            {/* Client Search */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    aria-label="Buscar cliente por telefone, email ou nome"
                    placeholder="Buscar por telefone, email ou nome"
                    value={termoBuscaCliente}
                    onChange={(e) => setTermoBuscaCliente(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscarCliente()}
                    className="pl-10 h-9"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    name="search-client-field"  // Nome único que navegador não reconhece
                    type="search"  // Tipo search ao invés de text

                  />
                </div>
                <Button size="sm" onClick={handleBuscarCliente} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsClientDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Novo
                </Button>
              </div>

              {listaResultadosCliente.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2">Nome</TableHead>
                        <TableHead className="py-2">Telefone</TableHead>
                        <TableHead className="py-2">Email</TableHead>
                        <TableHead className="py-2 w-24">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listaResultadosCliente.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell className="py-2 font-medium">{cliente.nome}</TableCell>
                          <TableCell className="py-2">{cliente.telefone}</TableCell>
                          <TableCell className="py-2">{cliente.email || "-"}</TableCell>
                          <TableCell className="py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelecionarCliente(cliente)}
                            >
                              Selecionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {clienteId && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <p className="text-sm text-success font-medium min-w-0 truncate">
                    ✓ {nomeCliente} {telefone && `· ${telefone}`} {email && `· ${email}`}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLimparCliente}
                    className="h-7 shrink-0 gap-1 text-muted-foreground hover:text-foreground"
                    aria-label="Trocar cliente"
                  >
                    <X className="h-3.5 w-3.5" />
                    Trocar
                  </Button>
                </div>
              )}
            </div>

            <ClientFormDialog
              open={isClientDialogOpen}
              onOpenChange={setIsClientDialogOpen}
              onClientCreated={handleClientCreated}
              showSaveAndSearch={true}
            />
          </div>

          {/* Block 2 - Evento */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Informações do Evento</h2>
            </div>

            <div className="space-y-4">
              {/* Linha 1: Tipo e Convidados */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tipo-evento" className="text-muted-foreground text-xs">Tipo de Evento</Label>
                  <Select value={tipoEvento} onValueChange={setTipoEvento}>
                    <SelectTrigger id="tipo-evento" className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEvento.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="n-convidados" className="text-muted-foreground text-xs">Nº de Convidados *</Label>
                  <Input
                    id="n-convidados"
                    type="number"
                    min="1"
                    placeholder="Ex: 150"
                    value={nConvidados || ""}
                    onChange={(e) => setNConvidados(parseInt(e.target.value) || 0)}
                    className={`h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      convidadosPendente ? "border-amber-400 ring-1 ring-amber-400/40" : ""
                    }`}
                  />
                  {convidadosPendente && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Necessário para calcular o valor
                    </p>
                  )}
                </div>
              </div>

              {/* Linha 2: Data do Evento */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <Label className="text-sm font-medium mb-3 block">Data do Evento</Label>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="data-evento" className="text-muted-foreground text-xs">Data *</Label>
                      <DatePickerField
                        id="data-evento"
                        value={dataEvento}
                        onChange={setDataEvento}
                        showAvailability
                        className={cn(
                          "h-9",
                          dataPendente && "border-amber-400 ring-1 ring-amber-400/40"
                        )}
                      />
                      {dataPendente && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Necessária para o preço do espaço
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="validade-orcamento" className="text-muted-foreground text-xs">Validade do Orçamento</Label>
                      <DatePickerField
                        id="validade-orcamento"
                        value={validadeOrcamento}
                        onChange={setValidadeOrcamento}
                        className="h-9"
                      />
                    </div>
                  </div>
              </div>
            </div>
          </div>

          {/* Block 3 - Itens do Orçamento */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-4">
              <PackageIcon className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Itens do Orçamento</h2>
            </div>

            <QuoteItemsSection
              spaces={spaces}
              buffets={buffets}
              services={services}
              packages={packages}
              selections={itemSelections}
              onSelectionsChange={setItemSelections}
              anoEvento={anoEvento}
              diaSemana={diaSemana}
            />
          </div>

          {/* Block 4 - Extras (Colapsável) */}
          <Collapsible>
            <div className="bg-card rounded-xl shadow-soft border border-border animate-slide-up" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-xl">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <h2 className="font-display font-semibold">Extras</h2>
                    {extras.length > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {extras.length} item(s)
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-0">
                  <ExtrasForm extras={extras} onChange={setExtras} guestCount={nConvidados} />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Desconto */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            <Collapsible>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-primary" />
                  <span className="font-medium">Desconto</span>
                  {discount.valor > 0 && (
                    <span className="text-sm font-medium text-success">
                      -{formatCurrency(discount.valor)}
                    </span>
                  )}
                </div>

                {composicao && composicao.total_geral > 0 ? (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                      {discount.valor > 0 ? (
                        <>
                          <Settings2 className="h-3.5 w-3.5" />
                          Editar
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                ) : (
                  <span className="text-xs text-muted-foreground">Indisponível</span>
                )}
              </div>

              {composicao && composicao.total_geral > 0 && (
                <CollapsibleContent>
                  <div className="mt-4 pt-4 border-t border-border">
                    <DiscountForm
                      valorTotal={composicao.total_geral}
                      discount={discount}
                      onChange={setDiscount}
                    />
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          </div>

          {/* Detalhamento do valor */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up" style={{ animationDelay: "230ms", animationFillMode: "both" }}>
            {composicao && composicao.itens.length > 0 ? (
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between text-sm hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors group">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Detalhamento do valor ({composicao.itens.length} {composicao.itens.length === 1 ? 'item' : 'itens'})
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-[[data-state=open]]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-3">
                    {composicao.itens.map((item) => (
                      <div key={item.id} className="bg-muted/30 rounded-lg p-2.5 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-foreground">{item.nome}</span>
                          <span className="text-sm font-semibold text-primary whitespace-nowrap ml-2">
                            {formatCurrency(item.valor_total)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.tipo_preco === 'fixo' ? (
                            <span>Valor fixo</span>
                          ) : (
                            <span>
                              {item.valor_inicial && item.valor_inicial > 0 && (
                                <>Base {formatCurrency(item.valor_inicial)} + </>
                              )}
                              {item.valor_por_unidade && (
                                <>
                                  {formatCurrency(item.valor_por_unidade)}/{item.unidade || 'un'} × {
                                    item.valor_inicial
                                      ? Math.round((item.valor_total - item.valor_inicial) / item.valor_por_unidade)
                                      : Math.round(item.valor_total / item.valor_por_unidade)
                                  }
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {composicao.total_extras > 0 && (
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-muted-foreground">Extras</span>
                        <span className="text-foreground font-medium">
                          {formatCurrency(composicao.total_extras)}
                        </span>
                      </div>
                    )}

                    {(composicao.desconto_fixo > 0 || composicao.desconto_variavel > 0) && (
                      <div className="flex justify-between text-sm py-1 text-success">
                        <span>Desconto do pacote</span>
                        <span className="font-medium">
                          -{formatCurrency(composicao.desconto_fixo + composicao.desconto_variavel)}
                        </span>
                      </div>
                    )}

                    {discount.valor > 0 && (
                      <div className="flex justify-between text-sm py-1 text-success">
                        <span>Desconto adicional</span>
                        <span className="font-medium">
                          -{formatCurrency(discount.valor)}
                        </span>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center py-2">
                <resumoEmptyState.Icon className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {resumoEmptyState.message}
                </p>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up" style={{ animationDelay: "260ms", animationFillMode: "both" }}>
            <Collapsible>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">Pagamento</span>
                </div>

                {composicao && composicao.total_geral > 0 ? (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                      <Settings2 className="h-3.5 w-3.5" />
                      Configurar
                    </Button>
                  </CollapsibleTrigger>
                ) : (
                  <span className="text-xs text-muted-foreground">Indisponível</span>
                )}
              </div>

              {composicao && composicao.total_geral > 0 && (
                <>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sinal ({paymentTerms.percentualSinal}%)</span>
                      <span className="font-medium">{formatCurrency(paymentTerms.valorSinal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Parcelas</span>
                      <span className="font-medium">
                        {paymentTerms.numeroParcelas}x de {formatCurrency((valorFinal - paymentTerms.valorSinal) / Math.max(paymentTerms.numeroParcelas, 1))}
                      </span>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t border-border">
                      <PaymentTermsForm
                        valorTotal={valorFinal}
                        dataEvento={dataStatus === "com_data" ? dataEvento : null}
                        onChange={setPaymentTerms}
                        onValidationChange={setHasPaymentErrors}
                      />
                    </div>
                  </CollapsibleContent>
                </>
              )}

              {(!composicao || composicao.total_geral <= 0) && (
                <p className="text-sm text-muted-foreground mt-2">
                  Adicione itens para configurar
                </p>
              )}
            </Collapsible>
          </div>

          {/* Block 5 - Observações (Compacto) */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Observações</h2>
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="obs-internas" className="text-xs text-muted-foreground">Internas (só você vê)</Label>
                <Textarea
                  id="obs-internas"
                  placeholder="Anotações internas..."
                  value={observacoesInternas}
                  onChange={(e) => setObservacoesInternas(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="obs-cliente" className="text-xs text-muted-foreground">Para o cliente</Label>
                <Textarea
                  id="obs-cliente"
                  placeholder="Aparecerá no orçamento..."
                  value={observacoesCliente}
                  onChange={(e) => setObservacoesCliente(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          </div>
        {/* ========== POP-UP DE CONFIRMAÇÃO DE RASCUNHO ========== */}
        <AlertDialog open={isDraftDialogOpen} onOpenChange={setIsDraftDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Salvar como rascunho
              </AlertDialogTitle>
              <AlertDialogDescription>
                Este orçamento será salvo como{" "}
                <span className="font-medium text-foreground">rascunho</span> e{" "}
                <span className="font-medium text-foreground">não será finalizado</span>.
                Você poderá editá-lo e concluí-lo depois.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {draftPendencias.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  Dados pendentes ({draftPendencias.length})
                </p>
                <ul className="mt-2 space-y-1">
                  {draftPendencias.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Todos os dados principais estão preenchidos.
              </p>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving}>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDraft} disabled={isSaving}>
                Salvar rascunho
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ========== POP-UP DE CONFIRMAÇÃO DE SAÍDA ========== */}
        <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Descartar alterações?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você tem informações não salvas neste orçamento. Se sair agora,
                elas serão perdidas. Você pode salvar como rascunho para continuar
                depois.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar editando</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsLeaveDialogOpen(false);
                  navigate("/orcamentos");
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Descartar e sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


      </div>
    </MainLayout>
  );
}
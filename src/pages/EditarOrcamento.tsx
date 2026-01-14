import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Calendar,
  Package as PackageIcon,
  FileText,
  ArrowLeft,
  Save,
  Plus,
  Loader2,
  ChevronDown,
  Download,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuotesOptimized as useQuotes, type Quote } from "@/hooks/useQuotesOptimized";
import { PaymentTermsForm, type PaymentTermsData } from "@/components/quotes/PaymentTermsForm";
import { ExtrasForm, type ExtraItem } from "@/components/quotes/ExtrasForm";
import { DiscountForm, type DiscountData } from "@/components/quotes/DiscountForm";
import { SpaceSelection } from "@/components/quotes/SpaceSelection";
import { BuffetSelection } from "@/components/quotes/BuffetSelection";
import { ServicesSelection } from "@/components/quotes/ServicesSelection";
import { PackageSelection } from "@/components/quotes/PackageSelection";
import { QuotePriceSummary } from "@/components/quotes/QuotePriceSummary";
import { useSpaceSettings } from "@/hooks/useSpaceSettings";
import { useBuffetSettings } from "@/hooks/useBuffetSettings";
import { useServiceSettings } from "@/hooks/useServiceSettings";
import { usePackageSettings } from "@/hooks/usePackageSettings";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { generateQuotePDF } from "@/lib/generateQuotePDF";
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

const diasSemana = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
  expirado: "Expirado",
};

const statusStyles: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground border-border",
  enviado: "bg-primary/10 text-primary border-primary/20",
  aceito: "bg-success/10 text-success border-success/20",
  recusado: "bg-destructive/10 text-destructive border-destructive/20",
  expirado: "bg-warning/10 text-warning border-warning/20",
};

const allStatuses = ["rascunho", "enviado", "aceito", "recusado", "expirado"];

export default function EditarOrcamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hooks
  const { getQuoteById, updateQuote, deleteQuote } = useQuotes();
  const { spaces } = useSpaceSettings();
  const { buffets } = useBuffetSettings();
  const { services } = useServiceSettings();
  const { packages } = usePackageSettings();
  const { settings: paymentSettings } = usePaymentSettings();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quoteData, setQuoteData] = useState<Quote | null>(null);

  // Client data (read-only in edit mode)
  const [nomeCliente, setNomeCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  // Event data
  const [tipoEvento, setTipoEvento] = useState("");
  const [dataStatus, setDataStatus] = useState<"com_data" | "sem_data">("sem_data");
  const [dataEvento, setDataEvento] = useState("");
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [anoEvento, setAnoEvento] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });
  const [validadeOrcamento, setValidadeOrcamento] = useState("");
  const [nConvidados, setNConvidados] = useState(0);
  const [status, setStatus] = useState("rascunho");

  // Quote selections
  const [espacoId, setEspacoId] = useState<string | null>(null);
  const [buffetId, setBuffetId] = useState<string | null>(null);
  const [servicoIds, setServicoIds] = useState<string[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
  const [pacoteId, setPacoteId] = useState<string | null>(null);

  // Price composition
  const [composicao, setComposicao] = useState<QuoteComposicao | null>(null);

  // Observations
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");

  // Extras
  const [extras, setExtras] = useState<ExtraItem[]>([]);

  // Discount
  const [discount, setDiscount] = useState<DiscountData>({
    descricao: "",
    percentual: 0,
    valor: 0,
  });

  // Payment terms
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsData>({
    percentualSinal: paymentSettings?.percentual_minimo_sinal || 10,
    valorSinal: 0,
    numeroParcelas: 1,
    diaVencimento: paymentSettings?.dia_vencimento_padrao || 10,
    parcelas: [],
  });
  const [hasPaymentErrors, setHasPaymentErrors] = useState(false);

  // Load quote data
  useEffect(() => {
    const loadQuote = async () => {
      if (!id) return;
      setLoading(true);
      const quote = await getQuoteById(id);
      if (quote) {
        setQuoteData(quote);
        
        // Client data
        setNomeCliente(quote.client?.nome || "");
        setEmail(quote.client?.email || "");
        setTelefone(quote.client?.telefone || "");
        setCpf(quote.client?.cpf || "");
        
        // Event data
        setTipoEvento(quote.tipo_evento || "");
        setDataStatus((quote.data_status as "com_data" | "sem_data") || "sem_data");
        setDataEvento(quote.data_evento || "");
        setDiaSemana(quote.dia_semana || null);
        setAnoEvento(quote.ano_evento || new Date().getFullYear().toString());
        setValidadeOrcamento(quote.validade || "");
        setNConvidados(quote.n_convidados);
        setStatus(quote.status);
        
        // Quote selections
        setEspacoId(quote.espaco_id || null);
        setBuffetId(quote.buffet_id || null);
        setServicoIds(quote.servico_ids || []);
        setPacoteId(quote.pacote_id || null);
        
        // Service quantities
        if (quote.servico_quantidades) {
          setServiceQuantities(quote.servico_quantidades as Record<string, number>);
        }
        
        // Observations
        setObservacoesInternas(quote.observacoes_internas || "");
        setObservacoesCliente(quote.observacoes_cliente || "");
        
        // Extras
        const extrasJson = quote.extras_json as any[] | null;
        if (extrasJson && extrasJson.length > 0) {
          setExtras(extrasJson.map((e: any) => ({
            id: e.id || crypto.randomUUID(),
            descricao: e.descricao,
            valor: e.valor,
            porConvidado: e.porConvidado || false,
          })));
        }
        
        // Discount
        if (quote.desconto_valor && Number(quote.desconto_valor) > 0) {
          setDiscount({
            descricao: quote.desconto_descricao || "",
            percentual: Number(quote.desconto_percentual) || 0,
            valor: Number(quote.desconto_valor) || 0,
          });
        }
        
        // Payment terms
        const parcelasJson = quote.parcelas_json as any[] | null;
        setPaymentTerms({
          percentualSinal: quote.percentual_sinal,
          valorSinal: quote.valor_sinal,
          numeroParcelas: quote.numero_parcelas,
          diaVencimento: quote.dia_vencimento,
          parcelas: parcelasJson?.map((p: any) => ({
            numero: p.numero,
            valor: p.valor,
            dataVencimento: p.dataVencimento,
          })) || [],
        });
      }
      setLoading(false);
    };
    loadQuote();
  }, [id]);

  // Calculate price when selections change
  useEffect(() => {
    // Precisa ter pelo menos um item selecionado e número de convidados
    if ((!espacoId && !buffetId && servicoIds.length === 0) || nConvidados <= 0) {
      setComposicao(null);
      return;
    }

    const itens: QuoteItem[] = [];

    // Calcular preço do espaço (se selecionado)
    if (espacoId && diaSemana) {
      const espaco = spaces.find((s) => s.id === espacoId);
      if (espaco) {
        const precoEspaco = calcularPrecoEspaco(espaco, diaSemana, nConvidados);
        if (precoEspaco) {
          itens.push(precoEspaco);
        }
      }
    }

    // Calcular preço do buffet (se selecionado)
    if (buffetId) {
      const buffet = buffets.find((b) => b.id === buffetId);
      if (buffet) {
        const precoBuffet = calcularPrecoBuffet(buffet, nConvidados);
        if (precoBuffet) {
          itens.push(precoBuffet);
        }
      }
    }

    // Calcular preço dos serviços (se selecionados)
    servicoIds.forEach((servicoId) => {
      const servico = services.find((s) => s.id === servicoId);
      if (servico) {
        // Verificar se precisa usar quantidade customizada
        const preco = servico.precos?.[0];
        let quantidade = nConvidados; // Padrão: número de convidados
        
        if (preco && preco.tipo === 'variavel') {
          const unidade = preco.unidade?.toLowerCase() || '';
          const isPessoaUnidade = unidade === 'pessoa' || unidade === 'pessoas' || 
                                  unidade === 'convidado' || unidade === 'convidados';
          
          // Se não é por pessoa, usar quantidade customizada
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

    // Buscar pacote (se selecionado)
    const pacote = pacoteId ? packages.find((p) => p.id === pacoteId) : null;

    // Calcular composição final
    const novaComposicao = calcularComposicaoPreco(itens, pacote || null, extras, nConvidados);
    setComposicao(novaComposicao);
  }, [espacoId, buffetId, servicoIds, serviceQuantities, pacoteId, diaSemana, nConvidados, extras, spaces, buffets, services, packages]);

  // Update diaSemana when dataEvento changes
  useEffect(() => {
    if (dataStatus === "com_data" && dataEvento) {
      const dia = getDiaSemana(dataEvento);
      setDiaSemana(dia);
      const year = getAnoFromDate(dataEvento);
      setAnoEvento(year);
    }
  }, [dataEvento, dataStatus]);

  const handleSalvarOrcamento = async (novoStatus?: string) => {
    if (!quoteData) return;

    // Validation
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

    // Validar dia da semana apenas se espaço estiver selecionado
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
      const servico = services.find(s => s.id === servicoId);
      if (servico) {
        const preco = servico.precos?.[0];
        if (preco && preco.tipo === 'variavel') {
          const unidade = preco.unidade?.toLowerCase() || '';
          const isPessoaUnidade = unidade === 'pessoa' || unidade === 'pessoas' || 
                                  unidade === 'convidado' || unidade === 'convidados';
          
          // Se não é por pessoa, validar quantidade customizada
          if (!isPessoaUnidade) {
            const quantidade = serviceQuantities[servicoId] || 0;
            if (quantidade < 1) {
              toast({
                title: "Quantidade inválida",
                description: `Informe a quantidade de ${preco.unidade || 'unidades'} para "${servico.nome}".`,
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

    const statusFinal = novoStatus || status;
    
    if (statusFinal === "enviado" && hasPaymentErrors) {
      toast({
        title: "Erro nas condições de pagamento",
        description: "Corrija os erros antes de salvar o orçamento.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Calcular valor total final com desconto
    const valorTotalFinal = composicao.total_geral - (discount?.valor || 0);

    const success = await updateQuote(quoteData.id, {
      tipo_evento: tipoEvento || null,
      data_status: dataStatus,
      data_evento: dataStatus === "com_data" && dataEvento ? dataEvento : null,
      dia_semana: diaSemana,
      ano_evento: anoEvento,
      n_convidados: nConvidados,
      
      // Novas referências às configurações
      espaco_id: espacoId,
      buffet_id: buffetId,
      servico_ids: servicoIds.length > 0 ? servicoIds : null,
      pacote_id: pacoteId,
      
      // Quantidades customizadas de serviços
      servico_quantidades: servicoIds.length > 0 ? serviceQuantities : null,
      
      // Composição de preço
      composicao_preco: composicao,
      
      // Desconto
      desconto_descricao: discount?.descricao || null,
      desconto_percentual: discount?.percentual || 0,
      desconto_valor: discount?.valor || 0,
      
      // Valores (mantidos para compatibilidade)
      pacote: pacoteId || "",
      menu_buffet: buffetId || null,
      valor_total: valorTotalFinal,
      
      validade: validadeOrcamento || null,
      status: statusFinal,
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

    if (success) {
      toast({
        title: "Orçamento atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
      navigate("/orcamentos");
    }
  };

  const handleStatusChange = async (novoStatus: string) => {
    setStatus(novoStatus);
  };

  const handleDelete = async () => {
    if (!quoteData) return;
    
    setIsDeleting(true);
    const success = await deleteQuote(quoteData.id);
    setIsDeleting(false);
    
    if (success) {
      navigate("/orcamentos");
    }
  };

  const handleDownloadPDF = () => {
    if (!quoteData || !composicao) return;

    const parcelasJson = quoteData.parcelas_json as any[] | null;
    const paymentTermsData = parcelasJson && parcelasJson.length > 0
      ? {
          percentualSinal: quoteData.percentual_sinal,
          valorSinal: quoteData.valor_sinal,
          numeroParcelas: quoteData.numero_parcelas,
          parcelas: parcelasJson.map((p: any) => ({
            numero: p.numero,
            valor: p.valor,
            dataVencimento: p.dataVencimento,
          })),
        }
      : undefined;

    const extrasJson = quoteData.extras_json as any[] | null;
    const extrasData = extrasJson && extrasJson.length > 0
      ? extrasJson.map((e: any) => ({
          descricao: e.descricao,
          valor: e.valor,
          porConvidado: e.porConvidado || false,
        }))
      : undefined;

    const valorFinal = composicao.total_geral - (discount?.valor || 0);

    generateQuotePDF({
      id: quoteData.quote_number,
      clientName: quoteData.client?.nome || "Cliente",
      guestCount: nConvidados,
      weddingDate: dataEvento,
      totalValue: valorFinal,
      status: status,
      createdAt: quoteData.created_at.split("T")[0],
      validUntil: validadeOrcamento,
      paymentTerms: paymentTermsData,
      composicao: composicao,
      desconto: discount.valor > 0 ? {
        descricao: discount.descricao,
        percentual: discount.percentual,
        valor: discount.valor,
      } : undefined,
      extras: extrasData,
    });
  };

  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

  // Obter dias da semana disponíveis baseado nos espaços configurados
  const getDiasDisponiveis = () => {
    const spacesDoAno = spaces.filter((s) => s.ano === anoEvento);
    if (spacesDoAno.length === 0) return diasSemana;

    const diasSet = new Set<string>();
    spacesDoAno.forEach((space) => {
      space.precos_por_dia?.forEach((preco) => {
        preco.dias.forEach((dia) => diasSet.add(dia));
      });
    });

    // Retornar dias na ordem correta
    return diasSemana.filter((dia) => diasSet.has(dia));
  };

  const diasDisponiveis = getDiasDisponiveis();

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString + "T12:00:00").toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!quoteData) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Orçamento não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/orcamentos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Orçamentos
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/orcamentos")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  Editar Orçamento {quoteData.quote_number}
                </h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
                        statusStyles[status] || statusStyles.rascunho
                      }`}
                    >
                      {statusLabels[status] || status}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover">
                    {allStatuses.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn("cursor-pointer", status === s && "bg-accent")}
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            s === "rascunho" ? "bg-muted-foreground" :
                            s === "enviado" ? "bg-primary" :
                            s === "aceito" ? "bg-success" :
                            s === "recusado" ? "bg-destructive" :
                            "bg-warning"
                          }`}
                        />
                        {statusLabels[s]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-muted-foreground">
                Criado em {formatDate(quoteData.created_at.split("T")[0])}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O orçamento será permanentemente excluído.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSalvarOrcamento()}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
            <Button
              variant="gold"
              onClick={() => handleSalvarOrcamento("enviado")}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar e Enviar
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Content - Tudo em uma coluna */}
          <div className="space-y-6">
            {/* Block 1 - Cliente (Read-only) */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Dados do Cliente</h2>
              </div>

              {/* Client Fields - Read only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Nome</Label>
                  <p className="font-medium py-2">{nomeCliente || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium py-2">{email || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Telefone</Label>
                  <p className="font-medium py-2">{telefone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">CPF</Label>
                  <p className="font-medium py-2">{cpf || "-"}</p>
                </div>
              </div>
            </div>

            {/* Block 2 - Evento */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Informações do Evento</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Evento e Número de Convidados - Sempre visíveis */}
                <div>
                  <Label className="text-muted-foreground text-sm">Tipo de Evento</Label>
                  <Select value={tipoEvento} onValueChange={setTipoEvento}>
                    <SelectTrigger>
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
                  <Label className="text-muted-foreground text-sm">Número de Convidados *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={nConvidados || ""}
                    onChange={(e) => setNConvidados(parseInt(e.target.value) || 0)}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Date Status Selection */}
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground text-sm mb-2 block">Data do Evento</Label>
                  <RadioGroup
                    value={dataStatus}
                    onValueChange={(v) => setDataStatus(v as "com_data" | "sem_data")}
                    className="flex gap-6 mb-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="com_data" id="com_data" />
                      <Label htmlFor="com_data">Data definida</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sem_data" id="sem_data" />
                      <Label htmlFor="sem_data">Sem data definida</Label>
                    </div>
                  </RadioGroup>
                </div>

                {dataStatus === "com_data" ? (
                  <>
                    <div>
                      <Label className="text-muted-foreground text-sm">Data do Evento *</Label>
                      <Input
                        type="date"
                        value={dataEvento}
                        onChange={(e) => setDataEvento(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Validade do Orçamento</Label>
                      <Input
                        type="date"
                        value={validadeOrcamento}
                        onChange={(e) => setValidadeOrcamento(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground text-sm">
                        Ano do Evento *
                        <span className="block text-xs font-normal text-muted-foreground/70 mt-0.5">
                          Para carregar configurações
                        </span>
                      </Label>
                      <Select value={anoEvento} onValueChange={setAnoEvento}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {anos.map((ano) => (
                            <SelectItem key={ano} value={ano}>
                              {ano}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-sm">
                        Dia da Semana *
                        <span className="block text-xs font-normal text-muted-foreground/70 mt-0.5">
                          Para calcular preços
                        </span>
                      </Label>
                      <Select
                        value={diaSemana || ""}
                        onValueChange={(v) => setDiaSemana(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                        <SelectContent>
                          {diasDisponiveis.length > 0 ? (
                            diasDisponiveis.map((dia) => (
                              <SelectItem key={dia} value={dia}>
                                {dia}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Configure espaços primeiro
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground text-sm">Validade do Orçamento</Label>
                      <Input
                        type="date"
                        value={validadeOrcamento}
                        onChange={(e) => setValidadeOrcamento(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Block 3 - Seleções (Espaço, Buffet, Serviços, Pacote) */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-6">
                <PackageIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Itens do Orçamento</h2>
              </div>

              <div className="space-y-6">
                {/* Seleção de Espaço */}
                <SpaceSelection
                  spaces={spaces}
                  selectedSpaceId={espacoId}
                  onSpaceChange={setEspacoId}
                  diaSemana={diaSemana}
                  anoEvento={anoEvento}
                />

                {/* Seleção de Buffet */}
                <BuffetSelection
                  buffets={buffets}
                  selectedBuffetId={buffetId}
                  onBuffetChange={setBuffetId}
                  anoEvento={anoEvento}
                />

                {/* Seleção de Serviços */}
                <ServicesSelection
                  services={services}
                  selectedServiceIds={servicoIds}
                  serviceQuantities={serviceQuantities}
                  onServicesChange={setServicoIds}
                  onQuantityChange={(serviceId, quantity) => {
                    setServiceQuantities(prev => ({
                      ...prev,
                      [serviceId]: quantity
                    }));
                  }}
                  anoEvento={anoEvento}
                />

                {/* Seleção de Pacote */}
                <PackageSelection
                  packages={packages}
                  selectedPackageId={pacoteId}
                  onPackageChange={setPacoteId}
                  anoEvento={anoEvento}
                  onAutoSelectSpace={setEspacoId}
                  onAutoSelectBuffet={setBuffetId}
                  onAutoSelectServices={setServicoIds}

                />
              </div>
            </div>

            {/* Block 4 - Extras */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Extras</h2>
              </div>

              <ExtrasForm
                extras={extras}
                onChange={setExtras}
                guestCount={nConvidados}
              />
            </div>

            {/* Block 5 - Desconto */}
            {composicao && composicao.total_geral > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <PackageIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-display font-semibold">Desconto</h2>
                </div>

                <DiscountForm
                  valorTotal={composicao.total_geral}
                  discount={discount}
                  onChange={setDiscount}
                />
              </div>
            )}

            {/* Block 6 - Resumo do Orçamento */}
            {composicao && composicao.total_geral > 0 && (
              <div className="animate-slide-up">
                <QuotePriceSummary
                  composicao={composicao}
                  nConvidados={nConvidados}
                  discount={discount}
                />
              </div>
            )}

            {/* Block 7 - Condições de Pagamento */}
            {composicao && composicao.total_geral > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-display font-semibold">Condições de Pagamento</h2>
                </div>
                <PaymentTermsForm
                  valorTotal={composicao.total_geral - (discount?.valor || 0)}
                  dataEvento={dataStatus === "com_data" ? dataEvento : null}
                  onChange={setPaymentTerms}
                  onValidationChange={setHasPaymentErrors}
                />
              </div>
            )}

            {/* Block 8 - Observações */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Observações</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Observações Internas</Label>
                  <Textarea
                    placeholder="Observações que só você verá..."
                    value={observacoesInternas}
                    onChange={(e) => setObservacoesInternas(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Observações para o Cliente</Label>
                  <Textarea
                    placeholder="Observações que aparecerão no orçamento..."
                    value={observacoesCliente}
                    onChange={(e) => setObservacoesCliente(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
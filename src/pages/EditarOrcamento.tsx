import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  ArrowLeft,
  Save,
  Download,
  User,
  Calendar,
  Package as PackageIcon,
  FileText,
  ChevronDown,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQuotePDF } from "@/lib/generateQuotePDF";
import { cn } from "@/lib/utils";
import { useQuotesOptimized as useQuotes, type Quote } from "@/hooks/useQuotesOptimized";
import { PaymentTermsForm, type PaymentTermsData, type Parcela } from "@/components/quotes/PaymentTermsForm";
import { ExtrasForm, type ExtraItem, calcularTotalExtras } from "@/components/quotes/ExtrasForm";
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
import {
  calcularPrecoEspaco,
  calcularPrecoBuffet,
  calcularPrecoServico,
  calcularComposicaoPreco,
  getDiaSemana,
  getAnoFromDate,
  formatCurrency,
} from "@/lib/pricingCalculator";
import type { QuoteItem, QuoteComposicao } from "@/types/quote.types";

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

const canaisEntrada = [
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "indicacao", label: "Indicação" },
  { value: "feira", label: "Feira de Noivas" },
  { value: "outro", label: "Outro" },
];

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

export default function EditarOrcamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getQuoteById, updateQuote, deleteQuote } = useQuotes();
  
  // Settings hooks
  const { spaces } = useSpaceSettings();
  const { buffets } = useBuffetSettings();
  const { services } = useServiceSettings();
  const { packages } = usePackageSettings();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quoteData, setQuoteData] = useState<Quote | null>(null);

  // Event data
  const [tipoEvento, setTipoEvento] = useState("");
  const [canalEntrada, setCanalEntrada] = useState("");
  const [dataStatus, setDataStatus] = useState<"com_data" | "sem_data">("sem_data");
  const [dataEvento, setDataEvento] = useState("");
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [anoEvento, setAnoEvento] = useState<string>(new Date().getFullYear().toString());
  const [validadeOrcamento, setValidadeOrcamento] = useState("");
  const [nConvidados, setNConvidados] = useState(0);
  const [status, setStatus] = useState("rascunho");

  // Quote selections (new system)
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
    percentualSinal: 10,
    valorSinal: 0,
    numeroParcelas: 1,
    diaVencimento: 10,
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
        
        // Basic info
        setNConvidados(quote.n_convidados);
        setDataEvento(quote.data_evento || "");
        setDataStatus(quote.data_status as "com_data" | "sem_data" || "sem_data");
        setCanalEntrada(quote.canal_entrada || "");
        setTipoEvento(quote.tipo_evento || "");
        setDiaSemana(quote.dia_semana);
        setStatus(quote.status);
        setObservacoesInternas(quote.observacoes_internas || "");
        setObservacoesCliente(quote.observacoes_cliente || "");
        setValidadeOrcamento(quote.validade || "");

        // Set ano evento
        if (quote.data_evento) {
          setAnoEvento(getAnoFromDate(quote.data_evento));
        } else if (quote.ano_evento) {
          setAnoEvento(quote.ano_evento);
        }

        // New pricing system fields
        setEspacoId(quote.espaco_id || null);
        setBuffetId(quote.buffet_id || null);
        setServicoIds(quote.servico_ids || []);
        setPacoteId(quote.pacote_id || null);
        
        // Service quantities
        if (quote.servico_quantidades) {
          setServiceQuantities(quote.servico_quantidades as Record<string, number>);
        }

        // Composição de preço salva
        if (quote.composicao_preco) {
          setComposicao(quote.composicao_preco as QuoteComposicao);
        }

        // Discount
        if (quote.desconto_valor && quote.desconto_valor > 0) {
          setDiscount({
            descricao: quote.desconto_descricao || "",
            percentual: quote.desconto_percentual || 0,
            valor: quote.desconto_valor || 0,
          });
        }

        // Load payment terms
        const parcelasJson = quote.parcelas_json as any[] | null;
        if (parcelasJson && parcelasJson.length > 0) {
          setPaymentTerms({
            percentualSinal: quote.percentual_sinal,
            valorSinal: quote.valor_sinal,
            numeroParcelas: quote.numero_parcelas,
            diaVencimento: quote.dia_vencimento,
            parcelas: parcelasJson.map((p: any) => ({
              numero: p.numero,
              valor: p.valor,
              dataVencimento: p.dataVencimento,
            })),
          });
        }

        // Load extras
        const extrasJson = quote.extras_json as any[] | null;
        if (extrasJson && extrasJson.length > 0) {
          setExtras(extrasJson.map((e: any) => ({
            id: e.id || crypto.randomUUID(),
            descricao: e.descricao,
            valor: e.valor,
            porConvidado: e.porConvidado || false,
          })));
        }
      }
      setLoading(false);
    };
    loadQuote();
  }, [id]);

  // Calculate price when selections change (only in edit mode)
  useEffect(() => {
    if (!isEditing) return;
    
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
        const preco = servico.precos?.[0];
        let quantidade = nConvidados;
        
        if (preco && preco.tipo === 'variavel') {
          const unidade = preco.unidade?.toLowerCase() || '';
          const isPessoaUnidade = unidade === 'pessoa' || unidade === 'pessoas' || 
                                  unidade === 'convidado' || unidade === 'convidados';
          
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
  }, [isEditing, espacoId, buffetId, servicoIds, serviceQuantities, pacoteId, diaSemana, nConvidados, extras, spaces, buffets, services, packages]);

  // Update diaSemana when dataEvento changes
  useEffect(() => {
    if (dataStatus === "com_data" && dataEvento) {
      const dia = getDiaSemana(dataEvento);
      setDiaSemana(dia);
      const year = getAnoFromDate(dataEvento);
      setAnoEvento(year);
    }
  }, [dataEvento, dataStatus]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString + "T12:00:00").toLocaleDateString("pt-BR");
  };

  const handleSave = async () => {
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

    if (espacoId && !diaSemana) {
      toast({
        title: "Defina o dia da semana",
        description: "O dia da semana é necessário para calcular o preço do espaço.",
        variant: "destructive",
      });
      return;
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

    setIsSaving(true);

    const valorTotalFinal = composicao.total_geral - (discount?.valor || 0);

    const success = await updateQuote(quoteData.id, {
      tipo_evento: tipoEvento || null,
      data_status: dataStatus,
      data_evento: dataStatus === "com_data" && dataEvento ? dataEvento : null,
      dia_semana: diaSemana,
      ano_evento: anoEvento,
      n_convidados: nConvidados,
      
      // New pricing system
      espaco_id: espacoId,
      buffet_id: buffetId,
      servico_ids: servicoIds.length > 0 ? servicoIds : null,
      pacote_id: pacoteId,
      servico_quantidades: servicoIds.length > 0 ? serviceQuantities : null,
      composicao_preco: composicao,
      
      // Discount
      desconto_descricao: discount?.descricao || null,
      desconto_percentual: discount?.percentual || 0,
      desconto_valor: discount?.valor || 0,
      
      // Legacy fields for compatibility
      pacote: pacoteId || "",
      menu_buffet: buffetId || null,
      valor_total: valorTotalFinal,
      
      canal_entrada: canalEntrada || null,
      status,
      observacoes_internas: observacoesInternas || null,
      observacoes_cliente: observacoesCliente || null,
      validade: validadeOrcamento || null,
      percentual_sinal: paymentTerms.percentualSinal,
      valor_sinal: paymentTerms.valorSinal,
      numero_parcelas: paymentTerms.numeroParcelas,
      dia_vencimento: paymentTerms.diaVencimento,
      parcelas_json: paymentTerms.parcelas,
      extras_json: extras,
    });

    setIsSaving(false);

    if (success) {
      setIsEditing(false);
      toast({
        title: "Orçamento atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    if (!isEditing && quoteData) {
      await updateQuote(quoteData.id, { status: newStatus });
    }
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

    const items = composicao.itens.map((item) => ({
      description: item.nome,
      value: item.valor_total,
      tipo: item.tipo,
      tipo_preco: item.tipo_preco,
    }));

    generateQuotePDF({
      id: quoteData.quote_number,
      clientName: quoteData.client?.nome || "Cliente",
      guestCount: nConvidados,
      weddingDate: dataEvento,
      totalValue: valorFinal,
      status: status as any,
      createdAt: quoteData.created_at.split("T")[0],
      validUntil: validadeOrcamento,
      items,
      paymentTerms: paymentTermsData,
      composicao: {
        itens: composicao.itens,
        subtotal_fixo: composicao.subtotal_fixo,
        desconto_fixo: composicao.desconto_fixo,
        total_fixo: composicao.total_fixo,
        subtotal_variavel: composicao.subtotal_variavel,
        desconto_variavel: composicao.desconto_variavel,
        total_variavel: composicao.total_variavel,
        total_extras: composicao.total_extras,
        total_geral: composicao.total_geral,
      },
      desconto: discount.valor > 0 ? {
        descricao: discount.descricao,
        percentual: discount.percentual,
        valor: discount.valor,
      } : undefined,
      extras: extrasData,
    });
  };

  // Get available days based on configured spaces
  const getDiasDisponiveis = () => {
    const spacesDoAno = spaces.filter((s) => s.ano === anoEvento);
    if (spacesDoAno.length === 0) return diasSemana;

    const diasSet = new Set<string>();
    spacesDoAno.forEach((space) => {
      space.precos_por_dia?.forEach((preco) => {
        preco.dias.forEach((dia) => diasSet.add(dia));
      });
    });

    return diasSemana.filter((dia) => diasSet.has(dia));
  };

  const diasDisponiveis = getDiasDisponiveis();
  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

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

  const valorTotal = composicao ? composicao.total_geral - (discount?.valor || 0) : Number(quoteData.valor_total);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/orcamentos")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  Orçamento {quoteData.quote_number}
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
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
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
                <Button onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Dados do Cliente</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Nome</Label>
                  <p className="font-medium">{quoteData.client?.nome || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium">{quoteData.client?.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Telefone</Label>
                  <p className="font-medium">{quoteData.client?.telefone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">CPF</Label>
                  <p className="font-medium">{quoteData.client?.cpf || "-"}</p>
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Dados do Evento</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Canal de Entrada</Label>
                  {isEditing ? (
                    <Select value={canalEntrada} onValueChange={setCanalEntrada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {canaisEntrada.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {canaisEntrada.find((c) => c.value === canalEntrada)?.label || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Tipo de Evento</Label>
                  {isEditing ? (
                    <Select value={tipoEvento} onValueChange={setTipoEvento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposEvento.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {tiposEvento.find((t) => t.value === tipoEvento)?.label || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Data do Evento</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={dataEvento}
                      onChange={(e) => {
                        setDataEvento(e.target.value);
                        setDataStatus(e.target.value ? "com_data" : "sem_data");
                      }}
                    />
                  ) : (
                    <p className="font-medium">{formatDate(dataEvento)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Número de Convidados</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      value={nConvidados}
                      onChange={(e) => setNConvidados(parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <p className="font-medium">{nConvidados}</p>
                  )}
                </div>
                {dataStatus === "sem_data" && isEditing && (
                  <>
                    <div>
                      <Label className="text-muted-foreground text-sm">Ano do Evento</Label>
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
                      <Label className="text-muted-foreground text-sm">Dia da Semana</Label>
                      <Select
                        value={diaSemana || ""}
                        onValueChange={(v) => setDiaSemana(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                        <SelectContent>
                          {diasDisponiveis.map((dia) => (
                            <SelectItem key={dia} value={dia}>
                              {dia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-muted-foreground text-sm">Validade</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={validadeOrcamento}
                      onChange={(e) => setValidadeOrcamento(e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{formatDate(validadeOrcamento)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Selection (editing mode) */}
            {isEditing && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
                <div className="flex items-center gap-2 mb-6">
                  <PackageIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-display font-semibold">Itens do Orçamento</h2>
                </div>

                <div className="space-y-6">
                  <SpaceSelection
                    spaces={spaces}
                    selectedSpaceId={espacoId}
                    onSpaceChange={setEspacoId}
                    diaSemana={diaSemana}
                    anoEvento={anoEvento}
                  />

                  <BuffetSelection
                    buffets={buffets}
                    selectedBuffetId={buffetId}
                    onBuffetChange={setBuffetId}
                    anoEvento={anoEvento}
                  />

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

                  <PackageSelection
                    packages={packages}
                    selectedPackageId={pacoteId}
                    onPackageChange={setPacoteId}
                    anoEvento={anoEvento}
                  />
                </div>
              </div>
            )}

            {/* Items Display (view mode) */}
            {!isEditing && composicao && composicao.itens.length > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <PackageIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-display font-semibold">Itens do Orçamento</h2>
                </div>

                <div className="space-y-2">
                  {composicao.itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.tipo} • {item.tipo_preco === 'fixo' ? 'Preço Fixo' : 'Preço Variável'}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatCurrency(item.valor_total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extras */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Extras</h2>
              </div>

              <ExtrasForm
                extras={extras}
                onChange={setExtras}
                disabled={!isEditing}
                guestCount={nConvidados}
              />
            </div>

            {/* Discount (editing mode) */}
            {isEditing && composicao && composicao.total_geral > 0 && (
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

            {/* Observations */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Observações</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Observações Internas</Label>
                  {isEditing ? (
                    <Textarea
                      value={observacoesInternas}
                      onChange={(e) => setObservacoesInternas(e.target.value)}
                      placeholder="Anotações internas..."
                      rows={3}
                    />
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">{observacoesInternas || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Observações para o Cliente</Label>
                  {isEditing ? (
                    <Textarea
                      value={observacoesCliente}
                      onChange={(e) => setObservacoesCliente(e.target.value)}
                      placeholder="Observações que aparecerão no orçamento..."
                      rows={3}
                    />
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">{observacoesCliente || "-"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Terms (editing mode) */}
            {isEditing && composicao && composicao.total_geral > 0 && (
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

            {/* Payment Terms Summary (view mode) */}
            {!isEditing && paymentTerms.parcelas.length > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-display font-semibold">Condições de Pagamento</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-primary/10 rounded border border-primary/20">
                    <span className="font-medium text-sm">Sinal ({paymentTerms.percentualSinal}%)</span>
                    <span className="font-semibold text-primary">{formatCurrency(paymentTerms.valorSinal)}</span>
                  </div>

                  {paymentTerms.parcelas.map((parcela) => (
                    <div key={parcela.numero} className="flex justify-between items-center p-2 bg-secondary/30 rounded">
                      <span className="text-sm">Parcela {parcela.numero}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{formatDate(parcela.dataVencimento)}</span>
                        <span className="font-medium">{formatCurrency(parcela.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            {composicao && composicao.total_geral > 0 && (
              <div className="animate-slide-up sticky top-6">
                <QuotePriceSummary
                  composicao={composicao}
                  nConvidados={nConvidados}
                  discount={discount}
                />
              </div>
            )}

            {/* Simple Summary when no composicao */}
            {(!composicao || composicao.total_geral === 0) && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up sticky top-6">
                <h2 className="text-lg font-display font-semibold mb-4">Resumo do Orçamento</h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Cliente</span>
                    <span className="font-medium text-sm">{quoteData.client?.nome || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Data do Evento</span>
                    <span className="font-medium text-sm">
                      {dataEvento ? formatDate(dataEvento) : `${diaSemana || "-"} - ${anoEvento}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Convidados</span>
                    <span className="font-medium text-sm">{nConvidados}</span>
                  </div>

                  <div className="border-t-2 border-primary/20 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-display font-bold text-primary">
                        {formatCurrency(valorTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
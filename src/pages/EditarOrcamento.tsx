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
  ArrowLeft,
  Save,
  Download,
  User,
  Calendar,
  Package,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQuotePDF } from "@/lib/generateQuotePDF";
import { cn } from "@/lib/utils";
import { useQuotes, type Quote } from "@/hooks/useQuotes";
import { PaymentTermsForm, type PaymentTermsData, type Parcela } from "@/components/quotes/PaymentTermsForm";

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

const pacotes = [
  { value: "harmonia", label: "Harmonia" },
  { value: "jardim", label: "Jardim" },
  { value: "essencia", label: "Essência" },
  { value: "florescer", label: "Florescer" },
];

const menusBuffet = [
  { value: "massas", label: "Massas" },
  { value: "brasileirinho", label: "Brasileirinho" },
];

function calcularPreco(
  pacote: string,
  diaSemana: string,
  n: number,
  menu: string | null
): number {
  if (n <= 0) return 0;

  if (pacote === "harmonia") {
    if (diaSemana === "sabado") return 10100 + 31 * n;
    if (diaSemana === "domingo") return 9100 + 31 * n;
  }

  if (pacote === "jardim") {
    if (diaSemana === "sabado") return 12300 + 55 * n;
    if (diaSemana === "domingo") return 10800 + 52 * n;
  }

  if (pacote === "essencia") {
    if (menu === "brasileirinho") {
      if (diaSemana === "sabado") return 10620 + 151 * n;
      if (diaSemana === "domingo") return 9620 + 151 * n;
    }
    if (menu === "massas") {
      if (diaSemana === "sabado") return 10740 + 182 * n;
      if (diaSemana === "domingo") return 9740 + 182 * n;
    }
  }

  if (pacote === "florescer") {
    if (menu === "brasileirinho") {
      if (diaSemana === "sabado") return 12820 + 175 * n;
      if (diaSemana === "domingo") return 11320 + 172 * n;
    }
    if (menu === "massas") {
      if (diaSemana === "sabado") return 12940 + 206 * n;
      if (diaSemana === "domingo") return 11440 + 203 * n;
    }
  }

  return 0;
}

function getDiaSemana(dateString: string): string | null {
  if (!dateString) return null;
  const date = new Date(dateString + "T12:00:00");
  const day = date.getDay();
  if (day === 6) return "sabado";
  if (day === 0) return "domingo";
  return null;
}

export default function EditarOrcamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getQuoteById, updateQuote } = useQuotes();
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [quoteData, setQuoteData] = useState<Quote | null>(null);
  
  // Editable fields
  const [guestCount, setGuestCount] = useState(0);
  const [weddingDate, setWeddingDate] = useState("");
  const [canalEntrada, setCanalEntrada] = useState("");
  const [tipoEvento, setTipoEvento] = useState("");
  const [pacote, setPacote] = useState("");
  const [menuBuffet, setMenuBuffet] = useState<string | null>(null);
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [status, setStatus] = useState("rascunho");
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [valorOrcamento, setValorOrcamento] = useState(0);

  // Payment terms state
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
        setGuestCount(quote.n_convidados);
        setWeddingDate(quote.data_evento || "");
        setCanalEntrada(quote.canal_entrada || "");
        setTipoEvento(quote.tipo_evento || "");
        setPacote(quote.pacote);
        setMenuBuffet(quote.menu_buffet);
        setDiaSemana(quote.dia_semana);
        setStatus(quote.status);
        setObservacoesInternas(quote.observacoes_internas || "");
        setObservacoesCliente(quote.observacoes_cliente || "");
        setValidUntil(quote.validade || "");
        setValorOrcamento(Number(quote.valor_total));
        
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
      }
      setLoading(false);
    };
    loadQuote();
  }, [id]);

  // Recalculate price
  useEffect(() => {
    if (pacote && diaSemana && guestCount > 0) {
      const needsMenu = pacote === "essencia" || pacote === "florescer";
      if (!needsMenu || (needsMenu && menuBuffet)) {
        const valor = calcularPreco(pacote, diaSemana, guestCount, menuBuffet);
        setValorOrcamento(valor);
      }
    }
  }, [pacote, diaSemana, guestCount, menuBuffet]);

  // Update diaSemana when weddingDate changes
  useEffect(() => {
    if (weddingDate) {
      const dia = getDiaSemana(weddingDate);
      if (dia) setDiaSemana(dia);
    }
  }, [weddingDate]);

  // Reset menu when package changes
  useEffect(() => {
    if (pacote !== "essencia" && pacote !== "florescer") {
      setMenuBuffet(null);
    }
  }, [pacote]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString + "T12:00:00").toLocaleDateString("pt-BR");
  };

  const handleSave = async () => {
    if (!quoteData) return;
    
    const success = await updateQuote(quoteData.id, {
      n_convidados: guestCount,
      data_evento: weddingDate || null,
      canal_entrada: canalEntrada || null,
      tipo_evento: tipoEvento || null,
      pacote,
      menu_buffet: menuBuffet,
      dia_semana: diaSemana,
      status,
      observacoes_internas: observacoesInternas || null,
      observacoes_cliente: observacoesCliente || null,
      validade: validUntil || null,
      valor_total: valorOrcamento,
      percentual_sinal: paymentTerms.percentualSinal,
      valor_sinal: paymentTerms.valorSinal,
      numero_parcelas: paymentTerms.numeroParcelas,
      dia_vencimento: paymentTerms.diaVencimento,
      parcelas_json: paymentTerms.parcelas,
    });
    
    if (success) {
      setIsEditing(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    if (!isEditing && quoteData) {
      await updateQuote(quoteData.id, { status: newStatus });
    }
  };

  const handleDownloadPDF = () => {
    if (!quoteData) return;

    // Parse payment terms from quote data
    const parcelasJson = quoteData.parcelas_json as any[] | null;
    const paymentTerms = parcelasJson && parcelasJson.length > 0
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

    generateQuotePDF({
      id: quoteData.quote_number,
      clientName: quoteData.client?.nome || "Cliente",
      guestCount,
      weddingDate,
      totalValue: valorOrcamento,
      status: status as any,
      createdAt: quoteData.created_at.split("T")[0],
      validUntil,
      items: [
        { description: `Pacote ${pacote}`, value: valorOrcamento },
      ],
      paymentTerms,
    });
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
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button variant="gold" onClick={handleSave} disabled={hasPaymentErrors}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </>
            ) : (
              <Button variant="gold" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
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
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{formatDate(weddingDate)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Número de Convidados</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <p className="font-medium">{guestCount}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Validade</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{formatDate(validUntil)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Pacote e Serviços</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Pacote</Label>
                  {isEditing ? (
                    <Select value={pacote} onValueChange={setPacote}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {pacotes.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {pacotes.find((p) => p.value === pacote)?.label || "-"}
                    </p>
                  )}
                </div>
                {(pacote === "essencia" || pacote === "florescer") && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Menu Buffet</Label>
                    {isEditing ? (
                      <Select value={menuBuffet || ""} onValueChange={setMenuBuffet}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {menusBuffet.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">
                        {menusBuffet.find((m) => m.value === menuBuffet)?.label || "-"}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground text-sm">Dia da Semana</Label>
                  {isEditing ? (
                    <Select value={diaSemana || ""} onValueChange={setDiaSemana}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sabado">Sábado</SelectItem>
                        <SelectItem value="domingo">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {diaSemana === "sabado" ? "Sábado" : diaSemana === "domingo" ? "Domingo" : "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

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

            {/* Payment Terms - Only show when editing */}
            {isEditing && (
              <PaymentTermsForm
                valorTotal={valorOrcamento}
                dataEvento={weddingDate || null}
                onChange={setPaymentTerms}
                onValidationChange={setHasPaymentErrors}
              />
            )}

            {/* Payment Terms Summary - Show when not editing */}
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
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up sticky top-6">
              <h2 className="text-lg font-display font-semibold mb-4">Resumo</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{quoteData.client?.nome || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Convidados</span>
                  <span className="font-medium">{guestCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pacote</span>
                  <span className="font-medium">
                    {pacotes.find((p) => p.value === pacote)?.label || "-"}
                  </span>
                </div>
                {menuBuffet && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Menu</span>
                    <span className="font-medium">
                      {menusBuffet.find((m) => m.value === menuBuffet)?.label || "-"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dia</span>
                  <span className="font-medium">
                    {diaSemana === "sabado" ? "Sábado" : diaSemana === "domingo" ? "Domingo" : "-"}
                  </span>
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-display font-bold text-gold">
                      {formatCurrency(valorOrcamento)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

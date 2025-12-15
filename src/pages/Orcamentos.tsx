import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Plus,
  Search,
  Download,
  Pencil,
  CalendarIcon,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateQuotePDF } from "@/lib/generateQuotePDF";
import { useQuotes, type Quote } from "@/hooks/useQuotes";
import { calcularPrecoDetalhado, getAnoFromDate } from "@/lib/pricing";

type QuoteStatus = "rascunho" | "enviado" | "aceito" | "recusado" | "expirado";

const statusLabels: Record<QuoteStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
  expirado: "Expirado",
};

const statusStyles: Record<QuoteStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-border",
  enviado: "bg-primary/10 text-primary border-primary/20",
  aceito: "bg-success/10 text-success border-success/20",
  recusado: "bg-destructive/10 text-destructive border-destructive/20",
  expirado: "bg-warning/10 text-warning border-warning/20",
};

const statusSelectedStyles: Record<QuoteStatus, string> = {
  rascunho: "bg-muted-foreground text-muted hover:bg-muted-foreground/90 border-muted-foreground",
  enviado: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary",
  aceito: "bg-success text-success-foreground hover:bg-success/90 border-success",
  recusado: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive",
  expirado: "bg-warning text-warning-foreground hover:bg-warning/90 border-warning",
};

const allStatuses: QuoteStatus[] = ["rascunho", "enviado", "aceito", "recusado", "expirado"];

export default function Orcamentos() {
  const { quotes, loading, updateQuoteStatus } = useQuotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [quoteNumberFilter, setQuoteNumberFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedStatuses, setSelectedStatuses] = useState<QuoteStatus[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpdateStatus = async (quoteId: string, newStatus: QuoteStatus) => {
    const success = await updateQuoteStatus(quoteId, newStatus);
    if (success) {
      toast({
        title: "Status atualizado",
        description: `Orçamento atualizado para "${statusLabels[newStatus]}".`,
      });
    }
  };

  const toggleStatus = (status: QuoteStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setQuoteNumberFilter("");
    setDateFilter(undefined);
    setSelectedStatuses([]);
  };

  const hasActiveFilters = searchTerm || quoteNumberFilter || dateFilter || selectedStatuses.length > 0;

  const filteredQuotes = quotes.filter((quote) => {
    const clientName = quote.client?.nome || "";
    const matchesName = clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNumber = quoteNumberFilter
      ? quote.quote_number.toLowerCase().includes(quoteNumberFilter.toLowerCase())
      : true;
    const matchesDate = dateFilter
      ? quote.created_at.split("T")[0] === format(dateFilter, "yyyy-MM-dd")
      : true;
    const matchesStatus = selectedStatuses.length > 0
      ? selectedStatuses.includes(quote.status as QuoteStatus)
      : true;

    return matchesName && matchesNumber && matchesDate && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleDownloadPDF = async (quote: Quote) => {
    // Parse payment terms from quote data
    const parcelasJson = quote.parcelas_json as any[] | null;
    const paymentTerms = parcelasJson && parcelasJson.length > 0
      ? {
          percentualSinal: quote.percentual_sinal,
          valorSinal: quote.valor_sinal,
          numeroParcelas: quote.numero_parcelas,
          parcelas: parcelasJson.map((p: any) => ({
            numero: p.numero,
            valor: p.valor,
            dataVencimento: p.dataVencimento,
          })),
        }
      : undefined;

    // Calculate composition
    const ano = quote.data_evento ? getAnoFromDate(quote.data_evento) : (quote.ano_evento || new Date().getFullYear().toString());
    const composicaoPreco = calcularPrecoDetalhado(
      quote.pacote,
      quote.dia_semana || "sabado",
      quote.n_convidados,
      quote.menu_buffet,
      ano
    );

    await generateQuotePDF({
      id: quote.quote_number,
      clientName: quote.client?.nome || "Cliente",
      weddingDate: quote.data_evento || "",
      guestCount: quote.n_convidados,
      totalValue: Number(quote.valor_total),
      status: quote.status as any,
      createdAt: quote.created_at.split("T")[0],
      validUntil: quote.validade || "",
      items: [
        { description: `Pacote ${quote.pacote}`, value: Number(quote.valor_total) },
      ],
      paymentTerms,
      composicao: composicaoPreco ? {
        espaco: composicaoPreco.espaco,
        decoracao: composicaoPreco.decoracao,
        buffet: composicaoPreco.buffet,
        custoConvidadoAdicional: composicaoPreco.custoConvidadoAdicional,
        ano: composicaoPreco.detalhes.ano,
        buffetNome: composicaoPreco.detalhes.buffetNome,
      } : undefined,
      pacoteNome: composicaoPreco?.detalhes.pacoteNome,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Orçamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie e gerencie propostas comerciais
            </p>
          </div>

          <Button variant="gold" size="lg" onClick={() => navigate("/orcamentos/novo")}>
            <Plus className="h-5 w-5" />
            Novo Orçamento
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-4 animate-slide-up">
          <div className="flex flex-wrap gap-4">
            {/* Search by name */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search by quote number */}
            <div className="relative min-w-[180px]">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nº do orçamento..."
                value={quoteNumberFilter}
                onChange={(e) => setQuoteNumberFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[180px] justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR }) : "Data de criação"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-2 self-center">Status:</span>
            {allStatuses.map((status) => {
              const isSelected = selectedStatuses.includes(status);
              return (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    "transition-all",
                    isSelected && statusSelectedStyles[status]
                  )}
                >
                  {statusLabels[status]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden animate-slide-up">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Nº
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Cliente
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Data Casamento
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Valor
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm font-medium">
                          {quote.quote_number}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{quote.client?.nome || "-"}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {quote.data_evento
                          ? new Date(quote.data_evento + "T12:00:00").toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </td>
                      <td className="p-4">
                        <span className="font-display font-semibold text-foreground">
                          {formatCurrency(Number(quote.valor_total))}
                        </span>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
                                statusStyles[quote.status as QuoteStatus] || statusStyles.rascunho
                              }`}
                            >
                              {statusLabels[quote.status as QuoteStatus] || quote.status}
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-popover">
                            {allStatuses.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleUpdateStatus(quote.id, status)}
                                className={cn(
                                  "cursor-pointer",
                                  quote.status === status && "bg-accent"
                                )}
                              >
                                <span
                                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                    status === "rascunho" ? "bg-muted-foreground" :
                                    status === "enviado" ? "bg-primary" :
                                    status === "aceito" ? "bg-success" :
                                    status === "recusado" ? "bg-destructive" :
                                    "bg-warning"
                                  }`}
                                />
                                {statusLabels[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Editar"
                            onClick={() => navigate(`/orcamentos/${quote.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Baixar PDF"
                            onClick={() => handleDownloadPDF(quote)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredQuotes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum orçamento encontrado</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

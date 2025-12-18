import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Calendar,
  Search,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Package,
  Loader2,
} from "lucide-react";
import { useQuotes, Quote } from "@/hooks/useQuotes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { calcularTotalExtras } from "@/components/quotes/ExtrasForm";

type ContractStatus = "pendente" | "assinado" | "em_execucao" | "concluido" | "cancelado";

const statusLabels: Record<ContractStatus, string> = {
  pendente: "Pendente Assinatura",
  assinado: "Assinado",
  em_execucao: "Em Execução",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const statusStyles: Record<ContractStatus, string> = {
  pendente: "bg-warning/10 text-warning border-warning/20",
  assinado: "bg-primary/10 text-primary border-primary/20",
  em_execucao: "bg-success/10 text-success border-success/20",
  concluido: "bg-muted text-muted-foreground border-border",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusIcons: Record<ContractStatus, typeof Clock> = {
  pendente: Clock,
  assinado: CheckCircle,
  em_execucao: CheckCircle,
  concluido: CheckCircle,
  cancelado: AlertCircle,
};

export default function Contratos() {
  const { quotes, loading } = useQuotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Filter quotes with "aceito" status
  const acceptedQuotes = useMemo(() => {
    return quotes.filter((quote) => quote.status === "aceito");
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return acceptedQuotes.filter((quote) =>
      quote.client?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [acceptedQuotes, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não definida";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getContractStatus = (quote: Quote): ContractStatus => {
    // For now, all accepted quotes are pending signature
    // This can be extended to track actual contract status
    return "pendente";
  };

  const calculateTotalWithExtras = (quote: Quote): number => {
    const extras = (quote.extras_json as any[]) || [];
    const extrasTotal = calcularTotalExtras(extras, quote.n_convidados);
    return quote.valor_total + extrasTotal;
  };

  const handlePreview = (quote: Quote) => {
    setSelectedQuote(quote);
    setPreviewOpen(true);
  };

  const generateContractPDF = (quote: Quote) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", pageWidth / 2, y, { align: "center" });
    y += 15;

    // Quote number
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Referência: ${quote.quote_number}`, pageWidth / 2, y, { align: "center" });
    y += 20;

    // Client info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATANTE", margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const client = quote.client;
    if (client) {
      doc.text(`Nome: ${client.nome}`, margin, y);
      y += 7;
      if (client.cpf) {
        doc.text(`CPF: ${client.cpf}`, margin, y);
        y += 7;
      }
      doc.text(`Telefone: ${client.telefone}`, margin, y);
      y += 7;
      if (client.email) {
        doc.text(`E-mail: ${client.email}`, margin, y);
        y += 7;
      }
      if (client.rua) {
        const endereco = [
          client.rua,
          client.numero,
          client.complemento,
          client.bairro,
          client.cidade,
          client.estado_uf,
          client.cep,
        ]
          .filter(Boolean)
          .join(", ");
        doc.text(`Endereço: ${endereco}`, margin, y, { maxWidth: pageWidth - margin * 2 });
        y += 14;
      }
    }
    y += 10;

    // Event info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EVENTO", margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (quote.tipo_evento) {
      doc.text(`Tipo: ${quote.tipo_evento}`, margin, y);
      y += 7;
    }
    doc.text(`Data: ${formatDate(quote.data_evento)}`, margin, y);
    y += 7;
    doc.text(`Número de Convidados: ${quote.n_convidados}`, margin, y);
    y += 15;

    // Package info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PACOTE CONTRATADO", margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Pacote: ${quote.pacote}`, margin, y);
    y += 7;
    if (quote.menu_buffet) {
      doc.text(`Menu/Buffet: ${quote.menu_buffet}`, margin, y);
      y += 7;
    }
    y += 10;

    // Extras
    const extras = (quote.extras_json as any[]) || [];
    if (extras.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SERVIÇOS EXTRAS", margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      extras.forEach((extra: any) => {
        const valorExtra = extra.porConvidado
          ? extra.valor * quote.n_convidados
          : extra.valor;
        const descricao = extra.porConvidado
          ? `${extra.descricao} (${formatCurrency(extra.valor)} x ${quote.n_convidados} convidados)`
          : extra.descricao;
        doc.text(`• ${descricao}: ${formatCurrency(valorExtra)}`, margin, y);
        y += 7;
      });
      y += 10;
    }

    // Payment terms
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("VALORES E CONDIÇÕES DE PAGAMENTO", margin, y);
    y += 10;

    const totalComExtras = calculateTotalWithExtras(quote);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Valor Total: ${formatCurrency(totalComExtras)}`, margin, y);
    y += 7;
    doc.text(`Sinal (${quote.percentual_sinal}%): ${formatCurrency(quote.valor_sinal)}`, margin, y);
    y += 7;
    doc.text(`Número de Parcelas: ${quote.numero_parcelas}`, margin, y);
    y += 7;
    doc.text(`Dia de Vencimento: ${quote.dia_vencimento}`, margin, y);
    y += 20;

    // Installments
    const parcelas = (quote.parcelas_json as any[]) || [];
    if (parcelas.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Cronograma de Parcelas:", margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      parcelas.forEach((parcela: any, index: number) => {
        doc.text(
          `Parcela ${index + 1}: ${formatCurrency(parcela.valor)} - Vencimento: ${formatDate(parcela.data)}`,
          margin + 5,
          y
        );
        y += 6;
      });
      y += 15;
    }

    // Signature section
    if (y > 220) {
      doc.addPage();
      y = 30;
    }

    y = Math.max(y, 230);
    doc.setFontSize(10);
    doc.text(`Data: ____/____/________`, margin, y);
    y += 25;

    doc.text("_________________________________________", margin, y);
    y += 5;
    doc.text("CONTRATANTE", margin, y);

    doc.text("_________________________________________", pageWidth - margin - 80, y - 5);
    doc.text("CONTRATADO", pageWidth - margin - 80, y);

    // Save
    doc.save(`Contrato_${quote.quote_number}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Contratos
            </h1>
            <p className="text-muted-foreground mt-1">
              Orçamentos aceitos prontos para gerar contrato
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <p className="text-sm text-muted-foreground">Orçamentos Aceitos</p>
            <p className="text-2xl font-display font-bold text-foreground">
              {acceptedQuotes.length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-display font-bold text-primary">
              {formatCurrency(
                acceptedQuotes.reduce((acc, q) => acc + calculateTotalWithExtras(q), 0)
              )}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <p className="text-sm text-muted-foreground">Total de Convidados</p>
            <p className="text-2xl font-display font-bold text-foreground">
              {acceptedQuotes.reduce((acc, q) => acc + q.n_convidados, 0)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-slide-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou número do orçamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Contracts Grid */}
        {!loading && (
          <div className="grid gap-4 md:grid-cols-2 animate-slide-up">
            {filteredQuotes.map((quote) => {
              const status = getContractStatus(quote);
              const StatusIcon = statusIcons[status];
              const totalComExtras = calculateTotalWithExtras(quote);

              return (
                <div
                  key={quote.id}
                  className="bg-card rounded-xl p-6 shadow-soft border border-border transition-all duration-200 hover:shadow-medium"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {quote.quote_number}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusLabels[status]}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-foreground text-lg mt-1">
                        {quote.client?.nome || "Cliente não encontrado"}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Visualizar"
                        onClick={() => handlePreview(quote)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Gerar Contrato PDF"
                        onClick={() => generateContractPDF(quote)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {quote.data_evento
                          ? formatDate(quote.data_evento)
                          : "Data a definir"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{quote.n_convidados} convidados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>{quote.pacote}</span>
                      {quote.menu_buffet && (
                        <span className="text-muted-foreground">
                          • {quote.menu_buffet}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Valor Total
                      </span>
                      <span className="font-display font-bold text-lg text-primary">
                        {formatCurrency(totalComExtras)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        Sinal ({quote.percentual_sinal}%)
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(quote.valor_sinal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredQuotes.length === 0 && !loading && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum orçamento aceito encontrado</p>
                <p className="text-sm mt-2">
                  Quando um orçamento for marcado como "Aceito", ele aparecerá aqui
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Contrato - {selectedQuote?.quote_number}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {selectedQuote && (
              <div className="space-y-6 p-4">
                {/* Client Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Contratante</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
                    <p><strong>Nome:</strong> {selectedQuote.client?.nome}</p>
                    {selectedQuote.client?.cpf && (
                      <p><strong>CPF:</strong> {selectedQuote.client.cpf}</p>
                    )}
                    <p><strong>Telefone:</strong> {selectedQuote.client?.telefone}</p>
                    {selectedQuote.client?.email && (
                      <p><strong>E-mail:</strong> {selectedQuote.client.email}</p>
                    )}
                    {selectedQuote.client?.rua && (
                      <p>
                        <strong>Endereço:</strong>{" "}
                        {[
                          selectedQuote.client.rua,
                          selectedQuote.client.numero,
                          selectedQuote.client.complemento,
                          selectedQuote.client.bairro,
                          selectedQuote.client.cidade,
                          selectedQuote.client.estado_uf,
                          selectedQuote.client.cep,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Event Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Evento</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
                    {selectedQuote.tipo_evento && (
                      <p><strong>Tipo:</strong> {selectedQuote.tipo_evento}</p>
                    )}
                    <p>
                      <strong>Data:</strong>{" "}
                      {formatDate(selectedQuote.data_evento)}
                    </p>
                    <p>
                      <strong>Convidados:</strong> {selectedQuote.n_convidados}
                    </p>
                  </div>
                </div>

                {/* Package Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Pacote Contratado</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
                    <p><strong>Pacote:</strong> {selectedQuote.pacote}</p>
                    {selectedQuote.menu_buffet && (
                      <p><strong>Menu/Buffet:</strong> {selectedQuote.menu_buffet}</p>
                    )}
                    <p>
                      <strong>Valor Base:</strong>{" "}
                      {formatCurrency(selectedQuote.valor_total)}
                    </p>
                  </div>
                </div>

                {/* Extras Section */}
                {((selectedQuote.extras_json as any[]) || []).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Serviços Extras</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                      {((selectedQuote.extras_json as any[]) || []).map(
                        (extra: any, index: number) => {
                          const valorExtra = extra.porConvidado
                            ? extra.valor * selectedQuote.n_convidados
                            : extra.valor;
                          return (
                            <div
                              key={index}
                              className="flex justify-between items-center"
                            >
                              <span>
                                {extra.descricao}
                                {extra.porConvidado && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({formatCurrency(extra.valor)} x{" "}
                                    {selectedQuote.n_convidados})
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(valorExtra)}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Condições de Pagamento
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span><strong>Valor Total:</strong></span>
                      <span className="font-bold text-primary">
                        {formatCurrency(calculateTotalWithExtras(selectedQuote))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        <strong>Sinal ({selectedQuote.percentual_sinal}%):</strong>
                      </span>
                      <span>{formatCurrency(selectedQuote.valor_sinal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span><strong>Parcelas:</strong></span>
                      <span>{selectedQuote.numero_parcelas}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span><strong>Dia de Vencimento:</strong></span>
                      <span>{selectedQuote.dia_vencimento}</span>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <Button
                  className="w-full"
                  onClick={() => {
                    generateContractPDF(selectedQuote);
                    setPreviewOpen(false);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Contrato PDF
                </Button>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

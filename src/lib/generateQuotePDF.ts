import jsPDF from "jspdf";

interface QuoteItem {
  description: string;
  value: number;
}

interface QuoteData {
  id: string;
  clientName: string;
  weddingDate: string;
  guestCount: number;
  totalValue: number;
  status: string;
  createdAt: string;
  validUntil: string;
  items: QuoteItem[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("pt-BR");
};

export const generateQuotePDF = (quote: QuoteData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  // Colors (using RGB values similar to the design system)
  const primaryColor: [number, number, number] = [75, 42, 34]; // #4B2A22 - Marrom Escuro
  const goldColor: [number, number, number] = [201, 168, 106]; // #C9A86A - Dourado
  const textColor: [number, number, number] = [107, 90, 74]; // #6B5A4A - Marrom Médio
  const lightBg: [number, number, number] = [247, 238, 220]; // #F7EEDC - Bege Claro
  
  let yPosition = 20;

  // Header background
  doc.setFillColor(...lightBg);
  doc.rect(0, 0, pageWidth, 60, "F");
  
  // Gold accent line
  doc.setFillColor(...goldColor);
  doc.rect(0, 60, pageWidth, 3, "F");

  // Company name / Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...primaryColor);
  doc.text("ORÇAMENTO", pageWidth / 2, yPosition + 15, { align: "center" });
  
  // Quote number
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  doc.text(`Nº ${quote.id}`, pageWidth / 2, yPosition + 25, { align: "center" });
  
  yPosition = 80;

  // Client Info Section
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPosition, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMAÇÕES DO CLIENTE", margin + 5, yPosition + 6);
  
  yPosition += 15;
  
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  
  // Client details in two columns
  const col1X = margin;
  const col2X = pageWidth / 2 + 10;
  
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", col1X, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(quote.clientName, col1X + 25, yPosition);
  
  doc.setFont("helvetica", "bold");
  doc.text("Data do Casamento:", col2X, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(quote.weddingDate), col2X + 45, yPosition);
  
  yPosition += 8;
  
  doc.setFont("helvetica", "bold");
  doc.text("Convidados:", col1X, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(quote.guestCount.toString(), col1X + 30, yPosition);
  
  yPosition += 20;

  // Items Section
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPosition, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ITENS DO ORÇAMENTO", margin + 5, yPosition + 6);
  
  yPosition += 15;
  
  // Table header
  doc.setFillColor(...lightBg);
  doc.rect(margin, yPosition, contentWidth, 10, "F");
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Descrição", margin + 5, yPosition + 7);
  doc.text("Valor", pageWidth - margin - 30, yPosition + 7, { align: "right" });
  
  yPosition += 15;
  
  // Items
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  
  quote.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 247, 242);
      doc.rect(margin, yPosition - 5, contentWidth, 10, "F");
    }
    
    doc.text(item.description, margin + 5, yPosition);
    doc.text(formatCurrency(item.value), pageWidth - margin - 5, yPosition, { align: "right" });
    yPosition += 10;
  });
  
  // Separator line
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 10;
  
  // Total
  doc.setFillColor(...primaryColor);
  doc.rect(pageWidth - margin - 80, yPosition - 5, 80, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", pageWidth - margin - 75, yPosition + 3);
  doc.text(formatCurrency(quote.totalValue), pageWidth - margin - 5, yPosition + 3, { align: "right" });
  
  yPosition += 25;

  // Validity Section
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPosition, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("VALIDADE E CONDIÇÕES", margin + 5, yPosition + 6);
  
  yPosition += 15;
  
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  doc.setFont("helvetica", "bold");
  doc.text("Data de Emissão:", margin, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(quote.createdAt), margin + 40, yPosition);
  
  doc.setFont("helvetica", "bold");
  doc.text("Válido até:", col2X, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(quote.validUntil), col2X + 28, yPosition);
  
  yPosition += 15;
  
  // Terms
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  const terms = [
    "• Este orçamento é válido pelo período indicado acima.",
    "• Os valores podem sofrer alterações após o vencimento.",
    "• Reserva confirmada mediante assinatura do contrato e pagamento do sinal.",
    "• Consulte condições de pagamento e política de cancelamento.",
  ];
  
  terms.forEach((term) => {
    doc.text(term, margin, yPosition);
    yPosition += 6;
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 25;
  
  doc.setFillColor(...goldColor);
  doc.rect(0, footerY - 5, pageWidth, 3, "F");
  
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Obrigado pela preferência! Estamos à disposição para esclarecer qualquer dúvida.",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );
  
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    pageWidth / 2,
    footerY + 12,
    { align: "center" }
  );

  // Save the PDF
  doc.save(`orcamento-${quote.id}.pdf`);
};

import jsPDF from "jspdf";

interface QuoteItem {
  id: string;
  nome: string;
  tipo: string;
  tipo_preco: string;
  valor_total: number;
  valor_fixo?: number;
  valor_inicial?: number;
  valor_por_unidade?: number;
  unidade?: string;
}

interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: string;
}

interface PaymentTerms {
  percentualSinal: number;
  valorSinal: number;
  numeroParcelas: number;
  parcelas: Parcela[];
}

interface ComposicaoPreco {
  itens: QuoteItem[];
  subtotal_fixo: number;
  desconto_fixo: number;
  total_fixo: number;
  subtotal_variavel: number;
  desconto_variavel: number;
  total_variavel: number;
  total_extras: number;
  total_geral: number;
}

interface ExtraItem {
  descricao: string;
  valor: number;
  porConvidado?: boolean;
}

interface DescontoData {
  descricao: string;
  percentual: number;
  valor: number;
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
  paymentTerms?: PaymentTerms;
  composicao?: ComposicaoPreco;
  extras?: ExtraItem[];
  desconto?: DescontoData;
  pacoteNome?: string;
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Paleta de cores sofisticada
  const colors = {
    primary: [75, 42, 34] as [number, number, number],
    gold: [201, 168, 106] as [number, number, number],
    lightGold: [218, 195, 149] as [number, number, number],
    text: [60, 50, 42] as [number, number, number],
    textLight: [107, 90, 74] as [number, number, number],
    bg: [252, 249, 243] as [number, number, number],
    bgAlt: [247, 242, 234] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    divider: [230, 220, 205] as [number, number, number],
    green: [34, 139, 34] as [number, number, number],
  };

  let yPosition = 0;

  // ============================================
  // CABEÇALHO ELEGANTE COM DEGRADÊ
  // ============================================

  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 70, "F");

  doc.setFillColor(...colors.gold);
  doc.rect(0, 68, pageWidth, 2, "F");
  doc.rect(0, 0, pageWidth, 2, "F");

  doc.setFillColor(...colors.lightGold);
  for (let i = 0; i < 8; i++) {
    doc.circle(5, 10 + i * 7, 1, "F");
    doc.circle(pageWidth - 5, 10 + i * 7, 1, "F");
  }

  yPosition = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...colors.gold);
  doc.text("SÍTIO CANTO DA MATA", pageWidth / 2, yPosition, { align: "center" });

  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(0.5);
  const lineWidth = 60;
  doc.line(pageWidth / 2 - lineWidth / 2, yPosition + 3, pageWidth / 2 + lineWidth / 2, yPosition + 3);

  yPosition += 12;

  doc.setFontSize(28);
  doc.setTextColor(...colors.white);
  doc.text("ORÇAMENTO", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;

  doc.setFillColor(...colors.gold);
  const idText = `Nº ${quote.id}`;
  const idWidth = doc.getTextWidth(idText) + 10;
  doc.roundedRect(pageWidth / 2 - idWidth / 2, yPosition - 4, idWidth, 8, 2, 2, "F");
  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(idText, pageWidth / 2, yPosition + 2, { align: "center" });

  yPosition = 85;

  // ============================================
  // INFORMAÇÕES DO CLIENTE
  // ============================================

  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin - 1, yPosition + 1, contentWidth + 2, 38, 3, 3, "F");

  doc.setFillColor(...colors.white);
  doc.roundedRect(margin, yPosition, contentWidth, 38, 3, 3, "F");

  doc.setFillColor(...colors.gold);
  doc.rect(margin, yPosition, 4, 38, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("INFORMAÇÕES DO CLIENTE", margin + 10, yPosition + 8);

  yPosition += 18;

  doc.setFontSize(10);
  doc.setTextColor(...colors.text);

  const infoStartX = margin + 10;
  const col2Start = pageWidth / 2 + 5;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textLight);
  doc.text("Cliente:", infoStartX, yPosition);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.text(quote.clientName, infoStartX + 20, yPosition);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textLight);
  doc.text("Data do Evento:", col2Start, yPosition);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.text(formatDate(quote.weddingDate), col2Start + 35, yPosition);

  yPosition += 8;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textLight);
  doc.text("Nº Convidados:", infoStartX, yPosition);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.text(quote.guestCount.toString() + " pessoas", infoStartX + 33, yPosition);

  yPosition += 25;

  // ============================================
  // COMPOSIÇÃO DO VALOR - ITENS
  // ============================================

  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, "F");

  doc.setTextColor(...colors.gold);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("COMPOSIÇÃO DO VALOR", margin + 5, yPosition + 7);

  yPosition += 18;

  // Cabeçalho da tabela
  doc.setFillColor(...colors.bgAlt);
  doc.rect(margin, yPosition, contentWidth, 8, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIÇÃO", margin + 5, yPosition + 6);
  doc.text("VALOR", pageWidth - margin - 5, yPosition + 6, { align: "right" });

  yPosition += 13;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.setFontSize(10);

  let itemIndex = 0;

  // Renderizar itens da composição
  if (quote.composicao && quote.composicao.itens && quote.composicao.itens.length > 0) {
    if (quote.pacoteNome) {
      // Com pacote: exibir linha única com o valor do pacote,
      // e listar os itens inclusos sem valores individuais
      const valorPacote = quote.composicao.total_fixo + quote.composicao.total_variavel;

      doc.setFillColor(...colors.bg);
      doc.rect(margin, yPosition - 4, contentWidth, 9, "F");

      doc.setFont("helvetica", "bold");
      doc.text(`Pacote ${quote.pacoteNome}`, margin + 5, yPosition);
      doc.text(formatCurrency(valorPacote), pageWidth - margin - 5, yPosition, { align: "right" });
      doc.setFont("helvetica", "normal");
      yPosition += 9;
      itemIndex++;

      doc.setFontSize(9);
      doc.setTextColor(...colors.textLight);
      quote.composicao.itens.forEach((item) => {
        const tipoLabel = item.tipo === 'espaco' ? 'Espaço' :
                          item.tipo === 'buffet' ? 'Buffet' :
                          item.tipo === 'servico' ? 'Serviço' : item.tipo;

        doc.text(`• ${item.nome} (${tipoLabel})`, margin + 10, yPosition);
        yPosition += 6;
      });
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      yPosition += 3;
    } else {
      quote.composicao.itens.forEach((item) => {
        if (itemIndex % 2 === 0) {
          doc.setFillColor(...colors.bg);
          doc.rect(margin, yPosition - 4, contentWidth, 9, "F");
        }

        // Nome do item com tipo entre parênteses
        const tipoLabel = item.tipo === 'espaco' ? 'Espaço' :
                          item.tipo === 'buffet' ? 'Buffet' :
                          item.tipo === 'servico' ? 'Serviço' : item.tipo;

        doc.text(`${item.nome} (${tipoLabel})`, margin + 5, yPosition);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.valor_total), pageWidth - margin - 5, yPosition, { align: "right" });
        doc.setFont("helvetica", "normal");
        yPosition += 9;
        itemIndex++;
      });
    }
  }

  // Extras
  if (quote.extras && quote.extras.length > 0) {
    yPosition += 8;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.setFontSize(10);
    doc.text("VALORES EXTRAS", margin + 5, yPosition);

    yPosition += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);

    quote.extras.forEach((extra) => {
      if (itemIndex % 2 === 0) {
        doc.setFillColor(...colors.bg);
        doc.rect(margin, yPosition - 4, contentWidth, 9, "F");
      }

      const valorCalculado = extra.porConvidado ? extra.valor * quote.guestCount : extra.valor;

      const descricao = extra.porConvidado
        ? `${extra.descricao} (${formatCurrency(extra.valor)} × ${quote.guestCount})`
        : extra.descricao;

      doc.text(descricao, margin + 5, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(valorCalculado), pageWidth - margin - 5, yPosition, { align: "right" });
      doc.setFont("helvetica", "normal");
      yPosition += 9;
      itemIndex++;
    });
  }

  yPosition += 5;

  // Linha divisória
  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(1);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 10;

  // ============================================
  // SUBTOTAL, DESCONTO E TOTAL
  // ============================================

  const hasDesconto = quote.desconto && quote.desconto.valor > 0;

  if (hasDesconto) {
    // Subtotal (antes do desconto)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textLight);
    doc.text("Subtotal:", margin + 5, yPosition);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    const subtotal = quote.composicao?.total_geral || (quote.totalValue + quote.desconto.valor);
    doc.text(formatCurrency(subtotal), pageWidth - margin - 5, yPosition, { align: "right" });

    yPosition += 8;

    // Desconto
    doc.setFillColor(240, 255, 240);
    doc.rect(margin, yPosition - 4, contentWidth, 10, "F");

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.green);
    const descontoLabel = quote.desconto.descricao 
      ? `Desconto (${quote.desconto.descricao}):`
      : `Desconto (${quote.desconto.percentual.toFixed(1)}%):`;
    doc.text(descontoLabel, margin + 5, yPosition + 2);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${formatCurrency(quote.desconto.valor)}`, pageWidth - margin - 5, yPosition + 2, { align: "right" });

    yPosition += 15;
  }

  // Total destacado em card
  const totalBoxWidth = 95;
  const totalBoxHeight = 18;
  const totalBoxX = pageWidth - margin - totalBoxWidth;

  doc.setFillColor(200, 200, 200);
  doc.roundedRect(totalBoxX + 1, yPosition - totalBoxHeight / 2 + 1, totalBoxWidth, totalBoxHeight, 3, 3, "F");

  doc.setFillColor(...colors.primary);
  doc.roundedRect(totalBoxX, yPosition - totalBoxHeight / 2, totalBoxWidth, totalBoxHeight, 3, 3, "F");

  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(1.5);
  doc.roundedRect(totalBoxX, yPosition - totalBoxHeight / 2, totalBoxWidth, totalBoxHeight, 3, 3, "S");

  doc.setTextColor(...colors.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL", totalBoxX + 7, yPosition + 1);

  doc.setFontSize(14);
  doc.setTextColor(...colors.gold);
  doc.text(formatCurrency(quote.totalValue), pageWidth - margin - 7, yPosition + 1, { align: "right" });

  yPosition += 25;

  // ============================================
  // CONDIÇÕES DE PAGAMENTO
  // ============================================

  if (quote.paymentTerms && quote.paymentTerms.parcelas.length > 0) {
    const estimatedPaymentHeight = 65 + quote.paymentTerms.parcelas.length * 9;
    if (yPosition + estimatedPaymentHeight > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, "F");

    doc.setTextColor(...colors.gold);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CONDIÇÕES DE PAGAMENTO", margin + 5, yPosition + 7);

    yPosition += 18;

    // Box do sinal
    doc.setFillColor(...colors.bg);
    doc.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, "F");

    doc.setFillColor(...colors.gold);
    doc.circle(margin + 7, yPosition + 6, 2, "F");

    doc.setTextColor(...colors.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Sinal (Entrada):", margin + 12, yPosition + 7);

    doc.setFont("helvetica", "normal");
    const sinalText = `${formatCurrency(quote.paymentTerms.valorSinal)} (${quote.paymentTerms.percentualSinal}%) — na assinatura do contrato`;
    doc.text(sinalText, margin + 42, yPosition + 7);

    yPosition += 20;

    // Cabeçalho da tabela de parcelas
    doc.setFillColor(...colors.bgAlt);
    doc.rect(margin, yPosition, contentWidth, 8, "F");

    doc.setTextColor(...colors.primary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PARCELA", margin + 5, yPosition + 6);
    doc.text("VENCIMENTO", margin + 45, yPosition + 6);
    doc.text("VALOR", pageWidth - margin - 5, yPosition + 6, { align: "right" });

    yPosition += 13;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);

    quote.paymentTerms.parcelas.forEach((parcela, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(...colors.bg);
        doc.rect(margin, yPosition - 4, contentWidth, 9, "F");
      }

      doc.text(`${parcela.numero}ª`, margin + 5, yPosition);
      doc.text(formatDate(parcela.dataVencimento), margin + 45, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(parcela.valor), pageWidth - margin - 5, yPosition, { align: "right" });
      doc.setFont("helvetica", "normal");
      yPosition += 9;
    });

    yPosition += 3;

    const totalParcelas = quote.paymentTerms.parcelas.reduce((sum, p) => sum + p.valor, 0);

    doc.setDrawColor(...colors.divider);
    doc.setLineWidth(0.5);
    doc.line(margin + 40, yPosition, pageWidth - margin, yPosition);

    yPosition += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.text("Total Parcelado:", margin + 45, yPosition);
    doc.text(formatCurrency(totalParcelas), pageWidth - margin - 5, yPosition, { align: "right" });

    yPosition += 18;
  }

  // ============================================
  // VALIDADE E CONDIÇÕES
  // ============================================

  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, "F");

  doc.setTextColor(...colors.gold);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("VALIDADE E CONDIÇÕES", margin + 5, yPosition + 7);

  yPosition += 18;

  const dateBoxWidth = (contentWidth - 10) / 2;

  doc.setFillColor(...colors.bg);
  doc.roundedRect(margin, yPosition, dateBoxWidth, 10, 2, 2, "F");
  doc.setTextColor(...colors.textLight);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Data de Emissão", margin + 5, yPosition + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.text(formatDate(quote.createdAt), margin + 5, yPosition + 8);

  doc.setFillColor(...colors.bg);
  doc.roundedRect(margin + dateBoxWidth + 10, yPosition, dateBoxWidth, 10, 2, 2, "F");
  doc.setTextColor(...colors.textLight);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Válido até", margin + dateBoxWidth + 15, yPosition + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.text(formatDate(quote.validUntil), margin + dateBoxWidth + 15, yPosition + 8);

  yPosition += 18;

  doc.setFontSize(9);
  doc.setTextColor(...colors.textLight);
  doc.setFont("helvetica", "normal");

  const terms = [
    "• Este orçamento é válido pelo período indicado acima.",
    "• Os valores podem sofrer alterações após o vencimento.",
    "• Reserva confirmada mediante assinatura do contrato e pagamento do sinal.",
    "• Dúvidas ou alterações podem ser solicitadas através dos nossos canais de atendimento.",
  ];

  terms.forEach((term) => {
    doc.text(term, margin + 2, yPosition);
    yPosition += 6;
  });

  // ============================================
  // RODAPÉ
  // ============================================

  const footerY = pageHeight - 25;

  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(1.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFillColor(...colors.gold);
  doc.circle(margin, footerY - 5, 2, "F");
  doc.circle(pageWidth - margin, footerY - 5, 2, "F");
  doc.circle(pageWidth / 2, footerY - 5, 2, "F");

  doc.setFontSize(10);
  doc.setTextColor(...colors.primary);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Obrigado pela preferência! Estamos à disposição para realizar seu evento dos sonhos.",
    pageWidth / 2,
    footerY + 3,
    { align: "center" },
  );

  doc.setFontSize(8);
  doc.setTextColor(...colors.textLight);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    pageWidth / 2,
    footerY + 10,
    { align: "center" },
  );

  // Salvar PDF
  doc.save(`orcamento-${quote.id}-sitio-canto-da-mata.pdf`);
};
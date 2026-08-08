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
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Paleta minimalista (baixo consumo de tinta, otimizada para impressão P&B)
  const colors = {
    dark: [40, 40, 40] as [number, number, number], // texto principal / títulos
    text: [55, 55, 55] as [number, number, number], // corpo
    textLight: [120, 120, 120] as [number, number, number], // rótulos / secundário
    line: [200, 200, 200] as [number, number, number], // divisórias
    sectionBg: [238, 238, 238] as [number, number, number], // barra de seção (cinza claro)
    rowBg: [247, 247, 247] as [number, number, number], // zebra suave
    accent: [120, 90, 70] as [number, number, number], // marrom discreto (só filetes finos)
    white: [255, 255, 255] as [number, number, number],
  };

  let yPosition = 0;

  const tipoLabelOf = (tipo: string): string =>
    tipo === "espaco" ? "Espaço" :
    tipo === "buffet" ? "Buffet" :
    tipo === "servico" ? "Serviço" : tipo;

  // Barra de título de seção: fundo cinza claro + filete de acento fino
  const sectionTitle = (title: string): void => {
    doc.setFillColor(...colors.sectionBg);
    doc.rect(margin, yPosition, contentWidth, 7, "F");
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.4);
    doc.line(margin, yPosition + 7, margin + contentWidth, yPosition + 7);
    doc.setTextColor(...colors.dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 3, yPosition + 5);
    yPosition += 11;
  };

  // ============================================
  // CABEÇALHO MINIMALISTA (sem preenchimento pesado)
  // ============================================

  yPosition = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...colors.dark);
  doc.text("SÍTIO CANTO DA MATA", margin, yPosition);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.textLight);
  doc.text("Espaço para eventos e casamentos", margin, yPosition + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...colors.dark);
  doc.text("ORÇAMENTO", pageWidth - margin, yPosition, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.textLight);
  doc.text(`Nº ${quote.id}`, pageWidth - margin, yPosition + 5, { align: "right" });

  yPosition += 9;

  // Filete duplo de acento abaixo do cabeçalho
  doc.setDrawColor(...colors.accent);
  doc.setLineWidth(0.6);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  doc.setDrawColor(...colors.line);
  doc.setLineWidth(0.2);
  doc.line(margin, yPosition + 1.2, pageWidth - margin, yPosition + 1.2);

  yPosition += 8;

  // ============================================
  // INFORMAÇÕES DO CLIENTE
  // ============================================

  sectionTitle("INFORMAÇÕES DO CLIENTE");

  const col2Start = pageWidth / 2 + 5;

  const infoField = (label: string, value: string, x: number, y: number): void => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colors.textLight);
    doc.text(label, x, y);
    const labelWidth = doc.getTextWidth(label) + 2;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.text(value, x + labelWidth, y);
  };

  infoField("Cliente:", quote.clientName, margin + 3, yPosition);
  infoField("Data do Evento:", formatDate(quote.weddingDate), col2Start, yPosition);
  yPosition += 6;
  infoField("Nº Convidados:", `${quote.guestCount} pessoas`, margin + 3, yPosition);
  yPosition += 11;

  // ============================================
  // COMPOSIÇÃO DO VALOR - ITENS
  // ============================================

  sectionTitle("COMPOSIÇÃO DO VALOR");

  const rowH = 6.5;

  // Cabeçalho da tabela
  doc.setDrawColor(...colors.line);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
  doc.setTextColor(...colors.textLight);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIÇÃO", margin + 2, yPosition - 1.5);
  doc.text("VALOR", pageWidth - margin - 2, yPosition - 1.5, { align: "right" });
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.setFontSize(9.5);

  let itemIndex = 0;

  // Renderizar itens da composição
  if (quote.composicao && quote.composicao.itens && quote.composicao.itens.length > 0) {
    if (quote.pacoteNome) {
      // Com pacote: linha única com o valor do pacote + itens inclusos sem valores
      const valorPacote = quote.composicao.total_fixo + quote.composicao.total_variavel;

      doc.setFont("helvetica", "bold");
      doc.text(`Pacote ${quote.pacoteNome}`, margin + 2, yPosition);
      doc.text(formatCurrency(valorPacote), pageWidth - margin - 2, yPosition, { align: "right" });
      doc.setFont("helvetica", "normal");
      yPosition += rowH;
      itemIndex++;

      doc.setFontSize(8.5);
      doc.setTextColor(...colors.textLight);
      quote.composicao.itens.forEach((item) => {
        doc.text(`• ${item.nome} (${tipoLabelOf(item.tipo)})`, margin + 6, yPosition);
        yPosition += 5;
      });
      doc.setFontSize(9.5);
      doc.setTextColor(...colors.text);
      yPosition += 1;
    } else {
      quote.composicao.itens.forEach((item) => {
        if (itemIndex % 2 === 0) {
          doc.setFillColor(...colors.rowBg);
          doc.rect(margin, yPosition - 4.5, contentWidth, rowH, "F");
        }
        doc.text(`${item.nome} (${tipoLabelOf(item.tipo)})`, margin + 2, yPosition);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.valor_total), pageWidth - margin - 2, yPosition, { align: "right" });
        doc.setFont("helvetica", "normal");
        yPosition += rowH;
        itemIndex++;
      });
    }
  }

  // Extras
  if (quote.extras && quote.extras.length > 0) {
    yPosition += 3;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.dark);
    doc.setFontSize(8.5);
    doc.text("VALORES EXTRAS", margin + 2, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.setFontSize(9.5);

    quote.extras.forEach((extra) => {
      if (itemIndex % 2 === 0) {
        doc.setFillColor(...colors.rowBg);
        doc.rect(margin, yPosition - 4.5, contentWidth, rowH, "F");
      }
      const valorCalculado = extra.porConvidado ? extra.valor * quote.guestCount : extra.valor;
      const descricao = extra.porConvidado
        ? `${extra.descricao} (${formatCurrency(extra.valor)} × ${quote.guestCount})`
        : extra.descricao;

      doc.text(descricao, margin + 2, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(valorCalculado), pageWidth - margin - 2, yPosition, { align: "right" });
      doc.setFont("helvetica", "normal");
      yPosition += rowH;
      itemIndex++;
    });
  }

  yPosition += 2;
  doc.setDrawColor(...colors.line);
  doc.setLineWidth(0.4);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 7;

  // ============================================
  // SUBTOTAL, DESCONTO E TOTAL
  // ============================================

  const hasDesconto = quote.desconto && quote.desconto.valor > 0;

  if (hasDesconto) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textLight);
    doc.text("Subtotal:", margin + 2, yPosition);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    const subtotal = quote.composicao?.total_geral || (quote.totalValue + quote.desconto.valor);
    doc.text(formatCurrency(subtotal), pageWidth - margin - 2, yPosition, { align: "right" });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textLight);
    const descontoLabel = quote.desconto.descricao
      ? `Desconto (${quote.desconto.descricao}):`
      : `Desconto (${quote.desconto.percentual.toFixed(1)}%):`;
    doc.text(descontoLabel, margin + 2, yPosition);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    doc.text(`- ${formatCurrency(quote.desconto.valor)}`, pageWidth - margin - 2, yPosition, { align: "right" });
    yPosition += 8;
  }

  // Total destacado com moldura (sem preenchimento escuro)
  const totalBoxWidth = 90;
  const totalBoxHeight = 13;
  const totalBoxX = pageWidth - margin - totalBoxWidth;
  const totalBoxTop = yPosition - 4;

  doc.setFillColor(...colors.sectionBg);
  doc.rect(totalBoxX, totalBoxTop, totalBoxWidth, totalBoxHeight, "F");
  doc.setDrawColor(...colors.accent);
  doc.setLineWidth(0.5);
  doc.rect(totalBoxX, totalBoxTop, totalBoxWidth, totalBoxHeight, "S");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL", totalBoxX + 4, totalBoxTop + 8.5);

  doc.setFontSize(13);
  doc.text(formatCurrency(quote.totalValue), pageWidth - margin - 4, totalBoxTop + 8.5, { align: "right" });

  yPosition = totalBoxTop + totalBoxHeight + 8;

  // ============================================
  // CONDIÇÕES DE PAGAMENTO
  // ============================================

  if (quote.paymentTerms && quote.paymentTerms.parcelas.length > 0) {
    sectionTitle("CONDIÇÕES DE PAGAMENTO");

    // Sinal
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Sinal (Entrada):", margin + 2, yPosition);
    const sinalLabelW = doc.getTextWidth("Sinal (Entrada):") + 3;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.text(
      `${formatCurrency(quote.paymentTerms.valorSinal)} (${quote.paymentTerms.percentualSinal}%) — na assinatura do contrato`,
      margin + 2 + sinalLabelW,
      yPosition,
    );
    yPosition += 7;

    // Cabeçalho da tabela de parcelas
    doc.setDrawColor(...colors.line);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    doc.setTextColor(...colors.textLight);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PARCELA", margin + 2, yPosition - 1.5);
    doc.text("VENCIMENTO", margin + 40, yPosition - 1.5);
    doc.text("VALOR", pageWidth - margin - 2, yPosition - 1.5, { align: "right" });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);

    const parcelaH = 5.8;
    quote.paymentTerms.parcelas.forEach((parcela, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(...colors.rowBg);
        doc.rect(margin, yPosition - 4, contentWidth, parcelaH, "F");
      }
      doc.text(`${parcela.numero}ª`, margin + 2, yPosition);
      doc.text(formatDate(parcela.dataVencimento), margin + 40, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(parcela.valor), pageWidth - margin - 2, yPosition, { align: "right" });
      doc.setFont("helvetica", "normal");
      yPosition += parcelaH;
    });

    yPosition += 1;
    const totalParcelas = quote.paymentTerms.parcelas.reduce((sum, p) => sum + p.valor, 0);
    doc.setDrawColor(...colors.line);
    doc.setLineWidth(0.3);
    doc.line(margin + 38, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.text("Total Parcelado:", margin + 40, yPosition);
    doc.text(formatCurrency(totalParcelas), pageWidth - margin - 2, yPosition, { align: "right" });
    yPosition += 10;
  }

  // ============================================
  // VALIDADE E CONDIÇÕES
  // ============================================

  sectionTitle("VALIDADE E CONDIÇÕES");

  infoField("Data de Emissão:", formatDate(quote.createdAt), margin + 3, yPosition);
  infoField("Válido até:", formatDate(quote.validUntil), col2Start, yPosition);
  yPosition += 8;

  doc.setFontSize(8);
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
    yPosition += 4.5;
  });

  // ============================================
  // RODAPÉ
  // ============================================

  const footerY = pageHeight - 16;

  doc.setDrawColor(...colors.accent);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(9);
  doc.setTextColor(...colors.dark);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Obrigado pela preferência! Estamos à disposição para realizar seu evento dos sonhos.",
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  doc.setFontSize(7.5);
  doc.setTextColor(...colors.textLight);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    pageWidth / 2,
    footerY + 5,
    { align: "center" },
  );

  // Salvar PDF
  doc.save(`orcamento-${quote.id}-sitio-canto-da-mata.pdf`);
};
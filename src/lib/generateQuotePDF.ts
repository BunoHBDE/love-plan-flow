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

  // Paleta da marca "Sítio Canto da Mata" (casamento no campo):
  // marrom terroso, dourado quente, verde-folhagem e creme suave.
  // Usada em tons claros como fundo para manter leveza na impressão.
  const colors = {
    brown: [73, 41, 34] as [number, number, number], // marrom principal (títulos)
    brownSoft: [106, 89, 72] as [number, number, number], // marrom médio (rótulos)
    text: [60, 50, 42] as [number, number, number], // corpo do texto
    gold: [200, 169, 106] as [number, number, number], // dourado (acentos/filetes)
    goldLight: [227, 210, 174] as [number, number, number], // dourado claro (barras)
    goldDark: [168, 132, 62] as [number, number, number], // dourado escuro (valor)
    sage: [138, 156, 134] as [number, number, number], // verde-folhagem (desconto/toques)
    cream: [250, 246, 238] as [number, number, number], // creme (fundo de blocos)
    creamAlt: [244, 238, 227] as [number, number, number], // zebra suave
    line: [214, 201, 176] as [number, number, number], // divisórias quentes
    white: [255, 255, 255] as [number, number, number],
  };

  let yPosition = 0;

  const tipoLabelOf = (tipo: string): string =>
    tipo === "espaco" ? "Espaço" :
    tipo === "buffet" ? "Buffet" :
    tipo === "servico" ? "Serviço" : tipo;

  // Divisória decorativa com losango dourado ao centro (toque afetivo)
  const ornamentDivider = (y: number): void => {
    doc.setDrawColor(...colors.gold);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth / 2 - 7, y);
    doc.line(pageWidth / 2 + 7, y, pageWidth - margin, y);
    const cx = pageWidth / 2;
    const s = 2;
    doc.setFillColor(...colors.gold);
    doc.triangle(cx, y - s, cx - s, y, cx + s, y, "F");
    doc.triangle(cx, y + s, cx - s, y, cx + s, y, "F");
  };

  // Título de seção: pílula arredondada em dourado claro + texto marrom
  const sectionTitle = (title: string): void => {
    doc.setFillColor(...colors.goldLight);
    doc.roundedRect(margin, yPosition, contentWidth, 8, 2.5, 2.5, "F");
    doc.setFillColor(...colors.gold);
    doc.circle(margin + 4.5, yPosition + 4, 1.1, "F");
    doc.setTextColor(...colors.brown);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 8, yPosition + 5.5);
    yPosition += 11;
  };

  const infoField = (label: string, value: string, x: number, y: number): void => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colors.brownSoft);
    doc.text(label, x, y);
    const labelWidth = doc.getTextWidth(label) + 2;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.text(value, x + labelWidth, y);
  };

  const col2Start = pageWidth / 2 + 5;

  // ============================================
  // CABEÇALHO ACOLHEDOR (bloco creme arredondado)
  // ============================================

  doc.setFillColor(...colors.cream);
  doc.roundedRect(margin, 12, contentWidth, 26, 4, 4, "F");
  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, 12, contentWidth, 26, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...colors.brown);
  doc.text("Sítio Canto da Mata", margin + 8, 24);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.sage);
  doc.text("Onde o seu grande dia acontece", margin + 8, 31);

  // Selo "ORÇAMENTO" + Nº à direita
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...colors.brown);
  doc.text("ORÇAMENTO", pageWidth - margin - 8, 22, { align: "right" });

  const idText = `Nº ${quote.id}`;
  doc.setFontSize(9);
  const idWidth = doc.getTextWidth(idText) + 8;
  const idX = pageWidth - margin - 8 - idWidth;
  doc.setFillColor(...colors.gold);
  doc.roundedRect(idX, 26, idWidth, 7, 3.5, 3.5, "F");
  doc.setTextColor(...colors.white);
  doc.setFont("helvetica", "bold");
  doc.text(idText, idX + idWidth / 2, 30.7, { align: "center" });

  yPosition = 44;
  ornamentDivider(yPosition);
  yPosition += 7;

  // ============================================
  // INFORMAÇÕES DO CLIENTE
  // ============================================

  sectionTitle("INFORMAÇÕES DO CLIENTE");

  infoField("Cliente:", quote.clientName, margin + 3, yPosition);
  infoField("Data do Evento:", formatDate(quote.weddingDate), col2Start, yPosition);
  yPosition += 6;
  infoField("Nº Convidados:", `${quote.guestCount} pessoas`, margin + 3, yPosition);
  yPosition += 8;

  // ============================================
  // COMPOSIÇÃO DO VALOR - ITENS
  // ============================================

  sectionTitle("COMPOSIÇÃO DO VALOR");

  const rowH = 6.5;

  // Respiro entre a barra de seção e o cabeçalho da tabela
  yPosition += 4;

  // Cabeçalho da tabela
  doc.setDrawColor(...colors.line);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
  doc.setTextColor(...colors.brownSoft);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIÇÃO", margin + 3, yPosition - 1.5);
  doc.text("VALOR", pageWidth - margin - 3, yPosition - 1.5, { align: "right" });
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.setFontSize(9.5);

  let itemIndex = 0;

  const zebra = (): void => {
    if (itemIndex % 2 === 0) {
      doc.setFillColor(...colors.creamAlt);
      doc.roundedRect(margin, yPosition - 4.5, contentWidth, rowH, 1.5, 1.5, "F");
    }
  };

  // Renderizar itens da composição
  // Sempre agrupamos os itens em uma linha única com o valor combinado e
  // listamos os itens inclusos abaixo, sem exibir o valor individual de cada um.
  // Isso vale tanto para pacotes quanto para seleções individuais (ex.: espaço + buffet).
  if (quote.composicao && quote.composicao.itens && quote.composicao.itens.length > 0) {
    const tituloLinha = quote.pacoteNome
      ? `Pacote ${quote.pacoteNome}`
      : "Pacote personalizado";
    const valorAgrupado =
      (quote.composicao.total_fixo || 0) + (quote.composicao.total_variavel || 0) ||
      quote.composicao.itens.reduce((sum, item) => sum + (item.valor_total || 0), 0);

    zebra();
    doc.setFont("helvetica", "bold");
    doc.text(tituloLinha, margin + 3, yPosition);
    doc.text(formatCurrency(valorAgrupado), pageWidth - margin - 3, yPosition, { align: "right" });
    doc.setFont("helvetica", "normal");
    yPosition += rowH;
    itemIndex++;

    doc.setFontSize(8.5);
    doc.setTextColor(...colors.brownSoft);
    quote.composicao.itens.forEach((item) => {
      doc.text(`• ${item.nome} (${tipoLabelOf(item.tipo)})`, margin + 7, yPosition);
      yPosition += 5;
    });
    doc.setFontSize(9.5);
    doc.setTextColor(...colors.text);
    yPosition += 1;
  }

  // Extras
  if (quote.extras && quote.extras.length > 0) {
    yPosition += 3;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.brown);
    doc.setFontSize(8.5);
    doc.text("VALORES EXTRAS", margin + 3, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.setFontSize(9.5);

    quote.extras.forEach((extra) => {
      zebra();
      const valorCalculado = extra.porConvidado ? extra.valor * quote.guestCount : extra.valor;
      const descricao = extra.porConvidado
        ? `${extra.descricao} (${formatCurrency(extra.valor)} × ${quote.guestCount})`
        : extra.descricao;

      doc.text(descricao, margin + 3, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(valorCalculado), pageWidth - margin - 3, yPosition, { align: "right" });
      doc.setFont("helvetica", "normal");
      yPosition += rowH;
      itemIndex++;
    });
  }

  yPosition += 2;
  doc.setDrawColor(...colors.gold);
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
    doc.setTextColor(...colors.brownSoft);
    doc.text("Subtotal:", margin + 3, yPosition);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    const subtotal = quote.composicao?.total_geral || (quote.totalValue + quote.desconto.valor);
    doc.text(formatCurrency(subtotal), pageWidth - margin - 3, yPosition, { align: "right" });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.sage);
    const descontoLabel = quote.desconto.descricao
      ? `Desconto (${quote.desconto.descricao}):`
      : `Desconto (${quote.desconto.percentual.toFixed(1)}%):`;
    doc.text(descontoLabel, margin + 3, yPosition);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${formatCurrency(quote.desconto.valor)}`, pageWidth - margin - 3, yPosition, { align: "right" });
    yPosition += 8;
  }

  // Total destacado em card arredondado (dourado claro + moldura dourada)
  const totalBoxWidth = 92;
  const totalBoxHeight = 14;
  const totalBoxX = pageWidth - margin - totalBoxWidth;
  const totalBoxTop = yPosition - 4;

  doc.setFillColor(...colors.goldLight);
  doc.roundedRect(totalBoxX, totalBoxTop, totalBoxWidth, totalBoxHeight, 3.5, 3.5, "F");
  doc.setDrawColor(...colors.goldDark);
  doc.setLineWidth(0.6);
  doc.roundedRect(totalBoxX, totalBoxTop, totalBoxWidth, totalBoxHeight, 3.5, 3.5, "S");

  doc.setTextColor(...colors.brown);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL", totalBoxX + 5, totalBoxTop + 9);

  doc.setFontSize(13);
  doc.setTextColor(...colors.goldDark);
  doc.text(formatCurrency(quote.totalValue), pageWidth - margin - 5, totalBoxTop + 9, { align: "right" });

  yPosition = totalBoxTop + totalBoxHeight + 6;

  // ============================================
  // CONDIÇÕES DE PAGAMENTO
  // ============================================

  if (quote.paymentTerms && quote.paymentTerms.parcelas.length > 0) {
    sectionTitle("CONDIÇÕES DE PAGAMENTO");

    // Sinal
    doc.setTextColor(...colors.brown);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Sinal (Entrada):", margin + 3, yPosition);
    const sinalLabelW = doc.getTextWidth("Sinal (Entrada):") + 3;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.text(
      `${formatCurrency(quote.paymentTerms.valorSinal)} (${quote.paymentTerms.percentualSinal}%) — na assinatura do contrato`,
      margin + 3 + sinalLabelW,
      yPosition,
    );
    yPosition += 7;

    const parcelas = quote.paymentTerms.parcelas;
    const parcelaH = 5.4;
    // Muitas parcelas → duas colunas para preservar a página única
    const twoCol = parcelas.length > 4;

    const drawParcela = (p: Parcela, x: number, xEnd: number, filled: boolean): void => {
      if (filled) {
        doc.setFillColor(...colors.creamAlt);
        doc.roundedRect(x, yPosition - 4, xEnd - x, parcelaH, 1.5, 1.5, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.text);
      doc.setFontSize(8.5);
      doc.text(`${p.numero}ª`, x + 3, yPosition);
      doc.text(formatDate(p.dataVencimento), x + 16, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(p.valor), xEnd - 3, yPosition, { align: "right" });
      doc.setFont("helvetica", "normal");
    };

    if (twoCol) {
      const colGap = 8;
      const colW = (contentWidth - colGap) / 2;
      const leftX = margin;
      const rightX = margin + colW + colGap;

      // Cabeçalhos das duas colunas
      doc.setDrawColor(...colors.line);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
      doc.setTextColor(...colors.brownSoft);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      [leftX, rightX].forEach((x) => {
        doc.text("Nº", x + 3, yPosition - 1.5);
        doc.text("VENCIMENTO", x + 16, yPosition - 1.5);
        doc.text("VALOR", x + colW - 3, yPosition - 1.5, { align: "right" });
      });
      yPosition += 5.5;

      const half = Math.ceil(parcelas.length / 2);
      for (let r = 0; r < half; r++) {
        const filled = r % 2 === 0;
        drawParcela(parcelas[r], leftX, leftX + colW, filled);
        if (parcelas[r + half]) {
          drawParcela(parcelas[r + half], rightX, rightX + colW, filled);
        }
        yPosition += parcelaH;
      }
    } else {
      // Cabeçalho da tabela de parcelas (coluna única)
      doc.setDrawColor(...colors.line);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
      doc.setTextColor(...colors.brownSoft);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("PARCELA", margin + 3, yPosition - 1.5);
      doc.text("VENCIMENTO", margin + 40, yPosition - 1.5);
      doc.text("VALOR", pageWidth - margin - 3, yPosition - 1.5, { align: "right" });
      yPosition += 6;

      parcelas.forEach((parcela, index) => {
        drawParcela(parcela, margin, pageWidth - margin, index % 2 === 0);
        yPosition += parcelaH;
      });
    }

    yPosition += 1;
    const totalParcelas = quote.paymentTerms.parcelas.reduce((sum, p) => sum + p.valor, 0);
    doc.setDrawColor(...colors.line);
    doc.setLineWidth(0.3);
    doc.line(margin + 38, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colors.brown);
    doc.text("Total Parcelado:", margin + 40, yPosition);
    doc.text(formatCurrency(totalParcelas), pageWidth - margin - 3, yPosition, { align: "right" });
    yPosition += 8;
  }

  // ============================================
  // VALIDADE E CONDIÇÕES
  // ============================================

  sectionTitle("VALIDADE E CONDIÇÕES");

  infoField("Data de Emissão:", formatDate(quote.createdAt), margin + 3, yPosition);
  infoField("Válido até:", formatDate(quote.validUntil), col2Start, yPosition);
  yPosition += 8;

  doc.setFontSize(8);
  doc.setTextColor(...colors.brownSoft);
  doc.setFont("helvetica", "normal");

  const terms = [
    "• Este orçamento é válido pelo período indicado acima.",
    "• Os valores podem sofrer alterações após o vencimento.",
    "• Reserva confirmada mediante assinatura do contrato e pagamento do sinal.",
    "• Dúvidas ou alterações podem ser solicitadas através dos nossos canais de atendimento.",
  ];

  terms.forEach((term) => {
    doc.text(term, margin + 2, yPosition);
    yPosition += 4.2;
  });

  // ============================================
  // RODAPÉ AFETIVO
  // ============================================

  // Rodapé fixo na base — recuado para nunca sobrepor os termos acima
  const footerY = Math.max(yPosition + 8, pageHeight - 14);

  ornamentDivider(footerY - 6);

  doc.setFontSize(9.5);
  doc.setTextColor(...colors.brown);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Obrigado pela preferência! Será uma alegria realizar o casamento dos seus sonhos.",
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  doc.setFontSize(7.5);
  doc.setTextColor(...colors.brownSoft);
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

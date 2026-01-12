/**
 * PRICING CALCULATOR: Cálculo de preços baseado em configurações
 * Calcula valores fixos e variáveis separadamente
 */

import type { SpaceData, PrecoDia } from "@/types/spaceSettings.types";
import type { BuffetData, PrecoPessoa } from "@/types/buffetSettings.types";
import type { ServiceData, PrecoServico } from "@/types/serviceSettings.types";
import type { PackageData } from "@/types/packageSettings.types";
import type { QuoteItem, QuoteComposicao, QuotePackageData } from "@/types/quote.types";
import type { ExtraItem } from "@/components/quotes/ExtrasForm";

/**
 * Calcula o preço de um espaço
 */
export function calcularPrecoEspaco(
  espaco: SpaceData,
  diaSemana: string,
  nConvidados: number
): QuoteItem | null {
  if (!espaco.precos_por_dia || espaco.precos_por_dia.length === 0) {
    return null;
  }

  // Buscar preço para o dia da semana
  const precoDia = espaco.precos_por_dia.find((p) =>
    p.dias.includes(diaSemana)
  );

  if (!precoDia) {
    return null;
  }

  let valorTotal = 0;
  let valorInicial: number | undefined;
  let valorPorUnidade: number | undefined;

  if (precoDia.tipo === 'fixo') {
    valorTotal = precoDia.preco_fixo || 0;
  } else {
    valorInicial = precoDia.valor_inicial || 0;
    valorPorUnidade = precoDia.valor_por_convidado || 0;
    valorTotal = valorInicial + (valorPorUnidade * nConvidados);
  }

  return {
    id: espaco.id!,
    nome: espaco.nome,
    tipo: 'espaco',
    tipo_preco: precoDia.tipo,
    valor_fixo: precoDia.tipo === 'fixo' ? precoDia.preco_fixo : undefined,
    valor_inicial: valorInicial,
    valor_por_unidade: valorPorUnidade,
    unidade: precoDia.tipo === 'variavel' ? 'convidado' : undefined,
    valor_total: valorTotal,
  };
}

/**
 * Calcula o preço de um buffet
 */
export function calcularPrecoBuffet(
  buffet: BuffetData,
  nConvidados: number
): QuoteItem | null {
  if (!buffet.precos_por_pessoa || buffet.precos_por_pessoa.length === 0) {
    return null;
  }

  const preco = buffet.precos_por_pessoa[0];
  let valorTotal = 0;
  let valorInicial: number | undefined;
  let valorPorUnidade: number | undefined;

  if (preco.tipo === 'fixo') {
    valorTotal = (preco.preco_fixo || 0) * nConvidados;
  } else {
    valorInicial = preco.valor_inicial || 0;
    valorPorUnidade = preco.valor_por_pessoa || 0;
    valorTotal = valorInicial + (valorPorUnidade * nConvidados);
  }

  return {
    id: buffet.id!,
    nome: buffet.nome,
    tipo: 'buffet',
    tipo_preco: preco.tipo,
    valor_fixo: preco.tipo === 'fixo' ? preco.preco_fixo : undefined,
    valor_inicial: valorInicial,
    valor_por_unidade: valorPorUnidade,
    unidade: 'pessoa',
    valor_total: valorTotal,
  };
}

/**
 * Calcula o preço de um serviço
 */
export function calcularPrecoServico(
  servico: ServiceData,
  quantidade: number = 1
): QuoteItem | null {
  if (!servico.precos || servico.precos.length === 0) {
    return null;
  }

  const preco = servico.precos[0];
  let valorTotal = 0;
  let valorInicial: number | undefined;
  let valorPorUnidade: number | undefined;

  if (preco.tipo === 'fixo') {
    valorTotal = preco.preco_fixo || 0;
  } else {
    valorInicial = preco.valor_inicial || 0;
    valorPorUnidade = preco.valor_por_unidade || 0;
    valorTotal = valorInicial + (valorPorUnidade * quantidade);
  }

  return {
    id: servico.id!,
    nome: servico.nome,
    tipo: 'servico',
    tipo_preco: preco.tipo,
    valor_fixo: preco.tipo === 'fixo' ? preco.preco_fixo : undefined,
    valor_inicial: valorInicial,
    valor_por_unidade: valorPorUnidade,
    unidade: preco.unidade,
    valor_total: valorTotal,
  };
}

/**
 * Calcula composição de preço completa do orçamento
 */
export function calcularComposicaoPreco(
  itens: QuoteItem[],
  pacote: PackageData | null,
  extras: ExtraItem[],
  nConvidados: number
): QuoteComposicao {
  let subtotal_fixo = 0;
  let subtotal_variavel = 0;

  // Calcular subtotais fixos e variáveis
  itens.forEach((item) => {
    if (item.tipo_preco === 'fixo') {
      subtotal_fixo += item.valor_fixo || 0;
    } else {
      // Valor inicial vai pro fixo
      subtotal_fixo += item.valor_inicial || 0;
      
      // Valor por unidade * quantidade vai pro variável
      // A quantidade JÁ está no valor_total do item, então:
      const valorVariavel = item.valor_total - (item.valor_inicial || 0);
      subtotal_variavel += valorVariavel;
    }
  });

  // Aplicar descontos do pacote
  let desconto_fixo = 0;
  let desconto_variavel = 0;

  if (pacote) {
    desconto_fixo = (subtotal_fixo * pacote.desconto_percentual) / 100;
    desconto_variavel = (subtotal_variavel * pacote.desconto_percentual_variavel) / 100;
  }

  const total_fixo = subtotal_fixo - desconto_fixo;
  const total_variavel = subtotal_variavel - desconto_variavel;

  // Calcular total de extras
  const total_extras = extras.reduce((sum, extra) => {
    if (extra.porConvidado) {
      return sum + (extra.valor * nConvidados);
    }
    return sum + extra.valor;
  }, 0);

  const total_geral = total_fixo + total_variavel + total_extras;

  // IMPORTANTE: total_geral NÃO inclui desconto adicional do formulário
  // O desconto adicional é aplicado separadamente nos campos:
  // - desconto_descricao
  // - desconto_percentual  
  // - desconto_valor
  // E o valor FINAL é salvo em: valor_total = total_geral - desconto_valor

  return {
    itens,
    subtotal_fixo,
    desconto_fixo,
    total_fixo,
    subtotal_variavel,
    desconto_variavel,
    total_variavel,
    total_extras,
    total_geral,
  };
}

/**
 * Formata valor em moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Retorna o dia da semana a partir de uma data
 */
export function getDiaSemana(dataString: string): string {
  const diasSemana = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  const date = new Date(dataString + "T12:00:00");
  return diasSemana[date.getDay()];
}

/**
 * Retorna o ano a partir de uma data
 */
export function getAnoFromDate(dataString: string): string {
  const date = new Date(dataString + "T12:00:00");
  return date.getFullYear().toString();
}
/**
 * Sistema de precificação detalhado para orçamentos
 * 
 * Regras de cálculo:
 * - Pacotes base (espaço + decoração): Harmonia, Jardim dos Sonhos
 * - Buffet: Massas, Brasileirinho
 * - Combinações: Essência = Harmonia + Buffet, Florescer = Jardim dos Sonhos + Buffet
 */

export interface EspacoPreco {
  ano: string;
  sabado: number;
  domingo: number;
}

export interface DecoracaoPreco {
  baseFixo: number;
  porConvidado: number;
}

export interface BuffetPreco {
  baseFixo: number;
  porConvidado: number;
}

export interface ComposicaoPreco {
  espaco: number;
  decoracao: number;
  buffet: number | null;
  total: number;
  custoConvidadoAdicional: number;
  detalhes: {
    pacoteNome: string;
    buffetNome: string | null;
    ano: string;
    diaSemana: string;
    nConvidados: number;
    formulaEspaco: string;
    formulaDecoracao: string;
    formulaBuffet: string | null;
  };
}

// Preços do espaço por ano
const espacoPrecos: EspacoPreco[] = [
  { ano: "2026", sabado: 8900, domingo: 7900 },
  { ano: "2027", sabado: 9790, domingo: 8690 },
  { ano: "2028", sabado: 10769, domingo: 9559 },
];

// Decoração por pacote base (valor fixo sem espaço + custo por convidado)
// Harmonia: 10100 + 31*n (total) → decoração = 10100 - espacoBase + 31*n
// Jardim: 12300 + 55*n (total) → decoração = 12300 - espacoBase + 55*n
const decoracaoHarmonia = {
  sabado: { baseFixo: 10100 - 8900, porConvidado: 31 }, // 2026 base, ajustar depois
  domingo: { baseFixo: 9100 - 7900, porConvidado: 31 },
};

const decoracaoJardim = {
  sabado: { baseFixo: 12300 - 8900, porConvidado: 55 },
  domingo: { baseFixo: 10800 - 7900, porConvidado: 52 },
};

// Buffet
const buffetPrecos: Record<string, BuffetPreco> = {
  massas: { baseFixo: 640, porConvidado: 151 },
  brasileirinho: { baseFixo: 520, porConvidado: 120 },
};

// Nome display dos pacotes
const pacoteNomes: Record<string, string> = {
  harmonia: "Harmonia",
  jardim: "Jardim dos Sonhos",
  essencia: "Essência",
  florescer: "Florescer",
};

const buffetNomes: Record<string, string> = {
  massas: "Massas",
  brasileirinho: "Brasileirinho",
};

const diaSemanaLabel: Record<string, string> = {
  sabado: "Sábado",
  domingo: "Domingo",
};

/**
 * Obtém o preço do espaço para um determinado ano e dia
 */
function getEspacoPreco(ano: string, diaSemana: string): number {
  const espacoAno = espacoPrecos.find(e => e.ano === ano);
  
  // Se não encontrar o ano, usar 2026 como base e aplicar aumento de 10% por ano
  if (!espacoAno) {
    const anoNum = parseInt(ano) || 2026;
    const baseAno = 2026;
    const anosExtra = Math.max(0, anoNum - baseAno);
    const multiplier = Math.pow(1.1, anosExtra);
    
    const base2026 = espacoPrecos[0];
    if (diaSemana === "sabado") {
      return Math.round(base2026.sabado * multiplier);
    }
    return Math.round(base2026.domingo * multiplier);
  }
  
  return diaSemana === "sabado" ? espacoAno.sabado : espacoAno.domingo;
}

/**
 * Obtém a decoração base (sem espaço) para um pacote
 */
function getDecoracaoBase(pacoteBase: "harmonia" | "jardim", diaSemana: string): DecoracaoPreco {
  if (pacoteBase === "harmonia") {
    return diaSemana === "sabado" ? decoracaoHarmonia.sabado : decoracaoHarmonia.domingo;
  }
  return diaSemana === "sabado" ? decoracaoJardim.sabado : decoracaoJardim.domingo;
}

/**
 * Determina o pacote base a partir do pacote selecionado
 */
function getPacoteBase(pacote: string): "harmonia" | "jardim" {
  if (pacote === "harmonia" || pacote === "essencia") {
    return "harmonia";
  }
  return "jardim"; // jardim ou florescer
}

/**
 * Verifica se o pacote inclui buffet
 */
function pacoteIncluiBuffet(pacote: string): boolean {
  return pacote === "essencia" || pacote === "florescer";
}

/**
 * Calcula o preço detalhado com composição completa
 */
export function calcularPrecoDetalhado(
  pacote: string,
  diaSemana: string,
  nConvidados: number,
  menuBuffet: string | null,
  ano: string
): ComposicaoPreco | null {
  if (!pacote || !diaSemana || nConvidados <= 0) {
    return null;
  }

  // Normalizar diaSemana para sabado ou domingo
  const diaNormalizado = diaSemana === "domingo" ? "domingo" : "sabado";

  // Verificar se pacote com buffet tem menu selecionado
  if (pacoteIncluiBuffet(pacote) && !menuBuffet) {
    return null;
  }

  const pacoteBase = getPacoteBase(pacote);
  
  // Espaço
  const espaco = getEspacoPreco(ano, diaNormalizado);
  
  // Decoração
  const decoracaoConfig = getDecoracaoBase(pacoteBase, diaNormalizado);
  const decoracao = decoracaoConfig.baseFixo + (decoracaoConfig.porConvidado * nConvidados);
  
  // Buffet (se aplicável)
  let buffet: number | null = null;
  let formulaBuffet: string | null = null;
  let custoBuffetPorConvidado = 0;
  
  if (pacoteIncluiBuffet(pacote) && menuBuffet) {
    const buffetConfig = buffetPrecos[menuBuffet];
    if (buffetConfig) {
      buffet = buffetConfig.baseFixo + (buffetConfig.porConvidado * nConvidados);
      formulaBuffet = `${buffetConfig.baseFixo} + ${buffetConfig.porConvidado} × ${nConvidados} = ${buffet}`;
      custoBuffetPorConvidado = buffetConfig.porConvidado;
    }
  }
  
  // Total
  const total = espaco + decoracao + (buffet || 0);
  
  // Custo por convidado adicional
  const custoConvidadoAdicional = decoracaoConfig.porConvidado + custoBuffetPorConvidado;

  return {
    espaco,
    decoracao,
    buffet,
    total,
    custoConvidadoAdicional,
    detalhes: {
      pacoteNome: pacoteNomes[pacote] || pacote,
      buffetNome: menuBuffet ? buffetNomes[menuBuffet] || menuBuffet : null,
      ano,
      diaSemana: diaSemanaLabel[diaNormalizado] || diaNormalizado,
      nConvidados,
      formulaEspaco: `Espaço ${ano} (${diaSemanaLabel[diaNormalizado]}) = ${espaco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      formulaDecoracao: `${decoracaoConfig.baseFixo} + ${decoracaoConfig.porConvidado} × ${nConvidados} = ${decoracao}`,
      formulaBuffet,
    },
  };
}

/**
 * Função simplificada para calcular apenas o total (compatibilidade)
 */
export function calcularPrecoTotal(
  pacote: string,
  diaSemana: string,
  nConvidados: number,
  menuBuffet: string | null,
  ano: string = "2026"
): number {
  const composicao = calcularPrecoDetalhado(pacote, diaSemana, nConvidados, menuBuffet, ano);
  return composicao?.total || 0;
}

/**
 * Obtém o dia da semana a partir de uma data
 */
export function getDiaSemana(dateString: string): string | null {
  if (!dateString) return null;
  const date = new Date(dateString + "T12:00:00");
  const day = date.getDay();
  if (day === 6) return "sabado";
  if (day === 0) return "domingo";
  return null;
}

/**
 * Obtém o ano a partir de uma data
 */
export function getAnoFromDate(dateString: string): string {
  if (!dateString) return new Date().getFullYear().toString();
  return new Date(dateString + "T12:00:00").getFullYear().toString();
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

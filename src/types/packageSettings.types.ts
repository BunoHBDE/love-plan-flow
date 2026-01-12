/**
 * TYPES: Package Settings
 * Tipos para configurações de pacotes com cálculo em tempo real
 * e descontos separados para valores fixos e variáveis
 */

/**
 * Itens inclusos no pacote (apenas IDs - referências)
 */
export interface ItensPacote {
  espacos: string[];
  buffets: string[];
  servicos: string[];
}

/**
 * Dados de um pacote
 */
export interface PackageData {
  id?: string;
  ano: string;
  nome: string;
  descricao?: string;
  itens_pacote: ItensPacote;
  desconto_percentual: number;          // Desconto para valores fixos
  desconto_percentual_variavel: number; // Desconto para valores variáveis
}

/**
 * Detalhes de preço de um item individual
 */
export interface ItemPriceDetail {
  id: string;
  nome: string;
  tipo: 'fixo' | 'variavel';
  
  // Preço Fixo
  valor_fixo?: number;
  
  // Preço Variável
  valor_inicial?: number;
  valor_por_unidade?: number;
  unidade?: string;
}

/**
 * Resultado do cálculo de preços do pacote
 */
export interface PackagePriceCalculation {
  // Itens detalhados
  espacos: ItemPriceDetail[];
  buffets: ItemPriceDetail[];
  servicos: ItemPriceDetail[];
  
  // Valores Fixos
  subtotal_fixo: number;
  desconto_fixo_valor: number;
  desconto_fixo_percentual: number;
  total_fixo: number;
  
  // Valores Variáveis
  subtotal_variavel: number;
  desconto_variavel_valor: number;
  desconto_variavel_percentual: number;
  total_variavel: number;
  
  // Total Geral
  total_geral: number;
  tem_variaveis: boolean;
}

/**
 * Dados para criar pacote
 */
export interface CreatePackageData {
  ano: string;
  nome: string;
  descricao?: string;
  itens_pacote: ItensPacote;
  desconto_percentual: number;
  desconto_percentual_variavel: number;
}

/**
 * Dados para atualizar pacote
 */
export interface UpdatePackageData {
  id: string;
  ano?: string;
  nome?: string;
  descricao?: string;
  itens_pacote?: ItensPacote;
  desconto_percentual?: number;
  desconto_percentual_variavel?: number;
}
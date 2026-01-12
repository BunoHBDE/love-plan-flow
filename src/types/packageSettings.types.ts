/**
 * TYPES: Package Settings
 * Tipos para configurações de pacotes com cálculo em tempo real
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
  desconto_percentual: number;
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
  espacos: ItemPriceDetail[];
  buffets: ItemPriceDetail[];
  servicos: ItemPriceDetail[];
  subtotal: number;
  desconto_valor: number;
  desconto_percentual: number;
  total: number;
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
}
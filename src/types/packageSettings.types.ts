/**
 * TYPES: Package Settings
 * Tipos para configurações de pacotes
 */

/**
 * Itens inclusos no pacote
 */
export interface ItensPacote {
  espacos: string[];   // IDs dos espaços
  buffets: string[];   // IDs dos buffets
  servicos: string[];  // IDs dos serviços
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
  preco_base: number;
  desconto_percentual: number;
  preco_final: number;
}

/**
 * Registro do banco (com campos adicionais)
 */
export interface PackageRecord {
  id: string;
  user_id: string;
  ano: string;
  nome: string;
  descricao: string | null;
  itens_pacote: ItensPacote;
  preco_base: number;
  desconto_percentual: number;
  preco_final: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Dados para criar pacote
 */
export interface CreatePackageData {
  ano: string;
  nome: string;
  descricao?: string;
  itens_pacote: ItensPacote;
  preco_base: number;
  desconto_percentual: number;
  preco_final: number;
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
  preco_base?: number;
  desconto_percentual?: number;
  preco_final?: number;
}
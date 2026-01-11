/**
 * TYPES: Buffet Settings
 * Tipos para configurações de buffet
 */

/**
 * Preço por pessoa (fixo ou variável)
 */
export interface PrecoPessoa {
  tipo: 'fixo' | 'variavel';
  
  // Preço Fixo
  preco_fixo?: number;  // Ex: 89.00 (R$ 89,00 por pessoa)
  
  // Preço Variável
  valor_inicial?: number;         // Ex: 0 (opcional)
  valor_por_pessoa?: number;      // Ex: 75.00 (obrigatório)
}

/**
 * Dados de um buffet
 */
export interface BuffetData {
  id?: string;
  ano: string;
  nome: string;
  precos_por_pessoa: PrecoPessoa[];
  itens_inclusos: string[];
}

/**
 * Registro do banco (com campos adicionais)
 */
export interface BuffetRecord {
  id: string;
  user_id: string;
  ano: string;
  nome: string;
  precos_por_pessoa: PrecoPessoa[];
  itens_inclusos: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Dados para criar buffet
 */
export interface CreateBuffetData {
  ano: string;
  nome: string;
  precos_por_pessoa: PrecoPessoa[];
  itens_inclusos: string[];
}

/**
 * Dados para atualizar buffet
 */
export interface UpdateBuffetData {
  id: string;
  ano?: string;
  nome?: string;
  precos_por_pessoa?: PrecoPessoa[];
  itens_inclusos?: string[];
}
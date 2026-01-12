/**
 * TYPES: Service Settings
 * Tipos para configurações de serviços extras
 */

/**
 * Preço de serviço (fixo ou variável)
 */
export interface PrecoServico {
  tipo: 'fixo' | 'variavel';
  
  // Preço Fixo
  preco_fixo?: number;  // Ex: 500.00 (R$ 500,00)
  
  // Preço Variável
  valor_inicial?: number;         // Ex: 0 (opcional)
  valor_por_unidade?: number;     // Ex: 50.00 (por hora, por pessoa, etc)
  unidade?: string;               // Ex: "hora", "pessoa", "item"
}

/**
 * Dados de um serviço
 */
export interface ServiceData {
  id?: string;
  ano: string;
  nome: string;
  precos: PrecoServico[];
  descricao?: string;
}

/**
 * Registro do banco (com campos adicionais)
 */
export interface ServiceRecord {
  id: string;
  user_id: string;
  ano: string;
  nome: string;
  precos: PrecoServico[];
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Dados para criar serviço
 */
export interface CreateServiceData {
  ano: string;
  nome: string;
  precos: PrecoServico[];
  descricao?: string;
}

/**
 * Dados para atualizar serviço
 */
export interface UpdateServiceData {
  id: string;
  ano?: string;
  nome?: string;
  precos?: PrecoServico[];
  descricao?: string;
}
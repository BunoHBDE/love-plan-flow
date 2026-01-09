/**
 * TYPES: Space Settings
 * Tipos para configuração de preços de espaço
 */

// Tipo de preço por dia
export interface PrecoDia {
  dias: string[];
  tipo: 'fixo' | 'variavel';
  preco_fixo?: number;
  valor_inicial?: number;
  valor_por_convidado?: number;
}

// Dados do espaço (frontend)
export interface SpaceData {
  id?: string;
  ano: string;
  nome: string;
  precos_por_dia: PrecoDia[];
  itens_inclusos: string[];
}

// Registro do banco de dados
export interface SpacePriceRecord {
  id: string;
  user_id: string;
  ano: string;
  nome: string;
  precos_por_dia: PrecoDia[];
  itens_inclusos: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Dados para criar/atualizar
export interface CreateSpaceData {
  ano: string;
  nome: string;
  precos_por_dia: PrecoDia[];
  itens_inclusos: string[];
}

export interface UpdateSpaceData extends Partial<CreateSpaceData> {
  id: string;
}
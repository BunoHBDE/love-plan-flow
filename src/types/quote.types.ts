/**
 * TYPES: Quote (Orçamento) com novas configurações
 * Estrutura atualizada para usar espaços, buffets, serviços e pacotes configuráveis
 */

import type { ExtraItem } from "@/components/quotes/ExtrasForm";

/**
 * Item selecionado no orçamento (espaço, buffet ou serviço)
 */
export interface QuoteItem {
  id: string;
  nome: string;
  tipo: 'espaco' | 'buffet' | 'servico';
  
  // Dados de precificação
  tipo_preco: 'fixo' | 'variavel';
  
  // Preço Fixo
  valor_fixo?: number;
  
  // Preço Variável
  valor_inicial?: number;
  valor_por_unidade?: number;
  unidade?: string;
  
  // Valor calculado
  valor_total: number;
}

/**
 * Dados do pacote aplicado (se houver)
 */
export interface QuotePackageData {
  id: string;
  nome: string;
  desconto_percentual_fixo: number;
  desconto_percentual_variavel: number;
}

/**
 * Composição de preço do orçamento
 */
export interface QuoteComposicao {
  // Itens individuais
  itens: QuoteItem[];
  
  // Valores Fixos
  subtotal_fixo: number;
  desconto_fixo: number;
  total_fixo: number;
  
  // Valores Variáveis
  subtotal_variavel: number;
  desconto_variavel: number;
  total_variavel: number;
  
  // Extras
  total_extras: number;
  
  // Total Geral
  total_geral: number;
}

/**
 * Estrutura de dados para salvar no banco
 */
export interface QuoteInsertData {
  client_id: string;
  
  // Dados do evento
  canal_entrada?: string | null;
  tipo_evento?: string | null;
  data_status: 'com_data' | 'sem_data';
  data_evento?: string | null;
  dia_semana?: string | null;
  ano_evento?: string | null;
  n_convidados: number;
  
  // Seleções (IDs das configurações)
  espaco_id?: string | null;
  buffet_id?: string | null;
  servico_ids?: string[] | null; // Array de IDs de serviços
  pacote_id?: string | null;
  
  // Composição de preço (JSON)
  composicao_preco: QuoteComposicao;
  
  // Extras
  extras_json?: ExtraItem[];
  
  // Valores totais
  valor_total: number;
  
  // Pagamento
  percentual_sinal: number;
  valor_sinal: number;
  numero_parcelas: number;
  dia_vencimento: number;
  parcelas_json: any[];
  
  // Observações
  observacoes_internas?: string | null;
  observacoes_cliente?: string | null;
  
  // Validade
  validade?: string | null;
  
  // Status
  status: 'rascunho' | 'enviado';
}

/**
 * Estrutura de seleção do orçamento (estado do formulário)
 */
export interface QuoteSelection {
  // Espaço
  espacoId: string | null;
  
  // Buffet (opcional)
  buffetId: string | null;
  
  // Serviços (múltiplos, opcionais)
  servicoIds: string[];
  
  // Pacote (opcional)
  pacoteId: string | null;
}
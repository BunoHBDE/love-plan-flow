/**
 * TYPES: Payment Settings
 * Tipos para configurações globais de pagamento
 */

/**
 * Configurações globais de pagamento do usuário
 */
export interface PaymentSettingsData {
  id?: string;
  user_id?: string;
  
  // Sinal
  percentual_minimo_sinal: number; // Ex: 10 (10%)
  
  // Vencimento
  dias_vencimento_opcoes: number[]; // Ex: [5, 10, 15, 20, 25]
  dia_vencimento_padrao: number; // Ex: 10
  
  // Parcelamento
  tipo_parcelamento: 'ate_evento' | 'apos_evento' | 'fixo';
  
  // Se tipo = 'ate_evento': permite parcelas até a data do evento
  // (não precisa de campo adicional)
  
  // Se tipo = 'apos_evento': permite parcelas X meses após o evento
  meses_apos_evento?: number; // Ex: 6 (6 meses após o evento)
  
  // Se tipo = 'fixo': número fixo de parcelas independente do evento
  numero_parcelas_fixo?: number; // Ex: 18
  
  // Regra fixa
  dias_ultima_parcela_antes_evento: number; // Ex: 30 (última parcela 30 dias antes)
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

/**
 * Dados para criar/atualizar configurações
 */
export interface PaymentSettingsUpdate {
  percentual_minimo_sinal?: number;
  dias_vencimento_opcoes?: number[];
  dia_vencimento_padrao?: number;
  tipo_parcelamento?: 'ate_evento' | 'apos_evento' | 'fixo';
  meses_apos_evento?: number;
  numero_parcelas_fixo?: number;
  dias_ultima_parcela_antes_evento?: number;
}
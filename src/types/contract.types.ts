/**
 * TYPES: Contratos
 */

export type ContractStatus = 'pendente' | 'assinado' | 'em_execucao' | 'concluido' | 'cancelado';

export interface ContractStatusInfo {
  label: string;
  color: string;
  icon: string;
}

export const CONTRACT_STATUS: Record<ContractStatus, ContractStatusInfo> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: 'Clock' },
  assinado: { label: 'Assinado', color: 'bg-blue-100 text-blue-800', icon: 'FileSignature' },
  em_execucao: { label: 'Em Execução', color: 'bg-purple-100 text-purple-800', icon: 'Play' },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: 'CheckCircle' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: 'XCircle' },
};

export interface DadosCliente {
  nome: string;
  cpf?: string;
  telefone: string;
  email?: string;
  endereco?: string;
}

export interface DadosEvento {
  data_evento?: string;
  dia_semana?: string;
  ano_evento?: string;
  tipo_evento?: string;
  n_convidados: number;
  espaco_nome?: string;
  buffet_nome?: string;
  servicos?: string[];
  pacote_nome?: string;
  extras?: Array<{ descricao: string; valor: number }>;
}

export interface DadosPagamento {
  valor_total: number;
  percentual_sinal: number;
  valor_sinal: number;
  numero_parcelas: number;
  dia_vencimento: number;
  parcelas: Array<{ numero: number; valor: number; vencimento: string }>;
}

export interface DadosEmpresa {
  nome?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  quote_id?: string;
  client_id: string;
  created_by: string;
  status: ContractStatus;
  data_assinatura?: string;
  assinado_por?: string;
  data_evento?: string;
  data_conclusao?: string;
  dados_cliente: DadosCliente;
  dados_evento: DadosEvento;
  dados_pagamento: DadosPagamento;
  dados_empresa: DadosEmpresa;
  modelo_contrato?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  user_id: string;
  nome: string;
  conteudo: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractInsertData {
  quote_id?: string;
  client_id: string;
  created_by: string;
  status?: ContractStatus;
  data_evento?: string;
  dados_cliente: DadosCliente;
  dados_evento: DadosEvento;
  dados_pagamento: DadosPagamento;
  dados_empresa: DadosEmpresa;
  modelo_contrato?: string;
}

export interface ContractTemplateInsertData {
  user_id: string;
  nome: string;
  conteudo: string;
  is_default?: boolean;
}

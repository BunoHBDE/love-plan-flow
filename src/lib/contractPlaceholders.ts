/**
 * Sistema de Placeholders para Contratos
 */

import type { DadosCliente, DadosEvento, DadosPagamento, DadosEmpresa } from '@/types/contract.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PlaceholderCategory {
  label: string;
  placeholders: PlaceholderItem[];
}

export interface PlaceholderItem {
  key: string;
  label: string;
  example: string;
}

export const PLACEHOLDER_CATEGORIES: PlaceholderCategory[] = [
  {
    label: 'Cliente',
    placeholders: [
      { key: '{{cliente_nome}}', label: 'Nome do Cliente', example: 'João da Silva' },
      { key: '{{cliente_cpf}}', label: 'CPF', example: '123.456.789-00' },
      { key: '{{cliente_telefone}}', label: 'Telefone', example: '(11) 99999-9999' },
      { key: '{{cliente_email}}', label: 'Email', example: 'joao@email.com' },
      { key: '{{cliente_endereco}}', label: 'Endereço Completo', example: 'Rua das Flores, 123 - Centro' },
    ],
  },
  {
    label: 'Evento',
    placeholders: [
      { key: '{{evento_data}}', label: 'Data do Evento', example: '15 de março de 2025' },
      { key: '{{evento_dia_semana}}', label: 'Dia da Semana', example: 'Sábado' },
      { key: '{{evento_tipo}}', label: 'Tipo de Evento', example: 'Casamento' },
      { key: '{{evento_convidados}}', label: 'Número de Convidados', example: '150' },
      { key: '{{evento_espaco}}', label: 'Nome do Espaço', example: 'Salão Principal' },
      { key: '{{evento_buffet}}', label: 'Menu do Buffet', example: 'Buffet Premium' },
      { key: '{{evento_servicos}}', label: 'Serviços Contratados', example: 'DJ, Decoração, Fotografia' },
      { key: '{{evento_pacote}}', label: 'Nome do Pacote', example: 'Pacote Completo 2025' },
      { key: '{{evento_extras}}', label: 'Lista de Extras', example: 'Hora extra, Espumante' },
    ],
  },
  {
    label: 'Valores',
    placeholders: [
      { key: '{{valor_total}}', label: 'Valor Total', example: 'R$ 25.000,00' },
      { key: '{{valor_sinal}}', label: 'Valor do Sinal', example: 'R$ 2.500,00' },
      { key: '{{percentual_sinal}}', label: 'Percentual do Sinal', example: '10%' },
      { key: '{{numero_parcelas}}', label: 'Número de Parcelas', example: '12' },
      { key: '{{tabela_parcelas}}', label: 'Tabela de Parcelas', example: '[Tabela formatada]' },
    ],
  },
  {
    label: 'Empresa',
    placeholders: [
      { key: '{{empresa_nome}}', label: 'Nome da Empresa', example: 'Espaço Eventos LTDA' },
      { key: '{{empresa_cnpj}}', label: 'CNPJ', example: '12.345.678/0001-90' },
      { key: '{{empresa_telefone}}', label: 'Telefone Comercial', example: '(11) 3333-4444' },
      { key: '{{empresa_email}}', label: 'Email Comercial', example: 'contato@empresa.com' },
      { key: '{{empresa_endereco}}', label: 'Endereço da Empresa', example: 'Av. Principal, 1000' },
    ],
  },
  {
    label: 'Contrato',
    placeholders: [
      { key: '{{contrato_numero}}', label: 'Número do Contrato', example: 'C-AB12-001' },
      { key: '{{contrato_data}}', label: 'Data de Geração', example: '01 de janeiro de 2025' },
      { key: '{{data_atual}}', label: 'Data Atual', example: '15 de janeiro de 2025' },
    ],
  },
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Data não definida';
  try {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateString;
  }
};

export const replacePlaceholders = (
  template: string,
  contractNumber: string,
  dadosCliente: DadosCliente,
  dadosEvento: DadosEvento,
  dadosPagamento: DadosPagamento,
  dadosEmpresa: DadosEmpresa
): string => {
  let result = template;

  // Cliente
  result = result.replace(/{{cliente_nome}}/g, dadosCliente.nome || '');
  result = result.replace(/{{cliente_cpf}}/g, dadosCliente.cpf || 'Não informado');
  result = result.replace(/{{cliente_telefone}}/g, dadosCliente.telefone || '');
  result = result.replace(/{{cliente_email}}/g, dadosCliente.email || 'Não informado');
  result = result.replace(/{{cliente_endereco}}/g, dadosCliente.endereco || 'Não informado');

  // Evento
  result = result.replace(/{{evento_data}}/g, formatDate(dadosEvento.data_evento));
  result = result.replace(/{{evento_dia_semana}}/g, dadosEvento.dia_semana || '');
  result = result.replace(/{{evento_tipo}}/g, dadosEvento.tipo_evento || 'Evento');
  result = result.replace(/{{evento_convidados}}/g, String(dadosEvento.n_convidados || 0));
  result = result.replace(/{{evento_espaco}}/g, dadosEvento.espaco_nome || 'Não selecionado');
  result = result.replace(/{{evento_buffet}}/g, dadosEvento.buffet_nome || 'Não selecionado');
  result = result.replace(/{{evento_servicos}}/g, dadosEvento.servicos?.join(', ') || 'Nenhum');
  result = result.replace(/{{evento_pacote}}/g, dadosEvento.pacote_nome || 'Sem pacote');
  
  const extrasText = dadosEvento.extras?.map(e => `${e.descricao}: ${formatCurrency(e.valor)}`).join('\n') || 'Nenhum';
  result = result.replace(/{{evento_extras}}/g, extrasText);

  // Valores
  result = result.replace(/{{valor_total}}/g, formatCurrency(dadosPagamento.valor_total));
  result = result.replace(/{{valor_sinal}}/g, formatCurrency(dadosPagamento.valor_sinal));
  result = result.replace(/{{percentual_sinal}}/g, `${dadosPagamento.percentual_sinal}%`);
  result = result.replace(/{{numero_parcelas}}/g, String(dadosPagamento.numero_parcelas));
  
  const parcelasText = dadosPagamento.parcelas
    ?.map(p => `Parcela ${p.numero}: ${formatCurrency(p.valor)} - Venc.: ${formatDate(p.vencimento)}`)
    .join('\n') || 'Nenhuma parcela';
  result = result.replace(/{{tabela_parcelas}}/g, parcelasText);

  // Empresa
  result = result.replace(/{{empresa_nome}}/g, dadosEmpresa.nome || 'Empresa não configurada');
  result = result.replace(/{{empresa_cnpj}}/g, dadosEmpresa.cnpj || 'CNPJ não informado');
  result = result.replace(/{{empresa_telefone}}/g, dadosEmpresa.telefone || '');
  result = result.replace(/{{empresa_email}}/g, dadosEmpresa.email || '');
  result = result.replace(/{{empresa_endereco}}/g, dadosEmpresa.endereco || '');

  // Contrato
  result = result.replace(/{{contrato_numero}}/g, contractNumber);
  result = result.replace(/{{contrato_data}}/g, formatDate(new Date().toISOString()));
  result = result.replace(/{{data_atual}}/g, formatDate(new Date().toISOString()));

  return result;
};

export const DEFAULT_CONTRACT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATO Nº {{contrato_numero}}

CONTRATADA:
{{empresa_nome}}
CNPJ: {{empresa_cnpj}}
Endereço: {{empresa_endereco}}
Telefone: {{empresa_telefone}}
Email: {{empresa_email}}

CONTRATANTE:
{{cliente_nome}}
CPF: {{cliente_cpf}}
Telefone: {{cliente_telefone}}
Email: {{cliente_email}}
Endereço: {{cliente_endereco}}

1. OBJETO DO CONTRATO

A CONTRATADA compromete-se a ceder o espaço e prestar os serviços para realização de {{evento_tipo}} do(a) CONTRATANTE, conforme especificações abaixo:

Data do Evento: {{evento_data}} ({{evento_dia_semana}})
Número de Convidados: {{evento_convidados}} pessoas
Espaço: {{evento_espaco}}
Buffet: {{evento_buffet}}
Serviços: {{evento_servicos}}
Pacote: {{evento_pacote}}

2. ITENS EXTRAS

{{evento_extras}}

3. VALOR E FORMA DE PAGAMENTO

Valor Total: {{valor_total}}
Sinal: {{valor_sinal}} ({{percentual_sinal}})
Número de Parcelas: {{numero_parcelas}}

PARCELAS:
{{tabela_parcelas}}

4. DISPOSIÇÕES GERAIS

4.1. O presente contrato é firmado em caráter irrevogável e irretratável.
4.2. Qualquer alteração deverá ser feita por escrito e assinada por ambas as partes.
4.3. Fica eleito o foro da comarca da sede da CONTRATADA para dirimir quaisquer questões.

{{data_atual}}

_______________________________
{{empresa_nome}}
CONTRATADA

_______________________________
{{cliente_nome}}
CONTRATANTE`;

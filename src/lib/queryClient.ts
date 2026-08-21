// src/lib/queryClient.ts
// ==========================================
// CONFIGURAÇÃO DO REACT QUERY
// ==========================================
//
// Este arquivo centraliza a configuração do React Query,
// incluindo o QueryClient e utilitários para gerenciamento de cache.
//

import { QueryClient } from "@tanstack/react-query";

// ==========================================
// QUERY CLIENT
// ==========================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo que os dados são considerados "frescos" (não refetch automático)
      staleTime: 1000 * 60 * 5, // 5 minutos
      
      // Tempo que dados ficam no cache após não serem mais usados
      gcTime: 1000 * 60 * 30, // 30 minutos (antigo cacheTime)
      
      // Não refetch ao focar a janela (pode ser irritante)
      refetchOnWindowFocus: false,
      
      // Retry em caso de erro
      retry: 1,
    },
    mutations: {
      // Retry em mutations é geralmente indesejado
      retry: 0,
    },
  },
});

// ==========================================
// QUERY KEYS
// ==========================================
/**
 * Chaves padronizadas para queries.
 * Usar chaves consistentes permite invalidação precisa do cache.
 * 
 * Convenção:
 * - Arrays para permitir invalidação em cascata
 * - Funções para chaves dinâmicas (com IDs)
 */
export const QUERY_KEYS = {
  // ==========================================
  // CLIENTES
  // ==========================================
  CLIENTS: ['clients'] as const,
  CLIENT_BY_ID: (id: string) => ['clients', id] as const,
  
  // ==========================================
  // ORÇAMENTOS
  // ==========================================
  QUOTES: ['quotes'] as const,
  QUOTE_BY_ID: (id: string) => ['quotes', id] as const,
  QUOTE_BY_NUMBER: (number: string) => ['quotes', 'number', number] as const,
  QUOTES_BY_CLIENT: (clientId: string) => ['quotes', 'client', clientId] as const,
  
  // ==========================================
  // VISITAS
  // ==========================================
  VISITS: ['visits'] as const,
  VISIT_BY_ID: (id: string) => ['visits', id] as const,
  VISITS_BY_CLIENT: (clientId: string) => ['visits', 'client', clientId] as const,
  UPCOMING_VISITS: ['visits', 'upcoming'] as const,
  
  // ==========================================
  // CONFIGURAÇÕES DE VISITAS (NOVO!)
  // ==========================================
  VISIT_SETTINGS: ['visit_settings'] as const,
  
  // ==========================================
  // DATAS BLOQUEADAS
  // ==========================================
  BLOCKED_DATES: ['blocked_dates'] as const,

  // ==========================================
  // DATAS DISPONÍVEIS (dias de semana habilitados manualmente)
  // ==========================================
  AVAILABLE_DATES: ['available_dates'] as const,

  // ==========================================
  // CRM DE ATENDIMENTO
  // ==========================================
  CRM_CONFIG: ['crm', 'config'] as const,
  CRM_LEADS: ['crm', 'leads'] as const,
  IA_REVISAO: ['crm', 'ia-revisao'] as const,
} as const;

// ==========================================
// UTILITÁRIOS DE INVALIDAÇÃO
// ==========================================
/**
 * Funções helper para invalidar cache de forma consistente.
 * 
 * Uso:
 * invalidateQueries.clients() - invalida todos os clientes
 * invalidateQueries.visitSettings() - invalida configurações de visitas
 */
export const invalidateQueries = {
  // Clientes
  clients: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS }),
  client: (id: string) => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENT_BY_ID(id) }),
  
  // Orçamentos
  quotes: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTES }),
  quote: (id: string) => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTE_BY_ID(id) }),
  quotesByClient: (clientId: string) => queryClient.invalidateQueries({ 
    queryKey: QUERY_KEYS.QUOTES_BY_CLIENT(clientId) 
  }),
  
  // Visitas
  visits: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITS }),
  visit: (id: string) => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISIT_BY_ID(id) }),
  visitsByClient: (clientId: string) => queryClient.invalidateQueries({ 
    queryKey: QUERY_KEYS.VISITS_BY_CLIENT(clientId) 
  }),
  
  // Configurações de Visitas (NOVO!)
  visitSettings: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISIT_SETTINGS }),
  
  // Datas Bloqueadas
  blockedDates: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOCKED_DATES }),

  // Datas Disponíveis
  availableDates: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AVAILABLE_DATES }),

  // CRM
  crmConfig: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CRM_CONFIG }),
  crmLeads: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CRM_LEADS }),
  iaRevisao: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IA_REVISAO }),

  // Invalida TUDO (use com cuidado!)
  all: () => queryClient.invalidateQueries(),
};

// ==========================================
// UTILITÁRIOS DE PREFETCH
// ==========================================
/**
 * Pré-carrega dados antes de serem necessários.
 * Útil para melhorar UX em navegações previsíveis.
 * 
 * Exemplo: Ao passar mouse em um link, já carrega os dados
 */
export const prefetchQueries = {
  client: async (id: string, fetcher: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENT_BY_ID(id),
      queryFn: fetcher,
    });
  },
  
  quote: async (id: string, fetcher: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.QUOTE_BY_ID(id),
      queryFn: fetcher,
    });
  },
};

// ==========================================
// UTILITÁRIOS DE CACHE DIRETO
// ==========================================
/**
 * Funções para manipular o cache diretamente.
 * Útil para atualizações otimistas.
 */
export const cacheUtils = {
  // Obtém dados do cache sem fazer fetch
  getVisitSettings: () => queryClient.getQueryData(QUERY_KEYS.VISIT_SETTINGS),
  
  // Define dados diretamente no cache
  setVisitSettings: (data: any) => queryClient.setQueryData(QUERY_KEYS.VISIT_SETTINGS, data),
  
  // Remove dados do cache
  removeVisitSettings: () => queryClient.removeQueries({ queryKey: QUERY_KEYS.VISIT_SETTINGS }),
};
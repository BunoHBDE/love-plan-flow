import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { QUERY_KEYS, invalidateQueries } from "@/lib/queryClient";
import type { Database } from "@/integrations/supabase/types";

// ==========================================
// TYPES
// ==========================================

type QuoteRow = Database['public']['Tables']['quotes']['Row'];
type QuoteInsertDB = Database['public']['Tables']['quotes']['Insert'];
type QuoteUpdateDB = Database['public']['Tables']['quotes']['Update'];

// Interface customizada que combina os dados do banco com client join
export interface Quote extends Omit<QuoteRow, 'espaco_id' | 'buffet_id' | 'servico_ids' | 'pacote_id' | 'servico_quantidades' | 'composicao_preco' | 'desconto_descricao' | 'desconto_percentual' | 'desconto_valor'> {
  client?: any;
  
  // ✅ Campos que podem ser nulos ou não existir
  espaco_id?: string | null;
  buffet_id?: string | null;
  servico_ids?: string[] | null;
  pacote_id?: string | null;
  servico_quantidades?: any;
  composicao_preco?: any;
  desconto_descricao?: string | null;
  desconto_percentual?: number | null;
  desconto_valor?: number | null;
}

// Interface customizada para facilitar o uso
export interface QuoteInsert {
  quote_number?: string;
  client_id: string;
  tipo_evento?: string | null;
  data_status?: string;
  data_evento?: string | null;
  dia_semana?: string | null;
  ano_evento?: string | null;
  n_convidados: number;
  
  // Novas referências às configurações
  espaco_id?: string | null;
  buffet_id?: string | null;
  servico_ids?: string[] | null;
  pacote_id?: string | null;
  
  // Quantidades customizadas de serviços (JSON)
  servico_quantidades?: any;
  
  // Composição de preço (JSON)
  composicao_preco?: any;
  
  // Valores (mantidos para compatibilidade)
  pacote: string;
  menu_buffet?: string | null;
  valor_total: number;
  
  // Desconto
  desconto_descricao?: string | null;
  desconto_percentual?: number;
  desconto_valor?: number;
  
  validade?: string | null;
  status?: string;
  observacoes_internas?: string | null;
  observacoes_cliente?: string | null;
  percentual_sinal?: number;
  valor_sinal?: number;
  numero_parcelas?: number;
  dia_vencimento?: number;
  parcelas_json?: any; // ✅ Aceita qualquer tipo
  extras_json?: any;   // ✅ Aceita qualquer tipo
  canal_entrada?: string | null;
}

// ==========================================
// SUPABASE FUNCTIONS
// ==========================================

const fetchQuotesFromDB = async (): Promise<Quote[]> => {
  const { data, error } = await supabase
    .from("quotes")
    .select(`
      *,
      client:clients(*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const createQuote = async (quoteData: QuoteInsert): Promise<Quote> => {
  // 🔥 IMPORTANTE: Pega o usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Você precisa estar logado para criar orçamentos');
  }
  
  // Converte para o tipo do Supabase, fazendo cast de parcelas_json e extras_json
  const dataToInsert: any = {
    ...quoteData,
    created_by: user.id, // 🔥 Adiciona created_by
    parcelas_json: quoteData.parcelas_json ? JSON.parse(JSON.stringify(quoteData.parcelas_json)) : null,
    extras_json: quoteData.extras_json ? JSON.parse(JSON.stringify(quoteData.extras_json)) : null,
  };

  const { data, error } = await supabase
    .from("quotes")
    .insert(dataToInsert)
    .select(`
      *,
      client:clients(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

const updateQuote = async ({ 
  id, 
  updates 
}: { 
  id: string; 
  updates: Partial<QuoteInsert> 
}): Promise<Quote> => {
  // Converte para o tipo do Supabase
  const dataToUpdate: any = {
    ...updates,
    parcelas_json: updates.parcelas_json ? JSON.parse(JSON.stringify(updates.parcelas_json)) : undefined,
    extras_json: updates.extras_json ? JSON.parse(JSON.stringify(updates.extras_json)) : undefined,
  };

  const { data, error } = await supabase
    .from("quotes")
    .update(dataToUpdate)
    .eq("id", id)
    .select(`
      *,
      client:clients(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

const updateQuoteStatus = async ({ 
  id, 
  status 
}: { 
  id: string; 
  status: string 
}): Promise<Quote> => {
  const { data, error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", id)
    .select(`
      *,
      client:clients(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

const deleteQuote = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

const getQuoteById = async (id: string): Promise<Quote | null> => {
  const { data, error } = await supabase
    .from("quotes")
    .select(`
      *,
      client:clients(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const getQuoteByNumber = async (quoteNumber: string): Promise<Quote | null> => {
  const { data, error } = await supabase
    .from("quotes")
    .select(`
      *,
      client:clients(*)
    `)
    .eq("quote_number", quoteNumber)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// ==========================================
// OPTIMIZED HOOK
// ==========================================

export function useQuotesOptimized() {
  const { toast } = useToast();

  // QUERY: Fetch all quotes
  const {
    data: quotes = [],
    isLoading: loading,
    error,
    refetch: fetchQuotes,
  } = useQuery({
    queryKey: QUERY_KEYS.QUOTES,
    queryFn: fetchQuotesFromDB,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // MUTATION: Create quote
  const createQuoteMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      invalidateQueries.quotes();
      toast({
        title: "Orçamento criado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar orçamento",
        description: getSafeErrorMessage(error as any, "createQuote"),
        variant: "destructive",
      });
    },
  });

  // MUTATION: Update quote
  const updateQuoteMutation = useMutation({
    mutationFn: updateQuote,
    onSuccess: () => {
      invalidateQueries.quotes();
      toast({
        title: "Orçamento atualizado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: getSafeErrorMessage(error as any, "updateQuote"),
        variant: "destructive",
      });
    },
  });

  // MUTATION: Update quote status
  const updateStatusMutation = useMutation({
    mutationFn: updateQuoteStatus,
    onSuccess: () => {
      invalidateQueries.quotes();
      toast({
        title: "Status atualizado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: getSafeErrorMessage(error as any, "updateQuoteStatus"),
        variant: "destructive",
      });
    },
  });

  // MUTATION: Delete quote
  const deleteQuoteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      invalidateQueries.quotes();
      toast({
        title: "Orçamento excluído!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir orçamento",
        description: getSafeErrorMessage(error as any, "deleteQuote"),
        variant: "destructive",
      });
    },
  });

  // Wrapper functions to match old API
  return {
    quotes,
    loading,
    error,
    fetchQuotes,
    
    createQuote: async (data: QuoteInsert): Promise<Quote | null> => {
      try {
        const result = await createQuoteMutation.mutateAsync(data);
        return result; // ✅ Retorna o orçamento criado!
      } catch {
        return null;
      }
    },
    
    updateQuote: async (id: string, updates: Partial<QuoteInsert>) => {
      try {
        await updateQuoteMutation.mutateAsync({ id, updates });
        return true;
      } catch {
        return false;
      }
    },
    
    updateQuoteStatus: async (id: string, status: string) => {
      try {
        await updateStatusMutation.mutateAsync({ id, status });
        return true;
      } catch {
        return false;
      }
    },
    
    deleteQuote: async (id: string) => {
      try {
        await deleteQuoteMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    
    getQuoteById,
    getQuoteByNumber,
  };
}
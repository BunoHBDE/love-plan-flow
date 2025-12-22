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

export interface Quote extends QuoteRow {
  client?: any;
}

export type QuoteInsert = Omit<QuoteInsertDB, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

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
  const { data, error } = await supabase
    .from("quotes")
    .insert(quoteData as QuoteInsertDB)
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
  const { data, error } = await supabase
    .from("quotes")
    .update(updates as QuoteUpdateDB)
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
    
    createQuote: async (data: QuoteInsert) => {
      try {
        await createQuoteMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
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
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { QUERY_KEYS, invalidateQueries } from "@/lib/queryClient";

// ==========================================
// TYPES
// ==========================================

export interface Visit {
  id: string;
  client_id: string | null;
  visit_date: string;
  visit_time: string;
  status: string;
  notes: string | null;
  guest_count: number | null;
  wedding_date_status: string;
  wedding_date: string | null;
  wedding_month: string | null;
  wedding_year: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    nome: string;
    email: string | null;
    telefone: string;
  } | null;
}

export interface VisitInsert {
  client_id?: string | null;
  visit_date: string;
  visit_time: string;
  status?: string;
  notes?: string | null;
  guest_count?: number | null;
  wedding_date_status?: string;
  wedding_date?: string | null;
  wedding_month?: string | null;
  wedding_year?: string | null;
}

// ==========================================
// VALIDATION SCHEMA
// ==========================================

const visitSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  visit_date: z.string().min(1, "Data da visita é obrigatória"),
  visit_time: z.string().min(1, "Horário é obrigatório"),
  status: z.string().optional(),
  notes: z.string().nullable().optional(),
  guest_count: z.number().min(1).nullable().optional(),
  wedding_date_status: z.string().optional(),
  wedding_date: z.string().nullable().optional(),
  wedding_month: z.string().nullable().optional(),
  wedding_year: z.string().nullable().optional(),
});

// ==========================================
// SUPABASE FUNCTIONS
// ==========================================

const fetchVisitsFromDB = async (): Promise<Visit[]> => {
  const { data, error } = await supabase
    .from("visits")
    .select(`
      *,
      client:clients(nome, email, telefone)
    `)
    .order("visit_date", { ascending: false });

  if (error) throw error;
  return data || [];
};

const createVisit = async (visitData: VisitInsert): Promise<Visit> => {
  const validationResult = visitSchema.safeParse(visitData);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validatedData = validationResult.data as VisitInsert;
  
  // 🔥 IMPORTANTE: Pega o usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Você precisa estar logado para criar visitas');
  }
  
  // Adiciona created_by automaticamente
  const dataWithUser = {
    ...validatedData,
    created_by: user.id,
  };
  
  const { data, error } = await supabase
    .from("visits")
    .insert(dataWithUser)
    .select(`
      *,
      client:clients(nome, email, telefone)
    `)
    .single();

  if (error) throw error;
  return data;
};

const updateVisit = async ({ 
  id, 
  updates 
}: { 
  id: string; 
  updates: Partial<VisitInsert> 
}): Promise<Visit> => {
  const partialSchema = visitSchema.partial();
  const validationResult = partialSchema.safeParse(updates);
  
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validatedData = validationResult.data as Partial<VisitInsert>;
  const { data, error } = await supabase
    .from("visits")
    .update(validatedData)
    .eq("id", id)
    .select(`
      *,
      client:clients(nome, email, telefone)
    `)
    .single();

  if (error) throw error;
  return data;
};

const updateVisitStatus = async ({ 
  id, 
  status 
}: { 
  id: string; 
  status: string 
}): Promise<Visit> => {
  const { data, error } = await supabase
    .from("visits")
    .update({ status })
    .eq("id", id)
    .select(`
      *,
      client:clients(nome, email, telefone)
    `)
    .single();

  if (error) throw error;
  return data;
};

const deleteVisit = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("visits")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// ==========================================
// OPTIMIZED HOOK
// ==========================================

export function useVisitsOptimized() {
  const { toast } = useToast();

  // QUERY: Fetch all visits
  const {
    data: visits = [],
    isLoading: loading,
    error,
    refetch: fetchVisits,
  } = useQuery({
    queryKey: QUERY_KEYS.VISITS,
    queryFn: fetchVisitsFromDB,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // MUTATION: Create visit
  const createVisitMutation = useMutation({
    mutationFn: createVisit,
    onSuccess: () => {
      invalidateQueries.visits();
      toast({
        title: "Visita agendada!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao agendar visita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // MUTATION: Update visit
  const updateVisitMutation = useMutation({
    mutationFn: updateVisit,
    onSuccess: () => {
      invalidateQueries.visits();
      toast({
        title: "Visita atualizada!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar visita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // MUTATION: Update visit status
  const updateStatusMutation = useMutation({
    mutationFn: updateVisitStatus,
    onSuccess: () => {
      invalidateQueries.visits();
      toast({
        title: "Status atualizado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // MUTATION: Delete visit
  const deleteVisitMutation = useMutation({
    mutationFn: deleteVisit,
    onSuccess: () => {
      invalidateQueries.visits();
      toast({
        title: "Visita excluída!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir visita",
        description: getSafeErrorMessage(error as any, "deleteVisit"),
        variant: "destructive",
      });
    },
  });

  // Wrapper functions to match old API
  return {
    visits,
    loading,
    error,
    fetchVisits,
    
    createVisit: async (data: VisitInsert): Promise<Visit | null> => {
      try {
        const result = await createVisitMutation.mutateAsync(data);
        return result; // ✅ Retorna a visita criada!
      } catch {
        return null;
      }
    },
    
    updateVisit: async (id: string, updates: Partial<VisitInsert>) => {
      try {
        await updateVisitMutation.mutateAsync({ id, updates });
        return true;
      } catch {
        return false;
      }
    },
    
    updateVisitStatus: async (id: string, status: string) => {
      try {
        await updateStatusMutation.mutateAsync({ id, status });
        return true;
      } catch {
        return false;
      }
    },
    
    deleteVisit: async (id: string) => {
      try {
        await deleteVisitMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
  };
}
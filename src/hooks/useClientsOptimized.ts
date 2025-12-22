import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { QUERY_KEYS, invalidateQueries } from "@/lib/queryClient";

// ==========================================
// TYPES
// ==========================================

export interface Client {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  cpf: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado_uf: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInsert {
  nome: string;
  email?: string | null;
  telefone: string;
  cpf?: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
}

// ==========================================
// VALIDATION SCHEMA
// ==========================================

const clientSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200).trim(),
  email: z.union([z.string().email("Email inválido"), z.literal(""), z.null()]).optional(),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.union([
    z.string().regex(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/, "CPF inválido"),
    z.literal(""),
    z.null(),
  ]).optional(),
  cep: z.union([z.string(), z.literal(""), z.null()]).optional(),
  rua: z.union([z.string(), z.literal(""), z.null()]).optional(),
  numero: z.union([z.string(), z.literal(""), z.null()]).optional(),
  complemento: z.union([z.string(), z.literal(""), z.null()]).optional(),
  bairro: z.union([z.string(), z.literal(""), z.null()]).optional(),
  cidade: z.union([z.string(), z.literal(""), z.null()]).optional(),
  estado_uf: z.union([z.string(), z.literal(""), z.null()]).optional(),
});

// ==========================================
// SUPABASE FUNCTIONS
// ==========================================

const fetchClientsFromDB = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const createClient = async (clientData: ClientInsert): Promise<Client> => {
  const validationResult = clientSchema.safeParse(clientData);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validatedData = validationResult.data as ClientInsert;
  
  // 🔥 IMPORTANTE: Pega o usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Você precisa estar logado para criar clientes');
  }
  
  // Adiciona created_by automaticamente
  const dataWithUser = {
    ...validatedData,
    created_by: user.id,
  };
  
  const { data, error } = await supabase
    .from("clients")
    .insert(dataWithUser)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateClient = async ({ 
  id, 
  updates 
}: { 
  id: string; 
  updates: Partial<ClientInsert> 
}): Promise<Client> => {
  const partialSchema = clientSchema.partial();
  const validationResult = partialSchema.safeParse(updates);
  
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validatedData = validationResult.data as Partial<ClientInsert>;
  
  // 🔥 Não precisa de created_by no update
  const { data, error } = await supabase
    .from("clients")
    .update(validatedData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteClient = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

const searchClients = async (term: string): Promise<Client[]> => {
  const sanitizedTerm = term.trim().substring(0, 100);
  
  if (!sanitizedTerm) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .or(`nome.ilike.%${sanitizedTerm}%,email.ilike.%${sanitizedTerm}%,telefone.ilike.%${sanitizedTerm}%`)
    .limit(10);

  if (error) throw error;
  return data || [];
};

// ==========================================
// OPTIMIZED HOOK
// ==========================================

export function useClientsOptimized() {
  const { toast } = useToast();

  // QUERY: Fetch all clients
  const {
    data: clients = [],
    isLoading: loading,
    error,
    refetch: fetchClients,
  } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: fetchClientsFromDB,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // MUTATION: Create client
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (data) => {
      invalidateQueries.clients();
      toast({
        title: "Cliente cadastrado!",
        description: `${data.nome} foi cadastrado com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // MUTATION: Update client
  const updateClientMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      invalidateQueries.clients();
      toast({
        title: "Cliente atualizado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // MUTATION: Delete client
  const deleteClientMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      invalidateQueries.clients();
      toast({
        title: "Cliente excluído!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir cliente",
        description: getSafeErrorMessage(error as any, "deleteClient"),
        variant: "destructive",
      });
    },
  });

  // Wrapper functions to match old API
  return {
    clients,
    loading,
    error,
    fetchClients,
    
    createClient: async (data: ClientInsert): Promise<Client | null> => {
      try {
        const result = await createClientMutation.mutateAsync(data);
        return result; // ✅ Retorna o cliente criado!
      } catch {
        return null;
      }
    },
    
    updateClient: async (id: string, updates: Partial<ClientInsert>) => {
      try {
        await updateClientMutation.mutateAsync({ id, updates });
        return true;
      } catch {
        return false;
      }
    },
    
    deleteClient: async (id: string) => {
      try {
        await deleteClientMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    
    searchClients,
  };
}
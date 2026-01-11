/**
 * HOOK: useBuffetSettings
 * Gerencia CRUD de configurações de buffet
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { 
  BuffetData, 
  CreateBuffetData, 
  UpdateBuffetData,
  PrecoPessoa
} from "@/types/buffetSettings.types";

const QUERY_KEY = ["buffetSettings"];

// ============================================================================
// API Functions
// ============================================================================

/**
 * Buscar todos os buffets do usuário
 */
async function fetchBuffets(): Promise<BuffetData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("quote_buffet_options")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("ano", { ascending: false })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar buffets:", error);
    throw error;
  }

  // Converter Json para tipos específicos
  return data.map((record) => ({
    id: record.id,
    ano: record.ano,
    nome: record.nome,
    precos_por_pessoa: record.precos_por_pessoa as unknown as PrecoPessoa[],
    itens_inclusos: record.itens_inclusos as unknown as string[],
  }));
}

/**
 * Criar novo buffet
 */
async function createBuffet(buffetData: CreateBuffetData): Promise<BuffetData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("quote_buffet_options")
    .insert({
      user_id: user.id,
      ano: buffetData.ano,
      nome: buffetData.nome,
      precos_por_pessoa: buffetData.precos_por_pessoa as any,
      itens_inclusos: buffetData.itens_inclusos as any,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar buffet:", error);
    throw error;
  }

  return {
    id: data.id,
    ano: data.ano,
    nome: data.nome,
    precos_por_pessoa: data.precos_por_pessoa as unknown as PrecoPessoa[],
    itens_inclusos: data.itens_inclusos as unknown as string[],
  };
}

/**
 * Atualizar buffet existente
 */
async function updateBuffet(buffetData: UpdateBuffetData): Promise<BuffetData> {
  const { id, ...updateData } = buffetData;

  const { data, error } = await supabase
    .from("quote_buffet_options")
    .update({
      ...(updateData.ano && { ano: updateData.ano }),
      ...(updateData.nome && { nome: updateData.nome }),
      ...(updateData.precos_por_pessoa && { precos_por_pessoa: updateData.precos_por_pessoa as any }),
      ...(updateData.itens_inclusos && { itens_inclusos: updateData.itens_inclusos as any }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar buffet:", error);
    throw error;
  }

  return {
    id: data.id,
    ano: data.ano,
    nome: data.nome,
    precos_por_pessoa: data.precos_por_pessoa as unknown as PrecoPessoa[],
    itens_inclusos: data.itens_inclusos as unknown as string[],
  };
}

/**
 * Deletar buffet (soft delete)
 */
async function deleteBuffet(id: string): Promise<void> {
  const { error } = await supabase
    .from("quote_buffet_options")
    .update({ ativo: false })
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar buffet:", error);
    throw error;
  }
}

// ============================================================================
// Hook Principal
// ============================================================================

export function useBuffetSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Buscar buffets
  const {
    data: buffets = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchBuffets,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation: Criar buffet
  const createMutation = useMutation({
    mutationFn: createBuffet,
    onSuccess: (newBuffet) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Buffet criado!",
        description: `${newBuffet.nome} foi criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar buffet:", error);
      
      // Tratar erro de nome duplicado
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um buffet com este nome para o ano selecionado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar buffet",
          description: "Ocorreu um erro ao salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation: Atualizar buffet
  const updateMutation = useMutation({
    mutationFn: updateBuffet,
    onSuccess: (updatedBuffet) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Buffet atualizado!",
        description: `${updatedBuffet.nome} foi atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar buffet:", error);
      
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um buffet com este nome para o ano selecionado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao atualizar buffet",
          description: "Ocorreu um erro ao salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation: Deletar buffet
  const deleteMutation = useMutation({
    mutationFn: deleteBuffet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Buffet removido!",
        description: "O buffet foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao deletar buffet:", error);
      toast({
        title: "Erro ao remover buffet",
        description: "Ocorreu um erro ao remover. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    buffets,
    isLoading,
    error,
    
    // Actions
    createBuffet: createMutation.mutate,
    updateBuffet: updateMutation.mutate,
    deleteBuffet: deleteMutation.mutate,
    refetch,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
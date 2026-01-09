/**
* HOOK: useSpaceSettings
* Gerencia CRUD de configurações de preço de espaço
*/
 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { 
  SpaceData, 
  CreateSpaceData, 
  UpdateSpaceData,
  PrecoDia
} from "@/types/spaceSettings.types";

const QUERY_KEY = ["spaceSettings"];

// ============================================================================
// API Functions
// ============================================================================

/**
 * Buscar todos os espaços do usuário
 */
async function fetchSpaces(): Promise<SpaceData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("quote_space_prices")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("ano", { ascending: false })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar espaços:", error);
    throw error;
  }

  // Converter Json para tipos específicos
  return data.map((record) => ({
    id: record.id,
    ano: record.ano,
    nome: record.nome,
    precos_por_dia: record.precos_por_dia as unknown as PrecoDia[],
    itens_inclusos: record.itens_inclusos as unknown as string[],
  }));
}

/**
 * Criar novo espaço
 */
async function createSpace(spaceData: CreateSpaceData): Promise<SpaceData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("quote_space_prices")
    .insert({
      user_id: user.id,
      ano: spaceData.ano,
      nome: spaceData.nome,
      precos_por_dia: spaceData.precos_por_dia as any,
      itens_inclusos: spaceData.itens_inclusos as any,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar espaço:", error);
    throw error;
  }

  return {
    id: data.id,
    ano: data.ano,
    nome: data.nome,
    precos_por_dia: data.precos_por_dia as unknown as PrecoDia[],
    itens_inclusos: data.itens_inclusos as unknown as string[],
  };
}

/**
 * Atualizar espaço existente
 */
async function updateSpace(spaceData: UpdateSpaceData): Promise<SpaceData> {
  const { id, ...updateData } = spaceData;

  const { data, error } = await supabase
    .from("quote_space_prices")
    .update({
      ...(updateData.ano && { ano: updateData.ano }),
      ...(updateData.nome && { nome: updateData.nome }),
      ...(updateData.precos_por_dia && { precos_por_dia: updateData.precos_por_dia as any }),
      ...(updateData.itens_inclusos && { itens_inclusos: updateData.itens_inclusos as any }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar espaço:", error);
    throw error;
  }

  return {
    id: data.id,
    ano: data.ano,
    nome: data.nome,
    precos_por_dia: data.precos_por_dia as unknown as PrecoDia[],
    itens_inclusos: data.itens_inclusos as unknown as string[],
  };
}

/**
 * Deletar espaço (soft delete)
 */
async function deleteSpace(id: string): Promise<void> {
  const { error } = await supabase
    .from("quote_space_prices")
    .update({ ativo: false })
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar espaço:", error);
    throw error;
  }
}

// ============================================================================
// Hook Principal
// ============================================================================

export function useSpaceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Buscar espaços
  const {
    data: spaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSpaces,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation: Criar espaço
  const createMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: (newSpace) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Espaço criado!",
        description: `${newSpace.nome} foi criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar espaço:", error);
      
      // Tratar erro de nome duplicado
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um espaço com este nome para o ano selecionado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar espaço",
          description: "Ocorreu um erro ao salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation: Atualizar espaço
  const updateMutation = useMutation({
    mutationFn: updateSpace,
    onSuccess: (updatedSpace) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Espaço atualizado!",
        description: `${updatedSpace.nome} foi atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar espaço:", error);
      
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um espaço com este nome para o ano selecionado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao atualizar espaço",
          description: "Ocorreu um erro ao salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation: Deletar espaço
  const deleteMutation = useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Espaço removido!",
        description: "O espaço foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao deletar espaço:", error);
      toast({
        title: "Erro ao remover espaço",
        description: "Ocorreu um erro ao remover. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    spaces,
    isLoading,
    error,
    
    // Actions
    createSpace: createMutation.mutate,
    updateSpace: updateMutation.mutate,
    deleteSpace: deleteMutation.mutate,
    refetch,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
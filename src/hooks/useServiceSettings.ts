/**
 * HOOK: useServiceSettings
 * Gerencia CRUD de configurações de serviços
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { 
  ServiceData, 
  CreateServiceData, 
  UpdateServiceData,
  PrecoServico
} from "@/types/serviceSettings.types";

const QUERY_KEY = ["serviceSettings"];

// ============================================================================
// API Functions
// ============================================================================

async function fetchServices(): Promise<ServiceData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("quote_service_options")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("ano", { ascending: false })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar serviços:", error);
    throw error;
  }

  return data.map((record) => ({
    id: record.id,
    ano: record.ano,
    nome: record.nome,
    precos: record.precos as unknown as PrecoServico[],
    descricao: record.descricao || undefined,
  }));
}

async function createService(serviceData: CreateServiceData): Promise<ServiceData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("quote_service_options")
    .insert({
      user_id: user.id,
      ano: serviceData.ano,
      nome: serviceData.nome,
      precos: serviceData.precos as any,
      descricao: serviceData.descricao || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar serviço:", error);
    throw error;
  }

  return {
    id: data.id,
    ano: data.ano,
    nome: data.nome,
    precos: data.precos as unknown as PrecoServico[],
    descricao: data.descricao || undefined,
  };
}

async function updateService(serviceData: UpdateServiceData): Promise<ServiceData> {
  const { id, ...updateData } = serviceData;

  const { data, error } = await supabase
    .from("quote_service_options")
    .update({
      ...(updateData.ano && { ano: updateData.ano }),
      ...(updateData.nome && { nome: updateData.nome }),
      ...(updateData.precos && { precos: updateData.precos as any }),
      ...(updateData.descricao !== undefined && { descricao: updateData.descricao || null }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar serviço:", error);
    throw error;
  }

  return {
    id: data.id,
    ano: data.ano,
    nome: data.nome,
    precos: data.precos as unknown as PrecoServico[],
    descricao: data.descricao || undefined,
  };
}

async function deleteService(id: string): Promise<void> {
  const { error } = await supabase
    .from("quote_service_options")
    .update({ ativo: false })
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar serviço:", error);
    throw error;
  }
}

// ============================================================================
// Hook Principal
// ============================================================================

export function useServiceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: services = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchServices,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: (newService) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Serviço criado!",
        description: `${newService.nome} foi criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar serviço:", error);
      
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um serviço com este nome para o ano selecionado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar serviço",
          description: "Ocorreu um erro ao salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateService,
    onSuccess: (updatedService) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Serviço atualizado!",
        description: `${updatedService.nome} foi atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar serviço:", error);
      
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um serviço com este nome para o ano selecionado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao atualizar serviço",
          description: "Ocorreu um erro ao salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Serviço removido!",
        description: "O serviço foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao deletar serviço:", error);
      toast({
        title: "Erro ao remover serviço",
        description: "Ocorreu um erro ao remover. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    services,
    isLoading,
    error,
    createService: createMutation.mutate,
    updateService: updateMutation.mutate,
    deleteService: deleteMutation.mutate,
    refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
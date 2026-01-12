/**
 * HOOK: usePackageSettings
 * Gerencia CRUD de configurações de pacotes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { 
  PackageData, 
  CreatePackageData, 
  UpdatePackageData,
  ItensPacote
} from "@/types/packageSettings.types";

const QUERY_KEY = ["packageSettings"];

// ============================================================================
// API Functions
// ============================================================================

async function fetchPackages(): Promise<PackageData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("quote_package_options")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("ano", { ascending: false })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar pacotes:", error);
    throw error;
  }

  return data.map((record) => ({
    id: record.id,
    ano: record.ano,
    nome: record.nome,
    descricao: record.descricao || undefined,
    itens_pacote: record.itens_pacote as unknown as ItensPacote,
    preco_base: Number(record.preco_base),
    desconto_percentual: Number(record.desconto_percentual),
    preco_final: Number(record.preco_final),
  }));
}

async function createPackage(packageData: CreatePackageData): Promise<PackageData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("quote_package_options")
    .insert({
      user_id: user.id,
      ano: packageData.ano,
      nome: packageData.nome,
      descricao: packageData.descricao || null,
      itens_pacote: packageData.itens_pacote as any,
      preco_base: packageData.preco_base,
      desconto_percentual: packageData.desconto_percentual,
      preco_final: packageData.preco_final,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar pacote:", error);
    throw error;
  }

  return {
    id: data.id,
    ano: data.ano,
    nome: data.nome,
    descricao: data.descricao || undefined,
    itens_pacote: data.itens_pacote as unknown as ItensPacote,
    preco_base: Number(data.preco_base),
    desconto_percentual: Number(data.desconto_percentual),
    preco_final: Number(data.preco_final),
  };
}

async function updatePackage(packageData: UpdatePackageData): Promise<PackageData> {
  const { id, ...updateData } = packageData;

  const { data, error } = await supabase
    .from("quote_package_options")
    .update({
      ...(updateData.ano && { ano: updateData.ano }),
      ...(updateData.nome && { nome: updateData.nome }),
      ...(updateData.descricao !== undefined && { descricao: updateData.descricao || null }),
      ...(updateData.itens_pacote && { itens_pacote: updateData.itens_pacote as any }),
      ...(updateData.preco_base !== undefined && { preco_base: updateData.preco_base }),
      ...(updateData.desconto_percentual !== undefined && { desconto_percentual: updateData.desconto_percentual }),
      ...(updateData.preco_final !== undefined && { preco_final: updateData.preco_final }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar pacote:", error);
    throw error;
  }

  return {
    id: data.id,
    ano: data.ano,
    nome: data.nome,
    descricao: data.descricao || undefined,
    itens_pacote: data.itens_pacote as unknown as ItensPacote,
    preco_base: Number(data.preco_base),
    desconto_percentual: Number(data.desconto_percentual),
    preco_final: Number(data.preco_final),
  };
}

async function deletePackage(id: string): Promise<void> {
  const { error } = await supabase
    .from("quote_package_options")
    .update({ ativo: false })
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar pacote:", error);
    throw error;
  }
}

// ============================================================================
// Hook Principal
// ============================================================================

export function usePackageSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: packages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPackages,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createPackage,
    onSuccess: (newPackage) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Pacote criado!",
        description: `${newPackage.nome} foi criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar pacote:", error);
      
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um pacote com este nome para o ano selecionado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar pacote",
          description: "Ocorreu um erro ao salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePackage,
    onSuccess: (updatedPackage) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Pacote atualizado!",
        description: `${updatedPackage.nome} foi atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar pacote:", error);
      
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um pacote com este nome para o ano selecionado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao atualizar pacote",
          description: "Ocorreu um erro ao salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Pacote removido!",
        description: "O pacote foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao deletar pacote:", error);
      toast({
        title: "Erro ao remover pacote",
        description: "Ocorreu um erro ao remover. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    packages,
    isLoading,
    error,
    createPackage: createMutation.mutate,
    updatePackage: updateMutation.mutate,
    deletePackage: deleteMutation.mutate,
    refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
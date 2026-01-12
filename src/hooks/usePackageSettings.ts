/**
 * HOOK: usePackageSettings
 * Gerencia CRUD de pacotes + cálculo de preços em tempo real
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpaceSettings } from "@/hooks/useSpaceSettings";
import { useBuffetSettings } from "@/hooks/useBuffetSettings";
import { useServiceSettings } from "@/hooks/useServiceSettings";
import type { 
  PackageData, 
  CreatePackageData, 
  UpdatePackageData,
  ItensPacote,
  PackagePriceCalculation,
  ItemPriceDetail
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
    desconto_percentual: Number(record.desconto_percentual),
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
      desconto_percentual: packageData.desconto_percentual,
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
    desconto_percentual: Number(data.desconto_percentual),
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
      ...(updateData.desconto_percentual !== undefined && { desconto_percentual: updateData.desconto_percentual }),
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
    desconto_percentual: Number(data.desconto_percentual),
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

  const { spaces } = useSpaceSettings();
  const { buffets } = useBuffetSettings();
  const { services } = useServiceSettings();

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

  /**
   * Calcula preços do pacote em tempo real com detalhes completos
   */
  const calculatePackagePrice = (pkg: PackageData): PackagePriceCalculation => {
    const espacosDetalhes: ItemPriceDetail[] = [];
    const buffetsDetalhes: ItemPriceDetail[] = [];
    const servicosDetalhes: ItemPriceDetail[] = [];

    let subtotal = 0;
    let tem_variaveis = false;

    // Calcular Espaços
    pkg.itens_pacote.espacos.forEach(id => {
      const espaco = spaces.find(s => s.id === id);
      if (espaco && espaco.precos_por_dia && espaco.precos_por_dia.length > 0) {
        const preco = espaco.precos_por_dia[0];
        
        if (preco.tipo === 'fixo') {
          const valor = preco.preco_fixo || 0;
          subtotal += valor;
          espacosDetalhes.push({
            id,
            nome: espaco.nome,
            tipo: 'fixo',
            valor_fixo: valor,
          });
        } else {
          tem_variaveis = true;
          const inicial = preco.valor_inicial || 0;
          subtotal += inicial;
          espacosDetalhes.push({
            id,
            nome: espaco.nome,
            tipo: 'variavel',
            valor_inicial: inicial,
            valor_por_unidade: preco.valor_por_convidado || 0,
            unidade: 'convidado',
          });
        }
      }
    });

    // Calcular Buffets
    pkg.itens_pacote.buffets.forEach(id => {
      const buffet = buffets.find(b => b.id === id);
      if (buffet && buffet.precos_por_pessoa && buffet.precos_por_pessoa.length > 0) {
        const preco = buffet.precos_por_pessoa[0];
        
        if (preco.tipo === 'fixo') {
          const valor = preco.preco_fixo || 0;
          subtotal += valor;
          buffetsDetalhes.push({
            id,
            nome: buffet.nome,
            tipo: 'fixo',
            valor_fixo: valor,
          });
        } else {
          tem_variaveis = true;
          const inicial = preco.valor_inicial || 0;
          subtotal += inicial;
          buffetsDetalhes.push({
            id,
            nome: buffet.nome,
            tipo: 'variavel',
            valor_inicial: inicial,
            valor_por_unidade: preco.valor_por_pessoa || 0,
            unidade: 'pessoa',
          });
        }
      }
    });

    // Calcular Serviços
    pkg.itens_pacote.servicos.forEach(id => {
      const servico = services.find(s => s.id === id);
      if (servico && servico.precos && servico.precos.length > 0) {
        const preco = servico.precos[0];
        
        if (preco.tipo === 'fixo') {
          const valor = preco.preco_fixo || 0;
          subtotal += valor;
          servicosDetalhes.push({
            id,
            nome: servico.nome,
            tipo: 'fixo',
            valor_fixo: valor,
          });
        } else {
          tem_variaveis = true;
          const inicial = preco.valor_inicial || 0;
          subtotal += inicial;
          servicosDetalhes.push({
            id,
            nome: servico.nome,
            tipo: 'variavel',
            valor_inicial: inicial,
            valor_por_unidade: preco.valor_por_unidade || 0,
            unidade: preco.unidade || 'unidade',
          });
        }
      }
    });

    const desconto_valor = (subtotal * pkg.desconto_percentual) / 100;
    const total = subtotal - desconto_valor;

    return {
      espacos: espacosDetalhes,
      buffets: buffetsDetalhes,
      servicos: servicosDetalhes,
      subtotal,
      desconto_valor,
      desconto_percentual: pkg.desconto_percentual,
      total,
      tem_variaveis,
    };
  };

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
    calculatePackagePrice,
    createPackage: createMutation.mutate,
    updatePackage: updateMutation.mutate,
    deletePackage: deleteMutation.mutate,
    refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
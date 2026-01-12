/**
 * HOOK: usePackageSettings (LÓGICA CORRETA)
 * 
 * FIXO = valores fixos puros + valores iniciais dos variáveis (sempre cobrados)
 * VARIÁVEL = apenas valores por unidade (R$/pessoa, R$/hora)
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
    desconto_percentual_variavel: Number(record.desconto_percentual_variavel || 0),
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
      desconto_percentual_variavel: packageData.desconto_percentual_variavel,
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
    desconto_percentual_variavel: Number(data.desconto_percentual_variavel || 0),
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
      ...(updateData.desconto_percentual_variavel !== undefined && { desconto_percentual_variavel: updateData.desconto_percentual_variavel }),
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
    desconto_percentual_variavel: Number(data.desconto_percentual_variavel || 0),
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
   * Calcula preços com lógica correta:
   * FIXO = valores fixos + valores iniciais (sempre cobrados)
   * VARIÁVEL = apenas valores por unidade (variam com quantidade)
   */
  const calculatePackagePrice = (pkg: PackageData): PackagePriceCalculation => {
    const espacosDetalhes: ItemPriceDetail[] = [];
    const buffetsDetalhes: ItemPriceDetail[] = [];
    const servicosDetalhes: ItemPriceDetail[] = [];

    let subtotal_fixo = 0;
    let subtotal_variavel = 0;

    // ========== ESPAÇOS ==========
    pkg.itens_pacote.espacos.forEach(id => {
      const espaco = spaces.find(s => s.id === id);
      if (espaco && espaco.precos_por_dia && espaco.precos_por_dia.length > 0) {
        const preco = espaco.precos_por_dia[0];
        
        if (preco.tipo === 'fixo') {
          const valor = preco.preco_fixo || 0;
          subtotal_fixo += valor;
          espacosDetalhes.push({
            id,
            nome: espaco.nome,
            tipo: 'fixo',
            valor_fixo: valor,
          });
        } else {
          // Valor inicial vai pro FIXO (sempre cobrado)
          const inicial = preco.valor_inicial || 0;
          subtotal_fixo += inicial;
          
          // Valor por unidade vai pro VARIÁVEL
          const porUnidade = preco.valor_por_convidado || 0;
          subtotal_variavel += porUnidade;
          
          espacosDetalhes.push({
            id,
            nome: espaco.nome,
            tipo: 'variavel',
            valor_inicial: inicial,
            valor_por_unidade: porUnidade,
            unidade: 'convidado',
          });
        }
      }
    });

    // ========== BUFFETS ==========
    pkg.itens_pacote.buffets.forEach(id => {
      const buffet = buffets.find(b => b.id === id);
      if (buffet && buffet.precos_por_pessoa && buffet.precos_por_pessoa.length > 0) {
        const preco = buffet.precos_por_pessoa[0];
        
        if (preco.tipo === 'fixo') {
          const valor = preco.preco_fixo || 0;
          subtotal_fixo += valor;
          buffetsDetalhes.push({
            id,
            nome: buffet.nome,
            tipo: 'fixo',
            valor_fixo: valor,
          });
        } else {
          const inicial = preco.valor_inicial || 0;
          subtotal_fixo += inicial;
          
          const porUnidade = preco.valor_por_pessoa || 0;
          subtotal_variavel += porUnidade;
          
          buffetsDetalhes.push({
            id,
            nome: buffet.nome,
            tipo: 'variavel',
            valor_inicial: inicial,
            valor_por_unidade: porUnidade,
            unidade: 'pessoa',
          });
        }
      }
    });

    // ========== SERVIÇOS ==========
    pkg.itens_pacote.servicos.forEach(id => {
      const servico = services.find(s => s.id === id);
      if (servico && servico.precos && servico.precos.length > 0) {
        const preco = servico.precos[0];
        
        if (preco.tipo === 'fixo') {
          const valor = preco.preco_fixo || 0;
          subtotal_fixo += valor;
          servicosDetalhes.push({
            id,
            nome: servico.nome,
            tipo: 'fixo',
            valor_fixo: valor,
          });
        } else {
          const inicial = preco.valor_inicial || 0;
          subtotal_fixo += inicial;
          
          const porUnidade = preco.valor_por_unidade || 0;
          subtotal_variavel += porUnidade;
          
          servicosDetalhes.push({
            id,
            nome: servico.nome,
            tipo: 'variavel',
            valor_inicial: inicial,
            valor_por_unidade: porUnidade,
            unidade: preco.unidade || 'unidade',
          });
        }
      }
    });

    // Calcular descontos
    const desconto_fixo_valor = (subtotal_fixo * pkg.desconto_percentual) / 100;
    const desconto_variavel_valor = (subtotal_variavel * pkg.desconto_percentual_variavel) / 100;
    
    const total_fixo = subtotal_fixo - desconto_fixo_valor;
    const total_variavel = subtotal_variavel - desconto_variavel_valor;
    const total_geral = total_fixo + total_variavel;

    return {
      espacos: espacosDetalhes,
      buffets: buffetsDetalhes,
      servicos: servicosDetalhes,
      
      subtotal_fixo,
      desconto_fixo_valor,
      desconto_fixo_percentual: pkg.desconto_percentual,
      total_fixo,
      
      subtotal_variavel,
      desconto_variavel_valor,
      desconto_variavel_percentual: pkg.desconto_percentual_variavel,
      total_variavel,
      
      total_geral,
      tem_variaveis: subtotal_variavel > 0,
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
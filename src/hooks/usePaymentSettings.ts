/**
 * HOOK: usePaymentSettings
 * Gerencia configurações globais de pagamento (CRUD simples - um registro por usuário)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PaymentSettingsData, PaymentSettingsUpdate } from "@/types/paymentSettings.types.ts";

const QUERY_KEY = ["paymentSettings"];

// Valores padrão
const DEFAULT_SETTINGS: Omit<PaymentSettingsData, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  percentual_minimo_sinal: 10,
  dias_vencimento_opcoes: [5, 10, 15, 20, 25],
  dia_vencimento_padrao: 10,
  tipo_parcelamento: 'ate_evento',
  dias_ultima_parcela_antes_evento: 30,
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Buscar configurações de pagamento do usuário
 */
async function fetchPaymentSettings(): Promise<PaymentSettingsData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // Se não encontrou, retorna valores padrão
    if (error.code === 'PGRST116') {
      return { ...DEFAULT_SETTINGS, user_id: user.id };
    }
    console.error("Erro ao buscar configurações de pagamento:", error);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    percentual_minimo_sinal: data.percentual_minimo_sinal,
    dias_vencimento_opcoes: data.dias_vencimento_opcoes as number[],
    dia_vencimento_padrao: data.dia_vencimento_padrao,
    tipo_parcelamento: data.tipo_parcelamento as 'ate_evento' | 'apos_evento' | 'fixo',
    meses_apos_evento: data.meses_apos_evento,
    numero_parcelas_fixo: data.numero_parcelas_fixo,
    dias_ultima_parcela_antes_evento: data.dias_ultima_parcela_antes_evento,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Criar ou atualizar configurações de pagamento
 */
async function upsertPaymentSettings(settingsData: PaymentSettingsUpdate): Promise<PaymentSettingsData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Verificar se já existe
  const { data: existing } = await supabase
    .from("payment_settings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // UPDATE
    const { data, error } = await supabase
      .from("payment_settings")
      .update(settingsData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar configurações de pagamento:", error);
      throw error;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      percentual_minimo_sinal: data.percentual_minimo_sinal,
      dias_vencimento_opcoes: data.dias_vencimento_opcoes as number[],
      dia_vencimento_padrao: data.dia_vencimento_padrao,
      tipo_parcelamento: data.tipo_parcelamento as 'ate_evento' | 'apos_evento' | 'fixo',
      meses_apos_evento: data.meses_apos_evento,
      numero_parcelas_fixo: data.numero_parcelas_fixo,
      dias_ultima_parcela_antes_evento: data.dias_ultima_parcela_antes_evento,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } else {
    // INSERT
    const { data, error } = await supabase
      .from("payment_settings")
      .insert({
        user_id: user.id,
        ...DEFAULT_SETTINGS,
        ...settingsData,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar configurações de pagamento:", error);
      throw error;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      percentual_minimo_sinal: data.percentual_minimo_sinal,
      dias_vencimento_opcoes: data.dias_vencimento_opcoes as number[],
      dia_vencimento_padrao: data.dia_vencimento_padrao,
      tipo_parcelamento: data.tipo_parcelamento as 'ate_evento' | 'apos_evento' | 'fixo',
      meses_apos_evento: data.meses_apos_evento,
      numero_parcelas_fixo: data.numero_parcelas_fixo,
      dias_ultima_parcela_antes_evento: data.dias_ultima_parcela_antes_evento,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

// ============================================================================
// Hook Principal
// ============================================================================

export function usePaymentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Buscar configurações
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPaymentSettings,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation: Salvar configurações
  const saveMutation = useMutation({
    mutationFn: upsertPaymentSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Configurações salvas!",
        description: "As configurações de pagamento foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao salvar configurações de pagamento:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    error,
    
    // Actions
    saveSettings: saveMutation.mutate,
    refetch,
    
    // Loading state
    isSaving: saveMutation.isPending,
  };
}
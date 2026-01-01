// src/hooks/useVisitSettings.ts
// ==========================================
// HOOK DE CONFIGURAÇÕES DE VISITAS (COM REACT QUERY)
// ==========================================
// 
// Este hook foi refatorado para usar React Query, garantindo que
// todos os componentes compartilhem o mesmo cache e recebam
// atualizações em tempo real quando as configurações mudam.
//

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandler";

// ==========================================
// TIPOS
// ==========================================

export interface VisitSettings {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  default_duration: number;
  interval_between_visits: number;
  allow_overlapping: boolean;
  max_visits_per_slot: number;
  created_at: string;
  updated_at: string;
}

export type VisitSettingsInsert = {
  start_time: string;
  end_time: string;
  default_duration: number;
  interval_between_visits: number;
  allow_overlapping?: boolean;
  max_visits_per_slot?: number;
};

// ==========================================
// CONFIGURAÇÕES PADRÃO
// ==========================================

export const DEFAULT_SETTINGS: Omit<VisitSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  start_time: '08:00',
  end_time: '19:00',
  default_duration: 60,
  interval_between_visits: 0,
  allow_overlapping: false,
  max_visits_per_slot: 1,
};

// ==========================================
// QUERY KEY - Exportada para uso em invalidações externas
// ==========================================

export const VISIT_SETTINGS_KEY = ['visit_settings'] as const;

// ==========================================
// FUNÇÕES DE API (separadas para melhor testabilidade)
// ==========================================

/**
 * Busca as configurações de visitas do usuário autenticado
 */
async function fetchVisitSettings(): Promise<VisitSettings | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("visit_settings")
    .select("*")
    .eq("user_id", userData.user.id)
    .single();

  if (error) {
    // Se não encontrou configurações, retorna null (não é erro crítico)
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  
  return data;
}

/**
 * Salva (cria ou atualiza) as configurações de visitas
 */
async function saveVisitSettingsAPI(
  newSettings: VisitSettingsInsert, 
  existingId?: string
): Promise<VisitSettings> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error("Usuário não autenticado");
  }

  if (existingId) {
    // UPDATE - configuração já existe
    const { data, error } = await supabase
      .from("visit_settings")
      .update({
        ...newSettings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // INSERT - primeira vez criando configuração
    const { data, error } = await supabase
      .from("visit_settings")
      .insert({
        ...newSettings,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

export function useVisitSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ==========================================
  // QUERY: Carregar configurações
  // ==========================================
  const { 
    data: settings, 
    isLoading: loading,
    error,
    refetch: refreshSettings,
  } = useQuery({
    queryKey: VISIT_SETTINGS_KEY,
    queryFn: fetchVisitSettings,
    staleTime: 5 * 60 * 1000, // 5 minutos - configurações mudam raramente
    gcTime: 30 * 60 * 1000,   // 30 minutos no cache
    retry: 1,
  });

  // ==========================================
  // MUTATION: Salvar configurações
  // ==========================================
  const saveMutation = useMutation({
    mutationFn: (newSettings: VisitSettingsInsert) => 
      saveVisitSettingsAPI(newSettings, settings?.id),
    
    // Atualização otimista: atualiza o cache ANTES da resposta do servidor
    onMutate: async (newSettings) => {
      // Cancela queries em andamento para evitar conflitos
      await queryClient.cancelQueries({ queryKey: VISIT_SETTINGS_KEY });
      
      // Salva o estado anterior para rollback se necessário
      const previousSettings = queryClient.getQueryData(VISIT_SETTINGS_KEY);
      
      // Atualiza o cache otimisticamente
      if (settings) {
        queryClient.setQueryData(VISIT_SETTINGS_KEY, {
          ...settings,
          ...newSettings,
        });
      }
      
      return { previousSettings };
    },
    
    onSuccess: (data) => {
      // Atualiza o cache com os dados reais do servidor
      queryClient.setQueryData(VISIT_SETTINGS_KEY, data);
      
      toast({
        title: settings?.id ? "Configurações atualizadas" : "Configurações criadas",
        description: "Suas preferências foram salvas com sucesso!",
      });
    },
    
    onError: (error: any, _newSettings, context) => {
      // Rollback para o estado anterior em caso de erro
      if (context?.previousSettings) {
        queryClient.setQueryData(VISIT_SETTINGS_KEY, context.previousSettings);
      }
      
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: getSafeErrorMessage(error, "saveSettings"),
        variant: "destructive",
      });
    },
  });

  // ==========================================
  // FUNÇÕES HELPER
  // ==========================================

  /**
   * Gera array de horários disponíveis baseado nas configurações
   * Considera: horário início/fim, duração e intervalo entre visitas
   */
  const generateAvailableSlots = (customSettings?: VisitSettings | null): string[] => {
    const config = customSettings || settings || DEFAULT_SETTINGS;
    const slots: string[] = [];
    
    // Converter horários para minutos para facilitar cálculos
    const [startHour, startMin] = config.start_time.split(':').map(Number);
    const [endHour, endMin] = config.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Intervalo entre slots = duração da visita + intervalo configurado
    const stepMinutes = config.default_duration + config.interval_between_visits;
    
    // Gera slots enquanto couber uma visita completa antes do horário de término
    for (let minutes = startMinutes; minutes + config.default_duration <= endMinutes; minutes += stepMinutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }
    
    return slots;
  };

  /**
   * Calcula horário de término baseado no início e duração
   */
  const calculateEndTime = (startTime: string, duration?: number): string => {
    const durationMinutes = duration || settings?.default_duration || DEFAULT_SETTINGS.default_duration;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  /**
   * Valida se um horário está dentro do range de funcionamento
   */
  const isTimeInRange = (time: string, customSettings?: VisitSettings | null): boolean => {
    const config = customSettings || settings || DEFAULT_SETTINGS;
    return time >= config.start_time && time <= config.end_time;
  };

  // ==========================================
  // RETORNO DO HOOK
  // ==========================================

  return {
    // Estado
    settings: settings ?? null,
    loading,
    error,
    
    // Ações
    saveSettings: async (newSettings: VisitSettingsInsert): Promise<boolean> => {
      try {
        await saveMutation.mutateAsync(newSettings);
        return true;
      } catch {
        return false;
      }
    },
    
    resetToDefault: async (): Promise<boolean> => {
      try {
        await saveMutation.mutateAsync(DEFAULT_SETTINGS);
        return true;
      } catch {
        return false;
      }
    },
    
    refreshSettings,
    
    // Helpers
    generateAvailableSlots,
    calculateEndTime,
    isTimeInRange,
    
    // Constantes
    defaultSettings: DEFAULT_SETTINGS,
    
    // Estado da mutation (útil para UI)
    isSaving: saveMutation.isPending,
  };
} 
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandler";

// ==========================================
// TYPES
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

export interface VisitSettingsInsert {
  start_time: string;
  end_time: string;
  default_duration: number;
  interval_between_visits?: number;
  allow_overlapping?: boolean;
  max_visits_per_slot?: number;
}

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
// HOOK
// ==========================================

export function useVisitSettings() {
  const [settings, setSettings] = useState<VisitSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar configurações do usuário
  const fetchSettings = async () => {
    setLoading(true);
    
    try {
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
        // Se não encontrou configurações, retorna null (não é erro)
        if (error.code === 'PGRST116') {
          setSettings(null);
        } else {
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: getSafeErrorMessage(error, "fetchSettings"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar ou atualizar configurações
  const saveSettings = async (newSettings: VisitSettingsInsert): Promise<boolean> => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        throw new Error("Usuário não autenticado");
      }

      // Se já existe configuração, faz UPDATE, senão faz INSERT
      if (settings?.id) {
        const { data, error } = await supabase
          .from("visit_settings")
          .update(newSettings)
          .eq("id", settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
        
        toast({
          title: "Configurações atualizadas",
          description: "Suas preferências foram salvas com sucesso!",
        });
      } else {
        const { data, error } = await supabase
          .from("visit_settings")
          .insert({
            ...newSettings,
            user_id: userData.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
        
        toast({
          title: "Configurações criadas",
          description: "Suas preferências foram salvas com sucesso!",
        });
      }

      return true;
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: getSafeErrorMessage(error, "saveSettings"),
        variant: "destructive",
      });
      return false;
    }
  };

  // Resetar para configurações padrão
  const resetToDefault = async (): Promise<boolean> => {
    return await saveSettings(DEFAULT_SETTINGS);
  };

  // Gerar horários disponíveis baseado nas configurações
  const generateAvailableSlots = (customSettings?: VisitSettings | null): string[] => {
    const config = customSettings || settings || DEFAULT_SETTINGS;
    const slots: string[] = [];
    
    // Converter horários para minutos
    const [startHour, startMin] = config.start_time.split(':').map(Number);
    const [endHour, endMin] = config.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Gerar slots considerando duração + intervalo
    const stepMinutes = config.default_duration + config.interval_between_visits;
    
    for (let minutes = startMinutes; minutes + config.default_duration <= endMinutes; minutes += stepMinutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }
    
    return slots;
  };

  // Calcular horário de término baseado no início e duração
  const calculateEndTime = (startTime: string, duration?: number): string => {
    const durationMinutes = duration || settings?.default_duration || DEFAULT_SETTINGS.default_duration;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  // Validar se um horário está dentro do range configurado
  const isTimeInRange = (time: string, customSettings?: VisitSettings | null): boolean => {
    const config = customSettings || settings || DEFAULT_SETTINGS;
    return time >= config.start_time && time <= config.end_time;
  };

  // Carregar configurações ao montar o componente
  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    saveSettings,
    resetToDefault,
    refreshSettings: fetchSettings,
    generateAvailableSlots,
    calculateEndTime,
    isTimeInRange,
    defaultSettings: DEFAULT_SETTINGS,
  };
}
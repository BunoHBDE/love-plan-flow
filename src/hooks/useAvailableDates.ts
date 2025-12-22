import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface AvailableDate {
  id: string;
  date: string;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export function useAvailableDates() {
  const { user } = useAuth();
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailableDates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("available_dates")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setAvailableDates(data || []);
    } catch (error) {
      console.error("Error fetching available dates:", error);
      toast.error("Erro ao carregar datas disponíveis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableDates();
  }, [user]);

  const addAvailableDate = async (date: string, reason?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("available_dates").insert({
        date,
        reason: reason || null,
        created_by: user.id,
      });

      if (error) throw error;
      await fetchAvailableDates();
      return true;
    } catch (error: any) {
      console.error("Error adding available date:", error);
      if (error.code === "23505") {
        toast.error("Esta data já está marcada como disponível");
      } else {
        toast.error("Erro ao adicionar data disponível");
      }
      return false;
    }
  };

  const updateAvailableDate = async (id: string, reason: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("available_dates")
        .update({ reason })
        .eq("id", id);

      if (error) throw error;
      await fetchAvailableDates();
      return true;
    } catch (error) {
      console.error("Error updating available date:", error);
      toast.error("Erro ao atualizar data disponível");
      return false;
    }
  };

  const removeAvailableDate = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("available_dates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchAvailableDates();
      return true;
    } catch (error) {
      console.error("Error removing available date:", error);
      toast.error("Erro ao remover data disponível");
      return false;
    }
  };

  return {
    availableDates,
    loading,
    addAvailableDate,
    updateAvailableDate,
    removeAvailableDate,
    refetch: fetchAvailableDates,
  };
}

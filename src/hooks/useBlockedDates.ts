import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  created_at: string;
}

export function useBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBlockedDates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blocked_dates")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching blocked dates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as datas bloqueadas.",
        variant: "destructive",
      });
    } else {
      setBlockedDates(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const addBlockedDate = async (date: string, reason: string): Promise<boolean> => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("blocked_dates").insert({
      date,
      reason,
      created_by: userData.user?.id,
    });

    if (error) {
      console.error("Error adding blocked date:", error);
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Esta data já está bloqueada.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível bloquear a data.",
          variant: "destructive",
        });
      }
      return false;
    }

    toast({
      title: "Data bloqueada",
      description: "A data foi bloqueada com sucesso.",
    });

    await fetchBlockedDates();
    return true;
  };

  const removeBlockedDate = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("blocked_dates").delete().eq("id", id);

    if (error) {
      console.error("Error removing blocked date:", error);
      toast({
        title: "Erro",
        description: "Não foi possível desbloquear a data.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Data desbloqueada",
      description: "A data foi desbloqueada com sucesso.",
    });

    await fetchBlockedDates();
    return true;
  };

  return {
    blockedDates,
    loading,
    addBlockedDate,
    removeBlockedDate,
    refetch: fetchBlockedDates,
  };
}

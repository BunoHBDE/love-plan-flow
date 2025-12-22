import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorHandler";

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  created_at: string;
}

// Validation schema for blocked date
const blockedDateSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  reason: z.string()
    .min(1, "Motivo é obrigatório")
    .max(200, "Motivo muito longo"),
});

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
        description: getSafeErrorMessage(error, "fetchBlockedDates"),
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
    // Validate input
    const validationResult = blockedDateSchema.safeParse({ date, reason });
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Dados inválidos",
        description: firstError.message,
        variant: "destructive",
      });
      return false;
    }

    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("blocked_dates").insert({
      date: validationResult.data.date,
      reason: validationResult.data.reason,
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
          description: getSafeErrorMessage(error, "addBlockedDate"),
          variant: "destructive",
        });
      }
      return false;
    }

    await fetchBlockedDates();
    return true;
  };

  const updateBlockedDate = async (id: string, reason: string): Promise<boolean> => {
    // Validate reason
    const reasonSchema = z.string().min(1, "Motivo é obrigatório").max(200, "Motivo muito longo");
    const validationResult = reasonSchema.safeParse(reason);
    
    if (!validationResult.success) {
      toast({
        title: "Dados inválidos",
        description: validationResult.error.errors[0].message,
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("blocked_dates")
      .update({ reason: validationResult.data })
      .eq("id", id);

    if (error) {
      console.error("Error updating blocked date:", error);
      toast({
        title: "Erro",
        description: getSafeErrorMessage(error, "updateBlockedDate"),
        variant: "destructive",
      });
      return false;
    }

    await fetchBlockedDates();
    return true;
  };

  const removeBlockedDate = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("blocked_dates").delete().eq("id", id);

    if (error) {
      console.error("Error removing blocked date:", error);
      toast({
        title: "Erro",
        description: getSafeErrorMessage(error, "removeBlockedDate"),
        variant: "destructive",
      });
      return false;
    }

    await fetchBlockedDates();
    return true;
  };

  return {
    blockedDates,
    loading,
    addBlockedDate,
    updateBlockedDate,
    removeBlockedDate,
    refetch: fetchBlockedDates,
  };
}

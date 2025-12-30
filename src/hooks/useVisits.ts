import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorHandler";

export interface Visit {
  id: string;
  client_id: string | null;
  visit_date: string;
  visit_time: string;
  visit_end_time: string | null;
  duration: number | null;
  status: string;
  notes: string | null;
  guest_count: number | null;
  wedding_date_status: string;
  wedding_date: string | null;
  wedding_month: string | null;
  wedding_year: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  client?: {
    nome: string;
    email: string | null;
    telefone: string;
  } | null;
}


export interface VisitInsert {
  client_id?: string | null;
  visit_date: string;
  visit_time: string;
  visit_end_time?: string | null;
  duration?: number | null;
  status?: string;
  notes?: string | null;
  guest_count?: number | null;
  wedding_date_status?: string;
  wedding_date?: string | null;
  wedding_month?: string | null;
  wedding_year?: string | null;
}



// Zod validation schema for visit data
const visitSchema = z.object({
  client_id: z.string().uuid("Cliente inválido").optional().nullable(),
  visit_date: z.string().min(1, "Data da visita é obrigatória"),
  visit_time: z.string().min(1, "Horário da visita é obrigatório"),
  visit_end_time: z.string().optional().nullable(), 
  duration: z.number()                              
    .int()
    .min(15, "Duração mínima: 15 minutos")
    .max(480, "Duração máxima: 8 horas")
    .optional()
    .nullable(),
  status: z.string().max(50).optional(),
  notes: z.string().max(1000, "Notas muito longas").optional().nullable(),
  guest_count: z.number()
    .int()
    .min(1, "Mínimo 1 convidado")
    .max(2000, "Número de convidados muito alto")
    .optional()
    .nullable(),
  wedding_date_status: z.string().max(50).optional(),
  wedding_date: z.string().optional().nullable(),
  wedding_month: z.string().max(20).optional().nullable(),
  wedding_year: z.string().max(10).optional().nullable(),
});

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVisits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visits")
      .select(`
        *,
        client:clients(nome, email, telefone)
      `)
      .order("visit_date", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar visitas",
        description: getSafeErrorMessage(error, "fetchVisits"),
        variant: "destructive",
      });
    } else {
      setVisits(data || []);
    }
    setLoading(false);
  };

  const createVisit = async (visit: VisitInsert): Promise<Visit | null> => {
    // Validate visit data
    const validationResult = visitSchema.safeParse(visit);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Dados inválidos",
        description: firstError.message,
        variant: "destructive",
      });
      return null;
    }

    // Get current user ID for created_by
    const { data: userData } = await supabase.auth.getUser();

    const validatedData = validationResult.data as VisitInsert;
    const { data, error } = await supabase
      .from("visits")
      .insert({ ...validatedData, created_by: userData.user?.id })
      .select(`
        *,
        client:clients(nome, email, telefone)
      `)
      .single();

    if (error) {
      toast({
        title: "Erro ao criar visita",
        description: getSafeErrorMessage(error, "createVisit"),
        variant: "destructive",
      });
      return null;
    }

    setVisits((prev) => [data, ...prev].sort((a, b) => 
      new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
    ));
    toast({
      title: "Visita agendada!",
      description: "A visita foi agendada com sucesso.",
    });
    return data;
  };

  const updateVisit = async (id: string, updates: Partial<VisitInsert>): Promise<boolean> => {
    // Validate update data (partial validation)
    const partialSchema = visitSchema.partial();
    const validationResult = partialSchema.safeParse(updates);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Dados inválidos",
        description: firstError.message,
        variant: "destructive",
      });
      return false;
    }

    const validatedData = validationResult.data as Partial<VisitInsert>;
    const { error } = await supabase
      .from("visits")
      .update(validatedData)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar visita",
        description: getSafeErrorMessage(error, "updateVisit"),
        variant: "destructive",
      });
      return false;
    }

    await fetchVisits();
    toast({
      title: "Visita atualizada!",
    });
    return true;
  };

  const updateVisitStatus = async (id: string, status: string): Promise<boolean> => {
    // Validate status
    const statusSchema = z.string().max(50);
    const validationResult = statusSchema.safeParse(status);
    if (!validationResult.success) {
      toast({
        title: "Dados inválidos",
        description: "Status inválido",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("visits")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: getSafeErrorMessage(error, "updateVisitStatus"),
        variant: "destructive",
      });
      return false;
    }

    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v))
    );
    toast({
      title: "Status atualizado!",
    });
    return true;
  };

  const deleteVisit = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("visits")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir visita",
        description: getSafeErrorMessage(error, "deleteVisit"),
        variant: "destructive",
      });
      return false;
    }

    setVisits((prev) => prev.filter((v) => v.id !== id));
    toast({
      title: "Visita excluída!",
    });
    return true;
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  return {
    visits,
    loading,
    fetchVisits,
    createVisit,
    updateVisit,
    updateVisitStatus,
    deleteVisit,
  };
}

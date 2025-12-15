import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Visit {
  id: string;
  client_id: string | null;
  visit_date: string;
  visit_time: string;
  status: string;
  notes: string | null;
  guest_count: number | null;
  wedding_date_status: string;
  wedding_date: string | null;
  wedding_month: string | null;
  wedding_year: string | null;
  created_at: string;
  updated_at: string;
  // Joined client data
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
  status?: string;
  notes?: string | null;
  guest_count?: number | null;
  wedding_date_status?: string;
  wedding_date?: string | null;
  wedding_month?: string | null;
  wedding_year?: string | null;
}

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
        description: error.message,
        variant: "destructive",
      });
    } else {
      setVisits(data || []);
    }
    setLoading(false);
  };

  const createVisit = async (visit: VisitInsert): Promise<Visit | null> => {
    const { data, error } = await supabase
      .from("visits")
      .insert(visit)
      .select(`
        *,
        client:clients(nome, email, telefone)
      `)
      .single();

    if (error) {
      toast({
        title: "Erro ao criar visita",
        description: error.message,
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
    const { error } = await supabase
      .from("visits")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar visita",
        description: error.message,
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
    const { error } = await supabase
      .from("visits")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
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
        description: error.message,
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

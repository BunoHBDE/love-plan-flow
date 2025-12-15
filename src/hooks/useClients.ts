import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  cpf: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado_uf: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInsert {
  nome: string;
  email?: string | null;
  telefone: string;
  cpf?: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const createClient = async (client: ClientInsert): Promise<Client | null> => {
    const { data, error } = await supabase
      .from("clients")
      .insert(client)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    setClients((prev) => [data, ...prev]);
    toast({
      title: "Cliente criado!",
      description: `${client.nome} foi cadastrado com sucesso.`,
    });
    return data;
  };

  const updateClient = async (id: string, updates: Partial<ClientInsert>): Promise<boolean> => {
    const { error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    await fetchClients();
    toast({
      title: "Cliente atualizado!",
    });
    return true;
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    setClients((prev) => prev.filter((c) => c.id !== id));
    toast({
      title: "Cliente excluído!",
    });
    return true;
  };

  const searchClients = async (term: string): Promise<Client[]> => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .or(`nome.ilike.%${term}%,email.ilike.%${term}%,telefone.ilike.%${term}%`)
      .limit(10);

    if (error) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }

    return data || [];
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
  };
}

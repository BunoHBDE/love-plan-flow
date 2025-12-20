import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorHandler";

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

// Zod validation schema for client data
const clientSchema = z.object({
  nome: z.string()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres")
    .trim(),
  email: z.union([
    z.string().email("Email inválido").max(255, "Email muito longo"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
  telefone: z.string()
    .min(1, "Telefone é obrigatório")
    .max(20, "Telefone muito longo")
    .trim(),
  cpf: z.union([
    z.string().regex(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/, "CPF inválido (formato: 000.000.000-00)"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
  cep: z.union([
    z.string().max(10, "CEP muito longo"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
  rua: z.union([
    z.string().max(200, "Rua muito longa"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
  numero: z.union([
    z.string().max(20, "Número muito longo"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
  complemento: z.union([
    z.string().max(100, "Complemento muito longo"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
  bairro: z.union([
    z.string().max(100, "Bairro muito longo"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
  cidade: z.union([
    z.string().max(100, "Cidade muito longa"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
  estado_uf: z.union([
    z.string().length(2, "Estado deve ter 2 caracteres"),
    z.literal(""),
    z.null()
  ]).optional().nullable().transform(val => val === "" ? null : val),
});

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
        description: getSafeErrorMessage(error, "fetchClients"),
        variant: "destructive",
      });
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const createClient = async (client: ClientInsert): Promise<Client | null> => {
    // Validate client data
    const validationResult = clientSchema.safeParse(client);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Dados inválidos",
        description: firstError.message,
        variant: "destructive",
      });
      return null;
    }

    const validatedData = validationResult.data as ClientInsert;
    const { data, error } = await supabase
      .from("clients")
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar cliente",
        description: getSafeErrorMessage(error, "createClient"),
        variant: "destructive",
      });
      return null;
    }

    setClients((prev) => [data, ...prev]);
    toast({
      title: "Cliente criado!",
      description: `${validatedData.nome} foi cadastrado com sucesso.`,
    });
    return data;
  };

  const updateClient = async (id: string, updates: Partial<ClientInsert>): Promise<boolean> => {
    // Validate update data (partial validation)
    const partialSchema = clientSchema.partial();
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

    const validatedData = validationResult.data as Partial<ClientInsert>;
    const { error } = await supabase
      .from("clients")
      .update(validatedData)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar cliente",
        description: getSafeErrorMessage(error, "updateClient"),
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
        description: getSafeErrorMessage(error, "deleteClient"),
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
    // Sanitize search term - limit length and remove special characters that could cause issues
    const sanitizedTerm = term.trim().substring(0, 100);
    
    if (!sanitizedTerm) {
      return [];
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .or(`nome.ilike.%${sanitizedTerm}%,email.ilike.%${sanitizedTerm}%,telefone.ilike.%${sanitizedTerm}%`)
      .limit(10);

    if (error) {
      toast({
        title: "Erro na busca",
        description: getSafeErrorMessage(error, "searchClients"),
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

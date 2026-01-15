import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ContractTemplate, ContractTemplateInsertData } from '@/types/contract.types';
import { DEFAULT_CONTRACT_TEMPLATE } from '@/lib/contractPlaceholders';

const QUERY_KEY = 'contract_templates';

export function useContractTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContractTemplate[];
    },
    enabled: !!user?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (data: Omit<ContractTemplateInsertData, 'user_id'>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data: result, error } = await supabase
        .from('contract_templates')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Modelo criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar modelo:', error);
      toast.error('Erro ao criar modelo');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ContractTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('contract_templates')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Modelo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar modelo:', error);
      toast.error('Erro ao atualizar modelo');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Modelo excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir modelo:', error);
      toast.error('Erro ao excluir modelo');
    },
  });

  const setDefaultTemplate = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Remove default from all templates
      await supabase
        .from('contract_templates')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('contract_templates')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Modelo padrão definido!');
    },
    onError: (error) => {
      console.error('Erro ao definir modelo padrão:', error);
      toast.error('Erro ao definir modelo padrão');
    },
  });

  const getDefaultTemplate = (): ContractTemplate | null => {
    const templates = templatesQuery.data || [];
    return templates.find(t => t.is_default) || templates[0] || null;
  };

  const getDefaultContent = (): string => {
    const defaultTemplate = getDefaultTemplate();
    return defaultTemplate?.conteudo || DEFAULT_CONTRACT_TEMPLATE;
  };

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getDefaultTemplate,
    getDefaultContent,
  };
}

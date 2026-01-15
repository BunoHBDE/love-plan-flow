import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Contract, ContractInsertData, ContractStatus, DadosCliente, DadosEvento, DadosPagamento, DadosEmpresa } from '@/types/contract.types';

const QUERY_KEY = 'contracts';

export function useContracts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        status: item.status as ContractStatus,
        dados_cliente: item.dados_cliente as unknown as DadosCliente,
        dados_evento: item.dados_evento as unknown as DadosEvento,
        dados_pagamento: item.dados_pagamento as unknown as DadosPagamento,
        dados_empresa: item.dados_empresa as unknown as DadosEmpresa,
      })) as Contract[];
    },
    enabled: !!user?.id,
  });

  const createContract = useMutation({
    mutationFn: async (data: ContractInsertData) => {
      const { data: result, error } = await supabase
        .from('contracts')
        .insert({
          quote_id: data.quote_id || null,
          client_id: data.client_id,
          created_by: data.created_by,
          status: data.status || 'pendente',
          data_evento: data.data_evento || null,
          dados_cliente: JSON.parse(JSON.stringify(data.dados_cliente)),
          dados_evento: JSON.parse(JSON.stringify(data.dados_evento)),
          dados_pagamento: JSON.parse(JSON.stringify(data.dados_pagamento)),
          dados_empresa: JSON.parse(JSON.stringify(data.dados_empresa)),
          modelo_contrato: data.modelo_contrato || null,
          contract_number: '',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Contrato criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar contrato:', error);
      toast.error('Erro ao criar contrato');
    },
  });

  const updateContractStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      data_assinatura, 
      assinado_por 
    }: { 
      id: string; 
      status: ContractStatus; 
      data_assinatura?: string;
      assinado_por?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (data_assinatura) {
        updateData.data_assinatura = data_assinatura;
      }
      if (assinado_por) {
        updateData.assinado_por = assinado_por;
      }
      if (status === 'concluido') {
        updateData.data_conclusao = new Date().toISOString();
      }

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Contrato excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir contrato:', error);
      toast.error('Erro ao excluir contrato');
    },
  });

  return {
    contracts: contractsQuery.data || [],
    isLoading: contractsQuery.isLoading,
    error: contractsQuery.error,
    createContract,
    updateContractStatus,
    deleteContract,
  };
}

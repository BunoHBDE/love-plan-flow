import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, AlertCircle } from 'lucide-react';
import { useQuotes } from '@/hooks/useQuotes';
import { useContractTemplates } from '@/hooks/useContractTemplates';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { useSpaceSettings } from '@/hooks/useSpaceSettings';
import { useBuffetSettings } from '@/hooks/useBuffetSettings';
import { useServiceSettings } from '@/hooks/useServiceSettings';
import { usePackageSettings } from '@/hooks/usePackageSettings';
import { useAuth } from '@/hooks/useAuth';
import type { ContractInsertData, DadosCliente, DadosEvento, DadosPagamento, DadosEmpresa } from '@/types/contract.types';
import { DEFAULT_CONTRACT_TEMPLATE } from '@/lib/contractPlaceholders';
import type { ExtraItem } from '@/components/quotes/ExtrasForm';

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: ContractInsertData) => void;
  isLoading?: boolean;
}

export function CreateContractDialog({
  open,
  onOpenChange,
  onCreate,
  isLoading,
}: CreateContractDialogProps) {
  const { user } = useAuth();
  const { quotes } = useQuotes();
  const { templates, getDefaultContent } = useContractTemplates();
  const { profileData } = useProfileSettings();
  const { spaces } = useSpaceSettings();
  const { buffets } = useBuffetSettings();
  const { services } = useServiceSettings();
  const { packages } = usePackageSettings();

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Filter only accepted quotes
  const acceptedQuotes = useMemo(() => {
    return quotes.filter(q => q.status === 'aceito');
  }, [quotes]);

  const selectedQuote = useMemo(() => {
    return acceptedQuotes.find(q => q.id === selectedQuoteId);
  }, [acceptedQuotes, selectedQuoteId]);

  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  const handleCreate = () => {
    if (!selectedQuote || !user?.id) return;

    const client = selectedQuote.client;
    if (!client) return;

    // Build dados_cliente
    const dadosCliente: DadosCliente = {
      nome: client.nome,
      cpf: client.cpf || undefined,
      telefone: client.telefone,
      email: client.email || undefined,
      endereco: [
        client.rua,
        client.numero && `nº ${client.numero}`,
        client.complemento,
        client.bairro,
        client.cidade,
        client.estado_uf,
        client.cep,
      ].filter(Boolean).join(', ') || undefined,
    };

    // Get names from IDs - using pacote field since espaco_id, buffet_id, servico_ids may not exist
    // For now we use the pacote field which contains the package name
    const pacoteNome = selectedQuote.pacote;
    const buffetNome = selectedQuote.menu_buffet || undefined;

    // Parse extras
    const extras = (selectedQuote.extras_json as ExtraItem[] || []).map(e => ({
      descricao: e.descricao || '',
      valor: e.valor || 0,
    }));

    // Build dados_evento
    const dadosEvento: DadosEvento = {
      data_evento: selectedQuote.data_evento || undefined,
      dia_semana: selectedQuote.dia_semana || undefined,
      ano_evento: selectedQuote.ano_evento || undefined,
      tipo_evento: selectedQuote.tipo_evento || undefined,
      n_convidados: selectedQuote.n_convidados,
      buffet_nome: buffetNome,
      pacote_nome: pacoteNome,
      extras,
    };

    // Parse parcelas
    const parcelas = (selectedQuote.parcelas_json as Array<{ numero: number; valor: number; vencimento: string }> || []);

    // Build dados_pagamento
    const dadosPagamento: DadosPagamento = {
      valor_total: Number(selectedQuote.valor_total),
      percentual_sinal: selectedQuote.percentual_sinal,
      valor_sinal: Number(selectedQuote.valor_sinal),
      numero_parcelas: selectedQuote.numero_parcelas,
      dia_vencimento: selectedQuote.dia_vencimento,
      parcelas,
    };

    // Build dados_empresa from profile (using Portuguese field names from ProfileData)
    const dadosEmpresa: DadosEmpresa = {
      nome: profileData?.empresaNome || undefined,
      cnpj: profileData?.empresaCnpj || undefined,
      telefone: profileData?.empresaTelefone || undefined,
      email: profileData?.empresaEmail || undefined,
      endereco: [
        profileData?.empresaRua,
        profileData?.empresaNumero && `nº ${profileData.empresaNumero}`,
        profileData?.empresaComplemento,
        profileData?.empresaBairro,
        profileData?.empresaCidade,
        profileData?.empresaEstado,
        profileData?.empresaCep,
      ].filter(Boolean).join(', ') || undefined,
    };

    const contractData: ContractInsertData = {
      quote_id: selectedQuote.id,
      client_id: selectedQuote.client_id,
      created_by: user.id,
      data_evento: selectedQuote.data_evento || undefined,
      dados_cliente: dadosCliente,
      dados_evento: dadosEvento,
      dados_pagamento: dadosPagamento,
      dados_empresa: dadosEmpresa,
      modelo_contrato: selectedTemplate?.conteudo || getDefaultContent(),
    };

    onCreate(contractData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Criar Contrato
          </DialogTitle>
          <DialogDescription>
            Selecione um orçamento aceito para gerar o contrato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Orçamento Aceito</Label>
            {acceptedQuotes.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Nenhum orçamento aceito disponível</span>
              </div>
            ) : (
              <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um orçamento" />
                </SelectTrigger>
                <SelectContent>
                  {acceptedQuotes.map((quote) => (
                    <SelectItem key={quote.id} value={quote.id}>
                      {quote.quote_number} - {quote.client?.nome} ({formatCurrency(Number(quote.valor_total))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Modelo de Contrato (opcional)</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Usar modelo padrão" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nome} {template.is_default && '(Padrão)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedQuote && (
            <div className="space-y-2">
              <Label>Resumo do Orçamento</Label>
              <ScrollArea className="h-40">
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                  <p><strong>Cliente:</strong> {selectedQuote.client?.nome}</p>
                  <p><strong>Evento:</strong> {selectedQuote.tipo_evento || 'Não especificado'}</p>
                  <p><strong>Data:</strong> {selectedQuote.data_evento || 'Não definida'}</p>
                  <p><strong>Convidados:</strong> {selectedQuote.n_convidados}</p>
                  <p><strong>Valor Total:</strong> {formatCurrency(Number(selectedQuote.valor_total))}</p>
                  <p><strong>Sinal:</strong> {formatCurrency(Number(selectedQuote.valor_sinal))} ({selectedQuote.percentual_sinal}%)</p>
                  <p><strong>Parcelas:</strong> {selectedQuote.numero_parcelas}x</p>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedQuoteId || isLoading}
          >
            {isLoading ? 'Criando...' : 'Criar Contrato'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

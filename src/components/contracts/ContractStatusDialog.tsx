import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Contract, ContractStatus } from '@/types/contract.types';
import { CONTRACT_STATUS } from '@/types/contract.types';

interface ContractStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onSave: (data: { 
    id: string; 
    status: ContractStatus; 
    data_assinatura?: string;
    assinado_por?: string;
  }) => void;
  isLoading?: boolean;
}

export function ContractStatusDialog({
  open,
  onOpenChange,
  contract,
  onSave,
  isLoading,
}: ContractStatusDialogProps) {
  const [status, setStatus] = useState<ContractStatus>('pendente');
  const [dataAssinatura, setDataAssinatura] = useState('');
  const [assinadoPor, setAssinadoPor] = useState('');

  useEffect(() => {
    if (contract) {
      setStatus(contract.status);
      setDataAssinatura(contract.data_assinatura?.split('T')[0] || '');
      setAssinadoPor(contract.assinado_por || '');
    }
  }, [contract]);

  const handleSave = () => {
    if (!contract) return;

    onSave({
      id: contract.id,
      status,
      data_assinatura: status === 'assinado' || dataAssinatura ? dataAssinatura : undefined,
      assinado_por: status === 'assinado' || assinadoPor ? assinadoPor : undefined,
    });
  };

  const showSignatureFields = status === 'assinado' || status === 'em_execucao' || status === 'concluido';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Status do Contrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Contrato</Label>
            <p className="text-sm text-muted-foreground">
              {contract?.contract_number} - {contract?.dados_cliente.nome}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTRACT_STATUS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showSignatureFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dataAssinatura">Data da Assinatura</Label>
                <Input
                  id="dataAssinatura"
                  type="date"
                  value={dataAssinatura}
                  onChange={(e) => setDataAssinatura(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assinadoPor">Assinado por</Label>
                <Input
                  id="assinadoPor"
                  placeholder="Nome de quem assinou"
                  value={assinadoPor}
                  onChange={(e) => setAssinadoPor(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download } from 'lucide-react';
import type { Contract } from '@/types/contract.types';
import { replacePlaceholders, DEFAULT_CONTRACT_TEMPLATE } from '@/lib/contractPlaceholders';

interface ContractPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onGeneratePDF: (contract: Contract) => void;
}

export function ContractPreviewDialog({
  open,
  onOpenChange,
  contract,
  onGeneratePDF,
}: ContractPreviewDialogProps) {
  if (!contract) return null;

  const templateContent = contract.modelo_contrato || DEFAULT_CONTRACT_TEMPLATE;
  
  const renderedContent = replacePlaceholders(
    templateContent,
    contract.contract_number,
    contract.dados_cliente,
    contract.dados_evento,
    contract.dados_pagamento,
    contract.dados_empresa
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrato {contract.contract_number}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border whitespace-pre-wrap font-mono text-sm">
            {renderedContent}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => onGeneratePDF(contract)}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

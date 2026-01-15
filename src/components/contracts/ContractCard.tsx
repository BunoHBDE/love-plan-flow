import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  FileSignature, 
  Play, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  Trash2,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';
import type { Contract, ContractStatus } from '@/types/contract.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<ContractStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pendente: { label: 'Pendente', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  assinado: { label: 'Assinado', variant: 'default', icon: <FileSignature className="h-3 w-3" /> },
  em_execucao: { label: 'Em Execução', variant: 'secondary', icon: <Play className="h-3 w-3" /> },
  concluido: { label: 'Concluído', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  cancelado: { label: 'Cancelado', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

interface ContractCardProps {
  contract: Contract;
  onView: (contract: Contract) => void;
  onUpdateStatus: (contract: Contract) => void;
  onGeneratePDF: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
}

export function ContractCard({ 
  contract, 
  onView, 
  onUpdateStatus, 
  onGeneratePDF, 
  onDelete 
}: ContractCardProps) {
  const status = statusConfig[contract.status];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definida';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg">{contract.contract_number}</span>
              <Badge variant={status.variant} className="flex items-center gap-1">
                {status.icon}
                {status.label}
              </Badge>
            </div>
            <p className="text-base font-medium text-foreground">
              {contract.dados_cliente.nome}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(contract.data_evento)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{contract.dados_evento.n_convidados} convidados</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {formatCurrency(contract.dados_pagamento.valor_total)}
            </span>
          </div>
        </div>

        {contract.data_assinatura && (
          <div className="text-sm text-muted-foreground mb-4">
            <span>Assinado em: {formatDate(contract.data_assinatura)}</span>
            {contract.assinado_por && <span> por {contract.assinado_por}</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(contract)}>
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus(contract)}>
            <FileSignature className="h-4 w-4 mr-1" />
            Status
          </Button>
          <Button variant="outline" size="sm" onClick={() => onGeneratePDF(contract)}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(contract)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  AlertCircle, 
  Calendar, 
  Users, 
  ArrowRight,
  User,
} from 'lucide-react';
import { useQuotes } from '@/hooks/useQuotes';
import { useContracts } from '@/hooks/useContracts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuotesPendingContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuotesPendingContractDialog({
  open,
  onOpenChange,
}: QuotesPendingContractDialogProps) {
  const navigate = useNavigate();
  const { quotes } = useQuotes();
  const { contracts } = useContracts();

  // Get quote IDs that already have contracts
  const quotesWithContracts = useMemo(() => {
    return new Set(contracts.map(c => c.quote_id).filter(Boolean));
  }, [contracts]);

  // Filter accepted quotes that don't have contracts yet
  const pendingQuotes = useMemo(() => {
    return quotes.filter(q => 
      q.status === 'aceito' && !quotesWithContracts.has(q.id)
    );
  }, [quotes, quotesWithContracts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não definida';
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleCreateContract = (quoteId: string) => {
    onOpenChange(false);
    navigate(`/contratos/novo?quoteId=${quoteId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selecionar Orçamento
          </DialogTitle>
          <DialogDescription>
            Selecione um orçamento aceito para gerar o contrato.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {pendingQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="p-4 rounded-full bg-muted">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">
                  Nenhum orçamento pendente
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os orçamentos aceitos já possuem contratos gerados.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="font-mono">
                          {quote.quote_number}
                        </Badge>
                        <span className="text-lg font-semibold text-foreground">
                          {formatCurrency(Number(quote.valor_total))}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{quote.client?.nome || 'Cliente não encontrado'}</span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(quote.data_evento)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{quote.n_convidados} convidados</span>
                        </div>
                      </div>

                      {quote.tipo_evento && (
                        <p className="text-sm text-muted-foreground">
                          Evento: {quote.tipo_evento}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <Button
                      variant="gold"
                      size="sm"
                      className="gap-2 shrink-0"
                      onClick={() => handleCreateContract(quote.id)}
                    >
                      Criar Contrato
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

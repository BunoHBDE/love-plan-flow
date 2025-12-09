import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Calendar,
  Euro,
  Search,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Contract {
  id: string;
  clientName: string;
  weddingDate: string;
  totalValue: number;
  paidValue: number;
  status: "pendente" | "assinado" | "em_execucao" | "concluido" | "cancelado";
  signedAt?: string;
  quoteId: string;
}

const initialContracts: Contract[] = [
  {
    id: "CTR-001",
    clientName: "Maria & João",
    weddingDate: "2025-06-15",
    totalValue: 25000,
    paidValue: 12500,
    status: "em_execucao",
    signedAt: "2024-11-15",
    quoteId: "ORC-001",
  },
  {
    id: "CTR-002",
    clientName: "Juliana & Lucas",
    weddingDate: "2025-05-10",
    totalValue: 35000,
    paidValue: 35000,
    status: "concluido",
    signedAt: "2024-10-20",
    quoteId: "ORC-003",
  },
  {
    id: "CTR-003",
    clientName: "Fernanda & Ricardo",
    weddingDate: "2025-07-20",
    totalValue: 28000,
    paidValue: 7000,
    status: "assinado",
    signedAt: "2024-12-01",
    quoteId: "ORC-005",
  },
  {
    id: "CTR-004",
    clientName: "Patricia & Marcos",
    weddingDate: "2025-04-25",
    totalValue: 22000,
    paidValue: 0,
    status: "pendente",
    quoteId: "ORC-006",
  },
];

const statusLabels = {
  pendente: "Pendente Assinatura",
  assinado: "Assinado",
  em_execucao: "Em Execução",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const statusStyles = {
  pendente: "bg-warning/10 text-warning border-warning/20",
  assinado: "bg-primary/10 text-primary border-primary/20",
  em_execucao: "bg-success/10 text-success border-success/20",
  concluido: "bg-muted text-muted-foreground border-border",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusIcons = {
  pendente: Clock,
  assinado: CheckCircle,
  em_execucao: CheckCircle,
  concluido: CheckCircle,
  cancelado: AlertCircle,
};

export default function Contratos() {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContracts = contracts.filter((contract) =>
    contract.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const getPaymentProgress = (paid: number, total: number) => {
    return Math.round((paid / total) * 100);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Contratos
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe os contratos e seus status
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-slide-up">
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <p className="text-sm text-muted-foreground">Total de Contratos</p>
            <p className="text-2xl font-display font-bold text-foreground">
              {contracts.length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <p className="text-sm text-muted-foreground">Em Execução</p>
            <p className="text-2xl font-display font-bold text-success">
              {contracts.filter((c) => c.status === "em_execucao").length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-display font-bold text-warning">
              {contracts.filter((c) => c.status === "pendente").length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-display font-bold text-primary">
              {formatCurrency(contracts.reduce((acc, c) => acc + c.totalValue, 0))}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-slide-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contratos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contracts Grid */}
        <div className="grid gap-4 md:grid-cols-2 animate-slide-up">
          {filteredContracts.map((contract) => {
            const StatusIcon = statusIcons[contract.status];
            const progress = getPaymentProgress(
              contract.paidValue,
              contract.totalValue
            );

            return (
              <div
                key={contract.id}
                className="bg-card rounded-xl p-6 shadow-soft border border-border transition-all duration-200 hover:shadow-medium"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {contract.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          statusStyles[contract.status]
                        }`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusLabels[contract.status]}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-lg mt-1">
                      {contract.clientName}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" title="Ver">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(contract.weddingDate).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    {formatCurrency(contract.totalValue)}
                  </span>
                </div>

                {/* Payment Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Pagamento: {formatCurrency(contract.paidValue)} /{" "}
                      {formatCurrency(contract.totalValue)}
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {contract.signedAt && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Assinado em{" "}
                    {new Date(contract.signedAt).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            );
          })}

          {filteredContracts.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contrato encontrado</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

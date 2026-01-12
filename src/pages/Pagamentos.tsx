import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubscriptionGate } from "@/components/subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Calendar,
  Euro,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  clientName: string;
  contractId: string;
  amount: number;
  date: string;
  type: "entrada" | "parcela" | "quitacao";
  method: "pix" | "transferencia" | "cartao" | "dinheiro" | "cheque";
  status: "confirmado" | "pendente" | "cancelado";
}

const initialPayments: Payment[] = [
  {
    id: "PAG-001",
    clientName: "Maria & João",
    contractId: "CTR-001",
    amount: 7500,
    date: "2024-12-01",
    type: "entrada",
    method: "pix",
    status: "confirmado",
  },
  {
    id: "PAG-002",
    clientName: "Maria & João",
    contractId: "CTR-001",
    amount: 5000,
    date: "2024-12-05",
    type: "parcela",
    method: "transferencia",
    status: "confirmado",
  },
  {
    id: "PAG-003",
    clientName: "Juliana & Lucas",
    contractId: "CTR-002",
    amount: 35000,
    date: "2024-11-20",
    type: "quitacao",
    method: "transferencia",
    status: "confirmado",
  },
  {
    id: "PAG-004",
    clientName: "Fernanda & Ricardo",
    contractId: "CTR-003",
    amount: 7000,
    date: "2024-12-08",
    type: "entrada",
    method: "cartao",
    status: "pendente",
  },
];

const typeLabels = {
  entrada: "Entrada",
  parcela: "Parcela",
  quitacao: "Quitação",
};

const methodLabels = {
  pix: "PIX",
  transferencia: "Transferência",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  cheque: "Cheque",
};

const statusStyles = {
  confirmado: "bg-success/10 text-success border-success/20",
  pendente: "bg-warning/10 text-warning border-warning/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Pagamentos() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    clientName: "",
    contractId: "",
    amount: 0,
    date: "",
    type: "parcela" as Payment["type"],
    method: "pix" as Payment["method"],
  });
  const { toast } = useToast();

  const filteredPayments = payments.filter((payment) =>
    payment.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmedPayments = payments.filter((p) => p.status === "confirmado");
  const totalReceived = confirmedPayments.reduce((acc, p) => acc + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "pendente");
  const totalPending = pendingPayments.reduce((acc, p) => acc + p.amount, 0);

  const handleCreatePayment = () => {
    if (!newPayment.clientName || !newPayment.amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha cliente e valor.",
        variant: "destructive",
      });
      return;
    }

    const payment: Payment = {
      id: `PAG-${String(payments.length + 1).padStart(3, "0")}`,
      ...newPayment,
      status: "pendente",
    };

    setPayments([payment, ...payments]);
    setNewPayment({
      clientName: "",
      contractId: "",
      amount: 0,
      date: "",
      type: "parcela",
      method: "pix",
    });
    setIsDialogOpen(false);

    toast({
      title: "Pagamento registrado!",
      description: `Pagamento de ${formatCurrency(payment.amount)} registrado.`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  return (
    <MainLayout>
      <SubscriptionGate>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Pagamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle o fluxo financeiro do seu espaço
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="h-5 w-5" />
                Registrar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Registrar Novo Pagamento
                </DialogTitle>
                <DialogDescription>
                  Adicione um novo recebimento ao sistema.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientName">Cliente *</Label>
                  <Input
                    id="clientName"
                    value={newPayment.clientName}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        clientName: e.target.value,
                      })
                    }
                    placeholder="Nome do casal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Valor (€) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newPayment.amount || ""}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="5000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newPayment.date}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newPayment.type}
                      onValueChange={(value) =>
                        setNewPayment({
                          ...newPayment,
                          type: value as Payment["type"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="parcela">Parcela</SelectItem>
                        <SelectItem value="quitacao">Quitação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Método</Label>
                    <Select
                      value={newPayment.method}
                      onValueChange={(value) =>
                        setNewPayment({
                          ...newPayment,
                          method: value as Payment["method"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">
                          Transferência
                        </SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contractId">Nº do Contrato</Label>
                  <Input
                    id="contractId"
                    value={newPayment.contractId}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        contractId: e.target.value,
                      })
                    }
                    placeholder="CTR-001"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="gold" onClick={handleCreatePayment}>
                  Registrar Pagamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recebido</p>
                <p className="text-3xl font-display font-bold text-success mt-1">
                  {formatCurrency(totalReceived)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <ArrowUpRight className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-3xl font-display font-bold text-warning mt-1">
                  {formatCurrency(totalPending)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <ArrowDownRight className="h-6 w-6 text-warning" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Transações este mês
                </p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">
                  {payments.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-slide-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pagamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Payments List */}
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Tipo
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Método
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="p-4 text-muted-foreground">
                      {payment.date
                        ? new Date(payment.date).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="font-medium">{payment.clientName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {payment.contractId}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {typeLabels[payment.type]}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {methodLabels[payment.method]}
                    </td>
                    <td className="p-4">
                      <span className="font-display font-semibold text-foreground">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border capitalize ${
                          statusStyles[payment.status]
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pagamento encontrado</p>
            </div>
          )}
        </div>
      </div>
      </SubscriptionGate>
    </MainLayout>
  );
}

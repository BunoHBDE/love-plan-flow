import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FileText,
  Calendar,
  Euro,
  Plus,
  Search,
  Download,
  Eye,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Quote {
  id: string;
  clientName: string;
  weddingDate: string;
  guestCount: number;
  totalValue: number;
  status: "rascunho" | "enviado" | "aceito" | "recusado" | "expirado";
  createdAt: string;
  validUntil: string;
  items: {
    description: string;
    value: number;
  }[];
}

const initialQuotes: Quote[] = [
  {
    id: "ORC-001",
    clientName: "Maria & João",
    weddingDate: "2025-06-15",
    guestCount: 150,
    totalValue: 25000,
    status: "enviado",
    createdAt: "2024-12-01",
    validUntil: "2024-12-31",
    items: [
      { description: "Locação do Espaço", value: 15000 },
      { description: "Decoração Básica", value: 5000 },
      { description: "Serviço de Buffet", value: 5000 },
    ],
  },
  {
    id: "ORC-002",
    clientName: "Ana & Pedro",
    weddingDate: "2025-08-20",
    guestCount: 100,
    totalValue: 18000,
    status: "rascunho",
    createdAt: "2024-12-05",
    validUntil: "2025-01-05",
    items: [
      { description: "Locação do Espaço", value: 12000 },
      { description: "Decoração Premium", value: 6000 },
    ],
  },
  {
    id: "ORC-003",
    clientName: "Juliana & Lucas",
    weddingDate: "2025-05-10",
    guestCount: 200,
    totalValue: 35000,
    status: "aceito",
    createdAt: "2024-11-20",
    validUntil: "2024-12-20",
    items: [
      { description: "Locação do Espaço", value: 20000 },
      { description: "Decoração Luxo", value: 10000 },
      { description: "Open Bar", value: 5000 },
    ],
  },
  {
    id: "ORC-004",
    clientName: "Carla & Bruno",
    weddingDate: "2025-09-25",
    guestCount: 80,
    totalValue: 12000,
    status: "recusado",
    createdAt: "2024-11-15",
    validUntil: "2024-12-15",
    items: [{ description: "Locação do Espaço", value: 12000 }],
  },
];

const statusLabels = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
  expirado: "Expirado",
};

const statusStyles = {
  rascunho: "bg-muted text-muted-foreground border-border",
  enviado: "bg-primary/10 text-primary border-primary/20",
  aceito: "bg-success/10 text-success border-success/20",
  recusado: "bg-destructive/10 text-destructive border-destructive/20",
  expirado: "bg-warning/10 text-warning border-warning/20",
};

export default function Orcamentos() {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newQuote, setNewQuote] = useState({
    clientName: "",
    weddingDate: "",
    guestCount: 0,
    spaceValue: 0,
    decorationValue: 0,
    extraServices: 0,
  });
  const { toast } = useToast();

  const filteredQuotes = quotes.filter((quote) =>
    quote.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateQuote = () => {
    if (!newQuote.clientName) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    const totalValue =
      newQuote.spaceValue + newQuote.decorationValue + newQuote.extraServices;

    const quote: Quote = {
      id: `ORC-${String(quotes.length + 1).padStart(3, "0")}`,
      clientName: newQuote.clientName,
      weddingDate: newQuote.weddingDate,
      guestCount: newQuote.guestCount,
      totalValue,
      status: "rascunho",
      createdAt: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      items: [
        { description: "Locação do Espaço", value: newQuote.spaceValue },
        { description: "Decoração", value: newQuote.decorationValue },
        { description: "Serviços Extras", value: newQuote.extraServices },
      ].filter((item) => item.value > 0),
    };

    setQuotes([quote, ...quotes]);
    setNewQuote({
      clientName: "",
      weddingDate: "",
      guestCount: 0,
      spaceValue: 0,
      decorationValue: 0,
      extraServices: 0,
    });
    setIsDialogOpen(false);

    toast({
      title: "Orçamento criado!",
      description: `Orçamento ${quote.id} criado com sucesso.`,
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Orçamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie e gerencie propostas comerciais
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="h-5 w-5" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Criar Novo Orçamento
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados para gerar uma proposta.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientName">Cliente *</Label>
                  <Input
                    id="clientName"
                    value={newQuote.clientName}
                    onChange={(e) =>
                      setNewQuote({ ...newQuote, clientName: e.target.value })
                    }
                    placeholder="Nome do casal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="weddingDate">Data do Casamento</Label>
                    <Input
                      id="weddingDate"
                      type="date"
                      value={newQuote.weddingDate}
                      onChange={(e) =>
                        setNewQuote({
                          ...newQuote,
                          weddingDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guestCount">Nº de Convidados</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      value={newQuote.guestCount || ""}
                      onChange={(e) =>
                        setNewQuote({
                          ...newQuote,
                          guestCount: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="150"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-2">
                  <h4 className="font-medium mb-4">Valores do Orçamento</h4>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="spaceValue">Locação do Espaço (€)</Label>
                      <Input
                        id="spaceValue"
                        type="number"
                        value={newQuote.spaceValue || ""}
                        onChange={(e) =>
                          setNewQuote({
                            ...newQuote,
                            spaceValue: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="15000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="decorationValue">Decoração (€)</Label>
                      <Input
                        id="decorationValue"
                        type="number"
                        value={newQuote.decorationValue || ""}
                        onChange={(e) =>
                          setNewQuote({
                            ...newQuote,
                            decorationValue: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="5000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="extraServices">Serviços Extras (€)</Label>
                      <Input
                        id="extraServices"
                        type="number"
                        value={newQuote.extraServices || ""}
                        onChange={(e) =>
                          setNewQuote({
                            ...newQuote,
                            extraServices: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="3000"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total do Orçamento</span>
                    <span className="text-xl font-display font-bold text-primary">
                      {formatCurrency(
                        newQuote.spaceValue +
                          newQuote.decorationValue +
                          newQuote.extraServices
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="gold" onClick={handleCreateQuote}>
                  Criar Orçamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-slide-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar orçamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quotes Table */}
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Nº
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Data Casamento
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm font-medium">
                        {quote.id}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{quote.clientName}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {quote.weddingDate
                        ? new Date(quote.weddingDate).toLocaleDateString(
                            "pt-BR"
                          )
                        : "-"}
                    </td>
                    <td className="p-4">
                      <span className="font-display font-semibold text-foreground">
                        {formatCurrency(quote.totalValue)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                          statusStyles[quote.status]
                        }`}
                      >
                        {statusLabels[quote.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" title="Ver">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        {quote.status === "rascunho" && (
                          <Button variant="ghost" size="icon" title="Enviar">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuotes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum orçamento encontrado</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

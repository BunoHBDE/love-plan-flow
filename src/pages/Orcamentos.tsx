import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Send,
} from "lucide-react";

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
  const [quotes] = useState<Quote[]>(initialQuotes);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredQuotes = quotes.filter((quote) =>
    quote.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
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

          <Button variant="gold" size="lg" onClick={() => navigate("/orcamentos/novo")}>
            <Plus className="h-5 w-5" />
            Novo Orçamento
          </Button>
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
                        ? new Date(quote.weddingDate + "T12:00:00").toLocaleDateString(
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

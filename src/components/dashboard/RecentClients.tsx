import { Users, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Client {
  id: string;
  name: string;
  partner: string;
  weddingDate: string;
  status: "lead" | "orcamento" | "contrato" | "pago";
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Maria & João",
    partner: "João Silva",
    weddingDate: "2025-06-15",
    status: "contrato",
  },
  {
    id: "2",
    name: "Ana & Pedro",
    partner: "Pedro Oliveira",
    weddingDate: "2025-08-20",
    status: "orcamento",
  },
  {
    id: "3",
    name: "Juliana & Lucas",
    partner: "Lucas Santos",
    weddingDate: "2025-05-10",
    status: "pago",
  },
  {
    id: "4",
    name: "Carla & Bruno",
    partner: "Bruno Costa",
    weddingDate: "2025-09-25",
    status: "lead",
  },
];

const statusLabels = {
  lead: "Novo Lead",
  orcamento: "Orçamento",
  contrato: "Contrato",
  pago: "Confirmado",
};

const statusStyles = {
  lead: "bg-rose-light text-rose",
  orcamento: "bg-warning/10 text-warning",
  contrato: "bg-primary/10 text-primary",
  pago: "bg-success/10 text-success",
};

export function RecentClients() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Clientes Recentes
          </h3>
          <p className="text-sm text-muted-foreground">
            Últimos casais cadastrados
          </p>
        </div>
        <Button variant="elegant" size="sm">
          <Users className="h-4 w-4" />
          Ver todos
        </Button>
      </div>

      <div className="space-y-3">
        {mockClients.map((client) => (
          <div
            key={client.id}
            className="group flex items-center justify-between p-4 rounded-lg border border-transparent transition-all duration-200 hover:bg-secondary/30 hover:border-border/50 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-light">
                <Heart className="h-5 w-5 text-rose" />
              </div>
              <div>
                <p className="font-medium text-foreground">{client.name}</p>
                <p className="text-sm text-muted-foreground">
                  Casamento: {new Date(client.weddingDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusStyles[client.status]
                }`}
              >
                {statusLabels[client.status]}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

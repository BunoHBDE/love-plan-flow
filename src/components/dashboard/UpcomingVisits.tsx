import { Calendar, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Visit {
  id: string;
  clientName: string;
  date: string;
  time: string;
  phone: string;
  status: "confirmada" | "pendente" | "cancelada";
}

const mockVisits: Visit[] = [
  {
    id: "1",
    clientName: "Maria Silva",
    date: "2024-12-15",
    time: "14:00",
    phone: "(11) 99999-0001",
    status: "confirmada",
  },
  {
    id: "2",
    clientName: "Ana Oliveira",
    date: "2024-12-16",
    time: "10:30",
    phone: "(11) 99999-0002",
    status: "pendente",
  },
  {
    id: "3",
    clientName: "Juliana Santos",
    date: "2024-12-17",
    time: "16:00",
    phone: "(11) 99999-0003",
    status: "confirmada",
  },
];

const statusStyles = {
  confirmada: "bg-success/10 text-success",
  pendente: "bg-warning/10 text-warning",
  cancelada: "bg-destructive/10 text-destructive",
};

export function UpcomingVisits() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Próximas Visitas
          </h3>
          <p className="text-sm text-muted-foreground">
            Visitas agendadas para os próximos dias
          </p>
        </div>
        <Button variant="gold" size="sm">
          <Calendar className="h-4 w-4" />
          Agendar
        </Button>
      </div>

      <div className="space-y-4">
        {mockVisits.map((visit) => (
          <div
            key={visit.id}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 transition-all duration-200 hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne">
                <User className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-medium text-foreground">{visit.clientName}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(visit.date).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {visit.time}
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                statusStyles[visit.status]
              }`}
            >
              {visit.status}
            </span>
          </div>
        ))}
      </div>

      <Button variant="ghost" className="w-full mt-4 text-muted-foreground">
        Ver todas as visitas
      </Button>
    </div>
  );
}

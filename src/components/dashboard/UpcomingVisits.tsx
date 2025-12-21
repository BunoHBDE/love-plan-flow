import { Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVisits } from "@/hooks/useVisits";
import { useClients } from "@/hooks/useClients";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const statusStyles = {
  agendado: "bg-warning/10 text-warning",
  confirmado: "bg-success/10 text-success",
  realizado: "bg-primary/10 text-primary",
  cancelado: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export function UpcomingVisits() {
  const { visits, loading: visitsLoading } = useVisits();
  const { clients, loading: clientsLoading } = useClients();

  const isLoading = visitsLoading || clientsLoading;

  // Get upcoming visits (future or today, not cancelled)
  const upcomingVisits = visits
    ?.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return visitDate >= today && visit.status !== 'cancelado';
    })
    .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
    .slice(0, 5) || [];

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Cliente não vinculado";
    const client = clients?.find(c => c.id === clientId);
    return client?.nome || "Cliente";
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasVisits = upcomingVisits.length > 0;

  return (
    <div className={`bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up ${!hasVisits ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Próximas Visitas
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasVisits ? "Visitas agendadas para os próximos dias" : "Nenhuma visita agendada"}
          </p>
        </div>
        <Button variant="gold" size="sm" asChild>
          <Link to="/visitas">
            <Calendar className="h-4 w-4" />
            Agendar
          </Link>
        </Button>
      </div>

      {hasVisits ? (
        <>
          <div className="space-y-4">
            {upcomingVisits.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 transition-all duration-200 hover:bg-secondary/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne">
                    <User className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{getClientName(visit.client_id)}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(visit.visit_date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {visit.visit_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    statusStyles[visit.status as keyof typeof statusStyles] || statusStyles.agendado
                  }`}
                >
                  {statusLabels[visit.status] || visit.status}
                </span>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="w-full mt-4 text-muted-foreground" asChild>
            <Link to="/visitas">Ver todas as visitas</Link>
          </Button>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma visita agendada</p>
          <p className="text-sm">Clique em "Agendar" para criar uma nova visita</p>
        </div>
      )}
    </div>
  );
}

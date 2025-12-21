import { Users, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useClients";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export function RecentClients() {
  const { clients, loading: isLoading } = useClients();

  // Get 5 most recent clients
  const recentClients = clients
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasClients = recentClients.length > 0;

  return (
    <div className={`bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up ${!hasClients ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Clientes Recentes
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasClients ? "Últimos clientes cadastrados" : "Nenhum cliente cadastrado"}
          </p>
        </div>
        <Button variant="elegant" size="sm" asChild>
          <Link to="/clientes">
            <Users className="h-4 w-4" />
            Ver todos
          </Link>
        </Button>
      </div>

      {hasClients ? (
        <div className="space-y-3">
          {recentClients.map((client) => (
            <div
              key={client.id}
              className="group flex items-center justify-between p-4 rounded-lg border border-transparent transition-all duration-200 hover:bg-secondary/30 hover:border-border/50 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-light">
                  <Heart className="h-5 w-5 text-rose" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{client.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.telefone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(client.created_at).toLocaleDateString("pt-BR")}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum cliente cadastrado</p>
          <p className="text-sm">Acesse a página de clientes para cadastrar</p>
        </div>
      )}
    </div>
  );
}

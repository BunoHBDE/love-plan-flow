import { Calendar, FileText, Users, CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const actions = [
  {
    icon: Calendar,
    label: "Agendar Visita",
    description: "Nova visita ao espaço",
    path: "/visitas",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FileText,
    label: "Novo Orçamento",
    description: "Criar proposta comercial",
    path: "/orcamentos",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: Users,
    label: "Novo Cliente",
    description: "Cadastrar casal",
    path: "/clientes",
    color: "bg-rose/10 text-rose",
  },
  {
    icon: CreditCard,
    label: "Registrar Pagamento",
    description: "Adicionar recebimento",
    path: "/pagamentos",
    color: "bg-success/10 text-success",
  },
];

export function QuickActions() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
      <div className="mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">
          Ações Rápidas
        </h3>
        <p className="text-sm text-muted-foreground">
          Acesse as funções mais utilizadas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-border transition-all duration-200 hover:border-primary hover:shadow-soft text-center"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color} transition-transform group-hover:scale-110`}
            >
              <action.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">
                {action.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

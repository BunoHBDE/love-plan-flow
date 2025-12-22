import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingVisits } from "@/components/dashboard/UpcomingVisits";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  Calendar,
  FileText,
  Users,
} from "lucide-react";
import { useVisitsOptimized as useVisits } from "@/hooks/useVisitsOptimized";
import { useClientsOptimized as useClients } from "@/hooks/useClientsOptimized";
import { useQuotesOptimized as useQuotes } from "@/hooks/useQuotesOptimized";

const Index = () => {
  const { visits, loading: visitsLoading } = useVisits();
  const { clients, loading: clientsLoading } = useClients();
  const { quotes, loading: quotesLoading } = useQuotes();

  const isLoading = visitsLoading || clientsLoading || quotesLoading;

  // Count visits scheduled for this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const visitsThisMonth = visits?.filter(visit => {
    const visitDate = new Date(visit.visit_date);
    return visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear;
  }).length || 0;

  // Count quotes in open status
  const openQuotes = quotes?.filter(quote => 
    quote.status === 'rascunho' || quote.status === 'enviado'
  ).length || 0;

  // Total clients
  const totalClients = clients?.length || 0;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Bem-vindo ao Painel
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu espaço de casamentos de forma simples e elegante
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Visitas Agendadas"
            value={visitsThisMonth}
            subtitle="Este mês"
            icon={<Calendar className="h-6 w-6 text-primary-foreground" />}
            isLoading={isLoading}
            disabled={!visits || visits.length === 0}
          />
          <StatCard
            title="Orçamentos"
            value={openQuotes}
            subtitle="Em aberto"
            icon={<FileText className="h-6 w-6 text-primary-foreground" />}
            isLoading={isLoading}
            disabled={!quotes || quotes.length === 0}
          />
          <StatCard
            title="Clientes"
            value={totalClients}
            subtitle="Cadastrados"
            icon={<Users className="h-6 w-6 text-primary-foreground" />}
            isLoading={isLoading}
            disabled={!clients || clients.length === 0}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Takes 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <UpcomingVisits />
            <RecentClients />
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;

import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingVisits } from "@/components/dashboard/UpcomingVisits";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  Calendar,
  FileText,
  Users,
  CreditCard,
} from "lucide-react";

const Index = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Visitas Agendadas"
            value={12}
            subtitle="Este mês"
            icon={<Calendar className="h-6 w-6 text-primary-foreground" />}
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Orçamentos"
            value={8}
            subtitle="Em aberto"
            icon={<FileText className="h-6 w-6 text-primary-foreground" />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Clientes Ativos"
            value={24}
            subtitle="Casamentos confirmados"
            icon={<Users className="h-6 w-6 text-primary-foreground" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Receita do Mês"
            value="€ 45.000"
            subtitle="Meta: € 60.000"
            icon={<CreditCard className="h-6 w-6 text-primary-foreground" />}
            trend={{ value: 8, isPositive: true }}
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

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  User,
  CreditCard,
  FileText,
  ScrollText,
  Calendar,
  CalendarCheck,
  Camera,
  Building2,
  Lock,
  Check,
  Crown,
  Receipt,
} from "lucide-react";

type MainSection = "perfil" | "assinatura" | "orcamentos" | "contratos" | "visitas" | "disponibilidade";
type OrcamentoSubSection = "espaco" | "pacotes" | "buffet" | "extras" | "pagamento" | "listas";

const mainSections = [
  { id: "perfil" as const, label: "Perfil", icon: User },
  { id: "assinatura" as const, label: "Assinatura", icon: CreditCard },
  { id: "orcamentos" as const, label: "Orçamentos", icon: FileText },
  { id: "contratos" as const, label: "Contratos", icon: ScrollText },
  { id: "visitas" as const, label: "Visitas", icon: Calendar },
  { id: "disponibilidade" as const, label: "Disponibilidade", icon: CalendarCheck },
];

const orcamentoSubSections = [
  { id: "espaco" as const, label: "Espaço" },
  { id: "pacotes" as const, label: "Pacotes" },
  { id: "buffet" as const, label: "Buffet" },
  { id: "extras" as const, label: "Extras" },
  { id: "pagamento" as const, label: "Pagamento" },
  { id: "listas" as const, label: "Listas" },
];

export default function Configuracoes() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState<MainSection>("perfil");
  const [activeOrcamentoSub, setActiveOrcamentoSub] = useState<OrcamentoSubSection>("espaco");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states - Perfil
  const [perfilData, setPerfilData] = useState({
    nome: profile?.full_name || "",
    telefone: "",
    whatsapp: "",
    empresaNome: "",
    empresaCnpj: "",
    empresaEndereco: "",
    empresaTelefone: "",
    empresaEmail: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setPerfilData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Configurações salvas com sucesso!");
  };

  const renderPerfilSection = () => (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-primary" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Seus dados de contato e foto de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <Camera className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <Button variant="outline" size="sm">Alterar foto</Button>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={perfilData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={perfilData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={perfilData.whatsapp}
                onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>Informações do seu espaço de eventos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <Button variant="outline" size="sm">Alterar logo</Button>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empresaNome">Nome da empresa</Label>
              <Input
                id="empresaNome"
                value={perfilData.empresaNome}
                onChange={(e) => handleInputChange("empresaNome", e.target.value)}
                placeholder="Nome do espaço"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaCnpj">CNPJ</Label>
              <Input
                id="empresaCnpj"
                value={perfilData.empresaCnpj}
                onChange={(e) => handleInputChange("empresaCnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="empresaEndereco">Endereço</Label>
              <Input
                id="empresaEndereco"
                value={perfilData.empresaEndereco}
                onChange={(e) => handleInputChange("empresaEndereco", e.target.value)}
                placeholder="Endereço completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaTelefone">Telefone comercial</Label>
              <Input
                id="empresaTelefone"
                value={perfilData.empresaTelefone}
                onChange={(e) => handleInputChange("empresaTelefone", e.target.value)}
                placeholder="(00) 0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaEmail">Email comercial</Label>
              <Input
                id="empresaEmail"
                value={perfilData.empresaEmail}
                onChange={(e) => handleInputChange("empresaEmail", e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alteração de Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Alteração de Senha
          </CardTitle>
          <CardDescription>Mantenha sua conta segura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <Input id="senhaAtual" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input id="novaSenha" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input id="confirmarSenha" type="password" placeholder="••••••••" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssinaturaSection = () => (
    <div className="space-y-6">
      {/* Plano Atual */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5 text-gold" />
                Plano Atual
              </CardTitle>
              <CardDescription>Gerenciamento da sua assinatura</CardDescription>
            </div>
            <div className="px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-medium">
              Ativo
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">Plano Pro</span>
            <span className="text-muted-foreground">/ mensal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Próxima cobrança em 15 de Janeiro de 2026
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Alterar plano</Button>
            <Button variant="ghost" size="sm" className="text-destructive">Cancelar assinatura</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recursos Incluídos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Check className="h-5 w-5 text-primary" />
            Recursos Incluídos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Orçamentos ilimitados",
              "Gestão de clientes",
              "Controle de visitas",
              "Calendário de disponibilidade",
              "Geração de contratos",
              "Relatórios avançados",
              "Suporte prioritário",
              "Backup automático",
            ].map((recurso) => (
              <div key={recurso} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>{recurso}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Histórico de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { data: "15/12/2025", valor: "R$ 99,90", status: "Pago" },
              { data: "15/11/2025", valor: "R$ 99,90", status: "Pago" },
              { data: "15/10/2025", valor: "R$ 99,90", status: "Pago" },
            ].map((fatura, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{fatura.data}</p>
                  <p className="text-sm text-muted-foreground">{fatura.valor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                    {fatura.status}
                  </span>
                  <Button variant="ghost" size="sm">Baixar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrcamentosSection = () => (
    <div className="space-y-6">
      {/* Sub-navegação */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-lg border">
        {orcamentoSubSections.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveOrcamentoSub(sub.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeOrcamentoSub === sub.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da sub-seção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Configurações de {orcamentoSubSections.find(s => s.id === activeOrcamentoSub)?.label}
          </CardTitle>
          <CardDescription>
            Gerencie as opções disponíveis para seus orçamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Em breve você poderá configurar as opções de {activeOrcamentoSub} aqui.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlaceholderSection = (title: string, icon: React.ReactNode) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          Configurações de {title}
        </CardTitle>
        <CardDescription>
          Personalize as configurações relacionadas a {title.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <div className="mx-auto mb-4 opacity-50">{icon}</div>
          <p>Em breve você poderá configurar {title.toLowerCase()} aqui.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "perfil":
        return renderPerfilSection();
      case "assinatura":
        return renderAssinaturaSection();
      case "orcamentos":
        return renderOrcamentosSection();
      case "contratos":
        return renderPlaceholderSection("Contratos", <ScrollText className="h-12 w-12" />);
      case "visitas":
        return renderPlaceholderSection("Visitas", <Calendar className="h-12 w-12" />);
      case "disponibilidade":
        return renderPlaceholderSection("Disponibilidade", <CalendarCheck className="h-12 w-12" />);
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua conta e personalize o sistema
          </p>
        </div>

        {/* Toggle Principal */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-muted/50 rounded-xl border shadow-sm animate-slide-up">
          {mainSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Área de Conteúdo */}
        <div className="animate-fade-in">
          {renderActiveSection()}
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="min-w-[180px]"
          >
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

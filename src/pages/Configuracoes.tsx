import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPhone, formatCNPJ } from "@/lib/masks";
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
  Loader2,
  Upload,
  X,
  Eye,
  EyeOff,
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

interface ProfileData {
  nome: string;
  telefone: string;
  whatsapp: string;
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco: string;
  empresaTelefone: string;
  empresaEmail: string;
  empresaLogoUrl: string;
}

// Password requirements checker
const getPasswordRequirements = (password: string) => ({
  minLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecial: /[^a-zA-Z0-9]/.test(password),
});

const isPasswordValid = (password: string): boolean => {
  const req = getPasswordRequirements(password);
  return req.minLength && req.hasUppercase && req.hasLowercase && req.hasNumber && req.hasSpecial;
};

// Password strength calculator
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: "", color: "" };
  
  const req = getPasswordRequirements(password);
  let score = 0;
  if (req.minLength) score++;
  if (req.hasLowercase) score++;
  if (req.hasUppercase) score++;
  if (req.hasNumber) score++;
  if (req.hasSpecial) score++;

  if (score <= 2) return { score, label: "Fraca", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Média", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Boa", color: "bg-emerald-500" };
  return { score, label: "Forte", color: "bg-emerald-600" };
};

export default function Configuracoes() {
  const { profile, user } = useAuth();
  const [activeSection, setActiveSection] = useState<MainSection>("perfil");
  const [activeOrcamentoSub, setActiveOrcamentoSub] = useState<OrcamentoSubSection>("espaco");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form states - Perfil
  const [perfilData, setPerfilData] = useState<ProfileData>({
    nome: "",
    telefone: "",
    whatsapp: "",
    empresaNome: "",
    empresaCnpj: "",
    empresaEndereco: "",
    empresaTelefone: "",
    empresaEmail: "",
    empresaLogoUrl: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    senhaAtual: false,
    novaSenha: false,
    confirmarSenha: false,
  });

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data && !error) {
        setPerfilData({
          nome: data.full_name || "",
          telefone: (data as any).phone || "",
          whatsapp: (data as any).whatsapp || "",
          empresaNome: (data as any).company_name || "",
          empresaCnpj: (data as any).company_cnpj || "",
          empresaEndereco: (data as any).company_address || "",
          empresaTelefone: (data as any).company_phone || "",
          empresaEmail: (data as any).company_email || "",
          empresaLogoUrl: (data as any).company_logo_url || "",
        });
      }
    };

    loadProfileData();
  }, [user?.id]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setPerfilData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const uploadFile = async (file: File, type: "avatar" | "logo"): Promise<string | null> => {
    if (!user?.id) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("user-uploads")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Erro ao fazer upload da imagem");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("user-uploads")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploadingLogo(true);
    const url = await uploadFile(file, "logo");
    setIsUploadingLogo(false);

    if (url) {
      setPerfilData(prev => ({ ...prev, empresaLogoUrl: url }));
      setHasChanges(true);
      toast.success("Logo da empresa atualizada!");
    }
  };


  const removeLogo = () => {
    setPerfilData(prev => ({ ...prev, empresaLogoUrl: "" }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: perfilData.nome,
        phone: perfilData.telefone,
        whatsapp: perfilData.whatsapp,
        company_name: perfilData.empresaNome,
        company_cnpj: perfilData.empresaCnpj,
        company_address: perfilData.empresaEndereco,
        company_phone: perfilData.empresaTelefone,
        company_email: perfilData.empresaEmail,
        company_logo_url: perfilData.empresaLogoUrl,
      } as any)
      .eq("id", user.id);

    setIsSaving(false);

    if (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar configurações");
      return;
    }

    setHasChanges(false);
    toast.success("Configurações salvas com sucesso!");
  };

  const handlePasswordChange = async () => {
    const { senhaAtual, novaSenha, confirmarSenha } = passwordData;

    // Validations
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    if (!isPasswordValid(novaSenha)) {
      toast.error("A senha não atende todos os requisitos");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não conferem");
      return;
    }

    setIsChangingPassword(true);

    // First verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: senhaAtual,
    });

    if (signInError) {
      setIsChangingPassword(false);
      toast.error("Senha atual incorreta");
      return;
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    setIsChangingPassword(false);

    if (updateError) {
      console.error("Password update error:", updateError);
      toast.error("Erro ao alterar senha. Tente novamente.");
      return;
    }

    // Clear password fields
    setPasswordData({
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    });

    toast.success("Senha alterada com sucesso!");
  };

  const renderPerfilSection = () => (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Seus dados de contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                onChange={(e) => handleInputChange("telefone", formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={perfilData.whatsapp}
                onChange={(e) => handleInputChange("whatsapp", formatPhone(e.target.value))}
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
            <div className="relative">
              {perfilData.empresaLogoUrl ? (
                <div className="relative h-20 w-20">
                  <img
                    src={perfilData.empresaLogoUrl}
                    alt="Logo da empresa"
                    className="h-20 w-20 rounded-lg object-cover border-2 border-primary/20"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                  {isUploadingLogo ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {perfilData.empresaLogoUrl ? "Alterar logo" : "Enviar logo"}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP. Máx 5MB.</p>
            </div>
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
                onChange={(e) => handleInputChange("empresaCnpj", formatCNPJ(e.target.value))}
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
                onChange={(e) => handleInputChange("empresaTelefone", formatPhone(e.target.value))}
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
              <div className="relative">
                <Input
                  id="senhaAtual"
                  type={showPasswords.senhaAtual ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordData.senhaAtual}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, senhaAtual: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, senhaAtual: !prev.senhaAtual }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswords.senhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showPasswords.novaSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordData.novaSenha}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, novaSenha: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, novaSenha: !prev.novaSenha }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswords.novaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {passwordData.novaSenha && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= getPasswordStrength(passwordData.novaSenha).score
                            ? getPasswordStrength(passwordData.novaSenha).color
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Força: <span className="font-medium">{getPasswordStrength(passwordData.novaSenha).label}</span>
                  </p>
                </div>
              )}
            </div>
            {/* Password requirements checklist */}
            {passwordData.novaSenha && (
              <div className="space-y-2 sm:col-span-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">Requisitos da senha:</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {[
                    { key: 'minLength', label: 'Mínimo 8 caracteres' },
                    { key: 'hasUppercase', label: 'Uma letra maiúscula' },
                    { key: 'hasLowercase', label: 'Uma letra minúscula' },
                    { key: 'hasNumber', label: 'Um número' },
                    { key: 'hasSpecial', label: 'Um caractere especial' },
                  ].map(({ key, label }) => {
                    const requirements = getPasswordRequirements(passwordData.novaSenha);
                    const isMet = requirements[key as keyof typeof requirements];
                    return (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${isMet ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
                          {isMet && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span className={isMet ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showPasswords.confirmarSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordData.confirmarSenha}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                  className={`pr-10 ${
                    passwordData.confirmarSenha
                      ? passwordData.confirmarSenha === passwordData.novaSenha
                        ? "border-emerald-500 focus-visible:ring-emerald-500"
                        : "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirmarSenha: !prev.confirmarSenha }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswords.confirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordData.confirmarSenha && (
                <p className={`text-xs flex items-center gap-1 ${
                  passwordData.confirmarSenha === passwordData.novaSenha
                    ? "text-emerald-500"
                    : "text-destructive"
                }`}>
                  {passwordData.confirmarSenha === passwordData.novaSenha ? (
                    <>
                      <Check className="h-3 w-3" />
                      As senhas conferem
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" />
                      As senhas não conferem
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={
              isChangingPassword || 
              !passwordData.senhaAtual || 
              !passwordData.novaSenha || 
              !passwordData.confirmarSenha ||
              !isPasswordValid(passwordData.novaSenha) ||
              passwordData.novaSenha !== passwordData.confirmarSenha
            }
            className="w-full sm:w-auto"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Alterando...
              </>
            ) : (
              "Alterar senha"
            )}
          </Button>
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
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configurações"
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

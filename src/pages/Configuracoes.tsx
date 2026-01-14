/**
 * PÁGINA DE CONFIGURAÇÕES (REFATORADA)
 * 
 * Página principal de configurações do sistema.
 * Modularizada para facilitar manutenção e extensibilidade.
 * 
 * Estrutura:
 * - Hook useProfileSettings: gerencia estado e lógica
 * - Componentes separados: cada seção em seu próprio arquivo
 * - Constantes centralizadas: fácil atualização de opções
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, ScrollText, Calendar, CalendarCheck } from "lucide-react";

// Hook customizado
import { useProfileSettings } from "@/hooks/useProfileSettings";

// Tipos e constantes
import type { MainSection } from "@/constants/settings";
import { MAIN_SECTIONS } from "@/constants/settings";

// Componentes de configurações
import {
  SettingsNavigation,
  ProfileSection,
  CompanySection,
  SubscriptionSection,
  QuotesSettingsSection,
  PlaceholderSection,
} from "@/components/settings";

export default function Configuracoes() {
  // ==========================================
  // ESTADO DA NAVEGAÇÃO
  // ==========================================
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as MainSection | null;
  const [activeSection, setActiveSection] = useState<MainSection>(tabParam || "perfil");

  // Atualiza a seção ativa quando o parâmetro da URL mudar
  useEffect(() => {
    if (tabParam && ["perfil", "empresa", "assinatura", "orcamentos", "contratos", "visitas", "disponibilidade"].includes(tabParam)) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);

  // ==========================================
  // HOOK DE CONFIGURAÇÕES DO PERFIL
  // ==========================================
  const {
    // Dados do perfil
    profileData,
    isLoadingProfile,
    handleInputChange,

    // Controle de alterações
    hasChanges,
    isSaving,
    handleSave,

    // CEP lookup
    isLoadingCep,
    handleCepLookup,

    // Upload de avatar
    avatarInputRef,
    isUploadingAvatar,
    handleAvatarChange,
    removeAvatar,
    triggerAvatarUpload,

    // Upload de logo
    logoInputRef,
    isUploadingLogo,
    handleLogoChange,
    removeLogo,
    triggerLogoUpload,

    // Alteração de senha
    passwordData,
    showPasswords,
    isChangingPassword,
    handlePasswordInputChange,
    togglePasswordVisibility,
    handlePasswordChange,

    // Alteração de email
    newEmail,
    setNewEmail,
    isChangingEmail,
    handleEmailChange,

    // Logout
    handleSignOut,
  } = useProfileSettings();

  // ==========================================
  // RENDER DA SEÇÃO ATIVA
  // ==========================================
  const renderActiveSection = () => {
    switch (activeSection) {
      case "perfil":
        return (
          <ProfileSection
            profileData={profileData}
            onProfileChange={handleInputChange}
            // Avatar
            avatarInputRef={avatarInputRef}
            isUploadingAvatar={isUploadingAvatar}
            onAvatarChange={handleAvatarChange}
            onRemoveAvatar={removeAvatar}
            onTriggerAvatarUpload={triggerAvatarUpload}
            // Email
            newEmail={newEmail}
            onNewEmailChange={setNewEmail}
            isChangingEmail={isChangingEmail}
            onEmailChange={handleEmailChange}
            // Senha
            passwordData={passwordData}
            showPasswords={showPasswords}
            isChangingPassword={isChangingPassword}
            onPasswordChange={handlePasswordInputChange}
            onTogglePasswordVisibility={togglePasswordVisibility}
            onSubmitPassword={handlePasswordChange}
          />
        );

      case "empresa":
        return (
          <CompanySection
            profileData={profileData}
            onProfileChange={handleInputChange}
            // Logo
            logoInputRef={logoInputRef}
            isUploadingLogo={isUploadingLogo}
            onLogoChange={handleLogoChange}
            onRemoveLogo={removeLogo}
            onTriggerUpload={triggerLogoUpload}
            // CEP
            isLoadingCep={isLoadingCep}
            onCepLookup={handleCepLookup}
          />
        );

      case "assinatura":
        return <SubscriptionSection />;

      case "orcamentos":
        return <QuotesSettingsSection />;

      case "contratos":
        return (
          <PlaceholderSection
            title="Contratos"
            icon={<ScrollText className="h-12 w-12" />}
          />
        );

      case "visitas":
        return (
          <PlaceholderSection
            title="Visitas"
            icon={<Calendar className="h-12 w-12" />}
          />
        );

      case "disponibilidade":
        return (
          <PlaceholderSection
            title="Disponibilidade"
            icon={<CalendarCheck className="h-12 w-12" />}
          />
        );

      default:
        return null;
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (isLoadingProfile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Configurações
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua conta e personalize o sistema
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Navegação Principal */}
        <SettingsNavigation
          sections={MAIN_SECTIONS}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Área de Conteúdo */}
        <div className="animate-fade-in">{renderActiveSection()}</div>

        {/* Botão Salvar (aparece nas seções de perfil e empresa) */}
        {(activeSection === "perfil" || activeSection === "empresa") && (
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
        )}
      </div>
    </MainLayout>
  );
}
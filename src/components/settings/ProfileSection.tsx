/**
 * SEÇÃO DE PERFIL
 * 
 * Agrupa todos os cards relacionados ao perfil do usuário:
 * - Informações pessoais
 * - Dados da empresa
 * - Alteração de senha
 */

import { PersonalInfoCard } from "./PersonalInfoCard";
import { CompanyInfoCard } from "./CompanyInfoCard";
import { PasswordChangeCard } from "./PasswordChangeCard";
import type { ProfileData, PasswordData, PasswordVisibility } from "@/constants/settings";

interface ProfileSectionProps {
  // Dados do perfil
  profileData: ProfileData;
  onProfileChange: (field: keyof ProfileData, value: string) => void;

  // Upload de logo
  logoInputRef: React.RefObject<HTMLInputElement>;
  isUploadingLogo: boolean;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onTriggerUpload: () => void;

  // Alteração de senha
  passwordData: PasswordData;
  showPasswords: PasswordVisibility;
  isChangingPassword: boolean;
  onPasswordChange: (field: keyof PasswordData, value: string) => void;
  onTogglePasswordVisibility: (field: keyof PasswordVisibility) => void;
  onSubmitPassword: () => void;
}

export function ProfileSection({
  profileData,
  onProfileChange,
  logoInputRef,
  isUploadingLogo,
  onLogoChange,
  onRemoveLogo,
  onTriggerUpload,
  passwordData,
  showPasswords,
  isChangingPassword,
  onPasswordChange,
  onTogglePasswordVisibility,
  onSubmitPassword,
}: ProfileSectionProps) {
  return (
    <div className="space-y-6">
      <PersonalInfoCard data={profileData} onChange={onProfileChange} />

      <CompanyInfoCard
        data={profileData}
        onChange={onProfileChange}
        logoInputRef={logoInputRef}
        isUploadingLogo={isUploadingLogo}
        onLogoChange={onLogoChange}
        onRemoveLogo={onRemoveLogo}
        onTriggerUpload={onTriggerUpload}
      />

      <PasswordChangeCard
        data={passwordData}
        showPasswords={showPasswords}
        isChanging={isChangingPassword}
        onChange={onPasswordChange}
        onToggleVisibility={onTogglePasswordVisibility}
        onSubmit={onSubmitPassword}
      />
    </div>
  );
}
/**
 * SEÇÃO DE PERFIL
 * 
 * Agrupa todos os cards relacionados ao perfil do usuário:
 * - Informações pessoais (expandido)
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

  // Upload de avatar
  avatarInputRef: React.RefObject<HTMLInputElement>;
  isUploadingAvatar: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onTriggerAvatarUpload: () => void;

  // CEP lookup
  isLoadingCep: boolean;
  onCepLookup: (cep: string) => void;

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
  avatarInputRef,
  isUploadingAvatar,
  onAvatarChange,
  onRemoveAvatar,
  onTriggerAvatarUpload,
  isLoadingCep,
  onCepLookup,
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
      <PersonalInfoCard
        data={profileData}
        onChange={onProfileChange}
        avatarInputRef={avatarInputRef}
        isUploadingAvatar={isUploadingAvatar}
        onAvatarChange={onAvatarChange}
        onRemoveAvatar={onRemoveAvatar}
        onTriggerAvatarUpload={onTriggerAvatarUpload}
        isLoadingCep={isLoadingCep}
        onCepLookup={onCepLookup}
      />

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
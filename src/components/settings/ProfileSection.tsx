/**
 * SEÇÃO DE PERFIL
 * 
 * Agrupa os cards relacionados ao perfil do usuário:
 * - Dados de cadastro (nome, email, avatar)
 * - Alteração de senha
 */

import { PersonalInfoCard } from "./PersonalInfoCard";
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

  // Alteração de email
  newEmail: string;
  onNewEmailChange: (value: string) => void;
  isChangingEmail: boolean;
  onEmailChange: () => void;

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
  newEmail,
  onNewEmailChange,
  isChangingEmail,
  onEmailChange,
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
        newEmail={newEmail}
        onNewEmailChange={onNewEmailChange}
        isChangingEmail={isChangingEmail}
        onEmailChange={onEmailChange}
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

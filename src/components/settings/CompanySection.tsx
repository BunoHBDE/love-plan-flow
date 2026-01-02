/**
 * SEÇÃO DE EMPRESA
 * 
 * Agrupa os cards relacionados aos dados da empresa:
 * - Informações da empresa (logo, nome, CNPJ, endereço, contatos)
 */

import { CompanyInfoCard } from "./CompanyInfoCard";
import type { ProfileData } from "@/constants/settings";

interface CompanySectionProps {
  // Dados do perfil (que contém dados da empresa)
  profileData: ProfileData;
  onProfileChange: (field: keyof ProfileData, value: string) => void;

  // Upload de logo
  logoInputRef: React.RefObject<HTMLInputElement>;
  isUploadingLogo: boolean;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onTriggerUpload: () => void;
}

export function CompanySection({
  profileData,
  onProfileChange,
  logoInputRef,
  isUploadingLogo,
  onLogoChange,
  onRemoveLogo,
  onTriggerUpload,
}: CompanySectionProps) {
  return (
    <div className="space-y-6">
      <CompanyInfoCard
        data={profileData}
        onChange={onProfileChange}
        logoInputRef={logoInputRef}
        isUploadingLogo={isUploadingLogo}
        onLogoChange={onLogoChange}
        onRemoveLogo={onRemoveLogo}
        onTriggerUpload={onTriggerUpload}
      />
    </div>
  );
}
/**
 * HOOK DE CONFIGURAÇÕES DO PERFIL
 * 
 * Gerencia todo o estado e lógica relacionados às configurações do perfil do usuário.
 * Inclui: dados pessoais, dados da empresa, upload de logo e alteração de senha.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ProfileData,
  PasswordData,
  PasswordVisibility,
  INITIAL_PROFILE_DATA,
  INITIAL_PASSWORD_DATA,
  INITIAL_PASSWORD_VISIBILITY,
} from "@/constants/settings";
import { isPasswordValid } from "@/lib/passwordUtils";

export function useProfileSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // ==========================================
  // ESTADOS
  // ==========================================

  // Dados do perfil
  const [profileData, setProfileData] = useState<ProfileData>(INITIAL_PROFILE_DATA);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Controle de alterações
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Upload de logo
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Alteração de senha
  const [passwordData, setPasswordData] = useState<PasswordData>(INITIAL_PASSWORD_DATA);
  const [showPasswords, setShowPasswords] = useState<PasswordVisibility>(INITIAL_PASSWORD_VISIBILITY);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // ==========================================
  // CARREGAR DADOS DO PERFIL
  // ==========================================

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          toast.error("Erro ao carregar dados do perfil");
          return;
        }

        if (data) {
          setProfileData({
            nome: data.full_name || "",
            telefone: data.phone || "",
            whatsapp: data.whatsapp || "",
            empresaNome: data.company_name || "",
            empresaCnpj: data.company_cnpj || "",
            empresaEndereco: data.company_address || "",
            empresaTelefone: data.company_phone || "",
            empresaEmail: data.company_email || "",
            empresaLogoUrl: data.company_logo_url || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Erro ao carregar dados do perfil");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [user?.id]);

  // ==========================================
  // HANDLERS - DADOS DO PERFIL
  // ==========================================

  const handleInputChange = useCallback((field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // ==========================================
  // HANDLERS - UPLOAD DE LOGO
  // ==========================================

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("user-uploads")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Erro ao fazer upload da imagem");
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("user-uploads").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploadingLogo(true);
    const url = await uploadFile(file);
    setIsUploadingLogo(false);

    if (url) {
      setProfileData((prev) => ({ ...prev, empresaLogoUrl: url }));
      setHasChanges(true);
      toast.success("Logo da empresa atualizada!");
    }

    // Limpar input para permitir reupload do mesmo arquivo
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const removeLogo = useCallback(() => {
    setProfileData((prev) => ({ ...prev, empresaLogoUrl: "" }));
    setHasChanges(true);
  }, []);

  const triggerLogoUpload = useCallback(() => {
    logoInputRef.current?.click();
  }, []);

  // ==========================================
  // HANDLERS - SALVAR PERFIL
  // ==========================================

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileData.nome,
        phone: profileData.telefone,
        whatsapp: profileData.whatsapp,
        company_name: profileData.empresaNome,
        company_cnpj: profileData.empresaCnpj,
        company_address: profileData.empresaEndereco,
        company_phone: profileData.empresaTelefone,
        company_email: profileData.empresaEmail,
        company_logo_url: profileData.empresaLogoUrl,
      })
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

  // ==========================================
  // HANDLERS - ALTERAÇÃO DE SENHA
  // ==========================================

  const handlePasswordInputChange = useCallback(
    (field: keyof PasswordData, value: string) => {
      setPasswordData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const togglePasswordVisibility = useCallback((field: keyof PasswordVisibility) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handlePasswordChange = async () => {
    const { senhaAtual, novaSenha, confirmarSenha } = passwordData;

    // Validações
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

    // Verificar senha atual fazendo login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: senhaAtual,
    });

    if (signInError) {
      setIsChangingPassword(false);
      toast.error("Senha atual incorreta");
      return;
    }

    // Atualizar para nova senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    setIsChangingPassword(false);

    if (updateError) {
      console.error("Password update error:", updateError);
      toast.error("Erro ao alterar senha. Tente novamente.");
      return;
    }

    // Limpar campos
    setPasswordData(INITIAL_PASSWORD_DATA);
    toast.success("Senha alterada com sucesso!");
  };

  // ==========================================
  // HANDLERS - LOGOUT
  // ==========================================

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // ==========================================
  // RETORNO
  // ==========================================

  return {
    // Dados do perfil
    profileData,
    isLoadingProfile,
    handleInputChange,

    // Controle de alterações
    hasChanges,
    isSaving,
    handleSave,

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

    // Logout
    handleSignOut,

    // User info
    user,
  };
}
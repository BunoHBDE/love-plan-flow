/**
 * HOOK DE CONFIGURAÇÕES DO PERFIL
 * 
 * Gerencia todo o estado e lógica relacionados às configurações do perfil do usuário.
 * Inclui: dados pessoais, dados da empresa, upload de logo/avatar e alteração de senha.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCEP } from "@/lib/masks";
import { z } from "zod";
import {
  ProfileData,
  PasswordData,
  PasswordVisibility,
  INITIAL_PROFILE_DATA,
  INITIAL_PASSWORD_DATA,
  INITIAL_PASSWORD_VISIBILITY,
} from "@/constants/settings";
import { isPasswordValid } from "@/lib/passwordUtils";

// Schema de validação de email
const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "O email não pode estar vazio" })
  .email({ message: "Formato de email inválido" })
  .max(255, { message: "O email deve ter no máximo 255 caracteres" });

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

  // Upload de logo e avatar
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // CEP lookup
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Alteração de senha
  const [passwordData, setPasswordData] = useState<PasswordData>(INITIAL_PASSWORD_DATA);
  const [showPasswords, setShowPasswords] = useState<PasswordVisibility>(INITIAL_PASSWORD_VISIBILITY);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Alteração de email
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

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
            // Dados pessoais básicos
            nome: data.full_name || "",
            email: data.email || user?.email || "",
            whatsapp: data.whatsapp || "",
            avatarUrl: data.avatar_url || "",
            
            // Campos pessoais expandidos
            cpf: (data as any).cpf || "",
            birthDate: (data as any).birth_date || "",
            
            // Endereço pessoal
            addressCep: (data as any).address_cep || "",
            addressStreet: (data as any).address_street || "",
            addressNumber: (data as any).address_number || "",
            addressComplement: (data as any).address_complement || "",
            addressNeighborhood: (data as any).address_neighborhood || "",
            addressCity: (data as any).address_city || "",
            addressState: (data as any).address_state || "",
            
            // Dados da empresa
            empresaNome: data.company_name || "",
            empresaCnpj: data.company_cnpj || "",
            empresaTelefone: data.company_phone || "",
            empresaEmail: data.company_email || "",
            empresaLogoUrl: data.company_logo_url || "",
            
            // Endereço da empresa
            empresaCep: (data as any).company_cep || "",
            empresaRua: (data as any).company_street || "",
            empresaNumero: (data as any).company_number || "",
            empresaComplemento: (data as any).company_complement || "",
            empresaBairro: (data as any).company_neighborhood || "",
            empresaCidade: (data as any).company_city || "",
            empresaEstado: (data as any).company_state || "",
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
  // HANDLERS - CEP LOOKUP
  // ==========================================

  const handleCepLookup = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado. Verifique o CEP informado.");
        return;
      }

      // Detectar se é CEP pessoal ou da empresa baseado no valor atual
      const isCompanyCep = profileData.empresaCep === formatCEP(cleanCep) || 
                           profileData.empresaCep === cep;

      if (isCompanyCep) {
        // Atualizar endereço da empresa
        setProfileData(prev => ({
          ...prev,
          empresaCep: formatCEP(cleanCep),
          empresaRua: data.logradouro || "",
          empresaBairro: data.bairro || "",
          empresaCidade: data.localidade || "",
          empresaEstado: data.uf || "",
        }));
      } else {
        // Atualizar endereço pessoal
        setProfileData(prev => ({
          ...prev,
          addressCep: formatCEP(cleanCep),
          addressStreet: data.logradouro || "",
          addressNeighborhood: data.bairro || "",
          addressCity: data.localidade || "",
          addressState: data.uf || "",
        }));
      }
      
      setHasChanges(true);
      toast.success("Endereço encontrado!");
    } catch {
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setIsLoadingCep(false);
    }
  }, [profileData.empresaCep]);

  // ==========================================
  // HANDLERS - UPLOAD DE ARQUIVOS
  // ==========================================

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

    const {
      data: { publicUrl },
    } = supabase.storage.from("user-uploads").getPublicUrl(filePath);

    return publicUrl;
  };

  // Avatar handlers
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    const url = await uploadFile(file, "avatar");
    setIsUploadingAvatar(false);

    if (url) {
      setProfileData((prev) => ({ ...prev, avatarUrl: url }));
      setHasChanges(true);
      toast.success("Foto de perfil atualizada!");
    }
  };

  const removeAvatar = useCallback(() => {
    setProfileData((prev) => ({ ...prev, avatarUrl: "" }));
    setHasChanges(true);
  }, []);

  const triggerAvatarUpload = useCallback(() => {
    avatarInputRef.current?.click();
  }, []);

  // Logo handlers
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setProfileData((prev) => ({ ...prev, empresaLogoUrl: url }));
      setHasChanges(true);
      toast.success("Logo da empresa atualizada!");
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
  // HANDLERS - SALVAR DADOS
  // ==========================================

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          // Dados pessoais básicos
          full_name: profileData.nome,
          email: profileData.email,
          whatsapp: profileData.whatsapp,
          avatar_url: profileData.avatarUrl,
          
          // Campos pessoais expandidos
          cpf: profileData.cpf,
          birth_date: profileData.birthDate || null,
          
          // Endereço pessoal
          address_cep: profileData.addressCep,
          address_street: profileData.addressStreet,
          address_number: profileData.addressNumber,
          address_complement: profileData.addressComplement,
          address_neighborhood: profileData.addressNeighborhood,
          address_city: profileData.addressCity,
          address_state: profileData.addressState,
          
          // Dados da empresa
          company_name: profileData.empresaNome,
          company_cnpj: profileData.empresaCnpj,
          company_phone: profileData.empresaTelefone,
          company_email: profileData.empresaEmail,
          company_logo_url: profileData.empresaLogoUrl,
          
          // Endereço da empresa
          company_cep: profileData.empresaCep,
          company_street: profileData.empresaRua,
          company_number: profileData.empresaNumero,
          company_complement: profileData.empresaComplemento,
          company_neighborhood: profileData.empresaBairro,
          company_city: profileData.empresaCidade,
          company_state: profileData.empresaEstado,
        } as any)
        .eq("id", user.id);

      if (error) {
        console.error("Save error:", error);
        toast.error("Erro ao salvar configurações");
        return;
      }

      setHasChanges(false);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // HANDLERS - ALTERAÇÃO DE SENHA
  // ==========================================

  const handlePasswordInputChange = useCallback((field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const togglePasswordVisibility = useCallback((field: keyof PasswordVisibility) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handlePasswordChange = async () => {
    const { senhaAtual, novaSenha, confirmarSenha } = passwordData;

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

    try {
      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: senhaAtual,
      });

      if (signInError) {
        toast.error("Senha atual incorreta");
        return;
      }

      // Atualizar para nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        toast.error("Erro ao alterar senha. Tente novamente.");
        return;
      }

      // Limpar campos
      setPasswordData(INITIAL_PASSWORD_DATA);
      toast.success("Senha alterada com sucesso!");
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Erro ao alterar senha");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ==========================================
  // HANDLERS - ALTERAÇÃO DE EMAIL
  // ==========================================

  const handleEmailChange = async () => {
    // Validação com zod
    const validation = emailSchema.safeParse(newEmail);
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const validatedEmail = validation.data;

    if (validatedEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("O novo email é igual ao atual");
      return;
    }

    setIsChangingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        console.error("Email update error:", error);
        if (error.message.includes("already registered")) {
          toast.error("Este email já está em uso por outra conta");
        } else {
          toast.error("Erro ao alterar email. Tente novamente.");
        }
        return;
      }

      toast.success(
        "Email de confirmação enviado! Verifique sua caixa de entrada do novo email para confirmar a alteração.",
        { duration: 8000 }
      );
      setNewEmail("");
    } catch (error) {
      console.error("Email change error:", error);
      toast.error("Erro ao alterar email");
    } finally {
      setIsChangingEmail(false);
    }
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
  };
}
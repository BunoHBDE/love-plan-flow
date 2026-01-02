/**
 * CONSTANTES E TIPOS DO MÓDULO DE CONFIGURAÇÕES
 * 
 * Centraliza todas as constantes e tipos usados na página de configurações.
 * Segue o mesmo padrão do visits.ts existente.
 */

import {
  User,
  CreditCard,
  FileText,
  ScrollText,
  Calendar,
  CalendarCheck,
  LucideIcon,
} from "lucide-react";

// ==========================================
// TIPOS
// ==========================================

export type MainSection = 
  | "perfil" 
  | "assinatura" 
  | "orcamentos" 
  | "contratos" 
  | "visitas" 
  | "disponibilidade";

export type OrcamentoSubSection = 
  | "espaco" 
  | "pacotes" 
  | "buffet" 
  | "extras" 
  | "pagamento" 
  | "listas";

export interface SectionConfig {
  id: MainSection;
  label: string;
  icon: LucideIcon;
}

export interface SubSectionConfig {
  id: OrcamentoSubSection;
  label: string;
}

export interface ProfileData {
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

export interface PasswordData {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

export interface PasswordVisibility {
  senhaAtual: boolean;
  novaSenha: boolean;
  confirmarSenha: boolean;
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

// ==========================================
// VALORES INICIAIS
// ==========================================

export const INITIAL_PROFILE_DATA: ProfileData = {
  nome: "",
  telefone: "",
  whatsapp: "",
  empresaNome: "",
  empresaCnpj: "",
  empresaEndereco: "",
  empresaTelefone: "",
  empresaEmail: "",
  empresaLogoUrl: "",
};

export const INITIAL_PASSWORD_DATA: PasswordData = {
  senhaAtual: "",
  novaSenha: "",
  confirmarSenha: "",
};

export const INITIAL_PASSWORD_VISIBILITY: PasswordVisibility = {
  senhaAtual: false,
  novaSenha: false,
  confirmarSenha: false,
};

// ==========================================
// SEÇÕES PRINCIPAIS DA NAVEGAÇÃO
// ==========================================

export const MAIN_SECTIONS: SectionConfig[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "assinatura", label: "Assinatura", icon: CreditCard },
  { id: "orcamentos", label: "Orçamentos", icon: FileText },
  { id: "contratos", label: "Contratos", icon: ScrollText },
  { id: "visitas", label: "Visitas", icon: Calendar },
  { id: "disponibilidade", label: "Disponibilidade", icon: CalendarCheck },
];

// ==========================================
// SUB-SEÇÕES DE ORÇAMENTOS
// ==========================================

export const ORCAMENTO_SUB_SECTIONS: SubSectionConfig[] = [
  { id: "espaco", label: "Espaço" },
  { id: "pacotes", label: "Pacotes" },
  { id: "buffet", label: "Buffet" },
  { id: "extras", label: "Extras" },
  { id: "pagamento", label: "Pagamento" },
  { id: "listas", label: "Listas" },
];

// ==========================================
// RECURSOS DO PLANO PRO (mock)
// ==========================================

export const PLAN_FEATURES = [
  "Orçamentos ilimitados",
  "Gestão de clientes",
  "Controle de visitas",
  "Calendário de disponibilidade",
  "Geração de contratos",
  "Relatórios avançados",
  "Suporte prioritário",
  "Backup automático",
];

// ==========================================
// HISTÓRICO DE FATURAS (mock)
// ==========================================

export const MOCK_INVOICES = [
  { data: "15/12/2025", valor: "R$ 99,90", status: "Pago" },
  { data: "15/11/2025", valor: "R$ 99,90", status: "Pago" },
  { data: "15/10/2025", valor: "R$ 99,90", status: "Pago" },
];

// ==========================================
// REQUISITOS DE SENHA
// ==========================================

export const PASSWORD_REQUIREMENTS_LIST = [
  { key: "minLength", label: "Mínimo 8 caracteres" },
  { key: "hasUppercase", label: "Uma letra maiúscula" },
  { key: "hasLowercase", label: "Uma letra minúscula" },
  { key: "hasNumber", label: "Um número" },
  { key: "hasSpecial", label: "Um caractere especial" },
] as const;
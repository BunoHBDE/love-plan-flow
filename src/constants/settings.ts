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

/**
 * Dados do perfil do usuário
 * Expandido para incluir todos os campos de cadastro
 */
export interface ProfileData {
  // Dados pessoais básicos
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  avatarUrl: string;
  
  // Campos pessoais expandidos
  cpf: string;
  rg: string;
  birthDate: string;
  gender: string;
  nationality: string;
  maritalStatus: string;
  occupation: string;
  
  // Endereço pessoal
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  
  // Dados da empresa
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
  // Dados pessoais básicos
  nome: "",
  email: "",
  telefone: "",
  whatsapp: "",
  avatarUrl: "",
  
  // Campos pessoais expandidos
  cpf: "",
  rg: "",
  birthDate: "",
  gender: "",
  nationality: "Brasileiro(a)",
  maritalStatus: "",
  occupation: "",
  
  // Endereço pessoal
  addressCep: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressCity: "",
  addressState: "",
  
  // Dados da empresa
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
// OPÇÕES DE SELECTS
// ==========================================

export const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar" },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União estável" },
];

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
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
];

// ==========================================
// ASSINATURA - RECURSOS DO PLANO
// ==========================================

export const PLAN_FEATURES = [
  "Orçamentos ilimitados",
  "Contratos personalizados",
  "Agenda de visitas",
  "Gestão de clientes",
  "Relatórios completos",
  "Suporte prioritário",
  "Exportação em PDF",
  "Múltiplos usuários",
];

// ==========================================
// ASSINATURA - FATURAS MOCK
// ==========================================

export const MOCK_INVOICES = [
  { data: "15 Dez 2025", valor: "R$ 49,90", status: "Pago" },
  { data: "15 Nov 2025", valor: "R$ 49,90", status: "Pago" },
  { data: "15 Out 2025", valor: "R$ 49,90", status: "Pago" },
];
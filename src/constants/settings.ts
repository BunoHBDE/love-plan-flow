/**
 * CONSTANTES E TIPOS DO MÓDULO DE CONFIGURAÇÕES
 * 
 * Centraliza todas as constantes e tipos usados na página de configurações.
 * Segue o mesmo padrão do visits.ts existente.
 */

import {
  User,
  Building2,
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
  | "empresa"
  | "assinatura" 
  | "orcamentos" 
  | "contratos" 
  | "visitas" 
  | "disponibilidade";

export type OrcamentoSubSection = 
  | "espaco" 
  | "pacotes" 
  | "buffet" 
  | "servicos" 
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
  whatsapp: string; // Renomeado de telefone para celular
  avatarUrl: string;
  
  // Campos pessoais expandidos
  cpf: string;
  birthDate: string;
  
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
  empresaTelefone: string;
  empresaEmail: string;
  empresaLogoUrl: string;
  
  // Endereço da empresa
  empresaCep: string;
  empresaRua: string;
  empresaNumero: string;
  empresaComplemento: string;
  empresaBairro: string;
  empresaCidade: string;
  empresaEstado: string;
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
  whatsapp: "",
  avatarUrl: "",
  
  // Campos pessoais expandidos
  cpf: "",
  birthDate: "",
  
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
  empresaTelefone: "",
  empresaEmail: "",
  empresaLogoUrl: "",
  
  // Endereço da empresa
  empresaCep: "",
  empresaRua: "",
  empresaNumero: "",
  empresaComplemento: "",
  empresaBairro: "",
  empresaCidade: "",
  empresaEstado: "",
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
  { id: "empresa", label: "Empresa", icon: Building2 },
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
  { id: "servicos", label: "Serviços" },
  { id: "pagamento", label: "Pagamento" },
  { id: "listas", label: "Listas" },
];

// ==========================================
// OPÇÕES DE SELECTS
// ==========================================

export const NATIONALITIES = [
  "Brasileiro(a)",
  "Argentino(a)",
  "Americano(a)",
  "Alemão/Alemã",
  "Angolano(a)",
  "Australiano(a)",
  "Austríaco(a)",
  "Belga",
  "Boliviano(a)",
  "Canadense",
  "Chileno(a)",
  "Chinês/Chinesa",
  "Colombiano(a)",
  "Coreano(a)",
  "Cubano(a)",
  "Equatoriano(a)",
  "Espanhol/Espanhola",
  "Francês/Francesa",
  "Haitiano(a)",
  "Indiano(a)",
  "Inglês/Inglesa",
  "Italiano(a)",
  "Japonês/Japonesa",
  "Mexicano(a)",
  "Moçambicano(a)",
  "Norueguês/Norueguesa",
  "Paraguaio(a)",
  "Peruano(a)",
  "Polonês/Polonesa",
  "Português/Portuguesa",
  "Russo(a)",
  "Sueco(a)",
  "Suíço(a)",
  "Turco(a)",
  "Ucraniano(a)",
  "Uruguaio(a)",
  "Venezuelano(a)",
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
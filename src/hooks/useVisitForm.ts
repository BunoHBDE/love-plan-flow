import { useState } from "react";

// Importa constantes do arquivo centralizado
// Assim não precisamos duplicar a lista de meses aqui
export { MONTHS as months, getYearsArray } from "@/constants/visits";

/**
 * Interface que define os dados do formulário de visita
 * Cada campo corresponde a uma informação que o usuário preenche
 */
export interface VisitFormData {
  clientName: string;           // Nome do cliente/visitante
  email: string;                // Email do cliente
  phone: string;                // Telefone do cliente
  date: string;                 // Data da visita (formato: YYYY-MM-DD)
  time: string;                 // Horário da visita (formato: HH:MM)
  notes: string;                // Observações/notas
  guestCount: string;           // Número estimado de convidados
  weddingDateStatus: "defined" | "undefined";  // Se já tem data definida
  weddingDate: string;          // Data do casamento (se definida)
  weddingMonthEstimate: string; // Mês estimado (se não tem data)
  weddingYearEstimate: string;  // Ano estimado (se não tem data)
}

/**
 * Valores iniciais do formulário (tudo vazio/padrão)
 */
const initialFormData: VisitFormData = {
  clientName: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  notes: "",
  guestCount: "",
  weddingDateStatus: "undefined",
  weddingDate: "",
  weddingMonthEstimate: "",
  weddingYearEstimate: "",
};

/**
 * Hook customizado para gerenciar o estado do formulário de visitas
 * 
 * @param defaultValues - Valores iniciais opcionais (para edição)
 * @returns Objeto com dados e funções para manipular o formulário
 * 
 * @example
 * const { formData, updateField, resetForm } = useVisitForm();
 * 
 * // Atualizar um campo
 * updateField("clientName", "Maria Silva");
 * 
 * // Resetar formulário
 * resetForm();
 */
export function useVisitForm(defaultValues?: Partial<VisitFormData>) {
  // Estado principal do formulário
  const [formData, setFormData] = useState<VisitFormData>({
    ...initialFormData,
    ...defaultValues,
  });

  /**
   * Atualiza um campo específico do formulário
   * @param field - Nome do campo a ser atualizado
   * @param value - Novo valor
   */
  const updateField = (field: keyof VisitFormData, value: string | "defined" | "undefined") => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Reseta o formulário para os valores iniciais
   */
  const resetForm = () => {
    setFormData(initialFormData);
  };

  /**
   * Define múltiplos campos de uma vez
   * @param data - Objeto com os campos a serem atualizados
   */
  const setForm = (data: Partial<VisitFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  /**
   * Valida se os campos obrigatórios estão preenchidos
   * @returns Objeto indicando se é válido e mensagem de erro (se houver)
   */
  const validateForm = (): { isValid: boolean; error?: string } => {
    // Verifica nome do cliente
    if (!formData.clientName || formData.clientName.trim() === "") {
      return {
        isValid: false,
        error: "Por favor, preencha o nome do cliente.",
      };
    }

    // Verifica data
    if (!formData.date) {
      return {
        isValid: false,
        error: "Por favor, selecione a data da visita.",
      };
    }

    // Verifica horário
    if (!formData.time) {
      return {
        isValid: false,
        error: "Por favor, selecione o horário da visita.",
      };
    }

    return { isValid: true };
  };

  /**
   * Formata número de telefone no padrão brasileiro
   * Formato: (00) 00000-0000 ou (00) 0000-0000
   * @param value - Valor digitado pelo usuário
   * @returns Telefone formatado
   */
  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limited = numbers.slice(0, 11);
    
    // Aplica formatação baseada na quantidade de dígitos
    if (limited.length <= 10) {
      // Telefone fixo: (00) 0000-0000
      return limited
        .replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
        .replace(/-$/, '');
    } else {
      // Celular: (00) 00000-0000
      return limited
        .replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
        .replace(/-$/, '');
    }
  };

  /**
   * Atualiza o campo de telefone com formatação automática
   * @param value - Valor digitado
   */
  const updatePhone = (value: string) => {
    const formatted = formatPhoneNumber(value);
    updateField("phone", formatted);
  };

  // Retorna tudo que os componentes precisam
  return {
    formData,       // Dados atuais do formulário
    updateField,    // Função para atualizar um campo
    updatePhone,    // Função específica para telefone (com formatação)
    resetForm,      // Função para limpar o formulário
    setForm,        // Função para definir múltiplos campos
    validateForm,   // Função para validar antes de enviar
  };
}
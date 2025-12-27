import { useState } from "react";

export interface VisitFormData {
  clientName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
  guestCount: string;
  weddingDateStatus: "defined" | "undefined";
  weddingDate: string;
  weddingMonthEstimate: string;
  weddingYearEstimate: string;
}

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

export function useVisitForm(defaultValues?: Partial<VisitFormData>) {
  const [formData, setFormData] = useState<VisitFormData>({
    ...initialFormData,
    ...defaultValues,
  });

  const updateField = (field: keyof VisitFormData, value: string | "defined" | "undefined") => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const setForm = (data: Partial<VisitFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Validações
  const validateForm = (): { isValid: boolean; error?: string } => {
    if (!formData.clientName || formData.clientName.trim() === "") {
      return {
        isValid: false,
        error: "Por favor, preencha o nome do cliente.",
      };
    }

    if (!formData.date) {
      return {
        isValid: false,
        error: "Por favor, selecione a data da visita.",
      };
    }

    if (!formData.time) {
      return {
        isValid: false,
        error: "Por favor, selecione o horário da visita.",
      };
    }

    return { isValid: true };
  };

  // Formatar telefone (00) 00000-0000
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
    } else {
      return numbers.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
    }
  };

  const updatePhone = (value: string) => {
    const formatted = formatPhoneNumber(value);
    updateField("phone", formatted);
  };

  return {
    formData,
    updateField,
    updatePhone,
    resetForm,
    setForm,
    validateForm,
  };
}

// Helper para gerar anos
export const getYearsArray = (count = 5) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => (currentYear + i).toString());
};

// Helper para meses
export const months = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];
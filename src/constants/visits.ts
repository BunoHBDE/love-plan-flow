/**
 * CONSTANTES DO MÓDULO DE VISITAS
 * 
 * Este arquivo centraliza todas as constantes usadas no módulo de visitas.
 * Isso evita duplicação de código e facilita a manutenção.
 * 
 * Se precisar mudar algo (ex: adicionar um novo status), 
 * basta mudar aqui e todas as páginas serão atualizadas automaticamente.
 */

// ==========================================
// STATUS DAS VISITAS
// ==========================================

/**
 * Valores possíveis para o status de uma visita
 * Use estes valores ao salvar no banco de dados
 */
export const VISIT_STATUS = {
  AGENDADA: "agendada",
  CONFIRMADA: "confirmada",
  REALIZADA: "realizada",
  CANCELADA: "cancelada",
} as const;

// Tipo TypeScript para garantir que só usamos status válidos
export type VisitStatusType = typeof VISIT_STATUS[keyof typeof VISIT_STATUS];

/**
 * Labels amigáveis para exibir na interface
 * Chave = valor do banco | Valor = texto para o usuário
 */
export const STATUS_LABELS: Record<string, string> = {
  agendada: "Agendada",
  agendado: "Agendada", // compatibilidade com dados antigos
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

/**
 * Estilos CSS para cada status (cores dos badges)
 * Usa classes do Tailwind CSS
 */
export const STATUS_STYLES: Record<string, string> = {
  agendada: "bg-warning/10 text-warning border-warning/20",
  agendado: "bg-warning/10 text-warning border-warning/20", // compatibilidade
  confirmada: "bg-success/10 text-success border-success/20",
  realizada: "bg-primary/10 text-primary border-primary/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
};

/**
 * Lista de status para usar em filtros e dropdowns
 */
export const STATUS_OPTIONS = [
  { value: "agendada", label: "Agendada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "realizada", label: "Realizada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

// ==========================================
// MESES DO ANO
// ==========================================

/**
 * Lista de meses para usar em selects
 * value = número do mês (para salvar no banco)
 * label = nome do mês (para exibir)
 */
export const MONTHS = [
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
] as const;

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Gera array de anos para seleção (ano atual + próximos 5 anos)
 * Usado para selecionar ano estimado do casamento
 */
export const getYearsArray = (): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = 0; i <= 5; i++) {
    years.push((currentYear + i).toString());
  }
  return years;
};

/**
 * Horários padrão para agendamento (fallback caso não tenha configurações)
 */
export const DEFAULT_TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00"
];

// ==========================================
// STATUS DA DATA DO CASAMENTO
// ==========================================

export const WEDDING_DATE_STATUS = {
  COM_DATA: "com_data",
  SEM_DATA: "sem_data",
} as const;

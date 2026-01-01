import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

export type CalendarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface CalendarSizeConfig {
  cell: string;       // Tamanho da célula (w-X h-X)
  text: string;       // Tamanho do texto do dia
  headerText: string; // Tamanho do texto do header
  weekDay: string;    // Tamanho do texto dos dias da semana
  navButton: string;  // Tamanho dos botões de navegação
  padding: string;    // Padding do container
  gap: string;        // Gap entre elementos
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
}

/** Props compatíveis com react-day-picker DayContentProps */
export interface DayContentProps {
  date: Date;
  displayMonth: Date;
  activeModifiers: Record<string, boolean>;
}

export interface CalendarProps {
  /** Data selecionada (modo single) */
  selected?: Date | null;
  /** Callback quando uma data é selecionada */
  onSelect?: (date: Date | undefined) => void;
  /** Callback quando um dia é clicado (compatibilidade com react-day-picker) */
  onDayClick?: (date: Date) => void;
  /** Mês/ano inicial para exibição */
  defaultMonth?: Date;
  /** Mês controlado externamente */
  month?: Date;
  /** Callback quando o mês muda */
  onMonthChange?: (date: Date) => void;
  /** Datas mínima e máxima permitidas */
  minDate?: Date;
  maxDate?: Date;
  /** Função para desabilitar datas específicas */
  disabledDates?: (date: Date) => boolean;
  /** Alias para disabledDates (compatibilidade com react-day-picker) */
  disabled?: ((date: Date) => boolean) | Date[];
  /** Renderização customizada do conteúdo do dia */
  renderDayContent?: (props: DayContentProps) => React.ReactNode;
  /** Classes CSS customizadas */
  className?: string;
  
  // ===== Modifiers (compatibilidade com react-day-picker) =====
  /** Modifiers para marcar dias com estados especiais */
  modifiers?: Record<string, Date[] | ((date: Date) => boolean)>;
  /** Classes CSS para cada modifier */
  modifiersClassNames?: Record<string, string>;
  
  // ===== Tamanho =====
  /** Tamanho predefinido do calendário */
  size?: CalendarSize;
  /** Configuração de tamanho customizada (sobrescreve size) */
  sizeConfig?: Partial<CalendarSizeConfig>;
  
  // ===== Feature Flags =====
  /** Modo de seleção (compatibilidade) */
  mode?: "single" | "multiple" | "range";
  /** Mostrar navegação por mês (< >) */
  showMonthNavigation?: boolean;
  /** Alias para showMonthNavigation (compatibilidade) */
  showNavigation?: boolean;
  /** Mostrar navegação por ano (<< >>) */
  showYearNavigation?: boolean;
  /** Mostrar botão "Hoje" */
  showTodayButton?: boolean;
  /** Mostrar caption (mês e ano) */
  showCaption?: boolean;
  /** Mostrar dias de outros meses */
  showOutsideDays?: boolean;
  /** Fixar 6 semanas (42 dias) */
  fixedWeeks?: boolean;
  /** Primeiro dia da semana (0 = Domingo, 1 = Segunda) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  
  // ===== Labels customizáveis =====
  todayButtonLabel?: string;
  monthLabels?: string[];
  weekDayLabels?: string[];
}

// ============================================================================
// UTILS
// ============================================================================

const DEFAULT_MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DEFAULT_WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Configurações de tamanho predefinidas (proporção retangular w > h)
const SIZE_CONFIGS: Record<CalendarSize, CalendarSizeConfig> = {
  xs: {
    cell: "h-6 w-8",
    text: "text-xs",
    headerText: "text-xs",
    weekDay: "text-[0.65rem] w-8",
    navButton: "h-5 w-5",
    padding: "p-1.5",
    gap: "mt-1",
  },
  sm: {
    cell: "h-7 w-9",
    text: "text-xs",
    headerText: "text-xs",
    weekDay: "text-[0.7rem] w-9",
    navButton: "h-6 w-6",
    padding: "p-2",
    gap: "mt-1.5",
  },
  md: {
    cell: "h-8 w-10",
    text: "text-sm",
    headerText: "text-sm",
    weekDay: "text-[0.8rem] w-10",
    navButton: "h-7 w-7",
    padding: "p-3",
    gap: "mt-2",
  },
  lg: {
    cell: "h-10 w-12",
    text: "text-base",
    headerText: "text-base",
    weekDay: "text-sm w-12",
    navButton: "h-8 w-8",
    padding: "p-4",
    gap: "mt-2.5",
  },
  xl: {
    cell: "h-12 w-14",
    text: "text-lg",
    headerText: "text-lg",
    weekDay: "text-base w-14",
    navButton: "h-9 w-9",
    padding: "p-5",
    gap: "mt-3",
  },
};

function isSameDay(date1: Date | null | undefined, date2: Date | null | undefined): boolean {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

function addYears(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + amount);
  return result;
}

function getCalendarDays(
  viewDate: Date,
  weekStartsOn: number,
  fixedWeeks: boolean,
  showOutsideDays: boolean
): Date[] {
  const firstDayOfMonth = startOfMonth(viewDate);
  const lastDayOfMonth = endOfMonth(viewDate);
  
  // Encontrar o primeiro dia a ser exibido
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysToSubtract = (firstDayWeekday - weekStartsOn + 7) % 7;
  const calendarStart = new Date(firstDayOfMonth);
  calendarStart.setDate(calendarStart.getDate() - daysToSubtract);
  
  // Determinar quantos dias exibir
  const totalDays = fixedWeeks ? 42 : (() => {
    const lastDayWeekday = lastDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const daysAfter = (6 - lastDayWeekday + weekStartsOn) % 7;
    return daysToSubtract + daysInMonth + daysAfter;
  })();
  
  const days: Date[] = [];
  const current = new Date(calendarStart);
  
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(current);
    const isCurrentMonth = isSameMonth(date, viewDate);
    
    if (showOutsideDays || isCurrentMonth) {
      days.push(date);
    } else {
      // Placeholder para manter o grid alinhado
      days.push(date);
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

// ============================================================================
// COMPONENT
// ============================================================================

function Calendar({
  selected,
  onSelect,
  onDayClick,
  defaultMonth,
  month: controlledMonth,
  onMonthChange,
  minDate,
  maxDate,
  disabledDates,
  disabled,
  renderDayContent,
  className,
  
  // Modifiers
  modifiers,
  modifiersClassNames,
  
  // Tamanho
  size = "md",
  sizeConfig: customSizeConfig,
  
  // Feature flags com defaults
  mode = "single",
  showMonthNavigation,
  showNavigation = true,
  showYearNavigation = true,
  showTodayButton = true,
  showCaption = true,
  showOutsideDays = true,
  fixedWeeks = true,
  weekStartsOn = 0,
  
  // Labels
  todayButtonLabel = "Hoje",
  monthLabels = DEFAULT_MONTH_LABELS,
  weekDayLabels = DEFAULT_WEEKDAY_LABELS,
}: CalendarProps) {
  const today = new Date();
  
  // Resolver showMonthNavigation (nova API) vs showNavigation (compatibilidade)
  const shouldShowMonthNav = showMonthNavigation ?? showNavigation;
  
  // Merge de configuração de tamanho
  const sizeConf = React.useMemo(() => ({
    ...SIZE_CONFIGS[size],
    ...customSizeConfig,
  }), [size, customSizeConfig]);
  
  // Estado interno do mês visualizado
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    defaultMonth || controlledMonth || today
  );
  
  // Suporte a modo controlado/não-controlado
  const viewMonth = controlledMonth || internalMonth;
  const setViewMonth = (date: Date) => {
    if (!controlledMonth) {
      setInternalMonth(date);
    }
    onMonthChange?.(date);
  };
  
  // Reordenar labels dos dias da semana baseado em weekStartsOn
  const orderedWeekDays = React.useMemo(() => {
    const days = [...weekDayLabels];
    for (let i = 0; i < weekStartsOn; i++) {
      days.push(days.shift()!);
    }
    return days;
  }, [weekDayLabels, weekStartsOn]);
  
  // Gerar dias do calendário
  const calendarDays = React.useMemo(() => {
    return getCalendarDays(viewMonth, weekStartsOn, fixedWeeks, showOutsideDays);
  }, [viewMonth, weekStartsOn, fixedWeeks, showOutsideDays]);
  
  // Resolver função de disabled (compatibilidade com react-day-picker)
  const isDateDisabled = React.useCallback((date: Date): boolean => {
    // Verificar minDate/maxDate
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    // Verificar disabledDates (nova API)
    if (disabledDates?.(date)) return true;
    
    // Verificar disabled (compatibilidade com react-day-picker)
    if (disabled) {
      if (typeof disabled === "function") {
        return disabled(date);
      }
      if (Array.isArray(disabled)) {
        return disabled.some(d => isSameDay(d, date));
      }
    }
    
    return false;
  }, [minDate, maxDate, disabledDates, disabled]);
  
  // Calcular modifiers ativos para uma data
  const getActiveModifiers = React.useCallback((date: Date): Record<string, boolean> => {
    const active: Record<string, boolean> = {};
    
    if (!modifiers) return active;
    
    for (const [name, value] of Object.entries(modifiers)) {
      if (typeof value === "function") {
        active[name] = value(date);
      } else if (Array.isArray(value)) {
        active[name] = value.some(d => isSameDay(d, date));
      }
    }
    
    return active;
  }, [modifiers]);
  
  // Handlers de navegação
  const handlePreviousMonth = () => setViewMonth(addMonths(viewMonth, -1));
  const handleNextMonth = () => setViewMonth(addMonths(viewMonth, 1));
  const handlePreviousYear = () => setViewMonth(addYears(viewMonth, -1));
  const handleNextYear = () => setViewMonth(addYears(viewMonth, 1));
  const handleToday = () => {
    setViewMonth(today);
    onSelect?.(today);
    onDayClick?.(today);
  };
  
  // Handler de seleção de dia
  const handleDayClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onSelect?.(date);
    onDayClick?.(date);
  };
  
  // Preparar dados de cada dia
  const getDayData = (date: Date): CalendarDay => ({
    date,
    isCurrentMonth: isSameMonth(date, viewMonth),
    isToday: isSameDay(date, today),
    isSelected: isSameDay(date, selected),
    isInRange: false,
    isRangeStart: false,
    isRangeEnd: false,
    isDisabled: isDateDisabled(date),
  });
  
  // Verificar se navegação deve estar desabilitada
  const canNavigatePrevMonth = !minDate || addMonths(viewMonth, -1) >= startOfMonth(minDate);
  const canNavigateNextMonth = !maxDate || addMonths(viewMonth, 1) <= startOfMonth(maxDate);
  const canNavigatePrevYear = !minDate || addYears(viewMonth, -1) >= startOfMonth(minDate);
  const canNavigateNextYear = !maxDate || addYears(viewMonth, 1) <= startOfMonth(maxDate);
  
  return (
    <div className={cn(sizeConf.padding, "select-none", className)}>
      {/* Header: Caption e Navegação */}
      {(showCaption || shouldShowMonthNav || showYearNavigation) && (
        <div className="flex items-center justify-between mb-4">
          {/* Navegação Esquerda */}
          <div className="flex items-center gap-1">
            {showYearNavigation && (
              <button
                type="button"
                onClick={handlePreviousYear}
                disabled={!canNavigatePrevYear}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  sizeConf.navButton,
                  "p-0 opacity-50 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed"
                )}
                aria-label="Ano anterior"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
            {shouldShowMonthNav && (
              <button
                type="button"
                onClick={handlePreviousMonth}
                disabled={!canNavigatePrevMonth}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  sizeConf.navButton,
                  "p-0 opacity-50 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed"
                )}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Caption */}
          {showCaption && (
            <span className={cn("font-medium", sizeConf.headerText)}>
              {monthLabels[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
          )}
          
          {/* Navegação Direita */}
          <div className="flex items-center gap-1">
            {shouldShowMonthNav && (
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={!canNavigateNextMonth}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  sizeConf.navButton,
                  "p-0 opacity-50 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed"
                )}
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {showYearNavigation && (
              <button
                type="button"
                onClick={handleNextYear}
                disabled={!canNavigateNextYear}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  sizeConf.navButton,
                  "p-0 opacity-50 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed"
                )}
                aria-label="Próximo ano"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Grid do Calendário */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="flex">
            {orderedWeekDays.map((day, index) => (
              <th
                key={index}
                className={cn(
                  "text-muted-foreground rounded-md font-normal text-center",
                  sizeConf.weekDay
                )}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
            <tr key={weekIndex} className={cn("flex", sizeConf.gap)}>
              {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                const dayData = getDayData(date);
                const isOutsideMonth = !dayData.isCurrentMonth;
                const activeModifiers = getActiveModifiers(date);
                
                // Construir classes do modifier
                const modifierClasses = Object.entries(activeModifiers)
                  .filter(([_, isActive]) => isActive)
                  .map(([name]) => modifiersClassNames?.[name] || "")
                  .filter(Boolean)
                  .join(" ");
                
                // Verificar se tem algum modifier ativo (para não aplicar estilos padrão de seleção)
                const hasActiveModifier = Object.values(activeModifiers).some(Boolean);
                
                return (
                  <td
                    key={dayIndex}
                    className={cn("text-center p-0 relative", sizeConf.cell)}
                  >
                    <button
                      type="button"
                      onClick={() => handleDayClick(date)}
                      disabled={dayData.isDisabled}
                      className={cn(
                        // Base styles (sem buttonVariants para controle total do tamanho)
                        "inline-flex items-center justify-center rounded-md transition-colors",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        "hover:bg-accent hover:text-accent-foreground",
                        sizeConf.cell,
                        sizeConf.text,
                        "p-0 font-normal",
                        // Estados padrão (só aplicar se não tiver modifier ativo)
                        !hasActiveModifier && dayData.isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                        !hasActiveModifier && dayData.isToday && !dayData.isSelected && "bg-accent text-accent-foreground",
                        // Outside month (só aplicar se não tiver modifier)
                        !hasActiveModifier && isOutsideMonth && "text-muted-foreground opacity-50",
                        // Disabled
                        dayData.isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed pointer-events-none",
                        // Classes dos modifiers
                        modifierClasses,
                      )}
                    >
                      {renderDayContent ? (
                        renderDayContent({
                          date,
                          displayMonth: viewMonth,
                          activeModifiers,
                        })
                      ) : (
                        <span>{date.getDate()}</span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Botão Hoje */}
      {showTodayButton && (
        <div className={cn("flex justify-center", sizeConf.gap, "mt-3")}>
          <button
            type="button"
            onClick={handleToday}
            className={cn("text-primary hover:underline", sizeConf.text)}
          >
            {todayButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
export default Calendar;
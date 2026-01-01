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

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface CalendarRangeDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
  isHovered: boolean;
}

export interface CalendarRangeProps {
  /** Range selecionado */
  selected?: DateRange;
  /** Callback quando o range muda */
  onSelect?: (range: DateRange) => void;
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
  /** Número máximo de dias no range */
  maxRangeDays?: number;
  /** Número mínimo de dias no range */
  minRangeDays?: number;
  /** Renderização customizada do conteúdo do dia */
  renderDayContent?: (day: CalendarRangeDay) => React.ReactNode;
  /** Renderização customizada do popover de informações */
  renderRangeInfo?: (range: DateRange) => React.ReactNode;
  /** Classes CSS customizadas */
  className?: string;
  
  // ===== Tamanho =====
  /** Tamanho predefinido do calendário */
  size?: CalendarSize;
  /** Configuração de tamanho customizada (sobrescreve size) */
  sizeConfig?: Partial<CalendarSizeConfig>;
  
  // ===== Feature Flags =====
  /** Mostrar navegação por mês (< >) */
  showMonthNavigation?: boolean;
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
  /** Mostrar informações do range selecionado */
  showRangeInfo?: boolean;
  /** Permitir seleção de range aberto (apenas from) */
  allowOpenRange?: boolean;
  /** Mostrar dois meses lado a lado */
  numberOfMonths?: 1 | 2;
  
  // ===== Labels customizáveis =====
  todayButtonLabel?: string;
  monthLabels?: string[];
  weekDayLabels?: string[];
  clearLabel?: string;
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

function isDateBetween(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const d = date.getTime();
  const s = start.getTime();
  const e = end.getTime();
  return d > Math.min(s, e) && d < Math.max(s, e);
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

function differenceInDays(date1: Date, date2: Date): number {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getCalendarDays(
  viewDate: Date,
  weekStartsOn: number,
  fixedWeeks: boolean,
  showOutsideDays: boolean
): Date[] {
  const firstDayOfMonth = startOfMonth(viewDate);
  const lastDayOfMonth = endOfMonth(viewDate);
  
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysToSubtract = (firstDayWeekday - weekStartsOn + 7) % 7;
  const calendarStart = new Date(firstDayOfMonth);
  calendarStart.setDate(calendarStart.getDate() - daysToSubtract);
  
  const totalDays = fixedWeeks ? 42 : (() => {
    const lastDayWeekday = lastDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const daysAfter = (6 - lastDayWeekday + weekStartsOn) % 7;
    return daysToSubtract + daysInMonth + daysAfter;
  })();
  
  const days: Date[] = [];
  const current = new Date(calendarStart);
  
  for (let i = 0; i < totalDays; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

function formatDate(date: Date | null, locale: string = "pt-BR"): string {
  if (!date) return "";
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

function CalendarRange({
  selected = { from: null, to: null },
  onSelect,
  defaultMonth,
  month: controlledMonth,
  onMonthChange,
  minDate,
  maxDate,
  disabledDates,
  maxRangeDays,
  minRangeDays,
  renderDayContent,
  renderRangeInfo,
  className,
  
  // Tamanho
  size = "md",
  sizeConfig: customSizeConfig,
  
  // Feature flags com defaults
  showMonthNavigation = true,
  showYearNavigation = true,
  showTodayButton = true,
  showCaption = true,
  showOutsideDays = true,
  fixedWeeks = true,
  weekStartsOn = 0,
  showRangeInfo = true,
  allowOpenRange = false,
  numberOfMonths = 1,
  
  // Labels
  todayButtonLabel = "Hoje",
  monthLabels = DEFAULT_MONTH_LABELS,
  weekDayLabels = DEFAULT_WEEKDAY_LABELS,
  clearLabel = "Limpar",
}: CalendarRangeProps) {
  const today = new Date();
  
  // Merge de configuração de tamanho
  const sizeConf = React.useMemo(() => ({
    ...SIZE_CONFIGS[size],
    ...customSizeConfig,
  }), [size, customSizeConfig]);
  
  // Estado interno do mês visualizado
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    defaultMonth || controlledMonth || selected?.from || today
  );
  
  // Estado de hover para preview do range
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);
  
  // Estado de seleção: "idle" | "selecting" (após selecionar from, antes de to)
  const [selectionState, setSelectionState] = React.useState<"idle" | "selecting">(
    selected?.from && !selected?.to ? "selecting" : "idle"
  );
  
  // Suporte a modo controlado/não-controlado
  const viewMonth = controlledMonth || internalMonth;
  const setViewMonth = (date: Date) => {
    if (!controlledMonth) {
      setInternalMonth(date);
    }
    onMonthChange?.(date);
  };
  
  // Reordenar labels dos dias da semana
  const orderedWeekDays = React.useMemo(() => {
    const days = [...weekDayLabels];
    for (let i = 0; i < weekStartsOn; i++) {
      days.push(days.shift()!);
    }
    return days;
  }, [weekDayLabels, weekStartsOn]);
  
  // Gerar dias do calendário para cada mês visível
  const calendarMonths = React.useMemo(() => {
    const months = [];
    for (let i = 0; i < numberOfMonths; i++) {
      const monthDate = addMonths(viewMonth, i);
      months.push({
        date: monthDate,
        days: getCalendarDays(monthDate, weekStartsOn, fixedWeeks, showOutsideDays),
      });
    }
    return months;
  }, [viewMonth, weekStartsOn, fixedWeeks, showOutsideDays, numberOfMonths]);
  
  // Verificar se uma data está desabilitada
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates?.(date)) return true;
    
    // Se estamos selecionando "to" e há restrições de range
    if (selectionState === "selecting" && selected?.from) {
      const daysDiff = differenceInDays(date, selected.from);
      if (maxRangeDays && daysDiff > maxRangeDays) return true;
      if (minRangeDays && daysDiff < minRangeDays && !isSameDay(date, selected.from)) return true;
    }
    
    return false;
  };
  
  // Handlers de navegação
  const handlePreviousMonth = () => setViewMonth(addMonths(viewMonth, -1));
  const handleNextMonth = () => setViewMonth(addMonths(viewMonth, 1));
  const handlePreviousYear = () => setViewMonth(addYears(viewMonth, -1));
  const handleNextYear = () => setViewMonth(addYears(viewMonth, 1));
  const handleToday = () => {
    setViewMonth(today);
  };
  
  const handleClear = () => {
    onSelect?.({ from: null, to: null });
    setSelectionState("idle");
    setHoveredDate(null);
  };
  
  // Handler de seleção de dia
  const handleDayClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    if (selectionState === "idle" || !selected?.from) {
      // Primeira seleção ou reinício
      onSelect?.({ from: date, to: null });
      setSelectionState("selecting");
    } else {
      // Segunda seleção
      let from = selected.from;
      let to = date;
      
      // Garantir que from < to
      if (to < from) {
        [from, to] = [to, from];
      }
      
      onSelect?.({ from, to });
      setSelectionState("idle");
      setHoveredDate(null);
    }
  };
  
  // Preparar dados de cada dia
  const getDayData = (date: Date, monthDate: Date): CalendarRangeDay => {
    const isRangeStart = isSameDay(date, selected?.from);
    const isRangeEnd = isSameDay(date, selected?.to);
    
    // Calcular se está no range (incluindo hover preview)
    let isInRange = false;
    let previewEnd = selected?.to || (selectionState === "selecting" ? hoveredDate : null);
    
    if (selected?.from && previewEnd) {
      isInRange = isDateBetween(date, selected.from, previewEnd) || isRangeStart || isRangeEnd;
    }
    
    const isHovered = isSameDay(date, hoveredDate);
    
    return {
      date,
      isCurrentMonth: isSameMonth(date, monthDate),
      isToday: isSameDay(date, today),
      isSelected: isRangeStart || isRangeEnd,
      isInRange,
      isRangeStart,
      isRangeEnd: isRangeEnd || (selectionState === "selecting" && isHovered),
      isDisabled: isDateDisabled(date),
      isHovered,
    };
  };
  
  // Verificar se navegação deve estar desabilitada
  const canNavigatePrevMonth = !minDate || addMonths(viewMonth, -1) >= startOfMonth(minDate);
  const canNavigateNextMonth = !maxDate || addMonths(viewMonth, numberOfMonths) <= endOfMonth(maxDate);
  const canNavigatePrevYear = !minDate || addYears(viewMonth, -1) >= startOfMonth(minDate);
  const canNavigateNextYear = !maxDate || addYears(viewMonth, numberOfMonths) <= endOfMonth(maxDate);
  
  // Renderizar um mês
  const renderMonth = (monthData: { date: Date; days: Date[] }, monthIndex: number) => (
    <div key={monthIndex} className="space-y-4">
      {/* Caption do mês (quando há múltiplos meses) */}
      {numberOfMonths > 1 && showCaption && (
        <div className={cn("text-center font-medium", sizeConf.headerText)}>
          {monthLabels[monthData.date.getMonth()]} {monthData.date.getFullYear()}
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
          {Array.from({ length: Math.ceil(monthData.days.length / 7) }).map((_, weekIndex) => (
            <tr key={weekIndex} className={cn("flex", sizeConf.gap)}>
              {monthData.days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                const dayData = getDayData(date, monthData.date);
                const isOutsideMonth = !dayData.isCurrentMonth;
                
                return (
                  <td
                    key={dayIndex}
                    className={cn(
                      "text-center p-0 relative",
                      sizeConf.cell,
                      // Background do range
                      dayData.isInRange && !dayData.isRangeStart && !dayData.isRangeEnd && "bg-accent",
                      dayData.isRangeStart && "rounded-l-md bg-accent",
                      dayData.isRangeEnd && "rounded-r-md bg-accent",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleDayClick(date)}
                      onMouseEnter={() => selectionState === "selecting" && setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={dayData.isDisabled}
                      className={cn(
                        // Base styles (sem buttonVariants para controle total do tamanho)
                        "inline-flex items-center justify-center rounded-md transition-colors",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        "hover:bg-accent hover:text-accent-foreground",
                        sizeConf.cell,
                        sizeConf.text,
                        "p-0 font-normal",
                        // Estados base
                        dayData.isToday && !dayData.isSelected && "bg-accent text-accent-foreground",
                        isOutsideMonth && "text-muted-foreground opacity-50",
                        dayData.isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed pointer-events-none",
                        // Range start/end com estilo destacado
                        (dayData.isRangeStart || dayData.isRangeEnd) && 
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-full",
                        // Hover preview
                        dayData.isHovered && selectionState === "selecting" && !dayData.isDisabled &&
                          "ring-2 ring-primary ring-offset-2",
                      )}
                    >
                      {renderDayContent ? (
                        renderDayContent(dayData)
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
    </div>
  );
  
  return (
    <div className={cn(sizeConf.padding, "select-none", className)}>
      {/* Header: Caption e Navegação */}
      {(showCaption || showMonthNavigation || showYearNavigation) && (
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
            {showMonthNavigation && (
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
          
          {/* Caption (para single month) */}
          {showCaption && numberOfMonths === 1 && (
            <span className={cn("font-medium", sizeConf.headerText)}>
              {monthLabels[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
          )}
          
          {/* Spacer para dual month */}
          {numberOfMonths > 1 && <div className="flex-1" />}
          
          {/* Navegação Direita */}
          <div className="flex items-center gap-1">
            {showMonthNavigation && (
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
      
      {/* Meses */}
      <div className={cn(
        "flex",
        numberOfMonths > 1 ? "gap-8" : ""
      )}>
        {calendarMonths.map((monthData, index) => renderMonth(monthData, index))}
      </div>
      
      {/* Range Info */}
      {showRangeInfo && (selected?.from || selected?.to) && (
        <div className={cn("mt-4 p-3 bg-muted rounded-md", sizeConf.text)}>
          {renderRangeInfo ? (
            renderRangeInfo(selected)
          ) : (
            <div className="flex flex-col gap-1">
              {selected.from && (
                <div>
                  <span className="text-muted-foreground">De:</span>{" "}
                  {formatDate(selected.from)}
                </div>
              )}
              {selected.to && (
                <div>
                  <span className="text-muted-foreground">Até:</span>{" "}
                  {formatDate(selected.to)}
                </div>
              )}
              {selected.from && selected.to && (
                <div className="text-muted-foreground text-xs mt-1">
                  {differenceInDays(selected.from, selected.to) + 1} dias
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Footer: Botões */}
      {(showTodayButton || selected?.from || selected?.to) && (
        <div className={cn("flex justify-center gap-4", sizeConf.gap, "mt-3")}>
          {showTodayButton && (
            <button
              type="button"
              onClick={handleToday}
              className={cn("text-primary hover:underline", sizeConf.text)}
            >
              {todayButtonLabel}
            </button>
          )}
          {(selected?.from || selected?.to) && (
            <button
              type="button"
              onClick={handleClear}
              className={cn("text-muted-foreground hover:underline", sizeConf.text)}
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

CalendarRange.displayName = "CalendarRange";

export { CalendarRange };
export default CalendarRange;
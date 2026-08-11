import { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useDateAvailability,
  DATE_AVAILABILITY_MODIFIER_CLASSES,
  DATE_AVAILABILITY_LEGEND,
} from "@/hooks/useDateAvailability";

export interface DatePickerFieldProps {
  /** Data no formato "yyyy-MM-dd" ("" quando vazia) */
  value: string;
  /** Recebe a data escolhida no formato "yyyy-MM-dd" */
  onChange: (value: string) => void;
  id?: string;
  /** Classes aplicadas ao botão que abre o calendário */
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Marca no calendário as datas disponíveis, bloqueadas e com evento,
   * exibe a legenda e avisa quando a data escolhida não está disponível.
   */
  showAvailability?: boolean;
  /**
   * Impede a escolha de datas indisponíveis: só datas disponíveis ou liberadas
   * ficam clicáveis. Exige `showAvailability`.
   */
  blockUnavailable?: boolean;
  /** Orçamento a ignorar ao checar ocupação (usar na edição) */
  ignoreQuoteId?: string;
}

/**
 * Campo de data com o calendário padrão do sistema dentro de um popover.
 *
 * Com `showAvailability`, usa as mesmas regras e cores da página de
 * Disponibilidade e alerta quando a data escolhida está indisponível.
 * Com `blockUnavailable`, também impede a escolha dessas datas.
 */
export function DatePickerField({
  value,
  onChange,
  id,
  className,
  placeholder = "Selecione a data",
  disabled = false,
  showAvailability = false,
  blockUnavailable = false,
  ignoreQuoteId,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const { getDateInfo, modifiers, hasMarker, loading } = useDateAvailability({
    ignoreQuoteId,
  });

  const selectedDate = useMemo(
    () => (value ? new Date(value + "T12:00:00") : undefined),
    [value]
  );

  // Destaca a data escolhida com um anel apenas quando ela já está colorida por
  // disponibilidade — nos demais casos o Calendar aplica sozinho o estilo de
  // seleção, que só é suprimido quando existe algum modifier ativo.
  const calendarModifiers = useMemo(() => {
    if (!showAvailability) return undefined;
    return {
      ...modifiers,
      selecionado: (date: Date) =>
        !!selectedDate && isSameDay(date, selectedDate) && hasMarker(date),
    };
  }, [showAvailability, modifiers, hasMarker, selectedDate]);

  const calendarModifierClasses = useMemo(() => {
    if (!showAvailability) return undefined;
    return {
      ...DATE_AVAILABILITY_MODIFIER_CLASSES,
      selecionado: "ring-2 ring-primary ring-offset-1",
    };
  }, [showAvailability]);

  // Aviso persistente: a data pode ter sido bloqueada depois de escolhida.
  // Enquanto carrega, ainda não dá para afirmar que está indisponível.
  const selectedInfo =
    showAvailability && !loading && selectedDate ? getDateInfo(selectedDate) : null;
  const selectedUnavailableReason = selectedInfo?.isAvailable
    ? null
    : selectedInfo?.unavailableReason ?? null;

  // Enquanto os dados não chegam, não dá para afirmar que uma data está
  // indisponível — bloquear tudo deixaria o calendário inutilizável.
  const isBlocked = showAvailability && blockUnavailable && !loading;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    const info = showAvailability && !loading ? getDateInfo(date) : null;

    // O Calendar já impede o clique, mas o botão "Hoje" chama onSelect direto.
    if (isBlocked && info && !info.isAvailable) {
      toast.warning("Data indisponível", {
        description: info.unavailableReason ?? undefined,
      });
      return;
    }

    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);

    if (info && !info.isAvailable && info.unavailableReason) {
      toast.warning("Data indisponível", {
        description: info.unavailableReason,
      });
    }
  };

  return (
    <div>
      <Popover modal={true} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {selectedDate
                ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 z-[9999]"
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={{ top: 60, bottom: 16, left: 16, right: 16 }}
          avoidCollisions={true}
          sticky="always"
        >
          <Calendar
            size="xs"
            showMonthNavigation={true}
            showYearNavigation={true}
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            modifiers={calendarModifiers}
            modifiersClassNames={calendarModifierClasses}
            disabled={
              isBlocked ? (date: Date) => !getDateInfo(date).isAvailable : undefined
            }
          />

          {showAvailability && (
            <div className="border-t px-3 py-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {DATE_AVAILABILITY_LEGEND.map(({ dot, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground"
                  >
                    <span className={cn("h-2 w-2 rounded-full", dot)} />
                    {label}
                  </span>
                ))}
              </div>
              {isBlocked && (
                <p className="text-[0.7rem] text-muted-foreground mt-1.5">
                  Só é possível escolher datas disponíveis ou liberadas.
                </p>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {selectedUnavailableReason && (
        <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{selectedUnavailableReason}</span>
        </p>
      )}
    </div>
  );
}

import { format, isSameDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, Ban, CheckCircle2, CalendarPlus } from "lucide-react";

interface EventoAceito {
  id: string;
  date: Date;
  clientName: string;
  guestCount: number;
  pacote: string;
}

interface DataBloqueada {
  id: string;
  date: Date;
  reason: string;
}

interface DataDisponivel {
  id: string;
  date: Date;
  reason: string | null;
}

interface DayWithTooltipProps {
  day: Date;
  eventosAceitos: EventoAceito[];
  datasBloqueadas: DataBloqueada[];
  datasDisponiveis?: DataDisponivel[];
  children: React.ReactNode;
}

export function DayWithTooltip({
  day,
  eventosAceitos,
  datasBloqueadas,
  datasDisponiveis = [],
  children,
}: DayWithTooltipProps) {
  const evento = eventosAceitos.find((e) => isSameDay(e.date, day));
  const bloqueio = datasBloqueadas.find((b) => isSameDay(b.date, day));
  const extraDisponivel = datasDisponiveis.find((d) => isSameDay(d.date, day));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isNaturallyAvailable = isWeekend(day);
  const isManuallyAvailable = !!extraDisponivel;
  const isAvailable = (isNaturallyAvailable || isManuallyAvailable) && day >= today && !evento && !bloqueio;

  // Mostrar tooltip para dias com evento, bloqueio, disponíveis ou clicáveis (dias de semana futuros)
  const isClickableWeekday = !isNaturallyAvailable && day >= today && !evento && !bloqueio && !isManuallyAvailable;
  
  if (!evento && !bloqueio && !isAvailable && !isClickableWeekday) {
    return <>{children}</>;
  }

  const getTooltipContent = () => {
    if (evento) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
            <Calendar className="h-3.5 w-3.5" />
            Evento Confirmado
          </div>
          <div className="text-sm">
            <span className="font-medium">Cliente:</span> {evento.clientName}
          </div>
          <div className="text-xs text-muted-foreground">
            {evento.guestCount} convidados • {evento.pacote}
          </div>
        </div>
      );
    }

    if (bloqueio) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
            <Ban className="h-3.5 w-3.5" />
            Data Bloqueada
          </div>
          <div className="text-sm">
            <span className="font-medium">Motivo:</span> {bloqueio.reason}
          </div>
        </div>
      );
    }

    if (isManuallyAvailable) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
            <CalendarPlus className="h-3.5 w-3.5" />
            Disponível (dia extra)
          </div>
          {extraDisponivel?.reason && (
            <div className="text-sm">
              <span className="font-medium">Motivo:</span> {extraDisponivel.reason}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Clique para remover disponibilidade
          </div>
        </div>
      );
    }

    if (isAvailable) {
      return (
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium">Disponível para eventos</span>
        </div>
      );
    }

    if (isClickableWeekday) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarPlus className="h-3.5 w-3.5" />
          <span className="font-medium">Clique para tornar disponível</span>
        </div>
      );
    }

    return null;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[250px] p-3"
          sideOffset={8}
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

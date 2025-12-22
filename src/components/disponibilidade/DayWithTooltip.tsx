import { format, isSameDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, Ban, CheckCircle2 } from "lucide-react";

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

interface DayWithTooltipProps {
  day: Date;
  eventosAceitos: EventoAceito[];
  datasBloqueadas: DataBloqueada[];
  children: React.ReactNode;
}

export function DayWithTooltip({
  day,
  eventosAceitos,
  datasBloqueadas,
  children,
}: DayWithTooltipProps) {
  const evento = eventosAceitos.find((e) => isSameDay(e.date, day));
  const bloqueio = datasBloqueadas.find((b) => isSameDay(b.date, day));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isAvailable = isWeekend(day) && day >= today && !evento && !bloqueio;

  // Só mostrar tooltip para dias com evento, bloqueio ou disponíveis
  if (!evento && !bloqueio && !isAvailable) {
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

    if (isAvailable) {
      return (
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium">Disponível para eventos</span>
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

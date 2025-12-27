import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Visit } from "@/hooks/useVisitsOptimized";

const statusStyles = {
  confirmada: "bg-success/10 text-success border-success/20",
  agendado: "bg-warning/10 text-warning border-warning/20",
  agendada: "bg-warning/10 text-warning border-warning/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
  realizada: "bg-primary/10 text-primary border-primary/20",
};

const statusLabels: Record<string, string> = {
  confirmada: "Confirmada",
  agendado: "Agendada",
  agendada: "Agendada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};

interface VisitCalendarViewProps {
  currentWeek: Date;
  weekDays: Date[];
  horarios: string[];
  getVisitsForSlot: (day: Date, time: string) => Visit[];
  getVisitorName: (visit: Visit) => string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onViewDetails: (visit: Visit) => void;
  onReschedule?: (visitId: string, newDate: string, newTime: string) => Promise<void>;
}

export function VisitCalendarView({
  currentWeek,
  weekDays,
  horarios,
  getVisitsForSlot,
  getVisitorName,
  onPreviousWeek,
  onNextWeek,
  onViewDetails,
  onReschedule,
}: VisitCalendarViewProps) {
  
  const [draggedVisit, setDraggedVisit] = React.useState<Visit | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{day: Date, time: string} | null>(null);

  const handleDragStart = (visit: Visit) => {
    setDraggedVisit(visit);
  };

  const handleDragOver = (e: React.DragEvent, day: Date, time: string) => {
    e.preventDefault();
    setDropTarget({ day, time });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, day: Date, time: string) => {
    e.preventDefault();
    
    if (draggedVisit && onReschedule) {
      const newDate = format(day, 'yyyy-MM-dd');
      const newTime = time;
      
      // Verifica se mudou de horário
      if (draggedVisit.visit_date !== newDate || draggedVisit.visit_time !== newTime) {
        await onReschedule(draggedVisit.id, newDate, newTime);
      }
    }
    
    setDraggedVisit(null);
    setDropTarget(null);
  };
  
  return (
    <div className="bg-card rounded-xl shadow-soft border border-border animate-slide-up overflow-hidden">
      {/* Week Navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousWeek}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="font-semibold">
            {format(weekDays[0], "dd MMM", { locale: ptBR })} - {format(weekDays[6], "dd MMM yyyy", { locale: ptBR })}
          </h3>
          {/* Legenda de Ocupação */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted/40 border border-border rounded"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border-l-2 border-l-green-400 rounded"></div>
              <span>Com espaço</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border-l-2 border-l-red-400 rounded"></div>
              <span>Ocupado</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextWeek}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid" style={{ gridTemplateColumns: `100px repeat(7, minmax(140px, 1fr))` }}>
            {/* Header - Days */}
            <div className="sticky left-0 bg-card z-10 p-3 border-r border-b"></div>
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={idx}
                  className={cn(
                    "text-center p-3 border-b",
                    isToday && "bg-gold/10"
                  )}
                >
                  <div className={cn(
                    "text-xs font-semibold uppercase",
                    isToday ? "text-gold" : "text-muted-foreground"
                  )}>
                    {format(day, "EEE", { locale: ptBR })}
                  </div>
                  <div className={cn(
                    "text-2xl font-bold mt-1",
                    isToday ? "text-gold" : "text-foreground"
                  )}>
                    {format(day, "dd")}
                  </div>
                </div>
              );
            })}

            {/* Time Slots */}
            {horarios.map((horario, hIdx) => (
              <React.Fragment key={hIdx}>
                {/* Time Label */}
                <div className="sticky left-0 bg-card z-10 flex items-center justify-center p-3 border-r border-b text-sm font-semibold text-muted-foreground">
                  {horario}
                </div>

                {/* Day Cells */}
                {weekDays.map((day, dIdx) => {
                  const visitsInSlot = getVisitsForSlot(day, horario);
                  const slotOccupancy = visitsInSlot.length;
                  const isToday = isSameDay(day, new Date());
                  const isDropTarget = dropTarget?.day === day && dropTarget?.time === horario;

                  // Define cores baseado na ocupação
                  let occupancyStyle = "";
                  if (slotOccupancy === 0) {
                    occupancyStyle = "bg-muted/20 hover:bg-muted/40"; // Vazio
                  } else if (slotOccupancy === 1) {
                    occupancyStyle = "bg-green-50 hover:bg-green-100 border-l-2 border-l-green-400"; // Com espaço
                  } else {
                    occupancyStyle = "bg-red-50 hover:bg-red-100 border-l-2 border-l-red-400"; // Cheio
                  }

                  return (
                    <div
                      key={dIdx}
                      className={cn(
                        "min-h-[80px] p-2 border-b border-r transition-colors relative group",
                        isToday && "bg-gold/5",
                        occupancyStyle,
                        isDropTarget && "ring-2 ring-primary bg-primary/10"
                      )}
                      title={slotOccupancy === 0 
                        ? "Horário disponível" 
                        : `${slotOccupancy} visita${slotOccupancy > 1 ? 's' : ''} agendada${slotOccupancy > 1 ? 's' : ''}`
                      }
                      onDragOver={(e) => handleDragOver(e, day, horario)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day, horario)}
                    >
                      {/* Tooltip com resumo */}
                      {slotOccupancy > 0 && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs min-w-[200px] max-w-[300px]">
                            <div className="font-semibold mb-2 text-foreground">
                              {slotOccupancy} Visita{slotOccupancy > 1 ? 's' : ''}
                            </div>
                            {visitsInSlot.slice(0, 3).map((visit, idx) => (
                              <div key={idx} className="text-muted-foreground mb-1">
                                • {getVisitorName(visit)}
                              </div>
                            ))}
                            {slotOccupancy > 3 && (
                              <div className="text-muted-foreground font-semibold mt-1">
                                +{slotOccupancy - 3} mais...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Indicador de quantidade no canto superior esquerdo */}
                      {slotOccupancy > 1 && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold">
                          {slotOccupancy}
                        </div>
                      )}

                      {/* Visitas */}
                      <div className="space-y-1">
                        {visitsInSlot.slice(0, 2).map((visit) => (
                          <button
                            key={visit.id}
                            draggable={!!onReschedule}
                            onDragStart={() => handleDragStart(visit)}
                            onClick={() => onViewDetails(visit)}
                            className={cn(
                              "w-full text-left p-2 rounded text-xs transition-all hover:shadow-md",
                              onReschedule && "cursor-move hover:scale-105",
                              !onReschedule && "hover:scale-105",
                              draggedVisit?.id === visit.id && "opacity-50",
                              statusStyles[visit.status as keyof typeof statusStyles] || statusStyles.agendado
                            )}
                            title={onReschedule ? "Arraste para reagendar" : undefined}
                          >
                            <div className="font-semibold truncate">
                              {getVisitorName(visit)}
                            </div>
                            <div className="text-[10px] opacity-75 capitalize">
                              {statusLabels[visit.status]}
                            </div>
                          </button>
                        ))}
                        {slotOccupancy > 2 && (
                          <div className="text-[10px] text-center text-muted-foreground font-semibold py-1 bg-muted/50 rounded">
                            +{slotOccupancy - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
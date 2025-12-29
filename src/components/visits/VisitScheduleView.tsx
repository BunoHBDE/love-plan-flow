import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Visit } from "@/hooks/useVisitsOptimized";

interface VisitScheduleViewProps {
  dateFilter: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  horarios: string[];
  visits: Visit[];
  statusFilter: string[];
  getVisitorName: (visit: Visit) => string;
  onViewDetails: (visit: Visit) => void;
  onScheduleVisit?: (date: string, time: string) => void;
}

export function VisitScheduleView({
  dateFilter,
  onDateChange,
  horarios,
  visits,
  statusFilter,
  getVisitorName,
  onViewDetails,
  onScheduleVisit,
}: VisitScheduleViewProps) {
  return (
    <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden h-full flex flex-col">
      <div className="grid lg:grid-cols-[380px_1fr] flex-1 overflow-hidden">
        {/* Calendar - Coluna Fixa */}
        <div className="border-r border-border p-6 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-4">Selecione uma Data</h3>
          <CalendarComponent
            mode="single"
            selected={dateFilter}
            onSelect={onDateChange}
            locale={ptBR}
            className="rounded-md border"
          />
          {dateFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(undefined)}
              className="w-full mt-4"
            >
              Limpar Data
            </Button>
          )}
        </div>

        {/* Horários do Dia - Área com Scroll Próprio */}
        {dateFilter ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-lg">
                Horários - {format(dateFilter, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-2">
                {horarios.map((horario) => {
                  const visitsInSlot = visits.filter(
                    (visit) =>
                      visit.visit_date === format(dateFilter, 'yyyy-MM-dd') &&
                      visit.visit_time === horario &&
                      (statusFilter.length === 0 || statusFilter.includes(visit.status))
                  );
                  const slotOccupancy = visitsInSlot.length;

                  return (
                    <div
                      key={horario}
                      className={`p-3 rounded-lg border transition-colors ${
                        slotOccupancy === 0
                          ? 'bg-muted/20 border-border hover:bg-muted/30'
                          : slotOccupancy === 1
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : 'bg-red-50 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm">{horario}</span>
                          {slotOccupancy > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {slotOccupancy} visita{slotOccupancy > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {slotOccupancy === 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600 font-medium">✓ Disponível</span>
                            {onScheduleVisit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onScheduleVisit(format(dateFilter, 'yyyy-MM-dd'), horario)}
                                className="h-7 text-xs"
                              >
                                Agendar
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </div>
                      {visitsInSlot.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {visitsInSlot.map((visit) => (
                            <button
                              key={visit.id}
                              onClick={() => onViewDetails(visit)}
                              className="w-full text-left text-sm p-2 rounded bg-card hover:bg-accent transition-colors border border-border"
                            >
                              <div className="font-medium">{getVisitorName(visit)}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                Status: {visit.status}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground p-6">
            <div className="text-center">
              <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Selecione uma data</p>
              <p className="text-sm">Escolha uma data no calendário para ver os horários disponíveis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
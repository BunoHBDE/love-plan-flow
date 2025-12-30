import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarDays, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Visit } from "@/hooks/useVisitsOptimized";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVisitSettings } from "@/hooks/useVisitSettings";

interface VisitScheduleViewProps {
  dateFilter: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  horarios: string[]; // Horários fixos antigos (mantido por compatibilidade)
  visits: Visit[];
  statusFilter: string[];
  getVisitorName: (visit: Visit) => string;
  onViewDetails: (visit: Visit) => void;
  onScheduleVisit?: (date: string, time: string) => void;
}

export function VisitScheduleView({
  dateFilter,
  onDateChange,
  horarios: _legacyHorarios, // Não usado mais
  visits,
  statusFilter,
  getVisitorName,
  onViewDetails,
  onScheduleVisit,
}: VisitScheduleViewProps) {
  const { settings, generateAvailableSlots, isTimeInRange, defaultSettings } = useVisitSettings();
  
  // Gerar horários baseado nas configurações
  const configuredSlots = generateAvailableSlots(settings);
  const currentSettings = settings || defaultSettings;

  // Pegar todos os horários únicos das visitas do dia selecionado (incluindo fora do range)
  const visitsOnSelectedDate = dateFilter 
    ? visits.filter(v => v.visit_date === format(dateFilter, 'yyyy-MM-dd'))
    : [];
  
  const visitTimesOnDate = [...new Set(visitsOnSelectedDate.map(v => v.visit_time))].sort();
  
  // Combinar horários configurados + horários com visitas existentes
  const allSlots = [...new Set([...configuredSlots, ...visitTimesOnDate])].sort();

  const getVisitsForSlot = (day: Date, time: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return visits.filter(visit => 
      visit.visit_date === dateStr && 
      visit.visit_time === time &&
      (statusFilter.length === 0 || statusFilter.includes(visit.status))
    );
  };

  const isSlotOutOfRange = (time: string) => {
    return !isTimeInRange(time, settings);
  };

  const getSlotOccupancyColor = (count: number) => {
    if (count === 0) return 'bg-muted/20 border-border hover:bg-muted/30';
    if (count === 1) return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    if (count === 2) return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
    return 'bg-red-50 border-red-200 hover:bg-red-100';
  };

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

          {/* Info sobre configurações */}
          <div className="mt-6 p-3 bg-muted/30 rounded-lg text-xs space-y-1">
            <p className="font-semibold">⚙️ Horários Configurados</p>
            <p className="text-muted-foreground">
              {currentSettings.start_time} - {currentSettings.end_time}
            </p>
            <p className="text-muted-foreground">
              Duração: {currentSettings.default_duration} min
            </p>
          </div>
        </div>

        {/* Horários do Dia - Área com Scroll Próprio */}
        {dateFilter ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  Horários - {format(dateFilter, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {allSlots.length} horários
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-2">
                {allSlots.map((horario) => {
                  const visitsInSlot = getVisitsForSlot(dateFilter, horario);
                  const slotOccupancy = visitsInSlot.length;
                  const outOfRange = isSlotOutOfRange(horario);

                  return (
                    <div
                      key={horario}
                      className={`p-4 rounded-lg border transition-colors ${getSlotOccupancyColor(slotOccupancy)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{horario}</span>
                          
                          {/* Badge se estiver fora do range */}
                          {outOfRange && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs border-warning text-warning">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Fora do padrão
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    Este horário está fora do range configurado<br />
                                    ({currentSettings.start_time} - {currentSettings.end_time})
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        {/* Botão agendar (apenas em horários vazios) */}
                        {slotOccupancy === 0 && onScheduleVisit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onScheduleVisit(format(dateFilter, 'yyyy-MM-dd'), horario)}
                          >
                            + Agendar
                          </Button>
                        )}

                        {/* Contador de ocupação */}
                        {slotOccupancy > 0 && (
                          <Badge variant={slotOccupancy === 1 ? "default" : slotOccupancy === 2 ? "secondary" : "destructive"}>
                            {slotOccupancy} {slotOccupancy === 1 ? 'visita' : 'visitas'}
                          </Badge>
                        )}
                      </div>

                      {/* Visitas agendadas neste horário */}
                      {visitsInSlot.length > 0 && (
                        <div className="space-y-2">
                          {visitsInSlot.map((visit) => (
                            <button
                              key={visit.id}
                              onClick={() => onViewDetails(visit)}
                              className="w-full text-left p-3 rounded-md bg-white dark:bg-gray-800 border border-border hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{getVisitorName(visit)}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    {visit.visit_end_time && (
                                      <span className="flex items-center gap-1">
                                        🕐 {visit.visit_time} - {visit.visit_end_time}
                                        {visit.duration && ` (${visit.duration} min)`}
                                      </span>
                                    )}
                                    {visit.guest_count && (
                                      <span>👥 {visit.guest_count} convidados</span>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={
                                  visit.status === 'confirmado' ? 'default' :
                                  visit.status === 'agendado' ? 'secondary' :
                                  visit.status === 'realizado' ? 'outline' :
                                  'destructive'
                                }>
                                  {visit.status}
                                </Badge>
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
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <CalendarDays className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground text-lg">
                Selecione uma data no calendário
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                para visualizar os horários disponíveis
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
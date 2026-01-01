import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarDays, AlertCircle, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Visit } from "@/hooks/useVisitsOptimized";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVisitSettings } from "@/hooks/useVisitSettings";

interface VisitScheduleViewProps {
  dateFilter: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  horarios: string[];
  visits: Visit[];
  statusFilter: string[];
  getVisitorName: (visit: Visit) => string;
  getWeddingDateDisplay: (visit: Visit) => string;
  onViewDetails: (visit: Visit) => void;
  onScheduleVisit?: (date: string, time: string) => void;
}

export function VisitScheduleView({
  dateFilter,
  onDateChange,
  horarios: _legacyHorarios,
  visits,
  statusFilter,
  getVisitorName,
  getWeddingDateDisplay,
  onViewDetails,
  onScheduleVisit,
}: VisitScheduleViewProps) {
  const { settings, generateAvailableSlots, isTimeInRange, defaultSettings } = useVisitSettings();
  
  const configuredSlots = generateAvailableSlots(settings);
  const currentSettings = settings || defaultSettings;

  const visitsOnSelectedDate = dateFilter 
    ? visits.filter(v => v.visit_date === format(dateFilter, 'yyyy-MM-dd'))
    : [];
  
  const visitTimesOnDate = [...new Set(visitsOnSelectedDate.map(v => v.visit_time.substring(0, 5)))].sort();
  
  const allSlots = [...new Set([...configuredSlots, ...visitTimesOnDate])].sort();

  const getVisitsForSlot = (day: Date, time: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return visits.filter(visit => 
      visit.visit_date === dateStr && 
      visit.visit_time.substring(0, 5) === time &&
      (statusFilter.length === 0 || statusFilter.includes(visit.status))
    );
  };

  const getAllVisitsForSlot = (day: Date, time: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return visits.filter(visit => 
      visit.visit_date === dateStr && 
      visit.visit_time.substring(0, 5) === time
    );
  };

  const isSlotOutOfRange = (time: string) => {
    return !isTimeInRange(time, settings);
  };

  const getSlotOccupancyColor = (count: number) => {
    if (count === 0) return 'bg-card border-border hover:bg-muted/30';
    if (count === 1) return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/50';
    if (count === 2) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-950/50';
    return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-950/50';
  };

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden h-full flex flex-col">
      <div className="grid lg:grid-cols-[380px_1fr] flex-1 overflow-hidden">
        {/* Calendar - Centralizado horizontalmente */}
        <div className="border-r border-border p-6 overflow-y-auto flex flex-col items-center">
          <h3 className="font-semibold text-lg mb-4">Selecione uma Data</h3>
          <CalendarComponent
            selected={dateFilter}
            onSelect={onDateChange}
            className="rounded-md border"
            showTodayButton={false}     
            showYearNavigation={false}   
          />
          {dateFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(undefined)}
              className="mt-4"
            >
              Hoje
            </Button>
          )}
        </div>

        {/* Horários */}
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
              <div className="grid gap-3">
                {allSlots.map((horario) => {
                  const visitsInSlot = getVisitsForSlot(dateFilter, horario);
                  const allVisitsInSlot = getAllVisitsForSlot(dateFilter, horario);
                  const slotOccupancy = visitsInSlot.length;
                  const totalOccupancy = allVisitsInSlot.length;
                  const outOfRange = isSlotOutOfRange(horario);

                  return (
                    <div
                      key={horario}
                      className={`p-4 rounded-lg border transition-all duration-200 ${getSlotOccupancyColor(slotOccupancy)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl text-foreground">{horario}</span>
                          
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

                        {totalOccupancy === 0 && onScheduleVisit && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gold text-gold hover:bg-gold hover:text-primary-foreground"
                            onClick={() => onScheduleVisit(format(dateFilter, 'yyyy-MM-dd'), horario)}
                          >
                            + Agendar
                          </Button>
                        )}

                        {slotOccupancy > 0 && (
                          <Badge variant={slotOccupancy === 1 ? "default" : slotOccupancy === 2 ? "secondary" : "destructive"}>
                            {slotOccupancy} {slotOccupancy === 1 ? 'visita' : 'visitas'}
                          </Badge>
                        )}
                      </div>

                      {visitsInSlot.length > 0 && (
                        <div className="space-y-2">
                          {visitsInSlot.map((visit) => (
                            <button
                              key={visit.id}
                              onClick={() => onViewDetails(visit)}
                              className="w-full text-left p-4 rounded-lg bg-gradient-to-br from-card to-muted/20 border border-border hover:shadow-md hover:border-gold/50 transition-all duration-200 group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 group-hover:bg-gold/20 transition-colors flex-shrink-0">
                                    <User className="h-5 w-5 text-gold" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-base truncate text-foreground group-hover:text-gold transition-colors">
                                      {getVisitorName(visit)}
                                    </p>
                                    
                                    <div className="flex flex-col gap-1.5 mt-2">
                                      {visit.visit_end_time && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <span className="text-base">Horário:</span>
                                          <span className="font-medium">
                                            {visit.visit_time.substring(0, 5)} - {visit.visit_end_time.substring(0, 5)}
                                          </span>
                                          {visit.duration && (
                                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                              {visit.duration} min
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      
                                      {visit.guest_count && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <span>{visit.guest_count} convidados</span>
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="text-base">Casamento: </span>
                                        <span>{getWeddingDateDisplay(visit)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <Badge 
                                  className="flex-shrink-0"
                                  variant={
                                    visit.status === 'confirmado' ? 'default' :
                                    visit.status === 'agendado' ? 'secondary' :
                                    visit.status === 'realizado' ? 'outline' :
                                    'destructive'
                                  }
                                >
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
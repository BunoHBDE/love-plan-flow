import React from "react";
import { timeToMinutes, getVisitEndMinutes } from "@/lib/timeConflictUtils";
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

  // ✅ CORRETO - Usa intervalo [início, fim) para não duplicar visitas consecutivas
  const getVisitsForSlot = (day: Date, time: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const slotMinutes = timeToMinutes(time);
    
    return visits.filter(visit => {
      if (visit.visit_date !== dateStr) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(visit.status)) return false;
      
      const visitStartMinutes = timeToMinutes(visit.visit_time.substring(0, 5));
      const visitEndMinutes = getVisitEndMinutes(visit, currentSettings.default_duration);
      
      // IMPORTANTE: Intervalo [início, fim) - fim é EXCLUSIVO
      // Visita 09:00-10:00 ocupa slots 09:00 e 09:30, mas NÃO o 10:00
      return slotMinutes >= visitStartMinutes && slotMinutes < visitEndMinutes;
    });
  };

  // ✅ CORRETO - Mesma lógica de intervalo [início, fim)
  const getAllVisitsForSlot = (day: Date, time: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const slotMinutes = timeToMinutes(time);
    
    return visits.filter(visit => {
      if (visit.visit_date !== dateStr) return false;
      
      const visitStartMinutes = timeToMinutes(visit.visit_time.substring(0, 5));
      const visitEndMinutes = getVisitEndMinutes(visit, currentSettings.default_duration);
      
      // Intervalo [início, fim) - fim é EXCLUSIVO
      return slotMinutes >= visitStartMinutes && slotMinutes < visitEndMinutes;
    });
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
        {/* Calendar - Responsivo */}
        <div className="border-b lg:border-b-0 lg:border-r border-border p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
          <h3 className="font-semibold text-lg mb-4">Selecione uma Data</h3>
          <CalendarComponent
            selected={dateFilter}
            onSelect={onDateChange}
            className="rounded-md border w-full [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_th]:w-auto [&_.rdp-cell]:w-auto [&_.rdp-head_th]:p-0 [&_.rdp-cell]:p-0 [&_.rdp-button]:w-full [&_.rdp-button]:h-9 sm:[&_.rdp-button]:h-10 [&_.rdp-day]:text-sm"
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
          <div className="flex flex-col h-full min-h-0">
            <div className="p-4 sm:p-6 border-b border-border bg-muted/30 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-base sm:text-lg truncate">
                  Horários - {format(dateFilter, "dd/MM/yyyy", { locale: ptBR })}
                </h3>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {allSlots.length} horários
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                      className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 ${getSlotOccupancyColor(slotOccupancy)}`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-lg sm:text-xl text-foreground">{horario}</span>
                          
                          {outOfRange && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-[10px] sm:text-xs border-warning text-warning">
                                    <AlertCircle className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Fora do padrão</span>
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
                            className="border-gold text-gold hover:bg-gold hover:text-primary-foreground text-xs sm:text-sm"
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
                              className="w-full text-left p-3 rounded-lg bg-gradient-to-br from-card to-muted/20 border border-border hover:shadow-md hover:border-gold/50 transition-all duration-200 group"
                            >
                              {/* Layout compacto para mobile */}
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gold/10 group-hover:bg-gold/20 transition-colors flex-shrink-0">
                                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
                                </div>
                                
                                {/* Info principal */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-sm sm:text-base truncate text-foreground group-hover:text-gold transition-colors">
                                      {getVisitorName(visit)}
                                    </p>
                                    <Badge 
                                      className="flex-shrink-0 text-[10px] sm:text-xs"
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
                                  
                                  {/* Informações secundárias em linha única */}
                                  <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                    {visit.visit_end_time && (
                                      <span className="flex items-center gap-1">
                                        {visit.visit_time.substring(0, 5)}-{visit.visit_end_time.substring(0, 5)}
                                        {visit.duration && (
                                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full hidden sm:inline">
                                            {visit.duration}min
                                          </span>
                                        )}
                                      </span>
                                    )}
                                    
                                    {visit.guest_count && (
                                      <>
                                        <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                                        <span className="hidden sm:inline">{visit.guest_count} convidados</span>
                                      </>
                                    )}
                                    
                                    <span className="text-muted-foreground/50">•</span>
                                    <span className="truncate">
                                      <span className="hidden sm:inline">Casamento: </span>
                                      {getWeddingDateDisplay(visit)}
                                    </span>
                                  </div>
                                </div>
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
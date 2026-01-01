// src/lib/timeConflictUtils.ts
// ==========================================
// UTILITÁRIOS PARA VERIFICAÇÃO DE CONFLITOS DE HORÁRIO
// ==========================================

import type { Visit } from "@/hooks/useVisitsOptimized";

/**
 * Converte string de horário (HH:MM ou HH:MM:SS) para minutos desde meia-noite
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.substring(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde meia-noite para string HH:MM
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Obtém o horário de término de uma visita em minutos
 * Usa visit_end_time se disponível, senão calcula a partir de duration
 */
export function getVisitEndMinutes(visit: Visit, fallbackDuration: number = 60): number {
  const startMinutes = timeToMinutes(visit.visit_time);
  
  if (visit.visit_end_time) {
    return timeToMinutes(visit.visit_end_time);
  }
  
  if (visit.duration && visit.duration > 0) {
    return startMinutes + visit.duration;
  }
  
  return startMinutes + fallbackDuration;
}

/**
 * Verifica se dois intervalos de tempo se sobrepõem DE VERDADE
 * 
 * IMPORTANTE: Intervalos que apenas "encostam" NÃO são sobreposição!
 * Exemplo: [09:00-10:00] e [10:00-11:00] NÃO se sobrepõem
 * 
 * Matemática: [A, B) e [C, D) se sobrepõem se A < D AND C < B
 */
export function doIntervalsOverlap(
  start1: number, end1: number,
  start2: number, end2: number
): boolean {
  // Usa < estrito para não considerar "encostes" como sobreposição
  return start1 < end2 && start2 < end1;
}

/**
 * Verifica se um slot específico está DENTRO do período de uma visita
 * 
 * IMPORTANTE: Usa intervalo [início, fim) - início inclusivo, fim exclusivo
 * O slot das 10:00 NÃO pertence a uma visita que TERMINA às 10:00
 */
export function isSlotOccupiedByVisit(
  slotMinutes: number,
  visitStartMinutes: number,
  visitEndMinutes: number
): boolean {
  // Intervalo [início, fim) - fim é EXCLUSIVO
  return slotMinutes >= visitStartMinutes && slotMinutes < visitEndMinutes;
}
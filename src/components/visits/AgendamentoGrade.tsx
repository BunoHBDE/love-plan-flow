import React, { useState } from 'react';
import { Calendar, Clock, User, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendamentoGradeProps {
  clientSearch: string;
  clientSearchResults: any[];
  selectedClientId: string | null;
  onClientSearchChange: (value: string) => void;
  onClientSelect: (client: any) => void;
  onConfirm: (data: {
    date: string;
    time: string;
    clientId: string | null;
    notes: string;
    guestCount: string;
    weddingDateStatus: "defined" | "undefined";
    weddingDate: string;
    weddingMonthEstimate: string;
    weddingYearEstimate: string;
  }) => void;
  onCancel: () => void;
}

export function AgendamentoGrade({
  clientSearch,
  clientSearchResults,
  selectedClientId,
  onClientSearchChange,
  onClientSelect,
  onConfirm,
  onCancel
}: AgendamentoGradeProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ day: Date; horario: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [weddingDateStatus, setWeddingDateStatus] = useState<"defined" | "undefined">("undefined");
  const [weddingDate, setWeddingDate] = useState("");
  const [weddingMonth, setWeddingMonth] = useState("");
  const [weddingYear, setWeddingYear] = useState("");

  // Próximos 7 dias
  const getDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDays();
  const horarios = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

  // Simulação de horários disponíveis
  const isAvailable = (day: Date, horario: string) => {
    // Aqui você pode adicionar lógica para verificar disponibilidade real
    // Por exemplo, checar se já existe agendamento nesse horário
    return Math.random() > 0.2; // 80% de disponibilidade
  };

  const formatDate = (date: Date) => {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      diaSemana: dias[date.getDay()],
      dia: date.getDate(),
      mes: format(date, 'MMM', { locale: ptBR })
    };
  };

  const handleSlotClick = (day: Date, horario: string) => {
    if (isAvailable(day, horario)) {
      setSelectedSlot({ day, horario });
    }
  };

  const handleConfirm = () => {
    if (!selectedSlot || !selectedClientId) return;

    onConfirm({
      date: format(selectedSlot.day, 'yyyy-MM-dd'),
      time: selectedSlot.horario,
      clientId: selectedClientId,
      notes,
      guestCount,
      weddingDateStatus,
      weddingDate,
      weddingMonthEstimate: weddingMonth,
      weddingYearEstimate: weddingYear,
    });
  };

  return (
    <div className="space-y-6">
      {/* Seleção de Cliente */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Cliente *</Label>
        </div>
        
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={clientSearch}
            onChange={(e) => onClientSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {clientSearchResults.length > 0 && (
          <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
            {clientSearchResults.map((client: any) => (
              <button
                key={client.id}
                onClick={() => onClientSelect(client)}
                className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors"
              >
                <div className="font-medium">{client.nome}</div>
                {client.telefone && (
                  <div className="text-sm text-muted-foreground">{client.telefone}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedClientId && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Cliente selecionado</span>
          </div>
        )}
      </div>

      {/* Grade de Horários */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Selecione Data e Horário *</Label>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid gap-1 p-2" style={{ gridTemplateColumns: `80px repeat(${days.length}, minmax(90px, 1fr))` }}>
                {/* Header - Dias */}
                <div className="p-2"></div>
                {days.map((day, idx) => {
                  const { diaSemana, dia, mes } = formatDate(day);
                  const isToday = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`text-center p-2 rounded-t ${
                        isToday ? 'bg-gold/10 border-2 border-gold' : 'bg-muted'
                      }`}
                    >
                      <div className={`text-xs font-semibold ${isToday ? 'text-gold' : 'text-muted-foreground'}`}>
                        {diaSemana}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? 'text-gold' : 'text-foreground'}`}>
                        {dia}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{mes}</div>
                    </div>
                  );
                })}

                {/* Linhas de Horários */}
                {horarios.map((horario, hIdx) => (
                  <React.Fragment key={hIdx}>
                    {/* Coluna de Horário */}
                    <div className="flex items-center justify-center bg-muted rounded p-2 text-sm font-semibold text-foreground">
                      {horario}
                    </div>

                    {/* Células de Agendamento */}
                    {days.map((day, dIdx) => {
                      const available = isAvailable(day, horario);
                      const isSelected = selectedSlot?.day.getTime() === day.getTime() && selectedSlot?.horario === horario;

                      return (
                        <button
                          key={dIdx}
                          onClick={() => handleSlotClick(day, horario)}
                          disabled={!available}
                          className={`p-3 rounded transition-all duration-200 border ${
                            isSelected
                              ? 'bg-gold border-gold text-white shadow-md scale-105'
                              : available
                              ? 'bg-white border-border hover:border-gold hover:bg-gold/5 hover:scale-105'
                              : 'bg-muted border-border cursor-not-allowed opacity-40'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-4 h-4 mx-auto" />
                          ) : available ? (
                            <div className="w-4 h-4 mx-auto rounded-full border-2 border-muted-foreground/30"></div>
                          ) : (
                            <X className="w-4 h-4 mx-auto text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-white border border-border rounded"></div>
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-gold rounded"></div>
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-muted border border-border rounded opacity-40"></div>
            <span>Indisponível</span>
          </div>
        </div>
      </div>

      {/* Informações Adicionais (aparecem quando um horário é selecionado) */}
      {selectedSlot && selectedClientId && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" />
              <span className="font-semibold">
                {format(selectedSlot.day, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {selectedSlot.horario}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="guestCount">Número de Convidados</Label>
              <Input
                id="guestCount"
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="Ex: 150"
              />
            </div>

            <div className="grid gap-2">
              <Label>Data do Casamento</Label>
              <Select value={weddingDateStatus} onValueChange={(val: "defined" | "undefined") => setWeddingDateStatus(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">Ainda não definida</SelectItem>
                  <SelectItem value="defined">Já tenho a data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {weddingDateStatus === "defined" ? (
              <div className="grid gap-2">
                <Label htmlFor="weddingDate">Data do Casamento</Label>
                <Input
                  id="weddingDate"
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Mês Previsto</Label>
                  <Select value={weddingMonth} onValueChange={setWeddingMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Ano Previsto</Label>
                  <Select value={weddingYear} onValueChange={setWeddingYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre a visita..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          variant="gold" 
          onClick={handleConfirm}
          disabled={!selectedSlot || !selectedClientId}
        >
          <Check className="h-4 w-4 mr-2" />
          Confirmar Agendamento
        </Button>
      </div>
    </div>
  );
}
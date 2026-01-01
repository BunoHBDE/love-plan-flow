import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVisitSettings, type VisitSettingsInsert } from "@/hooks/useVisitSettings";
import { Separator } from "@/components/ui/separator";

interface VisitSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VisitSettingsDialog({ open, onOpenChange }: VisitSettingsDialogProps) {
  const { settings, loading, saveSettings, resetToDefault, defaultSettings } = useVisitSettings();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<VisitSettingsInsert>({
    start_time: defaultSettings.start_time,
    end_time: defaultSettings.end_time,
    default_duration: defaultSettings.default_duration,
    interval_between_visits: defaultSettings.interval_between_visits,
    allow_overlapping: defaultSettings.allow_overlapping,
    max_visits_per_slot: defaultSettings.max_visits_per_slot,
  });

  // Atualizar form quando carregar as configurações
  useEffect(() => {
    if (settings) {
      setFormData({
        start_time: settings.start_time,
        end_time: settings.end_time,
        default_duration: settings.default_duration,
        interval_between_visits: settings.interval_between_visits,
        allow_overlapping: settings.allow_overlapping,
        max_visits_per_slot: settings.max_visits_per_slot,
      });
    }
  }, [settings]);

  // Opções de horários (00:00 até 23:00)
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = 0 + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  // Opções de duração
  const durationOptions = [
    { value: 30, label: "30 minutos" },
    { value: 60, label: "1 hora" },
    { value: 90, label: "1h 30min" },
    { value: 120, label: "2 horas" },
    { value: 150, label: "2h 30 min" },
    { value: 180, label: "3 horas" },
    { value: 210, label: "3h 30 min" },
    { value: 240, label: "4 horas" },
  ];

  // Opções de intervalo
  const intervalOptions = [
    { value: 0, label: "Sem intervalo" },
    { value: 15, label: "15 minutos" },
    { value: 30, label: "30 minutos" },
    { value: 60, label: "1 hora" },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveSettings(formData);
    setIsSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Tem certeza que deseja resetar para as configurações padrão?")) {
      setIsSaving(true);
      const success = await resetToDefault();
      setIsSaving(false);
      
      if (success) {
        onOpenChange(false);
      }
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Configurações de Visitas
          </DialogTitle>
          <DialogDescription>
            Configure os horários e regras para agendamento de visitas ao seu espaço.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Horários de Atendimento */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Horários de Atendimento</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Defina o período em que visitas podem ser agendadas
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Início</Label>
                <Select 
                  value={formData.start_time} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Término</Label>
                <Select 
                  value={formData.end_time} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, end_time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Duração e Intervalos */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Duração e Intervalos</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Configure o tempo de cada visita e pausas entre elas
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Duração Padrão</Label>
                <Select 
                  value={String(formData.default_duration)} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, default_duration: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Intervalo entre Visitas</Label>
                <Select 
                  value={String(formData.interval_between_visits)} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, interval_between_visits: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intervalOptions.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Separator />
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isSaving}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar Padrão
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            variant="gold" 
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
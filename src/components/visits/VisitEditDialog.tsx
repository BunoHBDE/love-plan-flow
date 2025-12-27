import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Visit, VisitInsert } from "@/hooks/useVisitsOptimized";

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

const getYearsArray = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push((currentYear + i).toString());
  }
  return years;
};

interface VisitEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  getVisitorName: (visit: Visit) => string;
  onSubmit: (visitId: string, updates: Partial<VisitInsert>) => Promise<boolean>;
}

export function VisitEditDialog({
  open,
  onOpenChange,
  visit,
  getVisitorName,
  onSubmit,
}: VisitEditDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientName: "",
    date: "",
    time: "",
    notes: "",
    guestCount: "",
    weddingDateStatus: "undefined" as "defined" | "undefined",
    weddingDate: "",
    weddingMonthEstimate: "",
    weddingYearEstimate: "",
  });

  const years = getYearsArray();

  // Load visit data ONLY when dialog opens
  useEffect(() => {
    if (visit && open) {
      const visitorName = getVisitorName(visit);
      
      setFormData({
        clientName: visitorName,
        date: visit.visit_date,
        time: visit.visit_time,
        notes: visit.notes?.startsWith('VISITANTE: ') 
          ? visit.notes.split('\n\n').slice(1).join('\n\n')
          : visit.notes || "",
        guestCount: visit.guest_count?.toString() || "",
        weddingDateStatus: (visit.wedding_date_status === "com_data" ? "defined" : "undefined") as "defined" | "undefined",
        weddingDate: visit.wedding_date || "",
        weddingMonthEstimate: visit.wedding_month || "",
        weddingYearEstimate: visit.wedding_year || "",
      });
    }
  }, [visit?.id, open]); // Só recarrega se mudar o ID da visita ou abrir/fechar

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.clientName.trim()) {
      return { isValid: false, error: "Preencha o nome do cliente" };
    }
    if (!formData.date) {
      return { isValid: false, error: "Preencha a data da visita" };
    }
    if (!formData.time) {
      return { isValid: false, error: "Preencha o horário da visita" };
    }
    return { isValid: true, error: "" };
  };

  const handleSave = async () => {
    if (!visit) return;

    const validation = validateForm();
    
    if (!validation.isValid) {
      toast({
        title: "Campo obrigatório",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Se é visitante (sem client_id), atualiza o nome nas observações
    let updatedNotes = formData.notes || "";
    if (!visit.client_id) {
      if (visit.notes && visit.notes.startsWith('VISITANTE: ')) {
        const oldNotes = visit.notes.split('\n\n').slice(1).join('\n\n');
        updatedNotes = oldNotes;
      }
      updatedNotes = `VISITANTE: ${formData.clientName}${updatedNotes ? '\n\n' + updatedNotes : ''}`;
    }

    const updates: Partial<VisitInsert> = {
      visit_date: formData.date,
      visit_time: formData.time,
      notes: updatedNotes || null,
      guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
      wedding_date_status: formData.weddingDateStatus === "defined" ? "com_data" : "sem_data",
      wedding_date: formData.weddingDate || null,
      wedding_month: formData.weddingMonthEstimate || null,
      wedding_year: formData.weddingYearEstimate || null,
    };

    const success = await onSubmit(visit.id, updates);
    if (success) {
      onOpenChange(false);
    }
  };

  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Editar Visita
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da visita
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nome do Cliente/Visitante */}
          <div className="grid gap-2">
            <Label htmlFor="editClientName">Nome do Cliente/Visitante <span className="text-destructive">*</span></Label>
            <Input
              id="editClientName"
              value={formData.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
              placeholder="Nome do cliente ou visitante"
            />
            <p className="text-xs text-muted-foreground">
              {visit.client_id ? "✓ Cliente cadastrado no sistema" : "Visitante sem cadastro"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="editDate">Data <span className="text-destructive">*</span></Label>
              <Input
                id="editDate"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editTime">Horário <span className="text-destructive">*</span></Label>
              <Input
                id="editTime"
                type="time"
                value={formData.time}
                onChange={(e) => updateField("time", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="editGuestCount">Número de Convidados</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="editGuestCount"
                type="number"
                placeholder="Ex: 150"
                value={formData.guestCount}
                onChange={(e) => updateField("guestCount", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-gold" />
              Data do Casamento
            </Label>
            <RadioGroup
              value={formData.weddingDateStatus}
              onValueChange={(value) => updateField("weddingDateStatus", value as "defined" | "undefined")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="defined" id="editDefined" />
                <Label htmlFor="editDefined" className="font-normal cursor-pointer">
                  Data definida
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="undefined" id="editUndefined" />
                <Label htmlFor="editUndefined" className="font-normal cursor-pointer">
                  Data ainda não definida
                </Label>
              </div>
            </RadioGroup>

            {formData.weddingDateStatus === "defined" ? (
              <Input
                id="editWeddingDate"
                type="date"
                value={formData.weddingDate}
                onChange={(e) => updateField("weddingDate", e.target.value)}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={formData.weddingMonthEstimate}
                  onValueChange={(value) => updateField("weddingMonthEstimate", value)}
                >
                  <SelectTrigger id="editWeddingMonth">
                    <SelectValue placeholder="Mês (previsão)" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.weddingYearEstimate}
                  onValueChange={(value) => updateField("weddingYearEstimate", value)}
                >
                  <SelectTrigger id="editWeddingYear">
                    <SelectValue placeholder="Ano (previsão)" />
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
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="editNotes">Observações</Label>
            <Textarea
              id="editNotes"
              placeholder="Adicione observações sobre a visita..."
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="gold" onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
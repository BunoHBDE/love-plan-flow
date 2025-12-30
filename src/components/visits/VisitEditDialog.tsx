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
import { Users, Heart, Calendar, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Importa tipos e constantes
import type { Visit, VisitInsert } from "@/hooks/useVisitsOptimized";
import { MONTHS, getYearsArray, WEDDING_DATE_STATUS } from "@/constants/visits";

// ==========================================
// TIPOS
// ==========================================

interface FormData {
  clientName: string;
  date: string;
  time: string;
  notes: string;
  guestCount: string;
  weddingDateStatus: "defined" | "undefined";
  weddingDate: string;
  weddingMonthEstimate: string;
  weddingYearEstimate: string;
}

interface VisitEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  getVisitorName: (visit: Visit) => string;
  onSubmit: (visitId: string, updates: Partial<VisitInsert>) => Promise<boolean>;
}

// ==========================================
// COMPONENTE
// ==========================================

export function VisitEditDialog({
  open,
  onOpenChange,
  visit,
  getVisitorName,
  onSubmit,
}: VisitEditDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado do formulário
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    date: "",
    time: "",
    notes: "",
    guestCount: "",
    weddingDateStatus: "undefined",
    weddingDate: "",
    weddingMonthEstimate: "",
    weddingYearEstimate: "",
  });

  // Gera array de anos disponíveis
  const years = getYearsArray();

  /**
   * Carrega os dados da visita quando o dialog abre
   */
  useEffect(() => {
    if (visit && open) {
      const visitorName = getVisitorName(visit);
      
      // Extrai notas (remove prefixo VISITANTE: se existir)
      let cleanNotes = visit.notes || "";
      if (cleanNotes.startsWith('VISITANTE: ')) {
        cleanNotes = cleanNotes.split('\n\n').slice(1).join('\n\n');
      }
      
      setFormData({
        clientName: visitorName,
        date: visit.visit_date,
        time: visit.visit_time,
        notes: cleanNotes,
        guestCount: visit.guest_count?.toString() || "",
        weddingDateStatus: visit.wedding_date_status === WEDDING_DATE_STATUS.COM_DATA 
          ? "defined" 
          : "undefined",
        weddingDate: visit.wedding_date || "",
        weddingMonthEstimate: visit.wedding_month || "",
        weddingYearEstimate: visit.wedding_year || "",
      });
    }
  }, [visit, open, getVisitorName]);

  /**
   * Atualiza um campo do formulário
   */
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Valida o formulário antes de enviar
   */
  const validateForm = (): boolean => {
    if (!formData.clientName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome do cliente.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.date) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione a data da visita.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.time) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione o horário da visita.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  /**
   * Envia as alterações
   */
  const handleSubmit = async () => {
    if (!visit || !validateForm()) return;

    setIsSubmitting(true);

    // Prepara as notas (adiciona prefixo se for visitante sem cliente vinculado)
    let updatedNotes = formData.notes;
    if (!visit.client_id && formData.clientName) {
      const existingNotes = formData.notes ? `\n\n${formData.notes}` : '';
      updatedNotes = `VISITANTE: ${formData.clientName}${existingNotes}`;
    }

    // Monta objeto de atualizações
    const updates: Partial<VisitInsert> = {
      visit_date: formData.date,
      visit_time: formData.time,
      notes: updatedNotes || null,
      guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
      wedding_date_status: formData.weddingDateStatus === "defined" 
        ? WEDDING_DATE_STATUS.COM_DATA 
        : WEDDING_DATE_STATUS.SEM_DATA,
      wedding_date: formData.weddingDate || null,
      wedding_month: formData.weddingMonthEstimate || null,
      wedding_year: formData.weddingYearEstimate || null,
    };

    const success = await onSubmit(visit.id, updates);
    
    setIsSubmitting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  // Não renderiza se não houver visita
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
            <Label htmlFor="editClientName">
              Nome do Cliente/Visitante <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editClientName"
              value={formData.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
              placeholder="Nome do cliente ou visitante"
            />
            <p className="text-xs text-muted-foreground">
              {visit.client_id 
                ? "Este visitante está vinculado a um cliente cadastrado."
                : "Visitante sem cadastro no sistema."}
            </p>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div className="grid gap-2">
              <Label htmlFor="editDate">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editDate"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>

            {/* Horário */}
            <div className="grid gap-2">
              <Label htmlFor="editTime">
                <Clock className="inline h-4 w-4 mr-1" />
                Horário <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editTime"
                type="time"
                value={formData.time}
                onChange={(e) => updateField("time", e.target.value)}
              />
            </div>
          </div>

          {/* Número de Convidados */}
          <div className="grid gap-2">
            <Label htmlFor="editGuestCount">
              <Users className="inline h-4 w-4 mr-1" />
              Número de Convidados (estimado)
            </Label>
            <Input
              id="editGuestCount"
              type="number"
              min="1"
              max="2000"
              value={formData.guestCount}
              onChange={(e) => updateField("guestCount", e.target.value)}
              placeholder="Ex: 150"
            />
          </div>

          {/* Data do Casamento */}
          <div className="space-y-3">
            <Label>
              <Heart className="inline h-4 w-4 mr-1 text-rose-500" />
              Data do Casamento
            </Label>
            
            <RadioGroup
              value={formData.weddingDateStatus}
              onValueChange={(value) => updateField("weddingDateStatus", value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="defined" id="edit-defined" />
                <Label htmlFor="edit-defined" className="cursor-pointer">
                  Data definida
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="undefined" id="edit-undefined" />
                <Label htmlFor="edit-undefined" className="cursor-pointer">
                  Ainda sem data
                </Label>
              </div>
            </RadioGroup>

            {/* Campos condicionais baseados na seleção */}
            {formData.weddingDateStatus === "defined" ? (
              <Input
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
                  <SelectTrigger>
                    <SelectValue placeholder="Mês estimado" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
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
                  <SelectTrigger>
                    <SelectValue placeholder="Ano estimado" />
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

          {/* Observações */}
          <div className="grid gap-2">
            <Label htmlFor="editNotes">Observações</Label>
            <Textarea
              id="editNotes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Informações adicionais sobre a visita..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            variant="gold" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
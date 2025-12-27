import React, { useState } from "react";
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
import { User, Calendar, Clock, Users, Heart } from "lucide-react";
import { useVisitForm, months, getYearsArray } from "@/hooks/useVisitForm";
import { useClientsOptimized as useClients } from "@/hooks/useClientsOptimized";
import { useToast } from "@/hooks/use-toast";
import type { VisitInsert } from "@/hooks/useVisitsOptimized";

interface VisitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (visitData: VisitInsert, clientData?: any) => Promise<void>;
}

export function VisitFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: VisitFormDialogProps) {
  const { formData, updateField, updatePhone, resetForm, validateForm } = useVisitForm();
  const { searchClients } = useClients();
  const { toast } = useToast();

  const [clientSearch, setClientSearch] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const years = getYearsArray();

  const handleClientSearch = async (term: string) => {
    setClientSearch(term);
    updateField("clientName", term);
    
    if (term.length >= 2) {
      const results = await searchClients(term);
      setClientSearchResults(results);
    } else {
      setClientSearchResults([]);
    }
  };

  const selectClient = (client: any) => {
    setSelectedClientId(client.id);
    updateField("clientName", client.nome);
    updateField("email", client.email || "");
    updateField("phone", client.telefone || "");
    setClientSearch(client.nome);
    setClientSearchResults([]);
  };

  const handleSubmit = async () => {
    const validation = validateForm();
    
    if (!validation.isValid) {
      toast({
        title: "Campo obrigatório",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    let clientId = selectedClientId;
    let newClientData = null;

    // Se não selecionou cliente existente E preencheu email ou telefone
    if (!selectedClientId && formData.clientName && (formData.email || formData.phone)) {
      newClientData = {
        nome: formData.clientName,
        email: formData.email || null,
        telefone: formData.phone || null,
      };
    }

    // Prepara notes
    let notes = formData.notes || "";
    if (!clientId && !newClientData && formData.clientName) {
      notes = `VISITANTE: ${formData.clientName}${formData.notes ? '\n\n' + formData.notes : ''}`;
    }

    const visitData: VisitInsert = {
      client_id: clientId,
      visit_date: formData.date,
      visit_time: formData.time,
      notes: notes || null,
      guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
      wedding_date_status: formData.weddingDateStatus === "defined" ? "com_data" : "sem_data",
      wedding_date: formData.weddingDate || null,
      wedding_month: formData.weddingMonthEstimate || null,
      wedding_year: formData.weddingYearEstimate || null,
      status: "agendado",
    };

    await onSubmit(visitData, newClientData);
    
    // Reset form
    resetForm();
    setClientSearch("");
    setSelectedClientId(null);
    setClientSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Agendar Nova Visita
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para agendar uma nova visita ao espaço
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Client Search */}
          <div className="grid gap-2">
            <Label>Cliente <span className="text-destructive">*</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do cliente ou busque existente..."
                value={clientSearch}
                onChange={(e) => handleClientSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {clientSearchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-32 overflow-y-auto bg-card shadow-lg">
                {clientSearchResults.map((client: any) => (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{client.nome}</div>
                      {client.telefone && (
                        <div className="text-xs text-muted-foreground">{client.telefone}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedClientId ? (
              <p className="text-sm text-green-700">
                ✓ Cliente cadastrado
              </p>
            ) : formData.clientName && (formData.email || formData.phone) ? (
              <p className="text-sm text-blue-700">
                ✓ Novo cliente
              </p>
            ) : null}
          </div>

          {/* Additional fields for non-registered clients */}
          {!selectedClientId && formData.clientName && (
            <div className="grid gap-4 p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm font-medium text-muted-foreground">
                Informações de contato (opcional)
              </p>
              <div className="grid gap-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => updatePhone(e.target.value)}
                  maxLength={15}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data <span className="text-destructive">*</span></Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Horário <span className="text-destructive">*</span></Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => updateField("time", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="guestCount">Número de Convidados</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guestCount"
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
                <RadioGroupItem value="defined" id="defined" />
                <Label htmlFor="defined" className="font-normal cursor-pointer">
                  Data definida
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="undefined" id="undefined" />
                <Label htmlFor="undefined" className="font-normal cursor-pointer">
                  Data ainda não definida
                </Label>
              </div>
            </RadioGroup>

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
                  <SelectTrigger>
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
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
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
          <Button variant="gold" onClick={handleSubmit}>
            Agendar Visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
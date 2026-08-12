import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { hoje } from "@/lib/crm/dates";
import type { NovoLeadInput } from "@/hooks/useCrmLeads";
import type { CrmConfig } from "@/types/crm.types";

interface NovoLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CrmConfig;
  onSalvar: (input: NovoLeadInput) => void;
  salvando: boolean;
}

const ESTADO_INICIAL = {
  nome: "",
  telefone: "",
  origem: "",
};

export function NovoLeadDialog({
  open,
  onOpenChange,
  config,
  onSalvar,
  salvando,
}: NovoLeadDialogProps) {
  const [campos, setCampos] = useState(ESTADO_INICIAL);
  const [entrada, setEntrada] = useState(hoje());
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCampos(ESTADO_INICIAL);
      setEntrada(hoje());
      setErro(null);
    }
  }, [open]);

  const enviar = () => {
    if (!campos.nome.trim()) {
      setErro("Informe o nome — pode ser algo como “(sem nome ainda)”.");
      return;
    }
    if (!campos.telefone.trim()) {
      setErro("Informe o WhatsApp do lead.");
      return;
    }

    onSalvar({
      nome: campos.nome,
      telefone: campos.telefone,
      origem: campos.origem || null,
      entrada,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Novo lead</DialogTitle>
          <DialogDescription>
            O lead entra na primeira etapa como “aguardando”: a saudação foi
            enviada e você está esperando a resposta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-nome">Nome *</Label>
            <Input
              id="lead-nome"
              value={campos.nome}
              onChange={(e) => setCampos({ ...campos, nome: e.target.value })}
              placeholder="Marina e Rafael"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-telefone">WhatsApp *</Label>
            <Input
              id="lead-telefone"
              value={campos.telefone}
              onChange={(e) =>
                setCampos({ ...campos, telefone: e.target.value })
              }
              placeholder="(11) 99999-0000"
            />
          </div>

          <div className="space-y-2">
            <Label>Origem</Label>
            <Select
              value={campos.origem}
              onValueChange={(valor) => setCampos({ ...campos, origem: valor })}
            >
              <SelectTrigger>
                <SelectValue placeholder="De onde veio?" />
              </SelectTrigger>
              <SelectContent>
                {config.origens.map((origem) => (
                  <SelectItem key={origem.id} value={origem.label}>
                    {origem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Entrada</Label>
            <DatePickerField value={entrada} onChange={setEntrada} />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="gold" onClick={enviar} disabled={salvando}>
            {salvando ? "Salvando..." : "Cadastrar lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

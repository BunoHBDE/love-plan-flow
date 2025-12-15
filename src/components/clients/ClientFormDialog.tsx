import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/hooks/useClients";

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
}

const initialFormData: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  address: {
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    cep: "",
  },
};

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: (client: ClientFormData & { id: string }) => void;
  onClientUpdated?: (client: ClientFormData) => void;
  showSaveAndSearch?: boolean;
  editingClient?: Client | null;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  onClientCreated,
  onClientUpdated,
  showSaveAndSearch = false,
  editingClient = null,
}: ClientFormDialogProps) {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const { toast } = useToast();

  const isEditing = !!editingClient;

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.nome,
        email: editingClient.email || "",
        phone: editingClient.telefone,
        cpf: editingClient.cpf || "",
        address: {
          street: editingClient.rua || "",
          number: editingClient.numero || "",
          complement: editingClient.complemento || "",
          neighborhood: editingClient.bairro || "",
          city: editingClient.cidade || "",
          state: editingClient.estado_uf || "",
          cep: editingClient.cep || "",
        },
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingClient, open]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado.",
          variant: "destructive",
        });
        return;
      }

      setFormData({
        ...formData,
        address: {
          ...formData.address,
          cep: formatCEP(cleanCep),
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        },
      });

      toast({
        title: "Endereço encontrado!",
        description: "Os campos foram preenchidos automaticamente.",
      });
    } catch {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível consultar o CEP. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleSubmit = (andSearch: boolean = false) => {
    if (!formData.name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing && onClientUpdated) {
      onClientUpdated(formData);
    } else if (onClientCreated) {
      const newClient = {
        ...formData,
        id: Date.now().toString(),
      };
      onClientCreated(newClient);
    }

    setFormData(initialFormData);
    onOpenChange(false);

    if (!isEditing) {
      toast({
        title: "Cliente cadastrado!",
        description: andSearch
          ? `${formData.name} foi adicionado. Agora você pode buscá-lo.`
          : `${formData.name} foi adicionado com sucesso.`,
      });
    }
  };

  const resetAndClose = () => {
    setFormData(initialFormData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? "Editar Cliente" : "Cadastrar Novo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações do cliente." : "Adicione as informações do cliente."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Info */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Cliente *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: formatPhone(e.target.value) })
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) =>
                setFormData({ ...formData, cpf: formatCPF(e.target.value) })
              }
              placeholder="000.000.000-00"
            />
          </div>

          {/* Address Section */}
          <div className="grid gap-4 p-4 bg-muted/50 rounded-lg border border-border">
            <Label className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </Label>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.address.cep}
                    onChange={(e) => {
                      const formattedCep = formatCEP(e.target.value);
                      setFormData({
                        ...formData,
                        address: { ...formData.address, cep: formattedCep },
                      });
                    }}
                    onBlur={(e) => handleCepLookup(e.target.value)}
                    placeholder="00000-000"
                    disabled={isLoadingCep}
                  />
                  {isLoadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  placeholder="Nome da rua"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.address.number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, number: e.target.value },
                    })
                  }
                  placeholder="Nº"
                />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.address.complement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, complement: e.target.value },
                    })
                  }
                  placeholder="Apto, Bloco, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.address.neighborhood}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, neighborhood: e.target.value },
                    })
                  }
                  placeholder="Bairro"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  placeholder="Cidade"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="state">Estado</Label>
              <Select
                value={formData.address.state}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: value },
                  })
                }
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetAndClose}>
            Cancelar
          </Button>
          {showSaveAndSearch && !isEditing && (
            <Button variant="outline" onClick={() => handleSubmit(true)}>
              Salvar e Buscar
            </Button>
          )}
          <Button variant="gold" onClick={() => handleSubmit(false)}>
            {isEditing ? "Salvar Alterações" : "Salvar Cliente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

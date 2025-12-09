import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Calendar, Phone, Mail, Plus, Search, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Address {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  weddingDate?: string;
  guestCount?: number;
  address: Address;
  status: "lead" | "orcamento" | "contrato" | "pago";
}

const initialClients: Client[] = [
  {
    id: "1",
    name: "Maria Silva",
    email: "maria@email.com",
    phone: "(11) 99999-0001",
    cpf: "123.456.789-00",
    weddingDate: "2025-06-15",
    guestCount: 150,
    address: {
      street: "Rua das Flores",
      number: "100",
      complement: "Apto 12",
      neighborhood: "Jardim Primavera",
      city: "São Paulo",
      state: "SP",
      cep: "01234-567",
    },
    status: "contrato",
  },
  {
    id: "2",
    name: "Ana Oliveira",
    email: "ana@email.com",
    phone: "(11) 99999-0002",
    cpf: "987.654.321-00",
    weddingDate: "2025-08-20",
    guestCount: 100,
    address: {
      street: "Av. Brasil",
      number: "500",
      complement: "",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      cep: "20000-000",
    },
    status: "orcamento",
  },
  {
    id: "3",
    name: "Juliana Martins",
    email: "juliana@email.com",
    phone: "(11) 99999-0003",
    cpf: "456.789.123-00",
    weddingDate: "2025-05-10",
    guestCount: 200,
    address: {
      street: "Rua do Sol",
      number: "250",
      complement: "Casa",
      neighborhood: "Bela Vista",
      city: "Belo Horizonte",
      state: "MG",
      cep: "30000-000",
    },
    status: "pago",
  },
  {
    id: "4",
    name: "Carla Ferreira",
    email: "carla@email.com",
    phone: "(11) 99999-0004",
    cpf: "789.123.456-00",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
    },
    status: "lead",
  },
];

const statusLabels = {
  lead: "Novo Lead",
  orcamento: "Orçamento Enviado",
  contrato: "Contrato Assinado",
  pago: "Pagamento Completo",
};

const statusStyles = {
  lead: "bg-rose-light text-rose border-rose/20",
  orcamento: "bg-warning/10 text-warning border-warning/20",
  contrato: "bg-primary/10 text-primary border-primary/20",
  pago: "bg-success/10 text-success border-success/20",
};

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    weddingDate: "",
    guestCount: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
    },
  });
  const { toast } = useToast();

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf.includes(searchTerm)
  );

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

      setNewClient({
        ...newClient,
        address: {
          ...newClient.address,
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

  const handleCreateClient = () => {
    if (!newClient.name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    const client: Client = {
      id: Date.now().toString(),
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      cpf: newClient.cpf,
      weddingDate: newClient.weddingDate || undefined,
      guestCount: newClient.guestCount ? parseInt(newClient.guestCount) : undefined,
      address: newClient.address,
      status: "lead",
    };

    setClients([client, ...clients]);
    setNewClient({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      weddingDate: "",
      guestCount: "",
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cep: "",
      },
    });
    setIsDialogOpen(false);

    toast({
      title: "Cliente cadastrado!",
      description: `${client.name} foi adicionado com sucesso.`,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="h-5 w-5" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Cadastrar Novo Cliente
                </DialogTitle>
                <DialogDescription>
                  Adicione as informações do cliente.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Basic Info */}
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Cliente *</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({ ...newClient, name: e.target.value })
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
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient({ ...newClient, email: e.target.value })
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newClient.phone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, phone: formatPhone(e.target.value) })
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={newClient.cpf}
                      onChange={(e) =>
                        setNewClient({ ...newClient, cpf: formatCPF(e.target.value) })
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guestCount">Nº de Convidados</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      value={newClient.guestCount}
                      onChange={(e) =>
                        setNewClient({ ...newClient, guestCount: e.target.value })
                      }
                      placeholder="150"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="weddingDate">Data do Casamento</Label>
                  <Input
                    id="weddingDate"
                    type="date"
                    value={newClient.weddingDate}
                    onChange={(e) =>
                      setNewClient({ ...newClient, weddingDate: e.target.value })
                    }
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
                          value={newClient.address.cep}
                          onChange={(e) => {
                            const formattedCep = formatCEP(e.target.value);
                            setNewClient({
                              ...newClient,
                              address: { ...newClient.address, cep: formattedCep },
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
                        value={newClient.address.street}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            address: { ...newClient.address, street: e.target.value },
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
                        value={newClient.address.number}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            address: { ...newClient.address, number: e.target.value },
                          })
                        }
                        placeholder="Nº"
                      />
                    </div>
                    <div className="col-span-2 grid gap-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={newClient.address.complement}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            address: { ...newClient.address, complement: e.target.value },
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
                        value={newClient.address.neighborhood}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            address: { ...newClient.address, neighborhood: e.target.value },
                          })
                        }
                        placeholder="Bairro"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={newClient.address.city}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            address: { ...newClient.address, city: e.target.value },
                          })
                        }
                        placeholder="Cidade"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={newClient.address.state}
                      onValueChange={(value) =>
                        setNewClient({
                          ...newClient,
                          address: { ...newClient.address, state: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
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

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="gold" onClick={handleCreateClient}>
                  Cadastrar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-slide-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clients Grid */}
        <div className="grid gap-4 md:grid-cols-2 animate-slide-up">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-card rounded-xl p-6 shadow-soft border border-border transition-all duration-200 hover:shadow-medium group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-light">
                    <Heart className="h-6 w-6 text-rose" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground text-lg">
                      {client.name}
                    </h3>
                    <span
                      className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium border mt-1 ${
                        statusStyles[client.status]
                      }`}
                    >
                      {statusLabels[client.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{client.email || "Sem email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone || "Sem telefone"}</span>
                </div>
                {client.address.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{client.address.city}, {client.address.state}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  CPF: {client.cpf || "Não informado"}
                </span>
                <Button
                  variant="elegant"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

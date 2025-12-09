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
import { Heart, Calendar, Phone, Mail, Plus, Search, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  bride: string;
  groom: string;
  email: string;
  phone: string;
  weddingDate: string;
  guestCount: number;
  status: "lead" | "orcamento" | "contrato" | "pago";
  address?: string;
}

const initialClients: Client[] = [
  {
    id: "1",
    bride: "Maria Silva",
    groom: "João Santos",
    email: "maria.joao@email.com",
    phone: "(11) 99999-0001",
    weddingDate: "2025-06-15",
    guestCount: 150,
    status: "contrato",
  },
  {
    id: "2",
    bride: "Ana Oliveira",
    groom: "Pedro Costa",
    email: "ana.pedro@email.com",
    phone: "(11) 99999-0002",
    weddingDate: "2025-08-20",
    guestCount: 100,
    status: "orcamento",
  },
  {
    id: "3",
    bride: "Juliana Martins",
    groom: "Lucas Almeida",
    email: "juliana.lucas@email.com",
    phone: "(11) 99999-0003",
    weddingDate: "2025-05-10",
    guestCount: 200,
    status: "pago",
  },
  {
    id: "4",
    bride: "Carla Ferreira",
    groom: "Bruno Lima",
    email: "carla.bruno@email.com",
    phone: "(11) 99999-0004",
    weddingDate: "2025-09-25",
    guestCount: 80,
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

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    bride: "",
    groom: "",
    email: "",
    phone: "",
    weddingDate: "",
    guestCount: 0,
    address: "",
  });
  const { toast } = useToast();

  const filteredClients = clients.filter(
    (client) =>
      client.bride.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.groom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = () => {
    if (!newClient.bride || !newClient.groom) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha os nomes dos noivos.",
        variant: "destructive",
      });
      return;
    }

    const client: Client = {
      id: Date.now().toString(),
      ...newClient,
      status: "lead",
    };

    setClients([client, ...clients]);
    setNewClient({
      bride: "",
      groom: "",
      email: "",
      phone: "",
      weddingDate: "",
      guestCount: 0,
      address: "",
    });
    setIsDialogOpen(false);

    toast({
      title: "Cliente cadastrado!",
      description: `${client.bride} & ${client.groom} foram adicionados com sucesso.`,
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
              Gerencie os casais e seus casamentos
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="h-5 w-5" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Cadastrar Novo Casal
                </DialogTitle>
                <DialogDescription>
                  Adicione as informações dos noivos.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bride">Nome da Noiva *</Label>
                    <Input
                      id="bride"
                      value={newClient.bride}
                      onChange={(e) =>
                        setNewClient({ ...newClient, bride: e.target.value })
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="groom">Nome do Noivo *</Label>
                    <Input
                      id="groom"
                      value={newClient.groom}
                      onChange={(e) =>
                        setNewClient({ ...newClient, groom: e.target.value })
                      }
                      placeholder="Nome completo"
                    />
                  </div>
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
                        setNewClient({ ...newClient, phone: e.target.value })
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="weddingDate">Data do Casamento</Label>
                    <Input
                      id="weddingDate"
                      type="date"
                      value={newClient.weddingDate}
                      onChange={(e) =>
                        setNewClient({
                          ...newClient,
                          weddingDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guestCount">Nº de Convidados</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      value={newClient.guestCount || ""}
                      onChange={(e) =>
                        setNewClient({
                          ...newClient,
                          guestCount: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="150"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                    placeholder="Endereço completo"
                  />
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
            placeholder="Buscar por nome ou email..."
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
                      {client.bride} & {client.groom}
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
                  <Calendar className="h-4 w-4" />
                  <span>
                    Casamento:{" "}
                    {client.weddingDate
                      ? new Date(client.weddingDate).toLocaleDateString("pt-BR")
                      : "A definir"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{client.email || "Sem email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone || "Sem telefone"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {client.guestCount} convidados
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

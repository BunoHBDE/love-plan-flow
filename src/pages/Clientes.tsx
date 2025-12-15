import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Calendar, Phone, Mail, Plus, Search, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientFormDialog, ClientFormData } from "@/components/clients/ClientFormDialog";

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

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf.includes(searchTerm)
  );

  const handleClientCreated = (clientData: ClientFormData & { id: string }) => {
    const client: Client = {
      id: clientData.id,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      cpf: clientData.cpf,
      weddingDate: undefined,
      guestCount: undefined,
      address: clientData.address,
      status: "lead",
    };
    setClients([client, ...clients]);
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

          <Button variant="gold" size="lg" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-5 w-5" />
            Novo Cliente
          </Button>

          <ClientFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onClientCreated={handleClientCreated}
          />
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

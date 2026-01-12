import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Phone, Mail, Plus, Search, MapPin, Loader2, Pencil, Trash2 } from "lucide-react";
import { ClientFormDialog, ClientFormData } from "@/components/clients/ClientFormDialog";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { useClientsOptimized as useClients, Client, ClientInsert } from "@/hooks/useClientsOptimized";
import { SubscriptionGate } from "@/components/subscription";


const statusLabels = {
  lead: "Novo Lead",
  orcamento: "Orçamento Enviado",
  contrato: "Contrato Assinado",
  pago: "Pagamento Completo",
};

export default function Clientes() {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(
    (client) =>
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (client.cpf?.includes(searchTerm) ?? false) ||
      client.telefone.includes(searchTerm)
  );

  const handleClientCreated = async (clientData: ClientFormData & { id: string }) => {
    const clientInsert: ClientInsert = {
      nome: clientData.name,
      email: clientData.email || null,
      telefone: clientData.phone,
      cpf: clientData.cpf || null,
      cep: clientData.address.cep || null,
      rua: clientData.address.street || null,
      numero: clientData.address.number || null,
      complemento: clientData.address.complement || null,
      bairro: clientData.address.neighborhood || null,
      cidade: clientData.address.city || null,
      estado_uf: clientData.address.state || null,
    };
    await createClient(clientInsert);
  };

  const handleClientUpdated = async (clientData: ClientFormData) => {
    if (!editingClient) return;
    
    const updates: Partial<ClientInsert> = {
      nome: clientData.name,
      email: clientData.email || null,
      telefone: clientData.phone,
      cpf: clientData.cpf || null,
      cep: clientData.address.cep || null,
      rua: clientData.address.street || null,
      numero: clientData.address.number || null,
      complemento: clientData.address.complement || null,
      bairro: clientData.address.neighborhood || null,
      cidade: clientData.address.city || null,
      estado_uf: clientData.address.state || null,
    };
    
    await updateClient(editingClient.id, updates);
    setEditingClient(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClient) return;
    await deleteClient(deletingClient.id);
    setDeletingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingClient(null);
    }
  };

  return (
    <MainLayout>
      <SubscriptionGate>
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
            onOpenChange={handleDialogClose}
            onClientCreated={handleClientCreated}
            onClientUpdated={handleClientUpdated}
            editingClient={editingClient}
          />

          <DeleteClientDialog
            open={!!deletingClient}
            onOpenChange={(open) => !open && setDeletingClient(null)}
            client={deletingClient}
            onConfirm={handleDeleteConfirm}
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-slide-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Clients Grid */}
        {!loading && (
          <div className="grid gap-4 md:grid-cols-2 animate-slide-up">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-card rounded-xl p-6 shadow-soft border border-border transition-all duration-200 hover:shadow-medium group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-light">
                      <Heart className="h-6 w-6 text-rose" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-lg">
                        {client.nome}
                      </h3>
                      <span
                        className="inline-block px-3 py-0.5 rounded-full text-xs font-medium border mt-1 bg-rose-light text-rose border-rose/20"
                      >
                        {statusLabels.lead}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingClient(client)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{client.email || "Sem email"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{client.telefone || "Sem telefone"}</span>
                  </div>
                  {client.cidade && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{client.cidade}, {client.estado_uf}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    CPF: {client.cpf || "Não informado"}
                  </span>
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
        )}
      </div>
      </SubscriptionGate>
    </MainLayout>
  );
}

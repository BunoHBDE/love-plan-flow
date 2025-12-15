import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  User,
  Calendar,
  Package,
  FileText,
  ArrowLeft,
  Save,
  Users,
  Plus,
  Phone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientFormDialog, ClientFormData } from "@/components/clients/ClientFormDialog";

// Mock data for existing clients (will come from database later)
const mockClients = [
  {
    id: "1",
    nome: "Maria Silva",
    email: "maria@email.com",
    telefone: "(11) 99999-0001",
    cpf: "123.456.789-00",
    n_convidados: 150,
    data_casamento: "2025-06-15",
    cep: "01310-100",
    rua: "Av. Paulista",
    numero: "1000",
    complemento: "Apto 501",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado_uf: "SP",
  },
  {
    id: "2",
    nome: "Ana Costa",
    email: "ana@email.com",
    telefone: "(11) 99999-0002",
    cpf: "987.654.321-00",
    n_convidados: 100,
    data_casamento: "2025-08-20",
    cep: "04543-011",
    rua: "Av. Faria Lima",
    numero: "500",
    complemento: "",
    bairro: "Itaim Bibi",
    cidade: "São Paulo",
    estado_uf: "SP",
  },
];

const canaisEntrada = [
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "indicacao", label: "Indicação" },
  { value: "feira", label: "Feira de Noivas" },
  { value: "outro", label: "Outro" },
];

const tiposEvento = [
  { value: "casamento", label: "Casamento" },
  { value: "debutante", label: "Debutante" },
  { value: "corporativo", label: "Corporativo" },
  { value: "aniversario", label: "Aniversário" },
];

const pacotes = [
  { value: "harmonia", label: "Harmonia" },
  { value: "jardim", label: "Jardim" },
  { value: "essencia", label: "Essência" },
  { value: "florescer", label: "Florescer" },
];

const menusBuffet = [
  { value: "massas", label: "Massas" },
  { value: "brasileirinho", label: "Brasileirinho" },
];

const estadosBrasil = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// Shared client list (mock - in future will come from database)
let sharedMockClients = [...mockClients];

function calcularPreco(
  pacote: string,
  diaSemana: string,
  n: number,
  menu: string | null
): number {
  if (n <= 0) return 0;

  if (pacote === "harmonia") {
    if (diaSemana === "sabado") return 10100 + 31 * n;
    if (diaSemana === "domingo") return 9100 + 31 * n;
  }

  if (pacote === "jardim") {
    if (diaSemana === "sabado") return 12300 + 55 * n;
    if (diaSemana === "domingo") return 10800 + 52 * n;
  }

  if (pacote === "essencia") {
    if (menu === "brasileirinho") {
      if (diaSemana === "sabado") return 10620 + 151 * n;
      if (diaSemana === "domingo") return 9620 + 151 * n;
    }
    if (menu === "massas") {
      if (diaSemana === "sabado") return 10740 + 182 * n;
      if (diaSemana === "domingo") return 9740 + 182 * n;
    }
  }

  if (pacote === "florescer") {
    if (menu === "brasileirinho") {
      if (diaSemana === "sabado") return 12820 + 175 * n;
      if (diaSemana === "domingo") return 11320 + 172 * n;
    }
    if (menu === "massas") {
      if (diaSemana === "sabado") return 12940 + 206 * n;
      if (diaSemana === "domingo") return 11440 + 203 * n;
    }
  }

  return 0;
}

function getDiaSemana(dateString: string): string | null {
  if (!dateString) return null;
  const date = new Date(dateString + "T12:00:00");
  const day = date.getDay();
  if (day === 6) return "sabado";
  if (day === 0) return "domingo";
  return null;
}

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Client state
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [termoBuscaCliente, setTermoBuscaCliente] = useState("");
  const [listaResultadosCliente, setListaResultadosCliente] = useState<typeof mockClients>([]);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  // Client data
  const [nomeCliente, setNomeCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [nConvidados, setNConvidados] = useState(0);
  const [dataCasamento, setDataCasamento] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estadoUf, setEstadoUf] = useState("");

  // Quote data
  const [canalEntrada, setCanalEntrada] = useState("");
  const [tipoEvento, setTipoEvento] = useState("");
  const [dataStatus, setDataStatus] = useState<"com_data" | "sem_data">("sem_data");
  const [dataEvento, setDataEvento] = useState("");
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [anoEvento, setAnoEvento] = useState<string | null>(null);

  // Package data
  const [pacote, setPacote] = useState("");
  const [menuBuffet, setMenuBuffet] = useState<string | null>(null);
  const [valorOrcamento, setValorOrcamento] = useState(0);

  // Observations
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");

  // Calculate price when relevant fields change
  useEffect(() => {
    const dia = dataStatus === "com_data" ? getDiaSemana(dataEvento) : diaSemana;
    if (pacote && dia && nConvidados > 0) {
      const needsMenu = pacote === "essencia" || pacote === "florescer";
      if (!needsMenu || (needsMenu && menuBuffet)) {
        const valor = calcularPreco(pacote, dia, nConvidados, menuBuffet);
        setValorOrcamento(valor);
      }
    } else {
      setValorOrcamento(0);
    }
  }, [pacote, diaSemana, dataEvento, dataStatus, nConvidados, menuBuffet]);

  // Update diaSemana when dataEvento changes
  useEffect(() => {
    if (dataStatus === "com_data" && dataEvento) {
      const dia = getDiaSemana(dataEvento);
      setDiaSemana(dia);
      const year = new Date(dataEvento).getFullYear().toString();
      setAnoEvento(year);
    }
  }, [dataEvento, dataStatus]);

  // Reset menu when package changes to one that doesn't need it
  useEffect(() => {
    if (pacote !== "essencia" && pacote !== "florescer") {
      setMenuBuffet(null);
    }
  }, [pacote]);

  const handleBuscarCliente = () => {
    if (!termoBuscaCliente.trim()) {
      toast({
        title: "Digite algo para buscar",
        variant: "destructive",
      });
      return;
    }

    const termo = termoBuscaCliente.toLowerCase();
    const resultados = mockClients.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.email.toLowerCase().includes(termo) ||
        c.telefone.includes(termo)
    );

    setListaResultadosCliente(resultados);

    if (resultados.length === 0) {
      toast({
        title: "Nenhum cliente encontrado",
        description: "Tente outro termo de busca ou cadastre um novo cliente.",
      });
    }
  };

  const handleSelecionarCliente = (cliente: typeof mockClients[0]) => {
    setClienteId(cliente.id);
    setNomeCliente(cliente.nome);
    setEmail(cliente.email);
    setTelefone(cliente.telefone);
    setCpf(cliente.cpf);
    setNConvidados(cliente.n_convidados);
    setDataCasamento(cliente.data_casamento);
    setCep(cliente.cep);
    setRua(cliente.rua);
    setNumero(cliente.numero);
    setComplemento(cliente.complemento);
    setBairro(cliente.bairro);
    setCidade(cliente.cidade);
    setEstadoUf(cliente.estado_uf);

    toast({
      title: "Cliente selecionado",
      description: cliente.nome,
    });
  };

  const handleClientCreated = (clientData: ClientFormData & { id: string }) => {
    // Add to shared mock clients
    const newMockClient = {
      id: clientData.id,
      nome: clientData.name,
      email: clientData.email,
      telefone: clientData.phone,
      cpf: clientData.cpf,
      n_convidados: 0,
      data_casamento: "",
      cep: clientData.address.cep,
      rua: clientData.address.street,
      numero: clientData.address.number,
      complemento: clientData.address.complement,
      bairro: clientData.address.neighborhood,
      cidade: clientData.address.city,
      estado_uf: clientData.address.state,
    };
    sharedMockClients = [newMockClient, ...sharedMockClients];

    // Select the created client
    handleSelecionarCliente(newMockClient);
    setIsClientDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleSalvarOrcamento = (status: "rascunho" | "final") => {
    // Validation
    if (!nomeCliente || !telefone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e telefone do cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!pacote) {
      toast({
        title: "Selecione um pacote",
        variant: "destructive",
      });
      return;
    }

    if (nConvidados <= 0) {
      toast({
        title: "Número de convidados inválido",
        description: "Informe um número maior que zero.",
        variant: "destructive",
      });
      return;
    }

    const dia = dataStatus === "com_data" ? getDiaSemana(dataEvento) : diaSemana;
    if (!dia) {
      toast({
        title: "Defina o dia da semana",
        description: "Selecione a data do evento ou o dia da semana.",
        variant: "destructive",
      });
      return;
    }

    if (status === "final" && valorOrcamento <= 0) {
      toast({
        title: "Valor inválido",
        description: "O orçamento precisa ter um valor calculado.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Save to database
    toast({
      title: status === "rascunho" ? "Rascunho salvo!" : "Orçamento salvo!",
      description: `Orçamento para ${nomeCliente} ${status === "rascunho" ? "salvo como rascunho" : "finalizado"}.`,
    });

    navigate("/orcamentos");
  };

  const needsMenu = pacote === "essencia" || pacote === "florescer";
  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/orcamentos")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Novo Orçamento
            </h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados para gerar uma proposta
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Block 1 - Cliente */}
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-display font-semibold">Cliente</h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por telefone, email ou nome"
                      value={termoBuscaCliente}
                      onChange={(e) => setTermoBuscaCliente(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleBuscarCliente()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleBuscarCliente}>Buscar</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsClientDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo
                  </Button>
                </div>

                {listaResultadosCliente.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="w-24">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listaResultadosCliente.map((cliente) => (
                          <TableRow key={cliente.id}>
                            <TableCell className="font-medium">{cliente.nome}</TableCell>
                            <TableCell>{cliente.telefone}</TableCell>
                            <TableCell>{cliente.email}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelecionarCliente(cliente)}
                              >
                                Selecionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {clienteId && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <p className="text-sm text-success font-medium">
                      Cliente selecionado: {nomeCliente}
                    </p>
                  </div>
                )}
              </div>

              <ClientFormDialog
                open={isClientDialogOpen}
                onOpenChange={setIsClientDialogOpen}
                onClientCreated={handleClientCreated}
                showSaveAndSearch={true}
              />
            </div>

            {/* Block 2 - Evento */}
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-display font-semibold">Dados do Evento</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Canal de Entrada</Label>
                  <Select value={canalEntrada} onValueChange={setCanalEntrada}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {canaisEntrada.map((canal) => (
                        <SelectItem key={canal.value} value={canal.value}>
                          {canal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Tipo de Evento</Label>
                  <Select value={tipoEvento} onValueChange={setTipoEvento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEvento.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label className="mb-2 block">Data do Evento</Label>
                <RadioGroup
                  value={dataStatus}
                  onValueChange={(v) => setDataStatus(v as "com_data" | "sem_data")}
                  className="flex gap-6 mb-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="com_data" id="com_data" />
                    <Label htmlFor="com_data">Data definida</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sem_data" id="sem_data" />
                    <Label htmlFor="sem_data">Sem data definida</Label>
                  </div>
                </RadioGroup>

                {dataStatus === "com_data" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dataEvento">Data</Label>
                      <Input
                        id="dataEvento"
                        type="date"
                        value={dataEvento}
                        onChange={(e) => setDataEvento(e.target.value)}
                      />
                    </div>
                    {diaSemana && (
                      <div className="flex items-end">
                        <p className="text-sm text-muted-foreground pb-2">
                          Dia da semana: <span className="font-medium text-foreground capitalize">{diaSemana}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Dia da Semana *</Label>
                      <Select value={diaSemana || ""} onValueChange={setDiaSemana}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sabado">Sábado</SelectItem>
                          <SelectItem value="domingo">Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Ano do Evento</Label>
                      <Select value={anoEvento || ""} onValueChange={setAnoEvento}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {anos.map((ano) => (
                            <SelectItem key={ano} value={ano}>
                              {ano}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2 mt-4">
                <Label htmlFor="nConvidadosEvento">Nº de Convidados *</Label>
                <Input
                  id="nConvidadosEvento"
                  type="number"
                  value={nConvidados || ""}
                  onChange={(e) => setNConvidados(parseInt(e.target.value) || 0)}
                  placeholder="150"
                />
              </div>
            </div>

            {/* Block 3 - Pacote */}
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-display font-semibold">Pacote e Valor</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Pacote *</Label>
                  <Select value={pacote} onValueChange={setPacote}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o pacote" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacotes.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {needsMenu && (
                  <div className="grid gap-2">
                    <Label>Menu Buffet *</Label>
                    <Select value={menuBuffet || ""} onValueChange={setMenuBuffet}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o menu" />
                      </SelectTrigger>
                      <SelectContent>
                        {menusBuffet.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {valorOrcamento > 0 && (
                <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Valor Calculado</span>
                    <span className="text-2xl font-display font-bold text-gold">
                      {formatCurrency(valorOrcamento)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Block 4 - Observações */}
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-display font-semibold">Observações</h2>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="observacoesInternas">Observações Internas</Label>
                  <Textarea
                    id="observacoesInternas"
                    value={observacoesInternas}
                    onChange={(e) => setObservacoesInternas(e.target.value)}
                    placeholder="Notas internas sobre o cliente ou evento..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="observacoesCliente">Observações para o Cliente</Label>
                  <Textarea
                    id="observacoesCliente"
                    value={observacoesCliente}
                    onChange={(e) => setObservacoesCliente(e.target.value)}
                    placeholder="Informações que aparecerão no orçamento..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 sticky top-6 animate-slide-up">
              <h2 className="text-lg font-display font-semibold mb-4">Resumo do Orçamento</h2>

              <div className="space-y-4">
                {nomeCliente && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{nomeCliente}</p>
                    </div>
                  </div>
                )}

                {telefone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{telefone}</p>
                    </div>
                  </div>
                )}

                {tipoEvento && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Evento</p>
                      <p className="font-medium capitalize">
                        {tiposEvento.find((t) => t.value === tipoEvento)?.label}
                      </p>
                    </div>
                  </div>
                )}

                {(dataCasamento || dataEvento || (diaSemana && anoEvento)) && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {dataEvento
                          ? new Date(dataEvento + "T12:00:00").toLocaleDateString("pt-BR")
                          : dataCasamento
                          ? new Date(dataCasamento + "T12:00:00").toLocaleDateString("pt-BR")
                          : `${diaSemana === "sabado" ? "Sábado" : "Domingo"} - ${anoEvento}`}
                      </p>
                    </div>
                  </div>
                )}

                {nConvidados > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Convidados</p>
                      <p className="font-medium">{nConvidados} pessoas</p>
                    </div>
                  </div>
                )}

                {pacote && (
                  <div className="flex items-start gap-3">
                    <Package className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pacote</p>
                      <p className="font-medium capitalize">
                        {pacotes.find((p) => p.value === pacote)?.label}
                        {menuBuffet && ` + ${menusBuffet.find((m) => m.value === menuBuffet)?.label}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-2xl font-display font-bold text-gold">
                      {formatCurrency(valorOrcamento)}
                    </span>
                  </div>
                </div>

                {clienteId && (
                  <div className="text-xs text-muted-foreground pt-2">
                    ID Cliente: {clienteId}
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSalvarOrcamento("rascunho")}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={() => handleSalvarOrcamento("final")}
                >
                  Salvar Orçamento
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/orcamentos")}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

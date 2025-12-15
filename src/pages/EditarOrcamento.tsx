import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Save,
  Download,
  User,
  Calendar,
  Package,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQuotePDF } from "@/lib/generateQuotePDF";
import { cn } from "@/lib/utils";

// Mock data - will come from database later
const mockQuotes = [
  {
    id: "ORC-001",
    clientName: "Maria & João",
    email: "maria@email.com",
    phone: "(11) 99999-0001",
    cpf: "123.456.789-00",
    weddingDate: "2025-06-15",
    guestCount: 150,
    totalValue: 25000,
    status: "enviado" as const,
    createdAt: "2024-12-01",
    validUntil: "2024-12-31",
    canalEntrada: "instagram",
    tipoEvento: "casamento",
    pacote: "jardim",
    menuBuffet: null,
    diaSemana: "sabado",
    observacoesInternas: "Cliente muito interessada, responde rápido",
    observacoesCliente: "Preferência por decoração rústica",
    items: [
      { description: "Locação do Espaço", value: 15000 },
      { description: "Decoração Básica", value: 5000 },
      { description: "Serviço de Buffet", value: 5000 },
    ],
  },
  {
    id: "ORC-002",
    clientName: "Ana & Pedro",
    email: "ana@email.com",
    phone: "(11) 99999-0002",
    cpf: "987.654.321-00",
    weddingDate: "2025-08-20",
    guestCount: 100,
    totalValue: 18000,
    status: "rascunho" as const,
    createdAt: "2024-12-05",
    validUntil: "2025-01-05",
    canalEntrada: "google",
    tipoEvento: "casamento",
    pacote: "essencia",
    menuBuffet: "brasileirinho",
    diaSemana: "domingo",
    observacoesInternas: "",
    observacoesCliente: "",
    items: [
      { description: "Locação do Espaço", value: 12000 },
      { description: "Decoração Premium", value: 6000 },
    ],
  },
  {
    id: "ORC-003",
    clientName: "Juliana & Lucas",
    email: "juliana@email.com",
    phone: "(11) 99999-0003",
    cpf: "",
    weddingDate: "2025-05-10",
    guestCount: 200,
    totalValue: 35000,
    status: "aceito" as const,
    createdAt: "2024-11-20",
    validUntil: "2024-12-20",
    canalEntrada: "indicacao",
    tipoEvento: "casamento",
    pacote: "florescer",
    menuBuffet: "massas",
    diaSemana: "sabado",
    observacoesInternas: "Indicação do casamento Silva",
    observacoesCliente: "Open bar premium incluso",
    items: [
      { description: "Locação do Espaço", value: 20000 },
      { description: "Decoração Luxo", value: 10000 },
      { description: "Open Bar", value: 5000 },
    ],
  },
  {
    id: "ORC-004",
    clientName: "Carla & Bruno",
    email: "carla@email.com",
    phone: "(11) 99999-0004",
    cpf: "",
    weddingDate: "2025-09-25",
    guestCount: 80,
    totalValue: 12000,
    status: "recusado" as const,
    createdAt: "2024-11-15",
    validUntil: "2024-12-15",
    canalEntrada: "feira",
    tipoEvento: "casamento",
    pacote: "harmonia",
    menuBuffet: null,
    diaSemana: "domingo",
    observacoesInternas: "Orçamento acima do esperado",
    observacoesCliente: "",
    items: [{ description: "Locação do Espaço", value: 12000 }],
  },
];

const statusLabels = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
  expirado: "Expirado",
};

const statusStyles = {
  rascunho: "bg-muted text-muted-foreground border-border",
  enviado: "bg-primary/10 text-primary border-primary/20",
  aceito: "bg-success/10 text-success border-success/20",
  recusado: "bg-destructive/10 text-destructive border-destructive/20",
  expirado: "bg-warning/10 text-warning border-warning/20",
};

const allStatuses: Array<"rascunho" | "enviado" | "aceito" | "recusado" | "expirado"> = [
  "rascunho", "enviado", "aceito", "recusado", "expirado"
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

export default function EditarOrcamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Quote data
  const [quoteData, setQuoteData] = useState<typeof mockQuotes[0] | null>(null);
  
  // Editable fields
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [weddingDate, setWeddingDate] = useState("");
  const [canalEntrada, setCanalEntrada] = useState("");
  const [tipoEvento, setTipoEvento] = useState("");
  const [pacote, setPacote] = useState("");
  const [menuBuffet, setMenuBuffet] = useState<string | null>(null);
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [status, setStatus] = useState<"rascunho" | "enviado" | "aceito" | "recusado" | "expirado">("rascunho");
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [valorOrcamento, setValorOrcamento] = useState(0);

  // Load quote data
  useEffect(() => {
    const quote = mockQuotes.find((q) => q.id === id);
    if (quote) {
      setQuoteData(quote);
      setClientName(quote.clientName);
      setEmail(quote.email);
      setPhone(quote.phone);
      setCpf(quote.cpf);
      setGuestCount(quote.guestCount);
      setWeddingDate(quote.weddingDate);
      setCanalEntrada(quote.canalEntrada);
      setTipoEvento(quote.tipoEvento);
      setPacote(quote.pacote);
      setMenuBuffet(quote.menuBuffet);
      setDiaSemana(quote.diaSemana);
      setStatus(quote.status);
      setObservacoesInternas(quote.observacoesInternas);
      setObservacoesCliente(quote.observacoesCliente);
      setValidUntil(quote.validUntil);
      setValorOrcamento(quote.totalValue);
    }
  }, [id]);

  // Recalculate price
  useEffect(() => {
    if (pacote && diaSemana && guestCount > 0) {
      const needsMenu = pacote === "essencia" || pacote === "florescer";
      if (!needsMenu || (needsMenu && menuBuffet)) {
        const valor = calcularPreco(pacote, diaSemana, guestCount, menuBuffet);
        setValorOrcamento(valor);
      }
    }
  }, [pacote, diaSemana, guestCount, menuBuffet]);

  // Update diaSemana when weddingDate changes
  useEffect(() => {
    if (weddingDate) {
      const dia = getDiaSemana(weddingDate);
      if (dia) setDiaSemana(dia);
    }
  }, [weddingDate]);

  // Reset menu when package changes
  useEffect(() => {
    if (pacote !== "essencia" && pacote !== "florescer") {
      setMenuBuffet(null);
    }
  }, [pacote]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString + "T12:00:00").toLocaleDateString("pt-BR");
  };

  const handleSave = () => {
    toast({
      title: "Orçamento salvo!",
      description: "As alterações foram salvas com sucesso.",
    });
    setIsEditing(false);
  };

  const handleDownloadPDF = () => {
    if (!quoteData) return;
    generateQuotePDF({
      ...quoteData,
      clientName,
      guestCount,
      weddingDate,
      totalValue: valorOrcamento,
      status,
      validUntil,
    });
  };

  if (!quoteData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Orçamento não encontrado</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/orcamentos")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  Orçamento {quoteData.id}
                </h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
                        statusStyles[status]
                      }`}
                    >
                      {statusLabels[status]}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover">
                    {allStatuses.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => setStatus(s)}
                        className={cn("cursor-pointer", status === s && "bg-accent")}
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            s === "rascunho" ? "bg-muted-foreground" :
                            s === "enviado" ? "bg-primary" :
                            s === "aceito" ? "bg-success" :
                            s === "recusado" ? "bg-destructive" :
                            "bg-warning"
                          }`}
                        />
                        {statusLabels[s]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-muted-foreground">
                Criado em {formatDate(quoteData.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button variant="gold" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </>
            ) : (
              <Button variant="gold" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Dados do Cliente</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Nome</Label>
                  {isEditing ? (
                    <Input 
                      value={clientName} 
                      onChange={(e) => setClientName(e.target.value)} 
                    />
                  ) : (
                    <p className="font-medium">{clientName}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  {isEditing ? (
                    <Input 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  ) : (
                    <p className="font-medium">{email || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Telefone</Label>
                  {isEditing ? (
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  ) : (
                    <p className="font-medium">{phone || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">CPF</Label>
                  {isEditing ? (
                    <Input 
                      value={cpf} 
                      onChange={(e) => setCpf(e.target.value)} 
                    />
                  ) : (
                    <p className="font-medium">{cpf || "-"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Dados do Evento</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Canal de Entrada</Label>
                  {isEditing ? (
                    <Select value={canalEntrada} onValueChange={setCanalEntrada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {canaisEntrada.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {canaisEntrada.find((c) => c.value === canalEntrada)?.label || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Tipo de Evento</Label>
                  {isEditing ? (
                    <Select value={tipoEvento} onValueChange={setTipoEvento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposEvento.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {tiposEvento.find((t) => t.value === tipoEvento)?.label || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Data do Casamento</Label>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={weddingDate} 
                      onChange={(e) => setWeddingDate(e.target.value)} 
                    />
                  ) : (
                    <p className="font-medium">{formatDate(weddingDate)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Dia da Semana</Label>
                  {isEditing ? (
                    <Select value={diaSemana || ""} onValueChange={setDiaSemana}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sabado">Sábado</SelectItem>
                        <SelectItem value="domingo">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {diaSemana === "sabado" ? "Sábado" : diaSemana === "domingo" ? "Domingo" : "-"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Número de Convidados</Label>
                  {isEditing ? (
                    <Input 
                      type="number"
                      value={guestCount} 
                      onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)} 
                    />
                  ) : (
                    <p className="font-medium">{guestCount}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Validade do Orçamento</Label>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={validUntil} 
                      onChange={(e) => setValidUntil(e.target.value)} 
                    />
                  ) : (
                    <p className="font-medium">{formatDate(validUntil)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Pacote e Valores</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Pacote</Label>
                  {isEditing ? (
                    <Select value={pacote} onValueChange={setPacote}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {pacotes.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {pacotes.find((p) => p.value === pacote)?.label || "-"}
                    </p>
                  )}
                </div>
                {(pacote === "essencia" || pacote === "florescer") && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Menu do Buffet</Label>
                    {isEditing ? (
                      <Select value={menuBuffet || ""} onValueChange={setMenuBuffet}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {menusBuffet.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">
                        {menusBuffet.find((m) => m.value === menuBuffet)?.label || "-"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Items list */}
              <div className="mt-6">
                <Label className="text-muted-foreground text-sm mb-2 block">Itens do Orçamento</Label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary/30">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Descrição</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteData.items.map((item, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-right">{formatCurrency(item.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Observations */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Observações</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Observações Internas</Label>
                  {isEditing ? (
                    <Textarea 
                      value={observacoesInternas} 
                      onChange={(e) => setObservacoesInternas(e.target.value)}
                      placeholder="Notas internas sobre o orçamento..."
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{observacoesInternas || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Observações para o Cliente</Label>
                  {isEditing ? (
                    <Textarea 
                      value={observacoesCliente} 
                      onChange={(e) => setObservacoesCliente(e.target.value)}
                      placeholder="Informações adicionais para o cliente..."
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{observacoesCliente || "-"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border sticky top-6 animate-slide-up">
              <h2 className="text-lg font-display font-semibold mb-4">Resumo</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Data do Evento</span>
                  <span className="font-medium">{formatDate(weddingDate)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Convidados</span>
                  <span className="font-medium">{guestCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Pacote</span>
                  <span className="font-medium">
                    {pacotes.find((p) => p.value === pacote)?.label || "-"}
                  </span>
                </div>
                {menuBuffet && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Menu</span>
                    <span className="font-medium">
                      {menusBuffet.find((m) => m.value === menuBuffet)?.label}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Validade</span>
                  <span className="font-medium">{formatDate(validUntil)}</span>
                </div>
                
                <div className="pt-4 border-t-2 border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Valor Total</span>
                    <span className="text-2xl font-display font-bold text-primary">
                      {formatCurrency(valorOrcamento)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button variant="gold" className="w-full" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/contratos/novo")}>
                    Gerar Contrato
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

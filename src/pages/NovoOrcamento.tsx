import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Package as PackageIcon,
  FileText,
  ArrowLeft,
  Save,
  Plus,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientFormDialog, ClientFormData } from "@/components/clients/ClientFormDialog";
import { useClientsOptimized as useClients, type Client, type ClientInsert } from "@/hooks/useClientsOptimized";
import { useQuotesOptimized as useQuotes } from "@/hooks/useQuotesOptimized";
import { PaymentTermsForm, type PaymentTermsData } from "@/components/quotes/PaymentTermsForm";
import { ExtrasForm, type ExtraItem, calcularTotalExtras } from "@/components/quotes/ExtrasForm";
import { SpaceSelection } from "@/components/quotes/SpaceSelection";
import { BuffetSelection } from "@/components/quotes/BuffetSelection";
import { ServicesSelection } from "@/components/quotes/ServicesSelection";
import { PackageSelection } from "@/components/quotes/PackageSelection";
import { QuotePriceSummary } from "@/components/quotes/QuotePriceSummary";
import { useSpaceSettings } from "@/hooks/useSpaceSettings";
import { useBuffetSettings } from "@/hooks/useBuffetSettings";
import { useServiceSettings } from "@/hooks/useServiceSettings";
import { usePackageSettings } from "@/hooks/usePackageSettings";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import {
  calcularPrecoEspaco,
  calcularPrecoBuffet,
  calcularPrecoServico,
  calcularComposicaoPreco,
  getDiaSemana,
  getAnoFromDate,
} from "@/lib/pricingCalculator";
import type { QuoteItem, QuoteComposicao } from "@/types/quote.types";

const tiposEvento = [
  { value: "casamento", label: "Casamento" },
  { value: "debutante", label: "Debutante" },
  { value: "corporativo", label: "Corporativo" },
  { value: "aniversario", label: "Aniversário" },
];

const diasSemana = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Hooks
  const { searchClients, createClient } = useClients();
  const { createQuote } = useQuotes();
  const { spaces } = useSpaceSettings();
  const { buffets } = useBuffetSettings();
  const { services } = useServiceSettings();
  const { packages } = usePackageSettings();
  const { settings: paymentSettings } = usePaymentSettings();

  // Pre-fill event date from URL params
  useEffect(() => {
    const dataEventoParam = searchParams.get("data_evento");
    if (dataEventoParam) {
      setDataStatus("com_data");
      setDataEvento(dataEventoParam);
    }
  }, [searchParams]);

  // Client state
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [termoBuscaCliente, setTermoBuscaCliente] = useState("");
  const [listaResultadosCliente, setListaResultadosCliente] = useState<Client[]>([]);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Client data
  const [nomeCliente, setNomeCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  // Event data
  const [tipoEvento, setTipoEvento] = useState("");
  const [dataStatus, setDataStatus] = useState<"com_data" | "sem_data">("sem_data");
  const [dataEvento, setDataEvento] = useState("");
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [anoEvento, setAnoEvento] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });
  const [validadeOrcamento, setValidadeOrcamento] = useState("");
  const [nConvidados, setNConvidados] = useState(0);

  // Quote selections
  const [espacoId, setEspacoId] = useState<string | null>(null);
  const [buffetId, setBuffetId] = useState<string | null>(null);
  const [servicoIds, setServicoIds] = useState<string[]>([]);
  const [pacoteId, setPacoteId] = useState<string | null>(null);

  // Price composition
  const [composicao, setComposicao] = useState<QuoteComposicao | null>(null);

  // Observations
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");

  // Extras
  const [extras, setExtras] = useState<ExtraItem[]>([]);

  // Payment terms
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsData>({
    percentualSinal: paymentSettings?.percentual_minimo_sinal || 10,
    valorSinal: 0,
    numeroParcelas: 1,
    diaVencimento: paymentSettings?.dia_vencimento_padrao || 10,
    parcelas: [],
  });
  const [hasPaymentErrors, setHasPaymentErrors] = useState(false);

  // Update payment settings when they load
  useEffect(() => {
    if (paymentSettings) {
      setPaymentTerms((prev) => ({
        ...prev,
        percentualSinal: paymentSettings.percentual_minimo_sinal,
        diaVencimento: paymentSettings.dia_vencimento_padrao,
      }));
    }
  }, [paymentSettings]);

  // Calculate price when selections change
  useEffect(() => {
    // Precisa ter pelo menos um item selecionado e número de convidados
    if ((!espacoId && !buffetId && servicoIds.length === 0) || nConvidados <= 0) {
      setComposicao(null);
      return;
    }

    const itens: QuoteItem[] = [];

    // Calcular preço do espaço (se selecionado)
    if (espacoId && diaSemana) {
      const espaco = spaces.find((s) => s.id === espacoId);
      if (espaco) {
        const precoEspaco = calcularPrecoEspaco(espaco, diaSemana, nConvidados);
        if (precoEspaco) {
          itens.push(precoEspaco);
        }
      }
    }

    // Calcular preço do buffet (se selecionado)
    if (buffetId) {
      const buffet = buffets.find((b) => b.id === buffetId);
      if (buffet) {
        const precoBuffet = calcularPrecoBuffet(buffet, nConvidados);
        if (precoBuffet) {
          itens.push(precoBuffet);
        }
      }
    }

    // Calcular preço dos serviços (se selecionados)
    servicoIds.forEach((servicoId) => {
      const servico = services.find((s) => s.id === servicoId);
      if (servico) {
        const precoServico = calcularPrecoServico(servico, nConvidados);
        if (precoServico) {
          itens.push(precoServico);
        }
      }
    });

    // Buscar pacote (se selecionado)
    const pacote = pacoteId ? packages.find((p) => p.id === pacoteId) : null;

    // Calcular composição final
    const novaComposicao = calcularComposicaoPreco(itens, pacote || null, extras, nConvidados);
    setComposicao(novaComposicao);
  }, [espacoId, buffetId, servicoIds, pacoteId, diaSemana, nConvidados, extras, spaces, buffets, services, packages]);

  // Update diaSemana when dataEvento changes
  useEffect(() => {
    if (dataStatus === "com_data" && dataEvento) {
      const dia = getDiaSemana(dataEvento);
      setDiaSemana(dia);
      const year = getAnoFromDate(dataEvento);
      setAnoEvento(year);
    }
  }, [dataEvento, dataStatus]);

  // Set default validity (30 days from now)
  useEffect(() => {
    const defaultValidity = new Date();
    defaultValidity.setDate(defaultValidity.getDate() + 30);
    setValidadeOrcamento(defaultValidity.toISOString().split("T")[0]);
  }, []);

  const handleBuscarCliente = async () => {
    if (!termoBuscaCliente.trim()) {
      toast({
        title: "Digite algo para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    const resultados = await searchClients(termoBuscaCliente);
    setListaResultadosCliente(resultados);
    setIsSearching(false);

    if (resultados.length === 0) {
      toast({
        title: "Nenhum cliente encontrado",
        description: "Tente outro termo de busca ou cadastre um novo cliente.",
      });
    }
  };

  const handleSelecionarCliente = (cliente: Client) => {
    setClienteId(cliente.id);
    setNomeCliente(cliente.nome);
    setEmail(cliente.email || "");
    setTelefone(cliente.telefone);
    setCpf(cliente.cpf || "");
    setListaResultadosCliente([]);
    setTermoBuscaCliente("");

    toast({
      title: "Cliente selecionado",
      description: cliente.nome,
    });
  };

  const handleClientCreated = async (clientData: ClientFormData & { id: string }) => {
    const newClient: ClientInsert = {
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

    const createdClient = await createClient(newClient);
    
    if (createdClient) {
      handleSelecionarCliente(createdClient);
    }
    
    setIsClientDialogOpen(false);
  };

  const handleSalvarOrcamento = async (status: "rascunho" | "enviado") => {
    // Validation
    if (!clienteId) {
      toast({
        title: "Selecione um cliente",
        description: "Busque e selecione um cliente existente ou cadastre um novo.",
        variant: "destructive",
      });
      return;
    }

    if (!espacoId && !buffetId && servicoIds.length === 0 && !pacoteId) {
      toast({
        title: "Selecione ao menos um item",
        description: "Selecione espaço, buffet, serviços ou pacote.",
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

    // Validar dia da semana apenas se espaço estiver selecionado
    if (espacoId && !diaSemana) {
      toast({
        title: "Defina o dia da semana",
        description: "O dia da semana é necessário para calcular o preço do espaço.",
        variant: "destructive",
      });
      return;
    }

    if (!composicao || composicao.total_geral <= 0) {
      toast({
        title: "Valor inválido",
        description: "O orçamento precisa ter um valor calculado.",
        variant: "destructive",
      });
      return;
    }

    if (status === "enviado" && hasPaymentErrors) {
      toast({
        title: "Erro nas condições de pagamento",
        description: "Corrija os erros antes de salvar o orçamento.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const quoteData = await createQuote ({
      client_id: clienteId,
      tipo_evento: tipoEvento || null,
      data_status: dataStatus,
      data_evento: dataStatus === "com_data" && dataEvento ? dataEvento : null,
      dia_semana: diaSemana,
      ano_evento: anoEvento,
      n_convidados: nConvidados,
      
      // Novas referências às configurações
      espaco_id: espacoId,
      buffet_id: buffetId,
      servico_ids: servicoIds.length > 0 ? servicoIds : null,
      pacote_id: pacoteId,
      
      // Composição de preço
      composicao_preco: composicao,
      
      // Valores (mantidos para compatibilidade)
      pacote: pacoteId || "",
      menu_buffet: buffetId || null,
      valor_total: composicao.total_geral,
      
      validade: validadeOrcamento || null,
      status,
      observacoes_internas: observacoesInternas || null,
      observacoes_cliente: observacoesCliente || null,
      percentual_sinal: paymentTerms.percentualSinal,
      valor_sinal: paymentTerms.valorSinal,
      numero_parcelas: paymentTerms.numeroParcelas,
      dia_vencimento: paymentTerms.diaVencimento,
      parcelas_json: paymentTerms.parcelas,
      extras_json: extras,
    });

    const quote = await createQuote(quoteData as any);

    setIsSaving(false);

    if (quote) {
      navigate("/orcamentos");
    }
  };

  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

  // Obter dias da semana disponíveis baseado nos espaços configurados
  const getDiasDisponiveis = () => {
    const spacesDoAno = spaces.filter((s) => s.ano === anoEvento);
    if (spacesDoAno.length === 0) return diasSemana;

    const diasSet = new Set<string>();
    spacesDoAno.forEach((space) => {
      space.precos_por_dia?.forEach((preco) => {
        preco.dias.forEach((dia) => diasSet.add(dia));
      });
    });

    // Retornar dias na ordem correta
    return diasSemana.filter((dia) => diasSet.has(dia));
  };

  const diasDisponiveis = getDiasDisponiveis();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/orcamentos")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Novo Orçamento
              </h1>
              <p className="text-muted-foreground">
                Preencha os dados para gerar uma proposta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSalvarOrcamento("rascunho")}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Rascunho
            </Button>
            <Button
              variant="gold"
              onClick={() => handleSalvarOrcamento("enviado")}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Orçamento
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Content - Tudo em uma coluna */}
          <div className="space-y-6">
            {/* Block 1 - Cliente */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Dados do Cliente</h2>
              </div>

              {/* Client Search */}
              <div className="space-y-4 mb-6">
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
                  <Button onClick={handleBuscarCliente} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                  </Button>
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
                            <TableCell>{cliente.email || "-"}</TableCell>
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
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                    <p className="text-sm text-success font-medium">
                      Cliente selecionado: {nomeCliente}
                    </p>
                  </div>
                )}
              </div>

              {/* Client Fields - Read only when selected */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Nome</Label>
                  <p className="font-medium py-2">{nomeCliente || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium py-2">{email || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Telefone</Label>
                  <p className="font-medium py-2">{telefone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">CPF</Label>
                  <p className="font-medium py-2">{cpf || "-"}</p>
                </div>
              </div>

              <ClientFormDialog
                open={isClientDialogOpen}
                onOpenChange={setIsClientDialogOpen}
                onClientCreated={handleClientCreated}
                showSaveAndSearch={true}
              />
            </div>

            {/* Block 2 - Evento */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Informações do Evento</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Evento e Número de Convidados - Sempre visíveis */}
                <div>
                  <Label className="text-muted-foreground text-sm">Tipo de Evento</Label>
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

                <div>
                  <Label className="text-muted-foreground text-sm">Número de Convidados *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={nConvidados || ""}
                    onChange={(e) => setNConvidados(parseInt(e.target.value) || 0)}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Date Status Selection */}
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground text-sm mb-2 block">Data do Evento</Label>
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
                </div>

                {dataStatus === "com_data" ? (
                  <>
                    <div>
                      <Label className="text-muted-foreground text-sm">Data do Evento *</Label>
                      <Input
                        type="date"
                        value={dataEvento}
                        onChange={(e) => setDataEvento(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Validade do Orçamento</Label>
                      <Input
                        type="date"
                        value={validadeOrcamento}
                        onChange={(e) => setValidadeOrcamento(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground text-sm">
                        Ano do Evento *
                        <span className="block text-xs font-normal text-muted-foreground/70 mt-0.5">
                          Para carregar configurações
                        </span>
                      </Label>
                      <Select value={anoEvento} onValueChange={setAnoEvento}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
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

                    <div>
                      <Label className="text-muted-foreground text-sm">
                        Dia da Semana *
                        <span className="block text-xs font-normal text-muted-foreground/70 mt-0.5">
                          Para calcular preços
                        </span>
                      </Label>
                      <Select
                        value={diaSemana || ""}
                        onValueChange={(v) => setDiaSemana(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                        <SelectContent>
                          {diasDisponiveis.length > 0 ? (
                            diasDisponiveis.map((dia) => (
                              <SelectItem key={dia} value={dia}>
                                {dia}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Configure espaços primeiro
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground text-sm">Validade do Orçamento</Label>
                      <Input
                        type="date"
                        value={validadeOrcamento}
                        onChange={(e) => setValidadeOrcamento(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Block 3 - Seleções (Espaço, Buffet, Serviços, Pacote) */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-6">
                <PackageIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Itens do Orçamento</h2>
              </div>

              <div className="space-y-6">
                {/* Seleção de Espaço */}
                <SpaceSelection
                  spaces={spaces}
                  selectedSpaceId={espacoId}
                  onSpaceChange={setEspacoId}
                  diaSemana={diaSemana}
                  anoEvento={anoEvento}
                />

                {/* Seleção de Buffet */}
                <BuffetSelection
                  buffets={buffets}
                  selectedBuffetId={buffetId}
                  onBuffetChange={setBuffetId}
                  anoEvento={anoEvento}
                />

                {/* Seleção de Serviços */}
                <ServicesSelection
                  services={services}
                  selectedServiceIds={servicoIds}
                  onServicesChange={setServicoIds}
                  anoEvento={anoEvento}
                />

                {/* Seleção de Pacote */}
                <PackageSelection
                  packages={packages}
                  selectedPackageId={pacoteId}
                  onPackageChange={setPacoteId}
                  anoEvento={anoEvento}
                />
              </div>
            </div>

            {/* Block 4 - Extras */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Extras</h2>
              </div>

              <ExtrasForm
                extras={extras}
                onChange={setExtras}
                guestCount={nConvidados}
              />
            </div>

            {/* Block 5 - Resumo do Orçamento */}
            {composicao && composicao.total_geral > 0 && (
              <div className="animate-slide-up">
                <QuotePriceSummary
                  composicao={composicao}
                  nConvidados={nConvidados}
                />
              </div>
            )}

            {/* Block 6 - Condições de Pagamento */}
            {composicao && composicao.total_geral > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-display font-semibold">Condições de Pagamento</h2>
                </div>
                <PaymentTermsForm
                  valorTotal={composicao.total_geral}
                  dataEvento={dataStatus === "com_data" ? dataEvento : null}
                  onChange={setPaymentTerms}
                  onValidationChange={setHasPaymentErrors}
                />
              </div>
            )}

            {/* Block 7 - Observações */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">Observações</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Observações Internas</Label>
                  <Textarea
                    placeholder="Observações que só você verá..."
                    value={observacoesInternas}
                    onChange={(e) => setObservacoesInternas(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Observações para o Cliente</Label>
                  <Textarea
                    placeholder="Observações que aparecerão no orçamento..."
                    value={observacoesCliente}
                    onChange={(e) => setObservacoesCliente(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
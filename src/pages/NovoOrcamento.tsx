import { useState, useEffect, useMemo } from "react";
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
  ChevronDown,
  Percent,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ClientFormDialog, ClientFormData } from "@/components/clients/ClientFormDialog";
import { useClientsOptimized as useClients, type Client, type ClientInsert } from "@/hooks/useClientsOptimized";
import { useQuotesOptimized as useQuotes } from "@/hooks/useQuotesOptimized";
import { PaymentTermsForm, type PaymentTermsData } from "@/components/quotes/PaymentTermsForm";
import { ExtrasForm, type ExtraItem, calcularTotalExtras } from "@/components/quotes/ExtrasForm";
import { DiscountForm, type DiscountData } from "@/components/quotes/DiscountForm";
import { QuoteItemsSection, type QuoteItemsSelections, initialQuoteItemsSelections } from "@/components/quotes/QuoteItemsSection";
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

  // Hooks de dados
  const { searchClients, createClient } = useClients();
  const { createQuote } = useQuotes();
  const { spaces } = useSpaceSettings();
  const { buffets } = useBuffetSettings();
  const { services } = useServiceSettings();
  const { packages } = usePackageSettings();
  const { settings: paymentSettings } = usePaymentSettings();

  // =============================================================================
  // ESTADOS
  // =============================================================================

  // Cliente
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [termoBuscaCliente, setTermoBuscaCliente] = useState("");
  const [listaResultadosCliente, setListaResultadosCliente] = useState<Client[]>([]);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dados do cliente selecionado
  const [nomeCliente, setNomeCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  // Evento
  const [tipoEvento, setTipoEvento] = useState("");
  const [dataStatus, setDataStatus] = useState<"com_data" | "sem_data">("sem_data");
  const [dataEvento, setDataEvento] = useState("");
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [anoEvento, setAnoEvento] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });
  const [validadeOrcamento, setValidadeOrcamento] = useState("");
  const [nConvidados, setNConvidados] = useState(0);

  // NOVO: Seleções de itens (unificado)
  const [itemSelections, setItemSelections] = useState<QuoteItemsSelections>(
    initialQuoteItemsSelections
  );

  // Composição de preço (calculado)
  const [composicao, setComposicao] = useState<QuoteComposicao | null>(null);

  // Observações
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");

  // Extras
  const [extras, setExtras] = useState<ExtraItem[]>([]);

  // Desconto manual
  const [discount, setDiscount] = useState<DiscountData>({
    descricao: "",
    percentual: 0,
    valor: 0,
  });

  // Condições de pagamento
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsData>({
    percentualSinal: paymentSettings?.percentual_minimo_sinal || 10,
    valorSinal: 0,
    numeroParcelas: 1,
    diaVencimento: paymentSettings?.dia_vencimento_padrao || 10,
    parcelas: [],
  });
  const [hasPaymentErrors, setHasPaymentErrors] = useState(false);

  // =============================================================================
  // EFEITOS
  // =============================================================================

  // Pre-fill data do evento da URL
  useEffect(() => {
    const dataEventoParam = searchParams.get("data_evento");
    if (dataEventoParam) {
      setDataStatus("com_data");
      setDataEvento(dataEventoParam);
    }
  }, [searchParams]);

  // Atualizar configurações de pagamento quando carregarem
  useEffect(() => {
    if (paymentSettings) {
      setPaymentTerms((prev) => ({
        ...prev,
        percentualSinal: paymentSettings.percentual_minimo_sinal,
        diaVencimento: paymentSettings.dia_vencimento_padrao,
      }));
    }
  }, [paymentSettings]);

  // Atualizar dia da semana quando data muda
  useEffect(() => {
    if (dataStatus === "com_data" && dataEvento) {
      const dia = getDiaSemana(dataEvento);
      setDiaSemana(dia);
      const year = getAnoFromDate(dataEvento);
      setAnoEvento(year);
    }
  }, [dataEvento, dataStatus]);

  // Validade padrão (30 dias)
  useEffect(() => {
    const defaultValidity = new Date();
    defaultValidity.setDate(defaultValidity.getDate() + 30);
    setValidadeOrcamento(defaultValidity.toISOString().split("T")[0]);
  }, []);

  // =============================================================================
  // CÁLCULO DE PREÇOS (useMemo para performance)
  // =============================================================================

  // Encontrar pacote selecionado
  const selectedPackage = useMemo(() => {
    if (!itemSelections.pacoteId) return null;
    return packages.find((p) => p.id === itemSelections.pacoteId) || null;
  }, [itemSelections.pacoteId, packages]);

  // Calcular composição de preço
  useEffect(() => {
    const { espacoId, buffetId, servicoIds, serviceQuantities } = itemSelections;

    // Precisa ter pelo menos um item e número de convidados
    if ((!espacoId && !buffetId && servicoIds.length === 0) || nConvidados <= 0) {
      setComposicao(null);
      return;
    }

    const itens: QuoteItem[] = [];

    // Calcular preço do espaço
    if (espacoId && diaSemana) {
      const espaco = spaces.find((s) => s.id === espacoId);
      if (espaco) {
        const precoEspaco = calcularPrecoEspaco(espaco, diaSemana, nConvidados);
        if (precoEspaco) {
          itens.push(precoEspaco);
        }
      }
    }

    // Calcular preço do buffet
    if (buffetId) {
      const buffet = buffets.find((b) => b.id === buffetId);
      if (buffet) {
        const precoBuffet = calcularPrecoBuffet(buffet, nConvidados);
        if (precoBuffet) {
          itens.push(precoBuffet);
        }
      }
    }

    // Calcular preço dos serviços
    servicoIds.forEach((servicoId) => {
      const servico = services.find((s) => s.id === servicoId);
      if (servico) {
        const preco = servico.precos?.[0];
        let quantidade = nConvidados;

        if (preco && preco.tipo === "variavel") {
          const unidade = preco.unidade?.toLowerCase() || "";
          const isPessoaUnidade =
            unidade === "pessoa" ||
            unidade === "pessoas" ||
            unidade === "convidado" ||
            unidade === "convidados";

          if (!isPessoaUnidade) {
            quantidade = serviceQuantities[servicoId] || 1;
          }
        }

        const precoServico = calcularPrecoServico(servico, quantidade);
        if (precoServico) {
          itens.push(precoServico);
        }
      }
    });

    // Calcular composição final com pacote (se houver)
    const novaComposicao = calcularComposicaoPreco(
      itens,
      selectedPackage,
      extras,
      nConvidados
    );
    setComposicao(novaComposicao);
  }, [
    itemSelections,
    diaSemana,
    nConvidados,
    extras,
    spaces,
    buffets,
    services,
    selectedPackage,
  ]);

  // Package info para o resumo
  const packageInfoForSummary = useMemo(() => {
    if (!selectedPackage) return null;
    return {
      nome: selectedPackage.nome,
      descontoFixo: selectedPackage.desconto_percentual,
      descontoVariavel: selectedPackage.desconto_percentual_variavel,
      itensIds: [
        ...itemSelections.packageLockedItems.servicoIds,
        itemSelections.packageLockedItems.espacoId,
        itemSelections.packageLockedItems.buffetId,
      ].filter(Boolean) as string[],
    };
  }, [selectedPackage, itemSelections.packageLockedItems]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

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
    const { espacoId, buffetId, servicoIds, serviceQuantities, pacoteId } = itemSelections;

    // Validações
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

    if (espacoId && !diaSemana) {
      toast({
        title: "Defina o dia da semana",
        description: "O dia da semana é necessário para calcular o preço do espaço.",
        variant: "destructive",
      });
      return;
    }

    // Validar quantidades de serviços
    for (const servicoId of servicoIds) {
      const servico = services.find((s) => s.id === servicoId);
      if (servico) {
        const preco = servico.precos?.[0];
        if (preco && preco.tipo === "variavel") {
          const unidade = preco.unidade?.toLowerCase() || "";
          const isPessoaUnidade =
            unidade === "pessoa" ||
            unidade === "pessoas" ||
            unidade === "convidado" ||
            unidade === "convidados";

          if (!isPessoaUnidade) {
            const quantidade = serviceQuantities[servicoId] || 0;
            if (quantidade < 1) {
              toast({
                title: "Quantidade inválida",
                description: `Informe a quantidade de ${preco.unidade || "unidades"} para "${servico.nome}".`,
                variant: "destructive",
              });
              return;
            }
          }
        }
      }
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

    const valorTotalFinal = composicao.total_geral - (discount?.valor || 0);

    const quote = await createQuote({
      client_id: clienteId,
      tipo_evento: tipoEvento || null,
      data_status: dataStatus,
      data_evento: dataStatus === "com_data" && dataEvento ? dataEvento : null,
      dia_semana: diaSemana,
      ano_evento: anoEvento,
      n_convidados: nConvidados,

      // Referências às configurações
      espaco_id: espacoId,
      buffet_id: buffetId,
      servico_ids: servicoIds.length > 0 ? servicoIds : null,
      pacote_id: pacoteId,

      // Quantidades customizadas de serviços
      servico_quantidades: servicoIds.length > 0 ? serviceQuantities : null,

      // Composição de preço
      composicao_preco: composicao,

      // Desconto manual
      desconto_descricao: discount?.descricao || null,
      desconto_percentual: discount?.percentual || 0,
      desconto_valor: discount?.valor || 0,

      // Valores (mantidos para compatibilidade)
      pacote: pacoteId || "",
      menu_buffet: buffetId || null,
      valor_total: valorTotalFinal,

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

    setIsSaving(false);

    if (quote) {
      navigate("/orcamentos");
    }
  };

  // =============================================================================
  // DADOS DERIVADOS
  // =============================================================================

  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

  // Dias da semana disponíveis baseado nos espaços
  const getDiasDisponiveis = () => {
    const spacesDoAno = spaces.filter((s) => s.ano === anoEvento);
    if (spacesDoAno.length === 0) return diasSemana;

    const diasSet = new Set<string>();
    spacesDoAno.forEach((space) => {
      space.precos_por_dia?.forEach((preco) => {
        preco.dias.forEach((dia) => diasSet.add(dia));
      });
    });

    return diasSemana.filter((dia) => diasSet.has(dia));
  };

  const diasDisponiveis = getDiasDisponiveis();

  // =============================================================================
  // RENDER
  // =============================================================================

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
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
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

        <div className="space-y-4">
          {/* Block 1 - Cliente */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Dados do Cliente</h2>
            </div>

            {/* Client Search */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por telefone, email ou nome"
                    value={termoBuscaCliente}
                    onChange={(e) => setTermoBuscaCliente(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscarCliente()}
                    className="pl-10 h-9"
                    autoComplete="off"
                  />
                </div>
                <Button size="sm" onClick={handleBuscarCliente} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsClientDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Novo
                </Button>
              </div>

              {listaResultadosCliente.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2">Nome</TableHead>
                        <TableHead className="py-2">Telefone</TableHead>
                        <TableHead className="py-2">Email</TableHead>
                        <TableHead className="py-2 w-24">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listaResultadosCliente.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell className="py-2 font-medium">{cliente.nome}</TableCell>
                          <TableCell className="py-2">{cliente.telefone}</TableCell>
                          <TableCell className="py-2">{cliente.email || "-"}</TableCell>
                          <TableCell className="py-2">
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
                <div className="bg-success/10 border border-success/20 rounded-lg p-2.5">
                  <p className="text-sm text-success font-medium">
                    ✓ {nomeCliente} {telefone && `· ${telefone}`} {email && `· ${email}`}
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
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Informações do Evento</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Tipo de Evento</Label>
                <Select value={tipoEvento} onValueChange={setTipoEvento}>
                  <SelectTrigger className="h-9">
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
                <Label className="text-muted-foreground text-xs">Nº Convidados *</Label>
                <Input
                  type="number"
                  min="1"
                  value={nConvidados || ""}
                  onChange={(e) => setNConvidados(parseInt(e.target.value) || 0)}
                  className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Data Status - inline */}
              <div className="col-span-2">
                <Label className="text-muted-foreground text-xs mb-1.5 block">Data do Evento</Label>
                <RadioGroup
                  value={dataStatus}
                  onValueChange={(v) => setDataStatus(v as "com_data" | "sem_data")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="com_data" id="com_data" />
                    <Label htmlFor="com_data" className="text-sm font-normal cursor-pointer">Definida</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="sem_data" id="sem_data" />
                    <Label htmlFor="sem_data" className="text-sm font-normal cursor-pointer">A definir</Label>
                  </div>
                </RadioGroup>
              </div>

              {dataStatus === "com_data" ? (
                <>
                  <div>
                    <Label className="text-muted-foreground text-xs">Data *</Label>
                    <Input
                      type="date"
                      value={dataEvento}
                      onChange={(e) => setDataEvento(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Validade</Label>
                    <Input
                      type="date"
                      value={validadeOrcamento}
                      onChange={(e) => setValidadeOrcamento(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-muted-foreground text-xs">Ano *</Label>
                    <Select value={anoEvento} onValueChange={setAnoEvento}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Ano" />
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
                    <Label className="text-muted-foreground text-xs">Dia da Semana *</Label>
                    <Select
                      value={diaSemana || ""}
                      onValueChange={(v) => setDiaSemana(v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Dia" />
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
                            Configure espaços
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">Validade</Label>
                    <Input
                      type="date"
                      value={validadeOrcamento}
                      onChange={(e) => setValidadeOrcamento(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Block 3 - Itens do Orçamento */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <PackageIcon className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Itens do Orçamento</h2>
            </div>

            <QuoteItemsSection
              spaces={spaces}
              buffets={buffets}
              services={services}
              packages={packages}
              selections={itemSelections}
              onSelectionsChange={setItemSelections}
              anoEvento={anoEvento}
              diaSemana={diaSemana}
            />
          </div>

          {/* Block 4 - Extras (Colapsável) */}
          <Collapsible>
            <div className="bg-card rounded-xl shadow-soft border border-border animate-slide-up">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-xl">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <h2 className="font-display font-semibold">Extras</h2>
                    {extras.length > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {extras.length} item(s)
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-0">
                  <ExtrasForm extras={extras} onChange={setExtras} guestCount={nConvidados} />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Block 5 - Desconto (Colapsável) */}
          {composicao && composicao.total_geral > 0 && (
            <Collapsible>
              <div className="bg-card rounded-xl shadow-soft border border-border animate-slide-up">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-xl">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-primary" />
                      <h2 className="font-display font-semibold">Desconto</h2>
                      {discount.valor > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                          -{discount.percentual.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0">
                    <DiscountForm
                      valorTotal={composicao.total_geral}
                      discount={discount}
                      onChange={setDiscount}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Block 5 - Resumo do Orçamento */}
          {composicao && composicao.total_geral > 0 && (
            <div className="animate-slide-up">
              <QuotePriceSummary
                composicao={composicao}
                nConvidados={nConvidados}
                discount={discount}
                packageInfo={packageInfoForSummary}
              />
            </div>
          )}

          {/* Block 6 - Condições de Pagamento */}
          {composicao && composicao.total_geral > 0 && (
            <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up">
              <PaymentTermsForm
                valorTotal={composicao.total_geral - (discount?.valor || 0)}
                dataEvento={dataStatus === "com_data" ? dataEvento : null}
                onChange={setPaymentTerms}
                onValidationChange={setHasPaymentErrors}
              />
            </div>
          )}

          {/* Block 7 - Observações (Compacto) */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">Observações</h2>
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Internas (só você vê)</Label>
                <Textarea
                  placeholder="Anotações internas..."
                  value={observacoesInternas}
                  onChange={(e) => setObservacoesInternas(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Para o cliente</Label>
                <Textarea
                  placeholder="Aparecerá no orçamento..."
                  value={observacoesCliente}
                  onChange={(e) => setObservacoesCliente(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
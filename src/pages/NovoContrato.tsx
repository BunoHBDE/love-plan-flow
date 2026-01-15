import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SubscriptionGate } from "@/components/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ContractEditor } from "@/components/contracts/ContractEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  CreditCard,
  Building2,
  Loader2,
  Save,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useQuotes, type Quote } from "@/hooks/useQuotes";
import { useContracts } from "@/hooks/useContracts";
import { useContractTemplates } from "@/hooks/useContractTemplates";
import { useProfileSettings } from "@/hooks/useProfileSettings";

// Types
import type {
  ContractInsertData,
  DadosCliente,
  DadosEvento,
  DadosPagamento,
  DadosEmpresa,
} from "@/types/contract.types";
import type { ExtraItem } from "@/components/quotes/ExtrasForm";

// Lib
import { replacePlaceholders, DEFAULT_CONTRACT_TEMPLATE, PLACEHOLDER_CATEGORIES } from "@/lib/contractPlaceholders";
import { DEFAULT_CONTRACT_CSS } from "@/components/contracts/ContractEditor";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NovoContrato() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get("quoteId");

  const { user } = useAuth();
  const { getQuoteById } = useQuotes();
  const { createContract } = useContracts();
  const { templates, getDefaultContent } = useContractTemplates();
  const { profileData } = useProfileSettings();

  // States
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [contractContent, setContractContent] = useState<string>("");
  const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);
  const [contractCss, setContractCss] = useState<string>(DEFAULT_CONTRACT_CSS);
  // Editable fields
  const [dadosCliente, setDadosCliente] = useState<DadosCliente>({
    nome: "",
    telefone: "",
  });
  const [dadosEvento, setDadosEvento] = useState<DadosEvento>({
    n_convidados: 0,
  });
  const [dadosPagamento, setDadosPagamento] = useState<DadosPagamento>({
    valor_total: 0,
    percentual_sinal: 0,
    valor_sinal: 0,
    numero_parcelas: 0,
    dia_vencimento: 0,
    parcelas: [],
  });
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa>({});

  // Track if we've already loaded the quote
  const loadedQuoteRef = useRef<string | null>(null);

  // Load quote data
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        toast.error("Orçamento não especificado");
        navigate("/contratos");
        return;
      }

      // Prevent duplicate loading
      if (loadedQuoteRef.current === quoteId) {
        return;
      }
      loadedQuoteRef.current = quoteId;

      setLoading(true);
      const quoteData = await getQuoteById(quoteId);
      
      if (!quoteData) {
        toast.error("Orçamento não encontrado");
        navigate("/contratos");
        return;
      }

      if (quoteData.status !== "aceito") {
        toast.error("Apenas orçamentos aceitos podem gerar contratos");
        navigate("/contratos");
        return;
      }

      setQuote(quoteData);

      // Pre-fill client data
      const client = quoteData.client;
      if (client) {
        setDadosCliente({
          nome: client.nome,
          cpf: client.cpf || undefined,
          telefone: client.telefone,
          email: client.email || undefined,
          endereco: [
            client.rua,
            client.numero && `nº ${client.numero}`,
            client.complemento,
            client.bairro,
            client.cidade,
            client.estado_uf,
            client.cep,
          ].filter(Boolean).join(", ") || undefined,
        });
      }

      // Pre-fill event data
      const extras = (quoteData.extras_json as ExtraItem[] || []).map(e => ({
        descricao: e.descricao || "",
        valor: e.valor || 0,
      }));

      setDadosEvento({
        data_evento: quoteData.data_evento || undefined,
        dia_semana: quoteData.dia_semana || undefined,
        ano_evento: quoteData.ano_evento || undefined,
        tipo_evento: quoteData.tipo_evento || undefined,
        n_convidados: quoteData.n_convidados,
        buffet_nome: quoteData.menu_buffet || undefined,
        pacote_nome: quoteData.pacote,
        extras,
      });

      // Pre-fill payment data
      const parcelas = (quoteData.parcelas_json as Array<{ numero: number; valor: number; vencimento: string }> || []);
      setDadosPagamento({
        valor_total: Number(quoteData.valor_total),
        percentual_sinal: quoteData.percentual_sinal,
        valor_sinal: Number(quoteData.valor_sinal),
        numero_parcelas: quoteData.numero_parcelas,
        dia_vencimento: quoteData.dia_vencimento,
        parcelas,
      });

      setLoading(false);
    };

    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  // Pre-fill company data from profile
  useEffect(() => {
    if (profileData) {
      setDadosEmpresa({
        nome: profileData.empresaNome || undefined,
        cnpj: profileData.empresaCnpj || undefined,
        telefone: profileData.empresaTelefone || undefined,
        email: profileData.empresaEmail || undefined,
        endereco: [
          profileData.empresaRua,
          profileData.empresaNumero && `nº ${profileData.empresaNumero}`,
          profileData.empresaComplemento,
          profileData.empresaBairro,
          profileData.empresaCidade,
          profileData.empresaEstado,
          profileData.empresaCep,
        ].filter(Boolean).join(", ") || undefined,
      });
    }
  }, [profileData]);

  // Set initial template content
  useEffect(() => {
    const defaultContent = getDefaultContent() || DEFAULT_CONTRACT_TEMPLATE;
    setContractContent(defaultContent);
  }, [getDefaultContent]);

  // Update contract content when template changes
  useEffect(() => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
      setContractContent(selectedTemplate.conteudo);
    }
  }, [selectedTemplateId, templates]);

  // Preview with placeholders replaced
  const previewContent = useMemo(() => {
    const contractNumber = "NOVO-CONTRATO";
    return replacePlaceholders(
      contractContent,
      contractNumber,
      dadosCliente,
      dadosEvento,
      dadosPagamento,
      dadosEmpresa
    );
  }, [contractContent, dadosCliente, dadosEvento, dadosPagamento, dadosEmpresa]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Não definida";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleCopyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    setCopiedPlaceholder(placeholder);
    setTimeout(() => setCopiedPlaceholder(null), 2000);
    toast.success("Placeholder copiado!");
  };

  const handleCreateContract = () => {
    if (!quote || !user?.id) return;

    const contractData: ContractInsertData = {
      quote_id: quote.id,
      client_id: quote.client_id,
      created_by: user.id,
      data_evento: quote.data_evento || undefined,
      dados_cliente: dadosCliente,
      dados_evento: dadosEvento,
      dados_pagamento: dadosPagamento,
      dados_empresa: dadosEmpresa,
      modelo_contrato: contractContent,
    };

    createContract.mutate(contractData, {
      onSuccess: () => {
        navigate("/contratos");
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SubscriptionGate>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/contratos")}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* Template Selector */}
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground hidden sm:block" />
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="w-[200px] sm:w-[250px]">
                    <SelectValue placeholder="Modelo Padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Modelo Padrão</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nome} {template.is_default && "(Padrão)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mr-4">
                <span className="font-medium">{quote?.quote_number}</span>
                <span>•</span>
                <span>{quote?.client?.nome}</span>
              </div>
              <Button
                variant="gold"
                className="gap-2"
                onClick={handleCreateContract}
                disabled={createContract.isPending}
              >
                {createContract.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Criar Contrato</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[1fr,380px] gap-6">
            {/* Left - Editable Contract */}
            <div className="space-y-4">
              <Card className="h-[calc(100vh-140px)]">
                <CardContent className="h-full pt-4">
                  <ContractEditor
                    value={contractContent}
                    onChange={setContractContent}
                    cssValue={contractCss}
                    onCssChange={setContractCss}
                    previewContent={previewContent}
                    placeholder="Digite o conteúdo do contrato aqui..."
                    className="h-full"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right - Configurations & Placeholders */}
            <div className="space-y-4">
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="space-y-4 pr-4">
                  {/* Contract Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Informações do Orçamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Orçamento:</span>
                        <span className="font-medium">{quote?.quote_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-medium">{quote?.client?.nome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data do Evento:</span>
                        <span className="font-medium">{formatDate(quote?.data_evento)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Total:</span>
                        <span className="font-medium text-primary">{formatCurrency(Number(quote?.valor_total || 0))}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Data Configuration */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Configurações do Contrato
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {/* Client Data */}
                        <AccordionItem value="cliente">
                          <AccordionTrigger className="text-sm py-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Dados do Cliente
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pt-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Nome</Label>
                              <Input
                                value={dadosCliente.nome}
                                onChange={(e) => setDadosCliente(prev => ({ ...prev, nome: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CPF</Label>
                              <Input
                                value={dadosCliente.cpf || ""}
                                onChange={(e) => setDadosCliente(prev => ({ ...prev, cpf: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Telefone</Label>
                              <Input
                                value={dadosCliente.telefone}
                                onChange={(e) => setDadosCliente(prev => ({ ...prev, telefone: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Email</Label>
                              <Input
                                value={dadosCliente.email || ""}
                                onChange={(e) => setDadosCliente(prev => ({ ...prev, email: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Endereço</Label>
                              <Textarea
                                value={dadosCliente.endereco || ""}
                                onChange={(e) => setDadosCliente(prev => ({ ...prev, endereco: e.target.value }))}
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Event Data */}
                        <AccordionItem value="evento">
                          <AccordionTrigger className="text-sm py-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Dados do Evento
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pt-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Data do Evento</Label>
                              <Input
                                type="date"
                                value={dadosEvento.data_evento || ""}
                                onChange={(e) => setDadosEvento(prev => ({ ...prev, data_evento: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Tipo de Evento</Label>
                              <Input
                                value={dadosEvento.tipo_evento || ""}
                                onChange={(e) => setDadosEvento(prev => ({ ...prev, tipo_evento: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Nº de Convidados</Label>
                              <Input
                                type="number"
                                value={dadosEvento.n_convidados}
                                onChange={(e) => setDadosEvento(prev => ({ ...prev, n_convidados: Number(e.target.value) }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Pacote</Label>
                              <Input
                                value={dadosEvento.pacote_nome || ""}
                                onChange={(e) => setDadosEvento(prev => ({ ...prev, pacote_nome: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Payment Data */}
                        <AccordionItem value="pagamento">
                          <AccordionTrigger className="text-sm py-2">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Dados de Pagamento
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="p-2 bg-muted rounded">
                                <p className="text-xs text-muted-foreground">Valor Total</p>
                                <p className="font-medium text-primary">{formatCurrency(dadosPagamento.valor_total)}</p>
                              </div>
                              <div className="p-2 bg-muted rounded">
                                <p className="text-xs text-muted-foreground">Sinal ({dadosPagamento.percentual_sinal}%)</p>
                                <p className="font-medium">{formatCurrency(dadosPagamento.valor_sinal)}</p>
                              </div>
                            </div>
                            <div className="p-2 bg-muted rounded text-sm">
                              <p className="text-xs text-muted-foreground mb-1">Parcelas</p>
                              <p className="font-medium">{dadosPagamento.numero_parcelas}x</p>
                            </div>
                            {dadosPagamento.parcelas.length > 0 && (
                              <div className="text-xs bg-muted rounded p-2 space-y-1 max-h-32 overflow-y-auto">
                                {dadosPagamento.parcelas.map((parcela, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span>Parcela {parcela.numero}</span>
                                    <span>{formatCurrency(parcela.valor)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>

                        {/* Company Data */}
                        <AccordionItem value="empresa">
                          <AccordionTrigger className="text-sm py-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Dados da Empresa
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pt-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Razão Social</Label>
                              <Input
                                value={dadosEmpresa.nome || ""}
                                onChange={(e) => setDadosEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CNPJ</Label>
                              <Input
                                value={dadosEmpresa.cnpj || ""}
                                onChange={(e) => setDadosEmpresa(prev => ({ ...prev, cnpj: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Telefone</Label>
                              <Input
                                value={dadosEmpresa.telefone || ""}
                                onChange={(e) => setDadosEmpresa(prev => ({ ...prev, telefone: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Email</Label>
                              <Input
                                value={dadosEmpresa.email || ""}
                                onChange={(e) => setDadosEmpresa(prev => ({ ...prev, email: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Endereço</Label>
                              <Textarea
                                value={dadosEmpresa.endereco || ""}
                                onChange={(e) => setDadosEmpresa(prev => ({ ...prev, endereco: e.target.value }))}
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>

                  {/* Placeholders */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Placeholders Disponíveis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {PLACEHOLDER_CATEGORIES.map((category) => (
                          <AccordionItem key={category.label} value={category.label}>
                            <AccordionTrigger className="text-sm py-2">
                              {category.label}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-1 pt-1">
                              {category.placeholders.map((placeholder) => (
                                <button
                                  key={placeholder.key}
                                  onClick={() => handleCopyPlaceholder(placeholder.key)}
                                  className="w-full flex items-center justify-between p-2 rounded hover:bg-muted transition-colors text-left group"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{placeholder.label}</p>
                                    <code className="text-[10px] text-muted-foreground">{placeholder.key}</code>
                                  </div>
                                  {copiedPlaceholder === placeholder.key ? (
                                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                  )}
                                </button>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </SubscriptionGate>
  );
}

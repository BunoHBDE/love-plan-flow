import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SubscriptionGate } from "@/components/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  CreditCard,
  Building2,
  Eye,
  Loader2,
  Save,
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
import { replacePlaceholders, DEFAULT_CONTRACT_TEMPLATE } from "@/lib/contractPlaceholders";
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
  const [showPreview, setShowPreview] = useState(false);

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

  // Load quote data
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        toast.error("Orçamento não especificado");
        navigate("/contratos");
        return;
      }

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
  }, [quoteId, getQuoteById, navigate]);

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

  // Get template content
  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  const templateContent = useMemo(() => {
    return selectedTemplate?.conteudo || getDefaultContent() || DEFAULT_CONTRACT_TEMPLATE;
  }, [selectedTemplate, getDefaultContent]);

  // Preview with placeholders replaced
  const previewContent = useMemo(() => {
    const contractNumber = "NOVO-CONTRATO";
    return replacePlaceholders(
      templateContent,
      contractNumber,
      dadosCliente,
      dadosEvento,
      dadosPagamento,
      dadosEmpresa
    );
  }, [templateContent, dadosCliente, dadosEvento, dadosPagamento, dadosEmpresa]);

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
      modelo_contrato: templateContent,
    };

    createContract.mutate(contractData, {
      onSuccess: () => {
        navigate("/contratos");
      },
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SubscriptionGate>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/contratos")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  Novo Contrato
                </h1>
                <p className="text-sm text-muted-foreground">
                  Orçamento: {quote?.quote_number} • {quote?.client?.nome}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4" />
                {showPreview ? "Ocultar Preview" : "Ver Preview"}
              </Button>
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
                Criar Contrato
              </Button>
            </div>
          </div>

          <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
            {/* Form Section */}
            <div className="space-y-6">
              {/* Template Selection */}
              {templates.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5" />
                      Modelo de Contrato
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Usar modelo padrão" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.nome} {template.is_default && "(Padrão)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Client Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={dadosCliente.nome}
                        onChange={(e) => setDadosCliente(prev => ({ ...prev, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        value={dadosCliente.cpf || ""}
                        onChange={(e) => setDadosCliente(prev => ({ ...prev, cpf: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={dadosCliente.telefone}
                        onChange={(e) => setDadosCliente(prev => ({ ...prev, telefone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={dadosCliente.email || ""}
                        onChange={(e) => setDadosCliente(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Textarea
                      value={dadosCliente.endereco || ""}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, endereco: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Event Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Dados do Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data do Evento</Label>
                      <Input
                        type="date"
                        value={dadosEvento.data_evento || ""}
                        onChange={(e) => setDadosEvento(prev => ({ ...prev, data_evento: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Evento</Label>
                      <Input
                        value={dadosEvento.tipo_evento || ""}
                        onChange={(e) => setDadosEvento(prev => ({ ...prev, tipo_evento: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nº de Convidados</Label>
                      <Input
                        type="number"
                        value={dadosEvento.n_convidados}
                        onChange={(e) => setDadosEvento(prev => ({ ...prev, n_convidados: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pacote</Label>
                      <Input
                        value={dadosEvento.pacote_nome || ""}
                        onChange={(e) => setDadosEvento(prev => ({ ...prev, pacote_nome: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Dados de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="font-semibold text-primary">
                        {formatCurrency(dadosPagamento.valor_total)}
                      </p>
                    </div>
                    <div className="space-y-1 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Sinal ({dadosPagamento.percentual_sinal}%)</p>
                      <p className="font-semibold">
                        {formatCurrency(dadosPagamento.valor_sinal)}
                      </p>
                    </div>
                    <div className="space-y-1 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Parcelas</p>
                      <p className="font-semibold">
                        {dadosPagamento.numero_parcelas}x
                      </p>
                    </div>
                  </div>

                  {dadosPagamento.parcelas.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm">Detalhamento das Parcelas</Label>
                      <div className="mt-2 text-sm bg-muted rounded-lg p-3 space-y-1">
                        {dadosPagamento.parcelas.map((parcela, index) => (
                          <div key={index} className="flex justify-between">
                            <span>Parcela {parcela.numero}</span>
                            <span>{formatCurrency(parcela.valor)} - {formatDate(parcela.vencimento)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" />
                    Dados da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Razão Social</Label>
                      <Input
                        value={dadosEmpresa.nome || ""}
                        onChange={(e) => setDadosEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input
                        value={dadosEmpresa.cnpj || ""}
                        onChange={(e) => setDadosEmpresa(prev => ({ ...prev, cnpj: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={dadosEmpresa.telefone || ""}
                        onChange={(e) => setDadosEmpresa(prev => ({ ...prev, telefone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={dadosEmpresa.email || ""}
                        onChange={(e) => setDadosEmpresa(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Textarea
                      value={dadosEmpresa.endereco || ""}
                      onChange={(e) => setDadosEmpresa(prev => ({ ...prev, endereco: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <Card className="lg:sticky lg:top-4 h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5" />
                    Preview do Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-300px)] rounded-lg border p-4">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: previewContent.replace(/\n/g, '<br />') }}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SubscriptionGate>
    </MainLayout>
  );
}

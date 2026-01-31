/**
 * PÁGINA: Novo Orçamento (V2 - Simplificada)
 * 
 * Design no padrão ERP (Conta Azul, Bling):
 * - Formulário em página única
 * - Tabela de itens editável inline
 * - Pagamento com toggle padrão/customizado
 * - Menos campos obrigatórios
 */

import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  Search,
  User,
  Calendar,
  Users,
  Package,
  Home,
  UtensilsCrossed,
  Wrench,
  Gift,
  ChevronDown,
  ChevronUp,
  Percent,
  DollarSign,
  CreditCard,
  FileText,
  X,
  Loader2,
  Check,
  AlertCircle,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// TIPOS
// ============================================================================

type ItemType = 'espaco' | 'buffet' | 'servico' | 'pacote' | 'extra';
type PaymentMode = 'default' | 'custom';
type QuoteStatus = 'rascunho' | 'enviado';

interface QuoteItem {
  id: string;
  tipo: ItemType;
  nome: string;
  descricao?: string;
  quantidade: number;
  valorUnitario: number;
  unidade?: string;
}

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TIPOS_EVENTO = [
  { value: 'casamento', label: 'Casamento' },
  { value: 'debutante', label: 'Debutante' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'formatura', label: 'Formatura' },
  { value: 'outro', label: 'Outro' },
];

const ITEM_CONFIG: Record<ItemType, { icon: React.ElementType; label: string; color: string }> = {
  espaco: { icon: Home, label: 'Espaço', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  buffet: { icon: UtensilsCrossed, label: 'Buffet', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  servico: { icon: Wrench, label: 'Serviço', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  pacote: { icon: Package, label: 'Pacote', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  extra: { icon: Gift, label: 'Extra', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

// Mock de clientes para demonstração
const MOCK_CLIENTES: Cliente[] = [
  { id: '1', nome: 'Maria Silva', email: 'maria@email.com', telefone: '(11) 99999-0001' },
  { id: '2', nome: 'João Santos', email: 'joao@email.com', telefone: '(11) 99999-0002' },
  { id: '3', nome: 'Ana Oliveira', email: 'ana@email.com', telefone: '(11) 99999-0003' },
];

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function NovoOrcamentoV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // ============================================================================
  // ESTADO
  // ============================================================================
  
  // Status
  const [isSaving, setIsSaving] = useState(false);
  
  // Cliente
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteResults, setShowClienteResults] = useState(false);
  
  // Evento
  const [tipoEvento, setTipoEvento] = useState('');
  const [dataStatus, setDataStatus] = useState<'com_data' | 'sem_data'>('sem_data');
  const [dataEvento, setDataEvento] = useState('');
  const [nConvidados, setNConvidados] = useState<number>(0);
  
  // Itens
  const [itens, setItens] = useState<QuoteItem[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemDialogType, setItemDialogType] = useState<ItemType>('servico');
  
  // Desconto
  const [descontoTipo, setDescontoTipo] = useState<'percentual' | 'valor'>('percentual');
  const [descontoValor, setDescontoValor] = useState(0);
  
  // Pagamento
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('default');
  const [percentualSinal, setPercentualSinal] = useState(30);
  const [numeroParcelas, setNumeroParcelas] = useState(6);
  
  // Observações
  const [obsOpen, setObsOpen] = useState(false);
  const [observacoesInternas, setObservacoesInternas] = useState('');
  const [observacoesCliente, setObservacoesCliente] = useState('');
  
  // Validade
  const [validade, setValidade] = useState('30');

  // ============================================================================
  // CÁLCULOS
  // ============================================================================
  
  const totais = useMemo(() => {
    const subtotal = itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);
    const descontoCalculado = descontoTipo === 'percentual' 
      ? (subtotal * descontoValor / 100)
      : descontoValor;
    const total = Math.max(0, subtotal - descontoCalculado);
    const valorSinal = total * percentualSinal / 100;
    const saldoRestante = total - valorSinal;
    const valorParcela = numeroParcelas > 0 ? saldoRestante / numeroParcelas : 0;

    return {
      subtotal,
      desconto: descontoCalculado,
      total,
      valorSinal,
      saldoRestante,
      valorParcela,
    };
  }, [itens, descontoTipo, descontoValor, percentualSinal, numeroParcelas]);

  // Busca de clientes filtrada
  const clientesFiltrados = useMemo(() => {
    if (clienteSearch.length < 2) return [];
    const term = clienteSearch.toLowerCase();
    return MOCK_CLIENTES.filter(c => 
      c.nome.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [clienteSearch]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleSelectCliente = (c: Cliente) => {
    setCliente(c);
    setClienteSearch('');
    setShowClienteResults(false);
  };

  const handleAddItem = (tipo: ItemType) => {
    setItemDialogType(tipo);
    setItemDialogOpen(true);
  };

  const handleConfirmAddItem = (nome: string, valor: number, quantidade: number, unidade?: string) => {
    const newItem: QuoteItem = {
      id: generateId(),
      tipo: itemDialogType,
      nome,
      quantidade,
      valorUnitario: valor,
      unidade,
    };
    setItens(prev => [...prev, newItem]);
    setItemDialogOpen(false);
  };

  const handleRemoveItem = (id: string) => {
    setItens(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItemQtd = (id: string, qtd: number) => {
    setItens(prev => prev.map(item => 
      item.id === id ? { ...item, quantidade: qtd } : item
    ));
  };

  const handleSave = async (status: QuoteStatus) => {
    // Validações mínimas
    if (!cliente) {
      toast({
        title: 'Selecione um cliente',
        description: 'É necessário selecionar um cliente para salvar o orçamento.',
        variant: 'destructive',
      });
      return;
    }

    if (status === 'enviado' && itens.length === 0) {
      toast({
        title: 'Adicione itens',
        description: 'Adicione pelo menos um item para enviar o orçamento.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: status === 'rascunho' ? 'Rascunho salvo!' : 'Orçamento enviado!',
      description: status === 'rascunho' 
        ? 'O orçamento foi salvo como rascunho.'
        : 'O orçamento foi enviado para o cliente.',
    });
    
    setIsSaving(false);
    navigate('/orcamentos');
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        
        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/orcamentos')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Novo Orçamento</h1>
              <p className="text-sm text-muted-foreground">
                Preencha os dados para gerar uma proposta
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="text-sm">
            Rascunho
          </Badge>
        </div>

        {/* ================================================================ */}
        {/* CLIENTE */}
        {/* ================================================================ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cliente ? (
              // Cliente selecionado
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{cliente.nome}</p>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      {cliente.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {cliente.email}
                        </span>
                      )}
                      {cliente.telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cliente.telefone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCliente(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Busca de cliente
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nome ou email..."
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setShowClienteResults(e.target.value.length >= 2);
                  }}
                  className="pl-10"
                />
                
                {/* Dropdown de resultados */}
                {showClienteResults && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowClienteResults(false)} 
                    />
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
                      {clientesFiltrados.length > 0 ? (
                        <ul>
                          {clientesFiltrados.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                                onClick={() => handleSelectCliente(c)}
                              >
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{c.nome}</p>
                                  <p className="text-xs text-muted-foreground">{c.email}</p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Nenhum cliente encontrado
                          </p>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Criar novo cliente
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* EVENTO */}
        {/* ================================================================ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select value={tipoEvento} onValueChange={setTipoEvento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Convidados */}
              <div className="space-y-2">
                <Label>Nº de Convidados</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    value={nConvidados || ''}
                    onChange={(e) => setNConvidados(parseInt(e.target.value) || 0)}
                    placeholder="Ex: 150"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label>Data do Evento</Label>
                <Select 
                  value={dataStatus} 
                  onValueChange={(v) => setDataStatus(v as 'com_data' | 'sem_data')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_data">Sem data definida</SelectItem>
                    <SelectItem value="com_data">Data definida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campo de data (condicional) */}
            {dataStatus === 'com_data' && (
              <div className="max-w-xs">
                <Label className="text-sm text-muted-foreground">Data</Label>
                <Input
                  type="date"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* ITENS DO ORÇAMENTO */}
        {/* ================================================================ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens do Orçamento
              </CardTitle>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAddItem('espaco')}>
                    <Home className="h-4 w-4 mr-2" />
                    Espaço
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddItem('buffet')}>
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Buffet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddItem('servico')}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Serviço
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAddItem('pacote')}>
                    <Package className="h-4 w-4 mr-2" />
                    Pacote
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddItem('extra')}>
                    <Gift className="h-4 w-4 mr-2" />
                    Item Extra
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {itens.length === 0 ? (
              // Empty state
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-1">
                  Nenhum item adicionado
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Adicionar Item" para começar
                </p>
              </div>
            ) : (
              // Tabela de itens
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[100px]">Tipo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-[100px] text-right">Qtd</TableHead>
                      <TableHead className="w-[130px] text-right">Valor Unit.</TableHead>
                      <TableHead className="w-[130px] text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => {
                      const config = ITEM_CONFIG[item.tipo];
                      const Icon = config.icon;
                      const itemTotal = item.quantidade * item.valorUnitario;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                              config.color
                            )}>
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{item.nome}</p>
                            {item.unidade && (
                              <p className="text-xs text-muted-foreground">
                                Por {item.unidade}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantidade}
                              onChange={(e) => handleUpdateItemQtd(item.id, parseInt(e.target.value) || 1)}
                              className="w-20 h-8 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.valorUnitario)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(itemTotal)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* TOTAIS E DESCONTO */}
        {/* ================================================================ */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              {/* Desconto */}
              <div className="space-y-3">
                <Label>Desconto</Label>
                <div className="flex items-center gap-2">
                  <Select 
                    value={descontoTipo} 
                    onValueChange={(v) => setDescontoTipo(v as 'percentual' | 'valor')}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">%</SelectItem>
                      <SelectItem value="valor">R$</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    value={descontoValor || ''}
                    onChange={(e) => setDescontoValor(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-[120px]"
                  />
                </div>
              </div>

              {/* Resumo */}
              <div className="space-y-2 text-right min-w-[200px]">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatCurrency(totais.subtotal)}</span>
                </div>
                {totais.desconto > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span className="font-mono">-{formatCurrency(totais.desconto)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(totais.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* PAGAMENTO */}
        {/* ================================================================ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Condições de Pagamento
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {paymentMode === 'default' ? 'Padrão' : 'Personalizado'}
                </span>
                <Switch
                  checked={paymentMode === 'custom'}
                  onCheckedChange={(checked) => setPaymentMode(checked ? 'custom' : 'default')}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paymentMode === 'default' ? (
              // Modo padrão: resumo
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Usando condições padrão
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sinal</p>
                    <p className="font-medium">{percentualSinal}% ({formatCurrency(totais.valorSinal)})</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Parcelas</p>
                    <p className="font-medium">{numeroParcelas}x de {formatCurrency(totais.valorParcela)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dia de vencimento</p>
                    <p className="font-medium">Dia 10</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo restante</p>
                    <p className="font-medium">{formatCurrency(totais.saldoRestante)}</p>
                  </div>
                </div>
              </div>
            ) : (
              // Modo personalizado: campos editáveis
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Sinal (%)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={100}
                      value={percentualSinal}
                      onChange={(e) => setPercentualSinal(parseInt(e.target.value) || 10)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor: {formatCurrency(totais.valorSinal)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nº de Parcelas</Label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={numeroParcelas}
                      onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor: {formatCurrency(totais.valorParcela)} cada
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Saldo Restante</Label>
                    <Input
                      value={formatCurrency(totais.saldoRestante)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* OBSERVAÇÕES (COLAPSÁVEL) */}
        {/* ================================================================ */}
        <Collapsible open={obsOpen} onOpenChange={setObsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                    <span className="text-sm font-normal text-muted-foreground">(opcional)</span>
                  </CardTitle>
                  {obsOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <Label>Observações Internas</Label>
                  <Textarea
                    placeholder="Notas internas (não aparece no PDF)"
                    value={observacoesInternas}
                    onChange={(e) => setObservacoesInternas(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações para o Cliente</Label>
                  <Textarea
                    placeholder="Informações que aparecerão no orçamento"
                    value={observacoesCliente}
                    onChange={(e) => setObservacoesCliente(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ================================================================ */}
        {/* VALIDADE */}
        {/* ================================================================ */}
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap">Validade do orçamento:</Label>
          <Select value={validade} onValueChange={setValidade}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ================================================================ */}
        {/* AÇÕES (FIXED BOTTOM) */}
        {/* ================================================================ */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/orcamentos')}
            >
              Cancelar
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave('rascunho')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Rascunho
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Salvar e Enviar
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSave('enviado')}>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar por Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSave('enviado')}>
                    <Phone className="h-4 w-4 mr-2" />
                    Enviar por WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* DIALOG: ADICIONAR ITEM */}
        {/* ================================================================ */}
        <AddItemDialog
          open={itemDialogOpen}
          onOpenChange={setItemDialogOpen}
          tipo={itemDialogType}
          onConfirm={handleConfirmAddItem}
        />

      </div>
    </MainLayout>
  );
}

// ============================================================================
// COMPONENTE: Dialog para adicionar item
// ============================================================================

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: ItemType;
  onConfirm: (nome: string, valor: number, quantidade: number, unidade?: string) => void;
}

function AddItemDialog({ open, onOpenChange, tipo, onConfirm }: AddItemDialogProps) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [quantidade, setQuantidade] = useState(1);
  const [unidade, setUnidade] = useState('');

  const config = ITEM_CONFIG[tipo];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (!nome.trim() || valor <= 0) return;
    onConfirm(nome.trim(), valor, quantidade, unidade || undefined);
    // Reset
    setNome('');
    setValor(0);
    setQuantidade(1);
    setUnidade('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Adicionar {config.label}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do item para adicionar ao orçamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Item *</Label>
            <Input
              placeholder={`Ex: ${tipo === 'espaco' ? 'Salão Principal' : tipo === 'buffet' ? 'Buffet Completo' : 'Descrição do item'}`}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Unitário *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={valor || ''}
                  onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Unidade (opcional)</Label>
            <Input
              placeholder="Ex: pessoa, hora, unidade"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
            />
          </div>

          {valor > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total do item:</span>
                <span className="font-bold">
                  {formatCurrency(valor * quantidade)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!nome.trim() || valor <= 0}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
/**
 * COMPONENT: ServiceSettingsCard
 * Card para gerenciar serviços extras com preços
 * PADRÃO: Igual ao BuffetSettingsCard (lista + botão no header)
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, Edit, Trash2, X, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useServiceSettings } from "@/hooks/useServiceSettings";
import type { ServiceData, PrecoServico } from "@/types/serviceSettings.types";

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_NOME_LENGTH = 100;
const MAX_DESCRICAO_LENGTH = 500;
const MAX_VALOR_MONETARIO = 100000000;
const anoAtual = new Date().getFullYear();
const ANOS_DISPONIVEIS = Array.from({ length: 10 }, (_, i) => (anoAtual + i).toString());

const UNIDADES = [
  { value: "hora", label: "por Hora" },
  { value: "pessoa", label: "por Pessoa" },
  { value: "item", label: "por Item" },
  { value: "unidade", label: "por Unidade" },
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

const formatCurrency = (value: number): string => {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const parseCurrencyInput = (value: string): string => {
  const parsed = value.replace(/\D/g, '');
  return parsed || '0';
};

const formatCurrencyInput = (value: string): string => {
  if (!value || value === '0') return '';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '';
  const displayValue = numValue / 100;
  return displayValue.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ServiceSettingsCard() {
  const { toast } = useToast();
  const {
    services,
    isLoading,
    createService,
    updateService,
    deleteService,
    isCreating,
    isUpdating,
    isDeleting,
  } = useServiceSettings();

  // Estados do formulário
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ano, setAno] = useState(anoAtual.toString());
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoPreco, setTipoPreco] = useState<'fixo' | 'variavel'>('fixo');
  const [precoFixo, setPrecoFixo] = useState("0");
  const [valorInicial, setValorInicial] = useState("0");
  const [valorPorUnidade, setValorPorUnidade] = useState("0");
  const [unidade, setUnidade] = useState("hora");

  // Dialog de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setAno(anoAtual.toString());
    setNome("");
    setDescricao("");
    setTipoPreco('fixo');
    setPrecoFixo("0");
    setValorInicial("0");
    setValorPorUnidade("0");
    setUnidade("hora");
  };

  const startEdit = (service: ServiceData) => {
    setEditingId(service.id!);
    setIsAdding(true);
    setAno(service.ano);
    setNome(service.nome);
    setDescricao(service.descricao || "");
    
    if (service.precos.length > 0) {
      const preco = service.precos[0];
      setTipoPreco(preco.tipo);
      
      if (preco.tipo === 'fixo') {
        setPrecoFixo(((preco.preco_fixo || 0) * 100).toString());
      } else {
        setValorInicial(((preco.valor_inicial || 0) * 100).toString());
        setValorPorUnidade(((preco.valor_por_unidade || 0) * 100).toString());
        setUnidade(preco.unidade || "hora");
      }
    }
  };

  const confirmDelete = (id: string) => {
    setServiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (serviceToDelete) {
      deleteService(serviceToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setServiceToDelete(null);
        }
      });
    }
  };

  const handleSave = () => {
    if (!ano) {
      toast({ title: "Erro", description: "Selecione um ano", variant: "destructive" });
      return;
    }

    if (!nome.trim()) {
      toast({ title: "Erro", description: "Informe o nome do serviço", variant: "destructive" });
      return;
    }

    if (nome.length > MAX_NOME_LENGTH) {
      toast({ title: "Erro", description: `Nome muito longo (máx: ${MAX_NOME_LENGTH})`, variant: "destructive" });
      return;
    }

    if (descricao.length > MAX_DESCRICAO_LENGTH) {
      toast({ title: "Erro", description: `Descrição muito longa (máx: ${MAX_DESCRICAO_LENGTH})`, variant: "destructive" });
      return;
    }

    const novoPreco: PrecoServico = { tipo: tipoPreco };

    if (tipoPreco === 'fixo') {
      if (!precoFixo || precoFixo === '0') {
        toast({ title: "Erro", description: "Informe o preço fixo", variant: "destructive" });
        return;
      }
      const valorFixo = parseFloat(precoFixo) / 100;
      if (valorFixo <= 0) {
        toast({ title: "Erro", description: "O valor deve ser maior que R$ 0,00", variant: "destructive" });
        return;
      }
      if (valorFixo > MAX_VALOR_MONETARIO) {
        toast({ title: "Erro", description: "Valor muito alto", variant: "destructive" });
        return;
      }
      novoPreco.preco_fixo = valorFixo;
    } else {
      if (!valorPorUnidade || valorPorUnidade === '0') {
        toast({ title: "Erro", description: "Informe o valor por unidade", variant: "destructive" });
        return;
      }
      
      const valPorUnidade = parseFloat(valorPorUnidade) / 100;
      
      if (valPorUnidade <= 0) {
        toast({ title: "Erro", description: "Valor por unidade deve ser maior que R$ 0,00", variant: "destructive" });
        return;
      }
      if (valPorUnidade > MAX_VALOR_MONETARIO) {
        toast({ title: "Erro", description: "Valor muito alto", variant: "destructive" });
        return;
      }
      
      const valInicial = valorInicial && valorInicial !== '0' 
        ? parseFloat(valorInicial) / 100 
        : 0;
      
      if (valInicial > MAX_VALOR_MONETARIO) {
        toast({ title: "Erro", description: "Valor muito alto", variant: "destructive" });
        return;
      }
      
      novoPreco.valor_inicial = valInicial;
      novoPreco.valor_por_unidade = valPorUnidade;
      novoPreco.unidade = unidade;
    }

    const serviceData = {
      ano,
      nome: nome.trim(),
      precos: [novoPreco],
      descricao: descricao.trim() || undefined,
    };

    if (editingId) {
      updateService({ id: editingId, ...serviceData }, {
        onSuccess: resetForm
      });
    } else {
      createService(serviceData, {
        onSuccess: resetForm
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Wrench className="h-5 w-5 text-primary" />
                Configuração de Serviços
              </CardTitle>
              <CardDescription className="mt-1">
                Defina serviços extras e preços
              </CardDescription>
            </div>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Lista de Serviços */}
          {services.length > 0 && !isAdding && (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{service.nome}</h4>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                        {service.ano}
                      </span>
                    </div>
                    
                    {service.precos.map((preco, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        {preco.tipo === 'fixo' ? (
                          <span>{formatCurrency(preco.preco_fixo || 0)}</span>
                        ) : (
                          <span>
                            {preco.valor_inicial && preco.valor_inicial > 0 
                              ? `${formatCurrency(preco.valor_inicial)} + ` 
                              : ''}
                            {formatCurrency(preco.valor_por_unidade || 0)} {preco.unidade ? `por ${preco.unidade}` : ''}
                          </span>
                        )}
                      </div>
                    ))}

                    {service.descricao && (
                      <div className="text-xs text-muted-foreground">
                        {service.descricao}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(service)}
                      disabled={isCreating || isUpdating || isDeleting}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(service.id!)}
                      disabled={isCreating || isUpdating || isDeleting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulário */}
          {isAdding && (
            <div className="space-y-6 p-6 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingId ? "Editar Serviço" : "Novo Serviço"}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  disabled={isCreating || isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ano *</Label>
                  <Select value={ano} onValueChange={setAno} disabled={isCreating || isUpdating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANOS_DISPONIVEIS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nome do Serviço *</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Fotógrafo, DJ, Decoração"
                    maxLength={MAX_NOME_LENGTH}
                    disabled={isCreating || isUpdating}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {nome.length}/{MAX_NOME_LENGTH}
                  </p>
                </div>
              </div>

              <div>
                <Label>Descrição (Opcional)</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva os detalhes do serviço..."
                  maxLength={MAX_DESCRICAO_LENGTH}
                  disabled={isCreating || isUpdating}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {descricao.length}/{MAX_DESCRICAO_LENGTH}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Preço</Label>
                <RadioGroup 
                  value={tipoPreco} 
                  onValueChange={(value) => setTipoPreco(value as 'fixo' | 'variavel')}
                  disabled={isCreating || isUpdating}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixo" id="tipo-fixo" />
                    <Label htmlFor="tipo-fixo">Preço Fixo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="variavel" id="tipo-variavel" />
                    <Label htmlFor="tipo-variavel">Preço Variável (por unidade)</Label>
                  </div>
                </RadioGroup>
              </div>

              {tipoPreco === 'fixo' ? (
                <div>
                  <Label>Valor Fixo *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input 
                      type="text"
                      value={formatCurrencyInput(precoFixo)} 
                      onChange={(e) => setPrecoFixo(parseCurrencyInput(e.target.value))} 
                      placeholder="500,00"
                      className="pl-10"
                      disabled={isCreating || isUpdating}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Inicial (Opcional)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input 
                          type="text"
                          value={formatCurrencyInput(valorInicial)} 
                          onChange={(e) => setValorInicial(parseCurrencyInput(e.target.value))} 
                          placeholder="0,00"
                          className="pl-10"
                          disabled={isCreating || isUpdating}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Deixe vazio se não houver
                      </p>
                    </div>
                    <div>
                      <Label>Valor por Unidade *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input 
                          type="text"
                          value={formatCurrencyInput(valorPorUnidade)} 
                          onChange={(e) => setValorPorUnidade(parseCurrencyInput(e.target.value))} 
                          placeholder="50,00"
                          className="pl-10"
                          disabled={isCreating || isUpdating}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Unidade de Cobrança *</Label>
                    <Select value={unidade} onValueChange={setUnidade} disabled={isCreating || isUpdating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isCreating || isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isCreating || isUpdating}
                >
                  {(isCreating || isUpdating) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingId ? "Atualizar" : "Salvar"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
/**
 * COMPONENT: BuffetSettingsCard
 * Card para gerenciar opções de buffet com preços por pessoa
 * PADRÃO: Igual ao SpaceSettingsCard (lista + botão embaixo)
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Loader2, Edit, Trash2, X, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBuffetSettings } from "@/hooks/useBuffetSettings";
import type { BuffetData, PrecoPessoa } from "@/types/buffetSettings.types";

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_NOME_LENGTH = 100;
const MAX_ITEM_LENGTH = 200;
const MAX_VALOR_MONETARIO = 100000000;
const anoAtual = new Date().getFullYear();
const ANOS_DISPONIVEIS = Array.from({ length: 10 }, (_, i) => (anoAtual + i).toString());

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

export function BuffetSettingsCard() {
  const { toast } = useToast();
  const {
    buffets,
    isLoading,
    createBuffet,
    updateBuffet,
    deleteBuffet,
    isCreating,
    isUpdating,
    isDeleting,
  } = useBuffetSettings();

  // Estados do formulário
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ano, setAno] = useState(anoAtual.toString());
  const [nome, setNome] = useState("");
  const [tipoPreco, setTipoPreco] = useState<'fixo' | 'variavel'>('fixo');
  const [precoFixo, setPrecoFixo] = useState("0");
  const [valorInicial, setValorInicial] = useState("0");
  const [valorPorPessoa, setValorPorPessoa] = useState("0");
  const [itensInclusos, setItensInclusos] = useState<string[]>([]);
  const [novoItem, setNovoItem] = useState("");

  // Dialog de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buffetToDelete, setBuffetToDelete] = useState<string | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setAno(anoAtual.toString());
    setNome("");
    setTipoPreco('fixo');
    setPrecoFixo("0");
    setValorInicial("0");
    setValorPorPessoa("0");
    setItensInclusos([]);
    setNovoItem("");
  };

  const startEdit = (buffet: BuffetData) => {
    setEditingId(buffet.id!);
    setIsAdding(true);
    setAno(buffet.ano);
    setNome(buffet.nome);
    setItensInclusos(buffet.itens_inclusos);
    
    if (buffet.precos_por_pessoa.length > 0) {
      const preco = buffet.precos_por_pessoa[0];
      setTipoPreco(preco.tipo);
      
      if (preco.tipo === 'fixo') {
        setPrecoFixo(((preco.preco_fixo || 0) * 100).toString());
      } else {
        setValorInicial(((preco.valor_inicial || 0) * 100).toString());
        setValorPorPessoa(((preco.valor_por_pessoa || 0) * 100).toString());
      }
    }
  };

  const confirmDelete = (id: string) => {
    setBuffetToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (buffetToDelete) {
      deleteBuffet(buffetToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setBuffetToDelete(null);
        }
      });
    }
  };

  const addItemIncluso = () => {
    const item = novoItem.trim();
    if (item && !itensInclusos.includes(item)) {
      setItensInclusos([...itensInclusos, item]);
      setNovoItem("");
    }
  };

  const removeItemIncluso = (index: number) => {
    setItensInclusos(itensInclusos.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!ano) {
      toast({ title: "Erro", description: "Selecione um ano", variant: "destructive" });
      return;
    }

    if (!nome.trim()) {
      toast({ title: "Erro", description: "Informe o nome do buffet", variant: "destructive" });
      return;
    }

    if (nome.length > MAX_NOME_LENGTH) {
      toast({ title: "Erro", description: `Nome muito longo (máx: ${MAX_NOME_LENGTH})`, variant: "destructive" });
      return;
    }

    const novoPreco: PrecoPessoa = { tipo: tipoPreco };

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
      if (!valorPorPessoa || valorPorPessoa === '0') {
        toast({ title: "Erro", description: "Informe o valor por pessoa", variant: "destructive" });
        return;
      }
      
      const valPorPessoa = parseFloat(valorPorPessoa) / 100;
      
      if (valPorPessoa <= 0) {
        toast({ title: "Erro", description: "Valor por pessoa deve ser maior que R$ 0,00", variant: "destructive" });
        return;
      }
      if (valPorPessoa > MAX_VALOR_MONETARIO) {
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
      novoPreco.valor_por_pessoa = valPorPessoa;
    }

    const buffetData = {
      ano,
      nome: nome.trim(),
      precos_por_pessoa: [novoPreco],
      itens_inclusos: itensInclusos,
    };

    if (editingId) {
      updateBuffet({ id: editingId, ...buffetData }, {
        onSuccess: resetForm
      });
    } else {
      createBuffet(buffetData, {
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
            <UtensilsCrossed className="h-5 w-5" />
            Buffets
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
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Configuração de Buffet
              </CardTitle>
              <CardDescription className="mt-1">
                Defina preços por pessoa e itens inclusos
              </CardDescription>
            </div>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Buffet
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Lista de Buffets */}
          {buffets.length > 0 && !isAdding && (
            <div className="space-y-4">
              {buffets.map((buffet) => (
                  <div
                    key={buffet.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{buffet.nome}</h4>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                          {buffet.ano}
                        </span>
                      </div>
                      
                      {buffet.precos_por_pessoa.map((preco, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground">
                          {preco.tipo === 'fixo' ? (
                            <span>{formatCurrency(preco.preco_fixo || 0)} por pessoa</span>
                          ) : (
                            <span>
                              {preco.valor_inicial && preco.valor_inicial > 0 
                                ? `${formatCurrency(preco.valor_inicial)} + ` 
                                : ''}
                              {formatCurrency(preco.valor_por_pessoa || 0)} por pessoa
                            </span>
                          )}
                        </div>
                      ))}

                      {buffet.itens_inclusos.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Inclui: {buffet.itens_inclusos.join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(buffet)}
                        disabled={isCreating || isUpdating || isDeleting}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(buffet.id!)}
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
                  {editingId ? "Editar Buffet" : "Novo Buffet"}
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
                  <Label>Nome do Buffet *</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Buffet Completo"
                    maxLength={MAX_NOME_LENGTH}
                    disabled={isCreating || isUpdating}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {nome.length}/{MAX_NOME_LENGTH}
                  </p>
                </div>
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
                    <Label htmlFor="tipo-fixo">Preço Fixo por Pessoa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="variavel" id="tipo-variavel" />
                    <Label htmlFor="tipo-variavel">Preço Variável</Label>
                  </div>
                </RadioGroup>
              </div>

              {tipoPreco === 'fixo' ? (
                <div>
                  <Label>Valor Fixo por Pessoa *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input 
                      type="text"
                      value={formatCurrencyInput(precoFixo)} 
                      onChange={(e) => setPrecoFixo(parseCurrencyInput(e.target.value))} 
                      placeholder="89,00"
                      className="pl-10"
                      disabled={isCreating || isUpdating}
                    />
                  </div>
                </div>
              ) : (
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
                    <Label>Valor por Pessoa *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input 
                        type="text"
                        value={formatCurrencyInput(valorPorPessoa)} 
                        onChange={(e) => setValorPorPessoa(parseCurrencyInput(e.target.value))} 
                        placeholder="75,00"
                        className="pl-10"
                        disabled={isCreating || isUpdating}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Itens Inclusos (Opcional)</Label>
                
                {itensInclusos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {itensInclusos.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm"
                      >
                        <span>{item}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeItemIncluso(index)}
                          disabled={isCreating || isUpdating}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Arroz, Feijão, Saladas..."
                    value={novoItem}
                    onChange={(e) => setNovoItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItemIncluso();
                      }
                    }}
                    maxLength={MAX_ITEM_LENGTH}
                    disabled={isCreating || isUpdating}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addItemIncluso}
                    disabled={!novoItem.trim() || isCreating || isUpdating}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {novoItem.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {MAX_ITEM_LENGTH - novoItem.length} caracteres restantes
                  </p>
                )}
              </div>

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
              Tem certeza que deseja excluir este buffet? Esta ação não pode ser desfeita.
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
/**
 * COMPONENTE: SpaceSettingsCard
 * Configuração de preços de espaço com backend integrado
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Building2, Pencil, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useSpaceSettings } from "@/hooks/useSpaceSettings";
import type { SpaceData, CreateSpaceData, PrecoDia } from "@/types/spaceSettings.types";

// Gerar lista dos próximos 10 anos
const anoAtual = new Date().getFullYear();
const ANOS_DISPONIVEIS = Array.from({ length: 10 }, (_, i) => (anoAtual + i).toString());

// Dias da semana
const DIAS_SEMANA = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
  "Feriado",
];

// Constantes
const MAX_NOME_LENGTH = 100;
const MAX_ITEM_LENGTH = 200;
const MAX_VALOR_MONETARIO = 100000000; // R$ 1.000.000,00

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Função para formatar input de moeda (remove formatação para número)
const parseCurrencyInput = (value: string): string => {
  const parsed = value.replace(/\D/g, '');
  return parsed || '0';
};

// Função para formatar display de moeda no input
const formatCurrencyInput = (value: string): string => {
  if (!value || value === '0') return '';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '';
  const displayValue = numValue / 100;
  return displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function SpaceSettingsCard() {
  const { toast } = useToast();
  
  // Hook do backend
  const {
    spaces,
    isLoading,
    createSpace,
    updateSpace,
    deleteSpace,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSpaceSettings();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado para Dialog de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SpaceData>({
    ano: new Date().getFullYear().toString(),
    nome: "",
    precos_por_dia: [],
    itens_inclusos: [],
  });
  
  // Estados para adicionar novo preço
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [tipoPreco, setTipoPreco] = useState<'fixo' | 'variavel'>('fixo');
  const [precoFixo, setPrecoFixo] = useState<string>("");
  const [valorInicial, setValorInicial] = useState<string>("");
  const [valorPorConvidado, setValorPorConvidado] = useState<string>("");
  const [newItem, setNewItem] = useState("");

  const resetForm = () => {
    setFormData({
      ano: new Date().getFullYear().toString(),
      nome: "",
      precos_por_dia: [],
      itens_inclusos: [],
    });
    resetNovoDiaForm();
    setNewItem("");
    setIsAdding(false);
    setEditingId(null);
  };

  const resetNovoDiaForm = () => {
    setDiasSelecionados([]);
    setTipoPreco('fixo');
    setPrecoFixo("");
    setValorInicial("");
    setValorPorConvidado("");
  };

  const handleEdit = (space: SpaceData) => {
    setFormData({
      ano: space.ano,
      nome: space.nome,
      precos_por_dia: [...space.precos_por_dia],
      itens_inclusos: [...space.itens_inclusos],
    });
    setEditingId(space.id || null);
    setIsAdding(true);
    // Limpar formulário de adicionar preço
    resetNovoDiaForm();
  };

  const handleSubmit = () => {
    if (!formData.ano.trim()) {
      toast({ title: "Erro", description: "Ano é obrigatório", variant: "destructive" });
      return;
    }
    if (!formData.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (formData.nome.length > MAX_NOME_LENGTH) {
      toast({ title: "Erro", description: `Nome deve ter no máximo ${MAX_NOME_LENGTH} caracteres`, variant: "destructive" });
      return;
    }
    if (formData.precos_por_dia.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um preço", variant: "destructive" });
      return;
    }

    // Validar nome duplicado (nome + ano único)
    const nomeDuplicado = spaces.some(s => 
      s.id !== editingId && 
      s.nome.toLowerCase() === formData.nome.toLowerCase() && 
      s.ano === formData.ano
    );
    
    if (nomeDuplicado) {
      toast({ 
        title: "Erro", 
        description: `Já existe um espaço chamado "${formData.nome}" para o ano ${formData.ano}`,
        variant: "destructive" 
      });
      return;
    }

    const spaceData: CreateSpaceData = {
      ano: formData.ano,
      nome: formData.nome,
      precos_por_dia: formData.precos_por_dia,
      itens_inclusos: formData.itens_inclusos,
    };

    if (editingId) {
      updateSpace(
        { id: editingId, ...spaceData },
        {
          onSuccess: () => resetForm(),
        }
      );
    } else {
      createSpace(spaceData, {
        onSuccess: () => resetForm(),
      });
    }
  };

  const handleDelete = (id: string) => {
    setSpaceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (spaceToDelete) {
      deleteSpace(spaceToDelete);
      setSpaceToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const toggleDia = (dia: string) => {
    setDiasSelecionados(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const obterDiasJaUsados = (): string[] => {
    return formData.precos_por_dia.flatMap(p => p.dias);
  };

  const verificarConflito = (dia: string): boolean => {
    return obterDiasJaUsados().includes(dia);
  };

  const adicionarPrecoDia = () => {
    if (diasSelecionados.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um dia", variant: "destructive" });
      return;
    }

    // Verificar conflitos
    const conflitos = diasSelecionados.filter(d => verificarConflito(d));
    if (conflitos.length > 0) {
      toast({ 
        title: "Conflito de dias!", 
        description: `Os dias ${conflitos.join(", ")} já possuem preço definido.`,
        variant: "destructive" 
      });
      return;
    }

    const novoPreco: PrecoDia = {
      dias: [...diasSelecionados],
      tipo: tipoPreco,
    };

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
        toast({ title: "Erro", description: "O valor é muito alto. Máximo: R$ 1.000.000,00", variant: "destructive" });
        return;
      }
      novoPreco.preco_fixo = valorFixo;
    } else {
      // Validar valor por convidado (obrigatório e > 0)
      if (!valorPorConvidado || valorPorConvidado === '0') {
        toast({ title: "Erro", description: "Informe o valor por convidado", variant: "destructive" });
        return;
      }
      
      const valPorConvidado = parseFloat(valorPorConvidado) / 100;
      
      if (valPorConvidado <= 0) {
        toast({ title: "Erro", description: "O valor por convidado deve ser maior que R$ 0,00", variant: "destructive" });
        return;
      }
      if (valPorConvidado > MAX_VALOR_MONETARIO) {
        toast({ title: "Erro", description: "Valor muito alto. Máximo: R$ 1.000.000,00", variant: "destructive" });
        return;
      }
      
      // Valor inicial pode ser vazio ou 0 (opcional)
      const valInicial = valorInicial && valorInicial !== '0' 
        ? parseFloat(valorInicial) / 100 
        : 0;
      
      if (valInicial > MAX_VALOR_MONETARIO) {
        toast({ title: "Erro", description: "Valor muito alto. Máximo: R$ 1.000.000,00", variant: "destructive" });
        return;
      }
      
      novoPreco.valor_inicial = valInicial;
      novoPreco.valor_por_convidado = valPorConvidado;
    }

    setFormData(prev => ({
      ...prev,
      precos_por_dia: [...prev.precos_por_dia, novoPreco],
    }));

    resetNovoDiaForm();
    toast({ title: "Preço adicionado!" });
  };

  const removerPrecoDia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      precos_por_dia: prev.precos_por_dia.filter((_, i) => i !== index),
    }));
  };

  const addItem = () => {
    const trimmedItem = newItem.trim();
    if (!trimmedItem) return;
    
    if (trimmedItem.length > MAX_ITEM_LENGTH) {
      toast({ 
        title: "Erro", 
        description: `O item deve ter no máximo ${MAX_ITEM_LENGTH} caracteres`,
        variant: "destructive" 
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      itens_inclusos: [...prev.itens_inclusos, trimmedItem],
    }));
    setNewItem("");
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens_inclusos: prev.itens_inclusos.filter((_, i) => i !== index),
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Building2 className="h-5 w-5 text-primary" />
              Configuração de Espaço
            </CardTitle>
            <CardDescription className="mt-1">
              Defina preços por dia da semana e feriados
            </CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Espaço
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Lista */}
        {!isAdding && spaces.length > 0 && (
          <div className="space-y-4">
            {spaces.map((space) => (
              <div key={space.id} className="border rounded-lg p-3 sm:p-4 space-y-3 hover:bg-muted/50 transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base sm:text-lg">{space.nome} - {space.ano}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(space)}>
                      <Pencil className="h-4 w-4" />
                      <span className="ml-2 sm:hidden">Editar</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(space.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="ml-2 sm:hidden">Excluir</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Preços:</p>
                  {space.precos_por_dia.map((preco, idx) => (
                    <div key={idx} className="text-xs sm:text-sm bg-muted/50 rounded p-2">
                      <span className="font-medium break-words">{preco.dias.join(", ")}:</span>{" "}
                      {preco.tipo === 'fixo' ? (
                        <span className="whitespace-nowrap">{formatCurrency(preco.preco_fixo || 0)}</span>
                      ) : (
                        <span className="whitespace-nowrap">{formatCurrency(preco.valor_inicial || 0)} + {formatCurrency(preco.valor_por_convidado || 0)}/convidado</span>
                      )}
                    </div>
                  ))}
                </div>

                {space.itens_inclusos.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Itens Inclusos:</p>
                    <ul className="text-xs sm:text-sm text-muted-foreground list-disc list-inside space-y-1">
                      {space.itens_inclusos.map((item, idx) => <li key={idx} className="break-words">{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulário */}
        {isAdding && (
          <div className="border rounded-lg p-4 sm:p-6 space-y-6 bg-muted/20">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base sm:text-lg font-semibold">{editingId ? "Editar Espaço" : "Novo Espaço"}</h3>
              <Button variant="ghost" size="sm" onClick={resetForm} disabled={isCreating || isUpdating}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Ano e Nome */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <Label>Ano *</Label>
                <Select 
                  value={formData.ano} 
                  onValueChange={(value) => setFormData({ ...formData, ano: value })}
                  disabled={isCreating || isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANOS_DISPONIVEIS.map((ano) => (
                      <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Nome do Espaço *</Label>
                <Input 
                  value={formData.nome} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                  placeholder="Ex: Salão Principal"
                  maxLength={MAX_NOME_LENGTH}
                  disabled={isCreating || isUpdating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.nome.length}/{MAX_NOME_LENGTH} caracteres
                </p>
              </div>
            </div>

            {/* Preços por Dia */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Preços por Dia da Semana</h4>

              {/* Lista de preços adicionados */}
              {formData.precos_por_dia.length > 0 && (
                <div className="space-y-2">
                  {formData.precos_por_dia.map((preco, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted rounded-md p-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm break-words">{preco.dias.join(", ")}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {preco.tipo === 'fixo' ? (
                            <>{formatCurrency(preco.preco_fixo || 0)}</>
                          ) : (
                            <>{formatCurrency(preco.valor_inicial || 0)} + {formatCurrency(preco.valor_por_convidado || 0)}/convidado</>
                          )}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removerPrecoDia(index)} 
                        className="self-end sm:self-auto"
                        disabled={isCreating || isUpdating}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário para adicionar novo preço */}
              <div className="border rounded-lg p-4 space-y-4 bg-background">
                <p className="text-sm font-medium">Adicionar Preço</p>

                {/* Seleção de Dias com Checkboxes */}
                <div className="space-y-3">
                  <Label>Selecione os dias</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {DIAS_SEMANA.map((dia) => {
                      const jaUsado = verificarConflito(dia);
                      const selecionado = diasSelecionados.includes(dia);
                      
                      return (
                        <div 
                          key={dia} 
                          className={`flex items-center space-x-2 p-3 rounded-md border transition ${
                            jaUsado 
                              ? 'bg-muted/50 opacity-50 cursor-not-allowed' 
                              : selecionado
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50 cursor-pointer'
                          }`}
                          onClick={() => !jaUsado && !isCreating && !isUpdating && toggleDia(dia)}
                        >
                          <Checkbox
                            id={dia}
                            checked={selecionado}
                            onCheckedChange={() => !jaUsado && !isCreating && !isUpdating && toggleDia(dia)}
                            disabled={jaUsado || isCreating || isUpdating}
                          />
                          <Label 
                            htmlFor={dia} 
                            className={`flex-1 cursor-pointer text-sm ${jaUsado ? 'cursor-not-allowed' : ''}`}
                          >
                            {dia}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {diasSelecionados.length > 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      Selecionados: {diasSelecionados.join(", ")}
                    </p>
                  )}
                </div>

                {/* Tipo de Preço */}
                <div className="space-y-2">
                  <Label>Tipo de Preço</Label>
                  <RadioGroup 
                    value={tipoPreco} 
                    onValueChange={(value: 'fixo' | 'variavel') => setTipoPreco(value)}
                    disabled={isCreating || isUpdating}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixo" id="tipo-fixo" disabled={isCreating || isUpdating} />
                      <Label htmlFor="tipo-fixo">Preço Fixo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="variavel" id="tipo-variavel" disabled={isCreating || isUpdating} />
                      <Label htmlFor="tipo-variavel">Preço Variável (por convidado)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Campos de Preço */}
                {tipoPreco === 'fixo' ? (
                  <div>
                    <Label>Valor Fixo *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input 
                        type="text"
                        value={formatCurrencyInput(precoFixo)} 
                        onChange={(e) => setPrecoFixo(parseCurrencyInput(e.target.value))} 
                        placeholder="8.900,00"
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
                        Deixe vazio ou R$ 0,00 se não houver
                      </p>
                    </div>
                    <div>
                      <Label>Valor por Convidado *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input 
                          type="text"
                          value={formatCurrencyInput(valorPorConvidado)} 
                          onChange={(e) => setValorPorConvidado(parseCurrencyInput(e.target.value))} 
                          placeholder="35,00"
                          className="pl-10"
                          disabled={isCreating || isUpdating}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="button" 
                  onClick={adicionarPrecoDia} 
                  className="w-full"
                  disabled={diasSelecionados.length === 0 || isCreating || isUpdating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Preço
                </Button>
              </div>
            </div>

            {/* Itens Inclusos */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Itens Inclusos no Espaço</h4>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input 
                      value={newItem} 
                      onChange={(e) => setNewItem(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())} 
                      placeholder="Ex: Mesas e cadeiras para até 150 convidados"
                      maxLength={MAX_ITEM_LENGTH}
                      disabled={isCreating || isUpdating}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {newItem.length}/{MAX_ITEM_LENGTH} caracteres
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addItem} 
                    variant="outline"
                    disabled={isCreating || isUpdating}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {formData.itens_inclusos.length > 0 && (
                <ul className="space-y-2">
                  {formData.itens_inclusos.map((item, index) => (
                    <li key={index} className="flex items-start sm:items-center justify-between bg-muted rounded-md p-2 gap-2">
                      <span className="text-xs sm:text-sm break-words flex-1 min-w-0">{item}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeItem(index)} 
                        className="shrink-0"
                        disabled={isCreating || isUpdating}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={resetForm} 
                className="w-full sm:w-auto"
                disabled={isCreating || isUpdating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="w-full sm:w-auto"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingId ? "Atualizando..." : "Criando..."}
                  </>
                ) : (
                  <>{editingId ? "Atualizar" : "Criar"} Espaço</>
                )}
              </Button>
            </div>
          </div>
        )}

        {!isAdding && spaces.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum espaço configurado ainda.</p>
            <p className="text-sm mt-2">Clique em "Adicionar Espaço" para começar.</p>
          </div>
        )}
      </CardContent>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este espaço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
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
    </Card>
  );
}
/**
 * COMPONENT: PackageSettingsCard
 * Card para gerenciar pacotes que combinam espaço, buffet e serviços
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Loader2, Edit, Trash2, X, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePackageSettings } from "@/hooks/usePackageSettings";
import { useSpaceSettings } from "@/hooks/useSpaceSettings";
import { useBuffetSettings } from "@/hooks/useBuffetSettings";
import { useServiceSettings } from "@/hooks/useServiceSettings";
import type { PackageData, ItensPacote } from "@/types/packageSettings.types";

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_NOME_LENGTH = 100;
const MAX_DESCRICAO_LENGTH = 500;
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

const formatPercentage = (value: number): string => {
  return `${value.toFixed(0)}%`;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PackageSettingsCard() {
  const { toast } = useToast();
  
  // Hooks de dados
  const {
    packages,
    isLoading: isLoadingPackages,
    createPackage,
    updatePackage,
    deletePackage,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePackageSettings();

  const { spaces, isLoading: isLoadingSpaces } = useSpaceSettings();
  const { buffets, isLoading: isLoadingBuffets } = useBuffetSettings();
  const { services, isLoading: isLoadingServices } = useServiceSettings();

  // Estados do formulário
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ano, setAno] = useState(anoAtual.toString());
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  
  // Itens selecionados
  const [selectedEspacos, setSelectedEspacos] = useState<string[]>([]);
  const [selectedBuffets, setSelectedBuffets] = useState<string[]>([]);
  const [selectedServicos, setSelectedServicos] = useState<string[]>([]);
  
  // Preços
  const [precoBase, setPrecoBase] = useState(0);
  const [descontoPercentual, setDescontoPercentual] = useState(0);
  const [precoFinal, setPrecoFinal] = useState(0);

  // Dialog de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);

  // ============================================================================
  // EFEITO: Calcular preço base automaticamente
  // ============================================================================

  useEffect(() => {
    let total = 0;
    
    // Somar espaços selecionados
    selectedEspacos.forEach(id => {
      const espaco = spaces.find(s => s.id === id);
      if (espaco && espaco.precos_por_dia.length > 0) {
        // Pega o primeiro preço como referência
        const preco = espaco.precos_por_dia[0];
        if (preco.tipo === 'fixo') {
          total += preco.preco_fixo || 0;
        } else {
          total += (preco.valor_inicial || 0);
        }
      }
    });
    
    // Somar buffets selecionados
    selectedBuffets.forEach(id => {
      const buffet = buffets.find(b => b.id === id);
      if (buffet && buffet.precos_por_pessoa.length > 0) {
        const preco = buffet.precos_por_pessoa[0];
        if (preco.tipo === 'fixo') {
          total += preco.preco_fixo || 0;
        } else {
          total += (preco.valor_inicial || 0);
        }
      }
    });
    
    // Somar serviços selecionados
    selectedServicos.forEach(id => {
      const servico = services.find(s => s.id === id);
      if (servico && servico.precos.length > 0) {
        const preco = servico.precos[0];
        if (preco.tipo === 'fixo') {
          total += preco.preco_fixo || 0;
        } else {
          total += (preco.valor_inicial || 0);
        }
      }
    });
    
    setPrecoBase(total);
  }, [selectedEspacos, selectedBuffets, selectedServicos, spaces, buffets, services]);

  // ============================================================================
  // EFEITO: Calcular preço final quando muda desconto
  // ============================================================================

  useEffect(() => {
    const desconto = (precoBase * descontoPercentual) / 100;
    setPrecoFinal(precoBase - desconto);
  }, [precoBase, descontoPercentual]);
  // ============================================================================
  // HANDLERS
  // ============================================================================

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setAno(anoAtual.toString());
    setNome("");
    setDescricao("");
    setSelectedEspacos([]);
    setSelectedBuffets([]);
    setSelectedServicos([]);
    setPrecoBase(0);
    setDescontoPercentual(0);
    setPrecoFinal(0);
  };

  const startEdit = (pkg: PackageData) => {
    setEditingId(pkg.id!);
    setIsAdding(true);
    setAno(pkg.ano);
    setNome(pkg.nome);
    setDescricao(pkg.descricao || "");
    setSelectedEspacos(pkg.itens_pacote.espacos);
    setSelectedBuffets(pkg.itens_pacote.buffets);
    setSelectedServicos(pkg.itens_pacote.servicos);
    setPrecoBase(pkg.preco_base);
    setDescontoPercentual(pkg.desconto_percentual);
    setPrecoFinal(pkg.preco_final);
  };

  const confirmDelete = (id: string) => {
    setPackageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (packageToDelete) {
      deletePackage(packageToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setPackageToDelete(null);
        }
      });
    }
  };

  const toggleItem = (id: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(id)) {
      setter(list.filter(i => i !== id));
    } else {
      setter([...list, id]);
    }
  };

  const handleSave = () => {
    if (!ano) {
      toast({ title: "Erro", description: "Selecione um ano", variant: "destructive" });
      return;
    }

    if (!nome.trim()) {
      toast({ title: "Erro", description: "Informe o nome do pacote", variant: "destructive" });
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

    if (selectedEspacos.length === 0 && selectedBuffets.length === 0 && selectedServicos.length === 0) {
      toast({ title: "Erro", description: "Selecione ao menos um item para o pacote", variant: "destructive" });
      return;
    }

    if (descontoPercentual < 0 || descontoPercentual > 100) {
      toast({ title: "Erro", description: "Desconto deve estar entre 0% e 100%", variant: "destructive" });
      return;
    }

    const itensPacote: ItensPacote = {
      espacos: selectedEspacos,
      buffets: selectedBuffets,
      servicos: selectedServicos,
    };

    const packageData = {
      ano,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      itens_pacote: itensPacote,
      preco_base: precoBase,
      desconto_percentual: descontoPercentual,
      preco_final: precoFinal,
    };

    if (editingId) {
      updatePackage({ id: editingId, ...packageData }, {
        onSuccess: resetForm
      });
    } else {
      createPackage(packageData, {
        onSuccess: resetForm
      });
    }
  };

  // ============================================================================
  // FUNÇÕES AUXILIARES DE RENDER
  // ============================================================================

  const getNomeById = (id: string, type: 'espaco' | 'buffet' | 'servico') => {
    if (type === 'espaco') {
      const item = spaces.find(s => s.id === id);
      return item ? item.nome : 'Não encontrado';
    } else if (type === 'buffet') {
      const item = buffets.find(b => b.id === id);
      return item ? item.nome : 'Não encontrado';
    } else {
      const item = services.find(s => s.id === id);
      return item ? item.nome : 'Não encontrado';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoadingPackages || isLoadingSpaces || isLoadingBuffets || isLoadingServices) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pacotes
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
                <Package className="h-5 w-5 text-primary" />
                Configuração de Pacotes
              </CardTitle>
              <CardDescription className="mt-1">
                Combine espaços, buffets e serviços com desconto
              </CardDescription>
            </div>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pacote
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Lista de Pacotes */}
          {packages.length > 0 && !isAdding && (
            <div className="space-y-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{pkg.nome}</h4>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                        {pkg.ano}
                      </span>
                    </div>
                    
                    {pkg.descricao && (
                      <p className="text-sm text-muted-foreground">{pkg.descricao}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      {pkg.itens_pacote.espacos.length > 0 && (
                        <div>
                          <span className="font-medium">Espaços:</span> {pkg.itens_pacote.espacos.map(id => getNomeById(id, 'espaco')).join(', ')}
                        </div>
                      )}
                      {pkg.itens_pacote.buffets.length > 0 && (
                        <div>
                          <span className="font-medium">Buffets:</span> {pkg.itens_pacote.buffets.map(id => getNomeById(id, 'buffet')).join(', ')}
                        </div>
                      )}
                      {pkg.itens_pacote.servicos.length > 0 && (
                        <div>
                          <span className="font-medium">Serviços:</span> {pkg.itens_pacote.servicos.map(id => getNomeById(id, 'servico')).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">Base: {formatCurrency(pkg.preco_base)}</span>
                      {pkg.desconto_percentual > 0 && (
                        <span className="text-green-600">Desconto: {formatPercentage(pkg.desconto_percentual)}</span>
                      )}
                      <span className="font-medium">Final: {formatCurrency(pkg.preco_final)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(pkg)}
                      disabled={isCreating || isUpdating || isDeleting}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(pkg.id!)}
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
                  {editingId ? "Editar Pacote" : "Novo Pacote"}
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
                  <Label>Nome do Pacote *</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Pacote Completo"
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
                  placeholder="Descreva o que está incluso no pacote..."
                  maxLength={MAX_DESCRICAO_LENGTH}
                  disabled={isCreating || isUpdating}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {descricao.length}/{MAX_DESCRICAO_LENGTH}
                </p>
              </div>

              {/* Seleção de Itens */}
              <div className="space-y-4">
                <h4 className="font-medium">Itens do Pacote *</h4>
                
                {/* Espaços */}
                {spaces.length > 0 && (
                  <div className="space-y-2">
                    <Label>Espaços</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border rounded-lg">
                      {spaces.filter(s => s.ano === ano).map(espaco => (
                        <div key={espaco.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`espaco-${espaco.id}`}
                            checked={selectedEspacos.includes(espaco.id!)}
                            onCheckedChange={() => toggleItem(espaco.id!, selectedEspacos, setSelectedEspacos)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`espaco-${espaco.id}`} className="text-sm cursor-pointer">
                            {espaco.nome}
                          </label>
                        </div>
                      ))}
                      {spaces.filter(s => s.ano === ano).length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum espaço cadastrado para {ano}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Buffets */}
                {buffets.length > 0 && (
                  <div className="space-y-2">
                    <Label>Buffets</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border rounded-lg">
                      {buffets.filter(b => b.ano === ano).map(buffet => (
                        <div key={buffet.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`buffet-${buffet.id}`}
                            checked={selectedBuffets.includes(buffet.id!)}
                            onCheckedChange={() => toggleItem(buffet.id!, selectedBuffets, setSelectedBuffets)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`buffet-${buffet.id}`} className="text-sm cursor-pointer">
                            {buffet.nome}
                          </label>
                        </div>
                      ))}
                      {buffets.filter(b => b.ano === ano).length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum buffet cadastrado para {ano}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Serviços */}
                {services.length > 0 && (
                  <div className="space-y-2">
                    <Label>Serviços</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border rounded-lg">
                      {services.filter(s => s.ano === ano).map(servico => (
                        <div key={servico.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`servico-${servico.id}`}
                            checked={selectedServicos.includes(servico.id!)}
                            onCheckedChange={() => toggleItem(servico.id!, selectedServicos, setSelectedServicos)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`servico-${servico.id}`} className="text-sm cursor-pointer">
                            {servico.nome}
                          </label>
                        </div>
                      ))}
                      {services.filter(s => s.ano === ano).length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado para {ano}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Preços */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Preços do Pacote</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Preço Base (Calculado)</Label>
                    <Input
                      value={formatCurrency(precoBase)}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div>
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      value={descontoPercentual}
                      onChange={(e) => setDescontoPercentual(Number(e.target.value))}
                      min="0"
                      max="100"
                      disabled={isCreating || isUpdating}
                    />
                  </div>

                  <div>
                    <Label>Preço Final</Label>
                    <Input
                      value={formatCurrency(precoFinal)}
                      disabled
                      className="bg-primary/10 font-medium"
                    />
                  </div>
                </div>
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
              Tem certeza que deseja excluir este pacote? Esta ação não pode ser desfeita.
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
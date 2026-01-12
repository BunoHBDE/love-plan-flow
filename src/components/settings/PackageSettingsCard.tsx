/**
 * COMPONENT: PackageSettingsCard (CORRIGIDO)
 * - Campos separados para desconto fixo e variável
 * - Preview detalhado mostrando valores fixos e variáveis separadamente
 * - Cálculo correto de descontos aplicados individualmente
 */

import { useState } from "react";
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
import { Plus, Loader2, Pencil, Trash2, X, Package, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePackageSettings } from "@/hooks/usePackageSettings";
import { useSpaceSettings } from "@/hooks/useSpaceSettings";
import { useBuffetSettings } from "@/hooks/useBuffetSettings";
import { useServiceSettings } from "@/hooks/useServiceSettings";
import type { PackageData } from "@/types/packageSettings.types";

const MAX_NOME_LENGTH = 100;
const MAX_DESCRICAO_LENGTH = 500;
const anoAtual = new Date().getFullYear();
const ANOS_DISPONIVEIS = Array.from({ length: 10 }, (_, i) => (anoAtual + i).toString());

const formatCurrency = (value: number): string => {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function PackageSettingsCard() {
  const { toast } = useToast();
  
  const {
    packages,
    isLoading: isLoadingPackages,
    calculatePackagePrice,
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

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ano, setAno] = useState(anoAtual.toString());
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedEspacos, setSelectedEspacos] = useState<string[]>([]);
  const [selectedBuffets, setSelectedBuffets] = useState<string[]>([]);
  const [selectedServicos, setSelectedServicos] = useState<string[]>([]);
  const [descontoPercentualFixo, setDescontoPercentualFixo] = useState(0);
  const [descontoPercentualVariavel, setDescontoPercentualVariavel] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setAno(anoAtual.toString());
    setNome("");
    setDescricao("");
    setSelectedEspacos([]);
    setSelectedBuffets([]);
    setSelectedServicos([]);
    setDescontoPercentualFixo(0);
    setDescontoPercentualVariavel(0);
  };

  const handleEdit = (pkg: PackageData) => {
    setEditingId(pkg.id!);
    setIsAdding(true);
    setAno(pkg.ano);
    setNome(pkg.nome);
    setDescricao(pkg.descricao || "");
    setSelectedEspacos(pkg.itens_pacote.espacos);
    setSelectedBuffets(pkg.itens_pacote.buffets);
    setSelectedServicos(pkg.itens_pacote.servicos);
    setDescontoPercentualFixo(pkg.desconto_percentual);
    setDescontoPercentualVariavel(pkg.desconto_percentual_variavel);
  };

  const handleDelete = (id: string) => {
    setPackageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
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

    if (descontoPercentualFixo < 0 || descontoPercentualFixo > 100) {
      toast({ title: "Erro", description: "Desconto fixo deve estar entre 0% e 100%", variant: "destructive" });
      return;
    }

    if (descontoPercentualVariavel < 0 || descontoPercentualVariavel > 100) {
      toast({ title: "Erro", description: "Desconto variável deve estar entre 0% e 100%", variant: "destructive" });
      return;
    }

    const packageData = {
      ano,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      itens_pacote: {
        espacos: selectedEspacos,
        buffets: selectedBuffets,
        servicos: selectedServicos,
      },
      desconto_percentual: descontoPercentualFixo,
      desconto_percentual_variavel: descontoPercentualVariavel,
    };

    if (editingId) {
      updatePackage({ id: editingId, ...packageData }, { onSuccess: resetForm });
    } else {
      createPackage(packageData, { onSuccess: resetForm });
    }
  };

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
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pacotes
          </CardTitle>
          <CardDescription>
            Configure pacotes com múltiplos itens e descontos separados para valores fixos e variáveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pacote
            </Button>
          )}

          {/* Lista de Pacotes */}
          {!isAdding && packages.length > 0 && (
            <div className="space-y-3">
              {packages.map((pkg) => {
                const precos = calculatePackagePrice(pkg);
                
                return (
                  <div key={pkg.id} className="p-4 border rounded-lg space-y-3 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{pkg.nome}</h3>
                        <p className="text-sm text-muted-foreground">Ano: {pkg.ano}</p>
                        {pkg.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{pkg.descricao}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(pkg)}
                          disabled={isDeleting}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pkg.id!)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Itens do Pacote */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      {precos.espacos.length > 0 && (
                        <div>
                          <p className="font-medium mb-1">Espaços:</p>
                          {precos.espacos.map(item => (
                            <div key={item.id} className="text-muted-foreground">
                              • {item.nome}
                            </div>
                          ))}
                        </div>
                      )}
                      {precos.buffets.length > 0 && (
                        <div>
                          <p className="font-medium mb-1">Buffets:</p>
                          {precos.buffets.map(item => (
                            <div key={item.id} className="text-muted-foreground">
                              • {item.nome}
                            </div>
                          ))}
                        </div>
                      )}
                      {precos.servicos.length > 0 && (
                        <div>
                          <p className="font-medium mb-1">Serviços:</p>
                          {precos.servicos.map(item => (
                            <div key={item.id} className="text-muted-foreground">
                              • {item.nome}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Valores */}
                    <div className="pt-3 border-t space-y-2">
                      {/* Valores Fixos */}
                      {precos.subtotal_fixo > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Subtotal Fixo:</p>
                            <p className="font-medium">{formatCurrency(precos.subtotal_fixo)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Desconto Fixo:</p>
                            <p className="font-medium text-red-600">
                              -{formatCurrency(precos.desconto_fixo_valor)} ({precos.desconto_fixo_percentual}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Fixo:</p>
                            <p className="font-semibold">{formatCurrency(precos.total_fixo)}</p>
                          </div>
                        </div>
                      )}

                      {/* Valores Variáveis */}
                      {precos.subtotal_variavel > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Subtotal Variável:</p>
                            <p className="font-medium text-blue-600 dark:text-blue-400">
                              {formatCurrency(precos.subtotal_variavel)}*
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Desconto Variável:</p>
                            <p className="font-medium text-red-600">
                              -{formatCurrency(precos.desconto_variavel_valor)} ({precos.desconto_variavel_percentual}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Variável:</p>
                            <p className="font-semibold text-blue-600 dark:text-blue-400">
                              {formatCurrency(precos.total_variavel)}*
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Total Geral */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total Geral:</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(precos.total_geral)}
                            {precos.tem_variaveis && <span className="text-sm">*</span>}
                          </span>
                        </div>
                      </div>

                      {precos.tem_variaveis && (
                        <p className="text-xs text-muted-foreground">
                          * Valores variáveis mostrados são os valores iniciais/base
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isAdding && packages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum pacote cadastrado ainda</p>
            </div>
          )}

          {/* Formulário */}
          {isAdding && (
            <div className="space-y-6 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingId ? "Editar Pacote" : "Novo Pacote"}
                </h3>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Campos Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ano">Ano *</Label>
                  <Select value={ano} onValueChange={setAno} disabled={isCreating || isUpdating}>
                    <SelectTrigger id="ano">
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
                  <Label htmlFor="nome">Nome do Pacote *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Pacote Premium"
                    maxLength={MAX_NOME_LENGTH}
                    disabled={isCreating || isUpdating}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {nome.length}/{MAX_NOME_LENGTH}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o que está incluído neste pacote..."
                  maxLength={MAX_DESCRICAO_LENGTH}
                  disabled={isCreating || isUpdating}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {descricao.length}/{MAX_DESCRICAO_LENGTH}
                </p>
              </div>

              {/* Seleção de Itens */}
              <div className="space-y-4">
                <h4 className="font-medium">Itens do Pacote *</h4>

                {/* Espaços */}
                {spaces.filter(s => s.ano === ano).length > 0 && (
                  <div>
                    <Label className="mb-2 block">Espaços</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg bg-background">
                      {spaces.filter(s => s.ano === ano).map((espaco) => (
                        <div key={espaco.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`espaco-${espaco.id}`}
                            checked={selectedEspacos.includes(espaco.id!)}
                            onCheckedChange={() => toggleItem(espaco.id!, selectedEspacos, setSelectedEspacos)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`espaco-${espaco.id}`} className="text-sm cursor-pointer">{espaco.nome}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buffets */}
                {buffets.filter(b => b.ano === ano).length > 0 && (
                  <div>
                    <Label className="mb-2 block">Buffets</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg bg-background">
                      {buffets.filter(b => b.ano === ano).map((buffet) => (
                        <div key={buffet.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`buffet-${buffet.id}`}
                            checked={selectedBuffets.includes(buffet.id!)}
                            onCheckedChange={() => toggleItem(buffet.id!, selectedBuffets, setSelectedBuffets)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`buffet-${buffet.id}`} className="text-sm cursor-pointer">{buffet.nome}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Serviços */}
                {services.filter(s => s.ano === ano).length > 0 && (
                  <div>
                    <Label className="mb-2 block">Serviços</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg bg-background">
                      {services.filter(s => s.ano === ano).map((servico) => (
                        <div key={servico.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`servico-${servico.id}`}
                            checked={selectedServicos.includes(servico.id!)}
                            onCheckedChange={() => toggleItem(servico.id!, selectedServicos, setSelectedServicos)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`servico-${servico.id}`} className="text-sm cursor-pointer">{servico.nome}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PREVIEW DETALHADO */}
              {(selectedEspacos.length > 0 || selectedBuffets.length > 0 || selectedServicos.length > 0) && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">Itens Selecionados:</h4>
                  
                  {selectedEspacos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Espaços:</p>
                      {selectedEspacos.map(id => {
                        const espaco = spaces.find(s => s.id === id);
                        if (!espaco?.precos_por_dia?.[0]) return null;
                        const preco = espaco.precos_por_dia[0];
                        
                        return (
                          <div key={id} className="text-xs sm:text-sm bg-background rounded p-2 mt-1">
                            <span className="font-medium">{espaco.nome}:</span>{" "}
                            {preco.tipo === 'fixo' ? (
                              <span>{formatCurrency(preco.preco_fixo || 0)}</span>
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {preco.valor_inicial && preco.valor_inicial > 0 ? `${formatCurrency(preco.valor_inicial)} + ` : ''}
                                {formatCurrency(preco.valor_por_convidado || 0)}/convidado
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedBuffets.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Buffets:</p>
                      {selectedBuffets.map(id => {
                        const buffet = buffets.find(b => b.id === id);
                        if (!buffet?.precos_por_pessoa?.[0]) return null;
                        const preco = buffet.precos_por_pessoa[0];
                        
                        return (
                          <div key={id} className="text-xs sm:text-sm bg-background rounded p-2 mt-1">
                            <span className="font-medium">{buffet.nome}:</span>{" "}
                            {preco.tipo === 'fixo' ? (
                              <span>{formatCurrency(preco.preco_fixo || 0)}</span>
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {preco.valor_inicial && preco.valor_inicial > 0 ? `${formatCurrency(preco.valor_inicial)} + ` : ''}
                                {formatCurrency(preco.valor_por_pessoa || 0)}/pessoa
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedServicos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Serviços:</p>
                      {selectedServicos.map(id => {
                        const servico = services.find(s => s.id === id);
                        if (!servico?.precos?.[0]) return null;
                        const preco = servico.precos[0];
                        
                        return (
                          <div key={id} className="text-xs sm:text-sm bg-background rounded p-2 mt-1">
                            <span className="font-medium">{servico.nome}:</span>{" "}
                            {preco.tipo === 'fixo' ? (
                              <span>{formatCurrency(preco.preco_fixo || 0)}</span>
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {preco.valor_inicial && preco.valor_inicial > 0 ? `${formatCurrency(preco.valor_inicial)} + ` : ''}
                                {formatCurrency(preco.valor_por_unidade || 0)}/{preco.unidade || 'unidade'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Valores e Descontos */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Valores do Pacote</h4>
                
                {(() => {
                  const tempPkg: PackageData = {
                    ano, nome,
                    itens_pacote: { espacos: selectedEspacos, buffets: selectedBuffets, servicos: selectedServicos },
                    desconto_percentual: descontoPercentualFixo,
                    desconto_percentual_variavel: descontoPercentualVariavel
                  };
                  const precos = calculatePackagePrice(tempPkg);
                  
                  return (
                    <>
                      {/* Valores Fixos */}
                      {precos.subtotal_fixo > 0 && (
                        <div className="space-y-3 p-3 border rounded-lg bg-background">
                          <h5 className="font-medium text-sm">Valores Fixos</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <Label>Subtotal Fixo</Label>
                              <Input value={formatCurrency(precos.subtotal_fixo)} disabled className="bg-muted" />
                            </div>
                            <div>
                              <Label>Desconto Fixo (%)</Label>
                              <Input
                                type="number"
                                value={descontoPercentualFixo}
                                onChange={(e) => setDescontoPercentualFixo(Number(e.target.value))}
                                min="0" max="100"
                                disabled={isCreating || isUpdating}
                              />
                            </div>
                            <div>
                              <Label>Total Fixo</Label>
                              <Input 
                                value={formatCurrency(precos.total_fixo)} 
                                disabled 
                                className="bg-green-50 dark:bg-green-950 font-semibold" 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Valores Variáveis */}
                      {precos.subtotal_variavel > 0 && (
                        <div className="space-y-3 p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/30">
                          <h5 className="font-medium text-sm text-blue-700 dark:text-blue-300">
                            Valores Variáveis (Base)
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <Label>Subtotal Variável</Label>
                              <Input 
                                value={formatCurrency(precos.subtotal_variavel)} 
                                disabled 
                                className="bg-muted" 
                              />
                            </div>
                            <div>
                              <Label>Desconto Variável (%)</Label>
                              <Input
                                type="number"
                                value={descontoPercentualVariavel}
                                onChange={(e) => setDescontoPercentualVariavel(Number(e.target.value))}
                                min="0" max="100"
                                disabled={isCreating || isUpdating}
                              />
                            </div>
                            <div>
                              <Label>Total Variável</Label>
                              <Input 
                                value={formatCurrency(precos.total_variavel)} 
                                disabled 
                                className="bg-blue-100 dark:bg-blue-900 font-semibold" 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Total Geral */}
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <Label className="text-base">Total Geral do Pacote:</Label>
                          <span className="text-2xl font-bold text-primary">
                            {formatCurrency(precos.total_geral)}
                          </span>
                        </div>
                      </div>

                      {precos.tem_variaveis && (
                        <div className="flex gap-2 items-start p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span className="text-blue-800 dark:text-blue-200">
                            Os valores variáveis mostrados são os valores iniciais/base. O valor final dependerá da quantidade de convidados/unidades.
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={resetForm} disabled={isCreating || isUpdating}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                  ) : (
                    editingId ? "Atualizar" : "Salvar"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
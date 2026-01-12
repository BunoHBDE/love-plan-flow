/**
 * COMPONENT: PackageSettingsCard (FINAL v2)
 * - Preview detalhado mostrando tipo (fixo/variável) + unidade no formulário
 * - Cor azul (blue-600) com melhor contraste
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
  const [descontoPercentual, setDescontoPercentual] = useState(0);
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
    setDescontoPercentual(0);
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
    setDescontoPercentual(pkg.desconto_percentual);
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

    if (descontoPercentual < 0 || descontoPercentual > 100) {
      toast({ title: "Erro", description: "Desconto deve estar entre 0% e 100%", variant: "destructive" });
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
      desconto_percentual: descontoPercentual,
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
          {/* Lista */}
          {!isAdding && packages.length > 0 && (
            <div className="space-y-4">
              {packages.map((pkg) => {
                const precos = calculatePackagePrice(pkg);
                
                return (
                  <div key={pkg.id} className="border rounded-lg p-3 sm:p-4 space-y-3 hover:bg-muted/50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base sm:text-lg">{pkg.nome} - {pkg.ano}</h4>
                        {pkg.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{pkg.descricao}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(pkg)}>
                          <Pencil className="h-4 w-4" />
                          <span className="ml-2 sm:hidden">Editar</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(pkg.id!)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="ml-2 sm:hidden">Excluir</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {precos.espacos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Espaços:</p>
                          {precos.espacos.map((item) => (
                            <div key={item.id} className="text-xs sm:text-sm bg-muted/50 rounded p-2 mt-1">
                              <span className="font-medium">{item.nome}:</span>{" "}
                              {item.tipo === 'fixo' ? (
                                <span className="whitespace-nowrap">{formatCurrency(item.valor_fixo || 0)}</span>
                              ) : (
                                <span className="whitespace-nowrap text-blue-600 dark:text-blue-400 font-medium">
                                  {item.valor_inicial && item.valor_inicial > 0 ? `${formatCurrency(item.valor_inicial)} + ` : ''}
                                  {formatCurrency(item.valor_por_unidade || 0)}/{item.unidade}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {precos.buffets.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Buffets:</p>
                          {precos.buffets.map((item) => (
                            <div key={item.id} className="text-xs sm:text-sm bg-muted/50 rounded p-2 mt-1">
                              <span className="font-medium">{item.nome}:</span>{" "}
                              {item.tipo === 'fixo' ? (
                                <span className="whitespace-nowrap">{formatCurrency(item.valor_fixo || 0)}</span>
                              ) : (
                                <span className="whitespace-nowrap text-blue-600 dark:text-blue-400 font-medium">
                                  {item.valor_inicial && item.valor_inicial > 0 ? `${formatCurrency(item.valor_inicial)} + ` : ''}
                                  {formatCurrency(item.valor_por_unidade || 0)}/{item.unidade}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {precos.servicos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Serviços:</p>
                          {precos.servicos.map((item) => (
                            <div key={item.id} className="text-xs sm:text-sm bg-muted/50 rounded p-2 mt-1">
                              <span className="font-medium">{item.nome}:</span>{" "}
                              {item.tipo === 'fixo' ? (
                                <span className="whitespace-nowrap">{formatCurrency(item.valor_fixo || 0)}</span>
                              ) : (
                                <span className="whitespace-nowrap text-blue-600 dark:text-blue-400 font-medium">
                                  {item.valor_inicial && item.valor_inicial > 0 ? `${formatCurrency(item.valor_inicial)} + ` : ''}
                                  {formatCurrency(item.valor_por_unidade || 0)}/{item.unidade}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Subtotal {precos.tem_variaveis && '(valores iniciais)'}:
                        </span>
                        <span className="font-medium">{formatCurrency(precos.subtotal)}</span>
                      </div>
                      {pkg.desconto_percentual > 0 && (
                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                          <span>Desconto ({pkg.desconto_percentual}%):</span>
                          <span>-{formatCurrency(precos.desconto_valor)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total {precos.tem_variaveis && 'base'}:</span>
                        <span>{formatCurrency(precos.total)}</span>
                      </div>

                      {precos.tem_variaveis && (
                        <div className="flex gap-2 items-start mt-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span className="text-blue-800 dark:text-blue-200">
                            Este pacote possui itens variáveis. O valor final será calculado no orçamento.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulário */}
          {isAdding && (
            <div className="space-y-6 border rounded-lg p-4 sm:p-6 bg-muted/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingId ? "Editar Pacote" : "Novo Pacote"}
                </h3>
                <Button variant="ghost" size="icon" onClick={resetForm} disabled={isCreating || isUpdating}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Ano *</Label>
                  <Select value={ano} onValueChange={setAno} disabled={isCreating || isUpdating}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <p className="text-xs text-muted-foreground mt-1">{nome.length}/{MAX_NOME_LENGTH}</p>
                </div>
              </div>

              <div>
                <Label>Descrição (Opcional)</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o que está incluso..."
                  maxLength={MAX_DESCRICAO_LENGTH}
                  disabled={isCreating || isUpdating}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">{descricao.length}/{MAX_DESCRICAO_LENGTH}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Itens do Pacote *</h4>
                
                {spaces.length > 0 && (
                  <div className="space-y-2">
                    <Label>Espaços</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                      {spaces.filter(s => s.ano === ano).map(espaco => (
                        <div key={espaco.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`espaco-${espaco.id}`}
                            checked={selectedEspacos.includes(espaco.id!)}
                            onCheckedChange={() => toggleItem(espaco.id!, selectedEspacos, setSelectedEspacos)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`espaco-${espaco.id}`} className="text-sm cursor-pointer">{espaco.nome}</label>
                        </div>
                      ))}
                      {spaces.filter(s => s.ano === ano).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2">Nenhum espaço cadastrado para {ano}</p>
                      )}
                    </div>
                  </div>
                )}

                {buffets.length > 0 && (
                  <div className="space-y-2">
                    <Label>Buffets</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                      {buffets.filter(b => b.ano === ano).map(buffet => (
                        <div key={buffet.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`buffet-${buffet.id}`}
                            checked={selectedBuffets.includes(buffet.id!)}
                            onCheckedChange={() => toggleItem(buffet.id!, selectedBuffets, setSelectedBuffets)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`buffet-${buffet.id}`} className="text-sm cursor-pointer">{buffet.nome}</label>
                        </div>
                      ))}
                      {buffets.filter(b => b.ano === ano).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2">Nenhum buffet cadastrado para {ano}</p>
                      )}
                    </div>
                  </div>
                )}

                {services.length > 0 && (
                  <div className="space-y-2">
                    <Label>Serviços</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                      {services.filter(s => s.ano === ano).map(servico => (
                        <div key={servico.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`servico-${servico.id}`}
                            checked={selectedServicos.includes(servico.id!)}
                            onCheckedChange={() => toggleItem(servico.id!, selectedServicos, setSelectedServicos)}
                            disabled={isCreating || isUpdating}
                          />
                          <label htmlFor={`servico-${servico.id}`} className="text-sm cursor-pointer">{servico.nome}</label>
                        </div>
                      ))}
                      {services.filter(s => s.ano === ano).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2">Nenhum serviço cadastrado para {ano}</p>
                      )}
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

              {/* Valores */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Valores do Pacote</h4>
                
                {(() => {
                  const tempPkg: PackageData = {
                    ano, nome,
                    itens_pacote: { espacos: selectedEspacos, buffets: selectedBuffets, servicos: selectedServicos },
                    desconto_percentual: descontoPercentual,
                  };
                  const precos = calculatePackagePrice(tempPkg);
                  
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label>Subtotal</Label>
                          <Input value={formatCurrency(precos.subtotal)} disabled className="bg-muted" />
                          <p className="text-xs text-muted-foreground mt-1">Soma dos itens</p>
                        </div>
                        <div>
                          <Label>Desconto (%)</Label>
                          <Input
                            type="number"
                            value={descontoPercentual}
                            onChange={(e) => setDescontoPercentual(Number(e.target.value))}
                            min="0" max="100"
                            disabled={isCreating || isUpdating}
                          />
                        </div>
                        <div>
                          <Label>Total</Label>
                          <Input value={formatCurrency(precos.total)} disabled className="bg-primary/10 font-semibold" />
                          <p className="text-xs text-muted-foreground mt-1">Com desconto</p>
                        </div>
                      </div>

                      {precos.tem_variaveis && (
                        <div className="flex gap-2 items-start p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span className="text-blue-800 dark:text-blue-200">
                            Este pacote possui itens variáveis. Os valores mostrados são os valores iniciais/base.
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
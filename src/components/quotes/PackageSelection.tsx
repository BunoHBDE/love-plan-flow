import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import type { PackageData } from "@/types/packageSettings.types";

interface PackageSelectionProps {
  packages: PackageData[];
  selectedPackageId: string | null;
  onPackageChange: (packageId: string | null) => void;
  anoEvento: string;
  disabled?: boolean;
  
  // ✨ NOVO: Callbacks para auto-selecionar itens
  onAutoSelectSpace?: (spaceId: string | null) => void;
  onAutoSelectBuffet?: (buffetId: string | null) => void;
  onAutoSelectServices?: (serviceIds: string[]) => void;
}

export function PackageSelection({
  packages,
  selectedPackageId,
  onPackageChange,
  anoEvento,
  disabled = false,
  onAutoSelectSpace,
  onAutoSelectBuffet,
  onAutoSelectServices,
}: PackageSelectionProps) {
  // Filtrar pacotes pelo ano do evento
  const pacotesDoAno = packages.filter((p) => p.ano === anoEvento);

  // Encontrar pacote selecionado
  const selectedPackage = pacotesDoAno.find((p) => p.id === selectedPackageId);

  // ✨ NOVO: Auto-selecionar itens quando o pacote muda
  useEffect(() => {
    if (!selectedPackageId || !selectedPackage) {
      onAutoSelectSpace?.(null);
      onAutoSelectBuffet?.(null);
      onAutoSelectServices?.([]);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎁 Pacote selecionado:', selectedPackage.nome);
    console.log('📦 Auto-selecionando itens do pacote...');

    // Auto-selecionar ESPAÇO
    if (selectedPackage.itens_pacote.espacos && 
        selectedPackage.itens_pacote.espacos.length > 0 &&
        onAutoSelectSpace) {
      const espacoId = selectedPackage.itens_pacote.espacos[0];
      console.log('  ✅ Espaço:', espacoId);
      onAutoSelectSpace(espacoId);
    }

    // Auto-selecionar BUFFET
    if (selectedPackage.itens_pacote.buffets && 
        selectedPackage.itens_pacote.buffets.length > 0 &&
        onAutoSelectBuffet) {
      const buffetId = selectedPackage.itens_pacote.buffets[0];
      console.log('  ✅ Buffet:', buffetId);
      onAutoSelectBuffet(buffetId);
    }

    // Auto-selecionar SERVIÇOS
    if (selectedPackage.itens_pacote.servicos && 
        selectedPackage.itens_pacote.servicos.length > 0 &&
        onAutoSelectServices) {
      console.log('  ✅ Serviços:', selectedPackage.itens_pacote.servicos.length);
      onAutoSelectServices(selectedPackage.itens_pacote.servicos);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }, [selectedPackageId, selectedPackage, onAutoSelectSpace, onAutoSelectBuffet, onAutoSelectServices]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-muted-foreground text-sm">
          Pacote Promocional (Opcional)
        </Label>
        <Select
          value={selectedPackageId || "none"}
          onValueChange={(value) => onPackageChange(value === "none" ? null : value)}
          disabled={disabled || pacotesDoAno.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nenhum pacote selecionado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem pacote</SelectItem>
            {pacotesDoAno.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id!}>
                {pkg.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {pacotesDoAno.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Nenhum pacote configurado para {anoEvento}
          </p>
        )}
      </div>

      {/* Detalhes do pacote selecionado */}
      {selectedPackage && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedPackage.nome}
                </h3>
                {selectedPackage.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPackage.descricao}
                  </p>
                )}
              </div>

              {/* Descontos aplicados */}
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Descontos aplicados:
                </p>
                <div className="space-y-1 text-sm">
                  <p className="text-amber-700 dark:text-amber-300">
                    ✓ {selectedPackage.desconto_percentual}% de desconto em valores fixos
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    ✓ {selectedPackage.desconto_percentual_variavel}% de desconto em valores variáveis
                  </p>
                </div>
              </div>

              {/* Itens inclusos no pacote */}
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Itens do pacote:
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {selectedPackage.itens_pacote.espacos.length > 0 && (
                    <p>• {selectedPackage.itens_pacote.espacos.length} espaço(s)</p>
                  )}
                  {selectedPackage.itens_pacote.buffets.length > 0 && (
                    <p>• {selectedPackage.itens_pacote.buffets.length} buffet(s)</p>
                  )}
                  {selectedPackage.itens_pacote.servicos.length > 0 && (
                    <p>• {selectedPackage.itens_pacote.servicos.length} serviço(s)</p>
                  )}
                </div>
              </div>

              {/* ✨ NOVO: Aviso de auto-seleção */}
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="text-base">⚡</span>
                  Os itens do pacote serão selecionados automaticamente
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
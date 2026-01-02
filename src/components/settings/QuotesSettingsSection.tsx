/**
 * SEÇÃO DE CONFIGURAÇÕES DE ORÇAMENTOS
 * 
 * Permite configurar opções relacionadas aos orçamentos:
 * espaço, pacotes, buffet, extras, pagamento e listas.
 * 
 * TODO: Implementar cada sub-seção conforme necessidade do MVP.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ORCAMENTO_SUB_SECTIONS } from "@/constants/settings";
import type { OrcamentoSubSection } from "@/constants/settings";

export function QuotesSettingsSection() {
  const [activeSubSection, setActiveSubSection] =
    useState<OrcamentoSubSection>("espaco");

  const currentSubSection = ORCAMENTO_SUB_SECTIONS.find(
    (s) => s.id === activeSubSection
  );

  return (
    <div className="space-y-6">
      {/* Sub-navegação */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-lg border">
        {ORCAMENTO_SUB_SECTIONS.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubSection(sub.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSubSection === sub.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da sub-seção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Configurações de {currentSubSection?.label}
          </CardTitle>
          <CardDescription>
            Gerencie as opções disponíveis para seus orçamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              Em breve você poderá configurar as opções de {activeSubSection}{" "}
              aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
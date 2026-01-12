/**
 * SEÇÃO DE CONFIGURAÇÕES DE ORÇAMENTOS
 * 
 * Permite configurar opções relacionadas aos orçamentos:
 * espaço, buffet, serviços, pacotes, pagamento e listas.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ORCAMENTO_SUB_SECTIONS } from "@/constants/settings";
import type { OrcamentoSubSection } from "@/constants/settings";
import { SpaceSettingsCard } from "./SpaceSettingsCard";
import { BuffetSettingsCard } from "./BuffetSettingsCard";
import { ServiceSettingsCard } from "./ServiceSettingsCard";  
import { PackageSettingsCard } from "./PackageSettingsCard";
import { PaymentSettingsCard } from "./PaymentSettingsCard";

export function QuotesSettingsSection() {
  const [activeSubSection, setActiveSubSection] =
    useState<OrcamentoSubSection>("espaco");

  const currentSubSection = ORCAMENTO_SUB_SECTIONS.find(
    (s) => s.id === activeSubSection
  );

  return (
    <div className="space-y-6">
      {/* Sub-navegação */}
      <div className="flex flex-wrap justify-center gap-2 p-1 bg-muted/50 rounded-lg border">
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
      {activeSubSection === "espaco" && <SpaceSettingsCard />}
      {activeSubSection === "buffet" && <BuffetSettingsCard />}
      {activeSubSection === "servicos" && <ServiceSettingsCard />}  
      {activeSubSection === "pacotes" && <PackageSettingsCard />}
      {activeSubSection === "pagamento" && <PaymentSettingsCard />}

      {/* Placeholders para outras seções */}
      {activeSubSection !== "espaco" && 
       activeSubSection !== "buffet" && 
       activeSubSection !== "servicos" &&
       activeSubSection !== "pacotes" &&
       activeSubSection !== "pagamento" && (
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
      )}
    </div>
  );
}
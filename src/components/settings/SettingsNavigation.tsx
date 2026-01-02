/**
 * COMPONENTE DE NAVEGAÇÃO DAS CONFIGURAÇÕES
 * 
 * Toggle principal para navegar entre as seções de configurações.
 */

import type { MainSection, SectionConfig } from "@/constants/settings";

interface SettingsNavigationProps {
  sections: SectionConfig[];
  activeSection: MainSection;
  onSectionChange: (section: MainSection) => void;
}

export function SettingsNavigation({
  sections,
  activeSection,
  onSectionChange,
}: SettingsNavigationProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-muted/50 rounded-xl border shadow-sm animate-slide-up">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;

        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{section.label}</span>
          </button>
        );
      })}
    </div>
  );
}
/**
 * COMPONENTE DE SEÇÃO PLACEHOLDER
 * 
 * Usado para seções que ainda não foram implementadas.
 * Mostra uma mensagem "Em breve" de forma elegante.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderSectionProps {
  title: string;
  icon: React.ReactNode;
}

export function PlaceholderSection({ title, icon }: PlaceholderSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          Configurações de {title}
        </CardTitle>
        <CardDescription>
          Personalize as configurações relacionadas a {title.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <div className="mx-auto mb-4 opacity-50">{icon}</div>
          <p>Em breve você poderá configurar {title.toLowerCase()} aqui.</p>
        </div>
      </CardContent>
    </Card>
  );
}
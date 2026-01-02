/**
 * COMPONENTE DE INFORMAÇÕES PESSOAIS
 * 
 * Card com campos para nome, telefone e WhatsApp do usuário.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { formatPhone } from "@/lib/masks";
import type { ProfileData } from "@/constants/settings";

interface PersonalInfoCardProps {
  data: ProfileData;
  onChange: (field: keyof ProfileData, value: string) => void;
}

export function PersonalInfoCard({ data, onChange }: PersonalInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Informações Pessoais
        </CardTitle>
        <CardDescription>Seus dados de contato</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={data.nome}
              onChange={(e) => onChange("nome", e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={data.telefone}
              onChange={(e) => onChange("telefone", formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={data.whatsapp}
              onChange={(e) => onChange("whatsapp", formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
/**
 * COMPONENTE DE DADOS DA EMPRESA
 * 
 * Card com campos para informações da empresa e upload de logo.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Camera, Loader2, Upload, X } from "lucide-react";
import { formatPhone, formatCNPJ } from "@/lib/masks";
import type { ProfileData } from "@/constants/settings";

interface CompanyInfoCardProps {
  data: ProfileData;
  onChange: (field: keyof ProfileData, value: string) => void;
  logoInputRef: React.RefObject<HTMLInputElement>;
  isUploadingLogo: boolean;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onTriggerUpload: () => void;
}

export function CompanyInfoCard({
  data,
  onChange,
  logoInputRef,
  isUploadingLogo,
  onLogoChange,
  onRemoveLogo,
  onTriggerUpload,
}: CompanyInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Dados da Empresa
        </CardTitle>
        <CardDescription>Informações do seu espaço de eventos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Upload */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {data.empresaLogoUrl ? (
              <div className="relative">
                <img
                  src={data.empresaLogoUrl}
                  alt="Logo da empresa"
                  className="h-20 w-20 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={onRemoveLogo}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={onLogoChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTriggerUpload}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {data.empresaLogoUrl ? "Alterar logo" : "Enviar logo"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WEBP. Máx 5MB.
            </p>
          </div>
        </div>

        <Separator />

        {/* Campos da empresa */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="empresaNome">Nome da empresa</Label>
            <Input
              id="empresaNome"
              value={data.empresaNome}
              onChange={(e) => onChange("empresaNome", e.target.value)}
              placeholder="Nome do espaço"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresaCnpj">CNPJ</Label>
            <Input
              id="empresaCnpj"
              value={data.empresaCnpj}
              onChange={(e) => onChange("empresaCnpj", formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="empresaEndereco">Endereço</Label>
            <Input
              id="empresaEndereco"
              value={data.empresaEndereco}
              onChange={(e) => onChange("empresaEndereco", e.target.value)}
              placeholder="Endereço completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresaTelefone">Telefone comercial</Label>
            <Input
              id="empresaTelefone"
              value={data.empresaTelefone}
              onChange={(e) => onChange("empresaTelefone", formatPhone(e.target.value))}
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresaEmail">Email comercial</Label>
            <Input
              id="empresaEmail"
              type="email"
              value={data.empresaEmail}
              onChange={(e) => onChange("empresaEmail", e.target.value)}
              placeholder="contato@empresa.com"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
/**
 * COMPONENTE DE DADOS DA EMPRESA
 * 
 * Card com campos para informações da empresa e upload de logo.
 * Inclui endereço completo com busca automática de CEP.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Camera, Loader2, Upload, X, MapPin } from "lucide-react";
import { formatPhone, formatCNPJ, formatCEP } from "@/lib/masks";
import type { ProfileData } from "@/constants/settings";
import { BRAZILIAN_STATES } from "@/constants/settings";

interface CompanyInfoCardProps {
  data: ProfileData;
  onChange: (field: keyof ProfileData, value: string) => void;
  logoInputRef: React.RefObject<HTMLInputElement>;
  isUploadingLogo: boolean;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onTriggerUpload: () => void;
  isLoadingCep: boolean;
  onCepLookup: (cep: string) => void;
}

export function CompanyInfoCard({
  data,
  onChange,
  logoInputRef,
  isUploadingLogo,
  onLogoChange,
  onRemoveLogo,
  onTriggerUpload,
  isLoadingCep,
  onCepLookup,
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
      <CardContent className="space-y-6">
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

        {/* Dados Básicos da Empresa */}
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
          <div className="space-y-2">
            <Label htmlFor="empresaTelefone">Telefone comercial</Label>
            <Input
              id="empresaTelefone"
              value={data.empresaTelefone}
              onChange={(e) => onChange("empresaTelefone", formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
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

        <Separator />

        {/* Endereço da Empresa */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            Endereço
          </Label>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="empresaCep">CEP</Label>
              <div className="relative">
                <Input
                  id="empresaCep"
                  value={data.empresaCep}
                  onChange={(e) => onChange("empresaCep", formatCEP(e.target.value))}
                  onBlur={(e) => onCepLookup(e.target.value)}
                  placeholder="00000-000"
                  disabled={isLoadingCep}
                />
                {isLoadingCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="empresaRua">Rua</Label>
              <Input
                id="empresaRua"
                value={data.empresaRua}
                onChange={(e) => onChange("empresaRua", e.target.value)}
                placeholder="Nome da rua"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="empresaNumero">Número</Label>
              <Input
                id="empresaNumero"
                value={data.empresaNumero}
                onChange={(e) => onChange("empresaNumero", e.target.value)}
                placeholder="Nº"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaComplemento">Complemento</Label>
              <Input
                id="empresaComplemento"
                value={data.empresaComplemento}
                onChange={(e) => onChange("empresaComplemento", e.target.value)}
                placeholder="Sala, Andar..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="empresaBairro">Bairro</Label>
              <Input
                id="empresaBairro"
                value={data.empresaBairro}
                onChange={(e) => onChange("empresaBairro", e.target.value)}
                placeholder="Bairro"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="empresaCidade">Cidade</Label>
              <Input
                id="empresaCidade"
                value={data.empresaCidade}
                onChange={(e) => onChange("empresaCidade", e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaEstado">Estado</Label>
              <Select
                value={data.empresaEstado}
                onValueChange={(value) => onChange("empresaEstado", value)}
              >
                <SelectTrigger id="empresaEstado">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
/**
 * COMPONENTE DE INFORMAÇÕES PESSOAIS (EXPANDIDO)
 * 
 * Card completo com todos os campos de cadastro do usuário:
 * - Avatar e email
 * - Dados pessoais (nome, CPF, data de nascimento, gênero, nacionalidade)
 * - Contato (celular)
 * - Endereço completo com busca automática de CEP
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, MapPin, Camera, Loader2, Upload, X } from "lucide-react";
import { formatPhone, formatCPF, formatCEP } from "@/lib/masks";
import type { ProfileData } from "@/constants/settings";
import { GENDER_OPTIONS, BRAZILIAN_STATES } from "@/constants/settings";

interface PersonalInfoCardProps {
  data: ProfileData;
  onChange: (field: keyof ProfileData, value: string) => void;
  
  // Avatar
  avatarInputRef: React.RefObject<HTMLInputElement>;
  isUploadingAvatar: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onTriggerAvatarUpload: () => void;
  
  // CEP
  isLoadingCep: boolean;
  onCepLookup: (cep: string) => void;
}

export function PersonalInfoCard({
  data,
  onChange,
  avatarInputRef,
  isUploadingAvatar,
  onAvatarChange,
  onRemoveAvatar,
  onTriggerAvatarUpload,
  isLoadingCep,
  onCepLookup,
}: PersonalInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Informações Pessoais
        </CardTitle>
        <CardDescription>Seus dados de cadastro</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar e Email */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {data.avatarUrl ? (
                <div className="relative">
                  <img
                    src={data.avatarUrl}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover border-2 border-primary/20"
                  />
                  <button
                    type="button"
                    onClick={onRemoveAvatar}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTriggerAvatarUpload}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {data.avatarUrl ? "Alterar" : "Adicionar foto"}
                </>
              )}
            </Button>
          </div>
          
          {/* Email (readonly) */}
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado pois está vinculado à sua conta.
            </p>
          </div>
        </div>

        <Separator />

        {/* Dados Básicos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input
              id="nome"
              value={data.nome}
              onChange={(e) => onChange("nome", e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={data.cpf}
              onChange={(e) => onChange("cpf", formatCPF(e.target.value))}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={data.birthDate}
              onChange={(e) => onChange("birthDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gênero</Label>
            <Select
              value={data.gender}
              onValueChange={(value) => onChange("gender", value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nacionalidade</Label>
            <Input
              id="nationality"
              value={data.nationality}
              onChange={(e) => onChange("nationality", e.target.value)}
              placeholder="Brasileiro(a)"
            />
          </div>
        </div>

        <Separator />

        {/* Contato */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Celular</Label>
            <Input
              id="whatsapp"
              value={data.whatsapp}
              onChange={(e) => onChange("whatsapp", formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <Separator />

        {/* Endereço */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            Endereço
          </Label>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="addressCep">CEP</Label>
              <div className="relative">
                <Input
                  id="addressCep"
                  value={data.addressCep}
                  onChange={(e) => onChange("addressCep", formatCEP(e.target.value))}
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
              <Label htmlFor="addressStreet">Rua</Label>
              <Input
                id="addressStreet"
                value={data.addressStreet}
                onChange={(e) => onChange("addressStreet", e.target.value)}
                placeholder="Nome da rua"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                value={data.addressNumber}
                onChange={(e) => onChange("addressNumber", e.target.value)}
                placeholder="Nº"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressComplement">Complemento</Label>
              <Input
                id="addressComplement"
                value={data.addressComplement}
                onChange={(e) => onChange("addressComplement", e.target.value)}
                placeholder="Apto, Bloco..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addressNeighborhood">Bairro</Label>
              <Input
                id="addressNeighborhood"
                value={data.addressNeighborhood}
                onChange={(e) => onChange("addressNeighborhood", e.target.value)}
                placeholder="Bairro"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addressCity">Cidade</Label>
              <Input
                id="addressCity"
                value={data.addressCity}
                onChange={(e) => onChange("addressCity", e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressState">Estado</Label>
              <Select
                value={data.addressState}
                onValueChange={(value) => onChange("addressState", value)}
              >
                <SelectTrigger id="addressState">
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
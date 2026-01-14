/**
 * COMPONENTE DE INFORMAÇÕES DE CADASTRO
 * 
 * Card simplificado com dados essenciais do usuário:
 * - Avatar
 * - Nome
 * - Email (somente leitura) + opção de alterar
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Camera, Loader2, Upload, X, Pencil } from "lucide-react";
import type { ProfileData } from "@/constants/settings";

interface PersonalInfoCardProps {
  data: ProfileData;
  onChange: (field: keyof ProfileData, value: string) => void;
  
  // Avatar
  avatarInputRef: React.RefObject<HTMLInputElement>;
  isUploadingAvatar: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onTriggerAvatarUpload: () => void;

  // Email
  newEmail: string;
  onNewEmailChange: (value: string) => void;
  isChangingEmail: boolean;
  onEmailChange: () => void;
}

export function PersonalInfoCard({
  data,
  onChange,
  avatarInputRef,
  isUploadingAvatar,
  onAvatarChange,
  onRemoveAvatar,
  onTriggerAvatarUpload,
  newEmail,
  onNewEmailChange,
  isChangingEmail,
  onEmailChange,
}: PersonalInfoCardProps) {
  const [showEmailEdit, setShowEmailEdit] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Dados de Cadastro
        </CardTitle>
        <CardDescription>Suas informações básicas de conta</CardDescription>
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
          
          {/* Nome e Email */}
          <div className="flex-1 space-y-4 w-full">
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
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  disabled
                  className="bg-muted flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEmailEdit(!showEmailEdit)}
                  title="Alterar email"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Formulário de alteração de email */}
              {showEmailEdit && (
                <div className="mt-3 p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Novo email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => onNewEmailChange(e.target.value)}
                      placeholder="Digite o novo email"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Um email de confirmação será enviado para o novo endereço. 
                    A alteração só será efetivada após a confirmação.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowEmailEdit(false);
                        onNewEmailChange("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onEmailChange}
                      disabled={isChangingEmail || !newEmail}
                    >
                      {isChangingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Alterar Email"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * COMPONENTE DE ALTERAÇÃO DE SENHA
 * 
 * Card com campos para alteração de senha com validação visual.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Check, X, Eye, EyeOff, Loader2 } from "lucide-react";
import type { PasswordData, PasswordVisibility } from "@/constants/settings";
import { PASSWORD_REQUIREMENTS_LIST } from "@/constants/settings";
import {
  getPasswordRequirements,
  getPasswordStrength,
  isPasswordValid,
} from "@/lib/passwordUtils";

interface PasswordChangeCardProps {
  data: PasswordData;
  showPasswords: PasswordVisibility;
  isChanging: boolean;
  onChange: (field: keyof PasswordData, value: string) => void;
  onToggleVisibility: (field: keyof PasswordVisibility) => void;
  onSubmit: () => void;
}

export function PasswordChangeCard({
  data,
  showPasswords,
  isChanging,
  onChange,
  onToggleVisibility,
  onSubmit,
}: PasswordChangeCardProps) {
  const requirements = getPasswordRequirements(data.novaSenha);
  const strength = getPasswordStrength(data.novaSenha);
  const passwordsMatch = data.novaSenha === data.confirmarSenha;

  const isFormValid =
    data.senhaAtual &&
    data.novaSenha &&
    data.confirmarSenha &&
    isPasswordValid(data.novaSenha) &&
    passwordsMatch;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-5 w-5 text-primary" />
          Alteração de Senha
        </CardTitle>
        <CardDescription>Mantenha sua conta segura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Senha atual */}
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha atual</Label>
            <div className="relative">
              <Input
                id="senhaAtual"
                type={showPasswords.senhaAtual ? "text" : "password"}
                placeholder="••••••••"
                value={data.senhaAtual}
                onChange={(e) => onChange("senhaAtual", e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => onToggleVisibility("senhaAtual")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.senhaAtual ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={showPasswords.novaSenha ? "text" : "password"}
                placeholder="••••••••"
                value={data.novaSenha}
                onChange={(e) => onChange("novaSenha", e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => onToggleVisibility("novaSenha")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.novaSenha ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Indicador de força */}
            {data.novaSenha && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        level <= strength.score ? strength.color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Força:{" "}
                  <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Checklist de requisitos */}
          {data.novaSenha && (
            <div className="space-y-2 sm:col-span-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Requisitos da senha:
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {PASSWORD_REQUIREMENTS_LIST.map(({ key, label }) => {
                  const isMet = requirements[key as keyof typeof requirements];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          isMet ? "bg-emerald-500" : "bg-muted-foreground/30"
                        }`}
                      >
                        {isMet && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span
                        className={
                          isMet ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirmar senha */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={showPasswords.confirmarSenha ? "text" : "password"}
                placeholder="••••••••"
                value={data.confirmarSenha}
                onChange={(e) => onChange("confirmarSenha", e.target.value)}
                className={`pr-10 ${
                  data.confirmarSenha
                    ? passwordsMatch
                      ? "border-emerald-500 focus-visible:ring-emerald-500"
                      : "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => onToggleVisibility("confirmarSenha")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.confirmarSenha ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Feedback de confirmação */}
            {data.confirmarSenha && (
              <p
                className={`text-xs flex items-center gap-1 ${
                  passwordsMatch ? "text-emerald-500" : "text-destructive"
                }`}
              >
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3" />
                    As senhas conferem
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" />
                    As senhas não conferem
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Botão de submit */}
        <Button
          onClick={onSubmit}
          disabled={isChanging || !isFormValid}
          className="w-full sm:w-auto"
        >
          {isChanging ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Alterando...
            </>
          ) : (
            "Alterar senha"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
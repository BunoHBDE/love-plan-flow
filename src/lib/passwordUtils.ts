/**
 * UTILITÁRIOS DE VALIDAÇÃO DE SENHA
 * 
 * Funções para verificar requisitos e força de senhas.
 * Separado para facilitar reutilização e testes.
 */

import type { PasswordRequirements, PasswordStrength } from "@/constants/settings";

/**
 * Verifica cada requisito de senha individualmente
 */
export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
  };
}

/**
 * Verifica se a senha atende todos os requisitos
 */
export function isPasswordValid(password: string): boolean {
  const req = getPasswordRequirements(password);
  return (
    req.minLength &&
    req.hasUppercase &&
    req.hasLowercase &&
    req.hasNumber &&
    req.hasSpecial
  );
}

/**
 * Calcula a força da senha (score de 0-5)
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "", color: "" };
  }

  const req = getPasswordRequirements(password);
  let score = 0;

  if (req.minLength) score++;
  if (req.hasLowercase) score++;
  if (req.hasUppercase) score++;
  if (req.hasNumber) score++;
  if (req.hasSpecial) score++;

  if (score <= 2) {
    return { score, label: "Fraca", color: "bg-destructive" };
  }
  if (score <= 3) {
    return { score, label: "Média", color: "bg-yellow-500" };
  }
  if (score <= 4) {
    return { score, label: "Boa", color: "bg-emerald-500" };
  }
  return { score, label: "Forte", color: "bg-emerald-600" };
}
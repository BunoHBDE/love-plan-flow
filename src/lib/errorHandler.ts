/**
 * Centralized error handling for Supabase operations
 * Maps database error codes to safe, user-friendly messages
 */

interface PostgrestError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Maps known Supabase/PostgreSQL error codes to safe user messages
 * Logs the full error for debugging while returning a sanitized message
 */
export function getSafeErrorMessage(error: PostgrestError, operation: string): string {
  // Log full error for debugging (only visible in dev tools)
  console.error(`[${operation}] Database error:`, {
    code: error.code,
    message: error.message,
  });

  const errorCode = error.code;

  // Permission/RLS errors
  if (errorCode === '42501' || error.message?.includes('row-level security')) {
    return 'Você não tem permissão para realizar esta operação.';
  }

  // Unique constraint violation
  if (errorCode === '23505') {
    return 'Este registro já existe no sistema.';
  }

  // Foreign key constraint
  if (errorCode === '23503') {
    return 'Não é possível realizar esta operação: existem dados relacionados.';
  }

  // Not null constraint
  if (errorCode === '23502') {
    return 'Campos obrigatórios estão faltando.';
  }

  // Check constraint violation
  if (errorCode === '23514') {
    return 'Os dados informados não são válidos.';
  }

  // Invalid input syntax
  if (errorCode === '22P02') {
    return 'O formato dos dados está incorreto.';
  }

  // Connection errors
  if (errorCode === '08000' || errorCode === '08003' || errorCode === '08006') {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Authentication errors
  if (errorCode === '28000' || errorCode === '28P01') {
    return 'Erro de autenticação. Faça login novamente.';
  }

  // Generic fallback - don't expose internal details
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

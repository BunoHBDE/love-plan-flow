/**
 * Só os dígitos de um telefone, já sem o DDI.
 *
 * O 55 só é DDI quando sobra número demais: o DDD 55 (Santa Maria) forma
 * um telefone de 10 ou 11 dígitos, e nunca de 12 ou 13. Por isso o corte é
 * pelo tamanho — colar "+55 11 99999-9999" funciona sem quebrar o RS.
 */
export function phoneDigits(value: string): string {
  const numbers = (value ?? "").replace(/\D/g, "");
  const semDdi =
    (numbers.length === 12 || numbers.length === 13) && numbers.startsWith("55")
      ? numbers.slice(2)
      : numbers;
  return semDdi.slice(0, 11);
}

/**
 * O telefone só está completo com DDD + 8 ou 9 dígitos. Serve para travar o
 * salvamento antes que um número pela metade chegue ao banco.
 */
export function isValidPhone(value: string): boolean {
  const digitos = phoneDigits(value).length;
  return digitos === 10 || digitos === 11;
}

/**
 * Formata telefone brasileiro: (00) 00000-0000 ou (00) 0000-0000
 *
 * Este é o padrão único do app — todo input de telefone passa por aqui e o
 * banco normaliza da mesma forma. Fixo e celular antigo (10 dígitos) ficam
 * em (00) 0000-0000: não há nono dígito para inventar.
 *
 * Formata enquanto se digita, então valor parcial sai parcial.
 */
export function formatPhone(value: string): string {
  const numbers = phoneDigits(value);

  if (numbers.length <= 2) {
    return numbers.length ? `(${numbers}` : "";
  }
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 14);
  
  if (numbers.length <= 2) {
    return numbers;
  }
  if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  }
  if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  }
  if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  }
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

/**
 * Formata CEP: 00000-000
 */
export function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  
  if (numbers.length <= 5) {
    return numbers;
  }
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  
  if (numbers.length <= 3) {
    return numbers;
  }
  if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  }
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

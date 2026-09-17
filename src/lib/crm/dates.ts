/**
 * DATAS DO CRM
 *
 * Todas as datas do CRM são datas puras ("YYYY-MM-DD"), sem hora e sem fuso.
 * Trabalhar com string evita o clássico bug de a data "voltar um dia" quando o
 * navegador converte UTC para o horário local.
 */

/** Data de hoje no fuso do usuário, no formato YYYY-MM-DD. */
export function hoje(): string {
  const d = new Date();
  return toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function toISODate(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Converte "YYYY-MM-DD" para Date local (meia-noite). */
export function paraDate(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Soma (ou subtrai) dias a uma data ISO, devolvendo outra data ISO. */
export function somarDias(iso: string, dias: number): string {
  const d = paraDate(iso);
  d.setDate(d.getDate() + dias);
  return toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Quantos dias de `de` até `ate` (positivo se `ate` é depois). */
export function diffDias(de: string, ate: string): number {
  const ms = paraDate(ate).getTime() - paraDate(de).getTime();
  return Math.round(ms / 86_400_000);
}

/** A maior entre duas datas ISO, ignorando nulos. */
export function maiorData(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a > b ? a : b;
}

/** Formata "YYYY-MM-DD" como "12/08/2026". */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Formata "YYYY-MM-DD" como "12/08" — para tabelas apertadas. */
export function formatarDataCurta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/**
 * "há 4h", "há 1 dia" — a partir de um instante exato (timestamp com hora),
 * como o horário real da última mensagem. Para quem só tem a data (sem
 * hora), use `formatarDiasRelativo`.
 */
export function formatarRelativo(momento: string): string {
  const diffMin = Math.floor((Date.now() - new Date(momento).getTime()) / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  const dias = Math.floor(diffHoras / 24);
  return `há ${dias} dia${dias === 1 ? "" : "s"}`;
}

/** Mesma ideia, mas a partir de uma contagem de dias já calculada — o
 * fallback de quem não tem hora exata do último contato. */
export function formatarDiasRelativo(dias: number): string {
  if (dias <= 0) return "hoje";
  return `há ${dias} dia${dias === 1 ? "" : "s"}`;
}

/** Formatações derivadas do lead que a interface reaproveita. */

import { MONTHS } from "@/constants/visits";
import { formatarData } from "./dates";
import type { CrmLead } from "@/types/crm.types";

/**
 * O que o lead já contou sobre a data: "20/03/2027" quando ela está fechada,
 * "Março de 2027" quando ainda é só uma previsão, null quando não se sabe nada.
 */
export function resumoDaData(lead: CrmLead): string | null {
  if (lead.data_evento_status === "sem_data") {
    const mes = MONTHS.find((m) => m.value === lead.mes_evento)?.label;
    if (mes && lead.ano_evento) return `${mes} de ${lead.ano_evento}`;
    return lead.ano_evento ?? mes ?? null;
  }
  return lead.data_evento ? formatarData(lead.data_evento) : null;
}

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

/** O ano do casamento, tenha ele data fechada ou só uma previsão. */
export function anoDoCasamento(lead: CrmLead): string | null {
  if (lead.data_evento_status === "sem_data") return lead.ano_evento;
  return lead.data_evento?.slice(0, 4) ?? null;
}

/**
 * O mês do casamento no formato de `MONTHS` ("01".."12"), tenha ele data
 * fechada ou só uma previsão. Serve para juntar num mesmo filtro quem já
 * marcou o dia e quem por enquanto só sabe o mês.
 */
export function mesDoCasamento(lead: CrmLead): string | null {
  if (lead.data_evento_status === "sem_data") return lead.mes_evento;
  return lead.data_evento?.slice(5, 7) ?? null;
}

/**
 * O resumo que cabe numa linha de lista: ano e convidados são o que se lê de
 * relance para saber se o lead é grande e se está perto. A data exata e o mês
 * ficam no formulário, que é onde eles importam.
 */
export function resumoCurto(lead: CrmLead): string | null {
  const partes = [
    anoDoCasamento(lead),
    lead.convidados ? `${lead.convidados} convidados` : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : null;
}

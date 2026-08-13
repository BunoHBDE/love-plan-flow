/**
 * LISTA DE ATENDIMENTO
 *
 * A tela de trabalho do dia. Foi desenhada em cima da rotina real: você fala
 * com as pessoas no WhatsApp e vem aqui registrar — quase sempre sabendo o
 * nome de quem procura. Por isso a busca recebe o foco sozinha e cada linha
 * resolve a etapa sem abrir nada.
 *
 * Os filtros são os momentos da rotina, não categorias abstratas:
 *   Hoje                → o que precisa de você agora
 *   Aguardando resposta → quem pode ter respondido sem você registrar
 *   Em silêncio         → quem sumiu
 *   Novos               → o que você cadastrou hoje
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { hoje } from "@/lib/crm/dates";
import type { useCrmLeads } from "@/hooks/useCrmLeads";
import type { CrmConfig, CrmLeadComputed } from "@/types/crm.types";
import { QuandoBadge, SituacaoBadge, WhatsAppButton } from "./CrmBadges";
import { AcaoRapidaLinha } from "./AcaoRapida";
import { CadastroRapido } from "./CadastroRapido";
import { QualificacaoNaLinha } from "./Qualificacao";

type FiltroId = "hoje" | "aguardando" | "silencio" | "novos" | "todos";

interface Filtro {
  id: FiltroId;
  label: string;
  descricao: string;
  inclui: (lead: CrmLeadComputed) => boolean;
}

const FILTROS: Filtro[] = [
  {
    id: "hoje",
    label: "Hoje",
    descricao: "Atrasados e vencendo hoje, na ordem em que devem ser feitos.",
    inclui: (l) =>
      l.derived.urgencia === "atrasado" || l.derived.urgencia === "hoje",
  },
  {
    id: "aguardando",
    label: "Aguardando resposta",
    descricao:
      "Você mandou mensagem e ainda não registrou o retorno. É aqui que você varre o que respondeu no WhatsApp enquanto o dia corria.",
    inclui: (l) => l.derived.aguardandoResposta,
  },
  {
    id: "silencio",
    label: "Em silêncio",
    descricao: "Sumiram. Quem está há mais tempo sem responder vem primeiro.",
    inclui: (l) => l.derived.situacao === "em_silencio",
  },
  {
    id: "novos",
    label: "Novos",
    descricao: "Cadastrados hoje.",
    inclui: (l) => l.entrada === hoje(),
  },
  {
    id: "todos",
    label: "Todos",
    descricao: "Todo o atendimento em aberto. Os encerrados ficam no fim.",
    inclui: () => true,
  },
];

export function CrmLista({
  leads,
  config,
  acoes,
  onAbrirLead,
}: {
  leads: CrmLeadComputed[];
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  onAbrirLead: (id: string) => void;
}) {
  const [filtro, setFiltro] = useState<FiltroId>("hoje");
  const [busca, setBusca] = useState("");
  const campoBusca = useRef<HTMLInputElement>(null);

  // "/" devolve o foco para a busca de qualquer lugar da página.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null;
      const digitando =
        alvo?.tagName === "INPUT" ||
        alvo?.tagName === "TEXTAREA" ||
        alvo?.isContentEditable;

      if (evento.key === "/" && !digitando) {
        evento.preventDefault();
        campoBusca.current?.focus();
      }
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const contagens = useMemo(() => {
    const mapa = {} as Record<FiltroId, number>;
    FILTROS.forEach((f) => {
      mapa[f.id] = leads.filter(f.inclui).length;
    });
    return mapa;
  }, [leads]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const ativo = FILTROS.find((f) => f.id === filtro)!;

    // A busca varre tudo: procurar alguém não deve depender do filtro aberto.
    const base = termo
      ? leads.filter(
          (l) =>
            l.nome.toLowerCase().includes(termo) ||
            l.telefone.replace(/\D/g, "").includes(termo.replace(/\D/g, "")),
        )
      : leads.filter(ativo.inclui);

    return [...base].sort(ordenar(filtro, !!termo));
  }, [leads, filtro, busca]);

  const filtroAtivo = FILTROS.find((f) => f.id === filtro)!;
  const buscando = busca.trim() !== "";

  return (
    <div className="space-y-4">
      {/* Busca e cadastro, lado a lado: as duas portas de entrada do dia. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={campoBusca}
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setBusca("")}
            placeholder="Buscar por nome ou telefone   ·   tecle /"
            className="pl-9 pr-9"
          />
          {buscando && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <CadastroRapido
          config={config}
          leads={leads}
          acoes={acoes}
          onAbrirLead={onAbrirLead}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFiltro(item.id);
              setBusca("");
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              filtro === item.id && !buscando
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                filtro === item.id && !buscando
                  ? "bg-primary-foreground/20"
                  : "bg-muted",
              )}
            >
              {contagens[item.id]}
            </span>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {buscando
          ? `${visiveis.length} resultado${visiveis.length === 1 ? "" : "s"} para “${busca.trim()}”`
          : filtroAtivo.descricao}
      </p>

      {/* Linhas */}
      {visiveis.length === 0 ? (
        <Vazio buscando={buscando} filtro={filtro} />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {visiveis.map((lead) => (
            <LinhaLead
              key={lead.id}
              lead={lead}
              config={config}
              acoes={acoes}
              onAbrirLead={onAbrirLead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// LINHA
// ==========================================

function LinhaLead({
  lead,
  config,
  acoes,
  onAbrirLead,
}: {
  lead: CrmLeadComputed;
  config: CrmConfig;
  acoes: ReturnType<typeof useCrmLeads>;
  onAbrirLead: (id: string) => void;
}) {
  const { derived } = lead;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAbrirLead(lead.id)}
      onKeyDown={(evento) => {
        if (evento.key === "Enter") onAbrirLead(lead.id);
      }}
      className={cn(
        "flex cursor-pointer flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center",
        derived.urgencia === "atrasado" && "bg-destructive/5",
        derived.urgencia === "hoje" && "bg-warning/5",
        derived.encerrado && "opacity-60",
      )}
    >
      {/* Quem é, junto do que já se sabe do casamento */}
      <div className="min-w-0 lg:flex-1">
        <p className="truncate font-medium">{lead.nome}</p>
        <p className="truncate text-xs text-muted-foreground">
          {lead.telefone}
          {lead.origem && ` · ${lead.origem}`}
        </p>
        <QualificacaoNaLinha lead={lead} acoes={acoes} className="-ml-2 mt-1" />
      </div>

      {/* Onde está */}
      <div className="lg:w-60 lg:shrink-0">
        <SituacaoBadge
          situacao={derived.situacao}
          etapa={derived.etapaAtual?.nome}
        />
      </div>

      {/* O que fazer */}
      <div className="flex flex-wrap items-center gap-2 lg:w-72 lg:shrink-0">
        {derived.proximoPasso ? (
          <>
            <span className="text-sm">{derived.proximoPasso}</span>
            <QuandoBadge quando={derived.quando} urgencia={derived.urgencia} />
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Encerrado</span>
        )}
      </div>

      {/* Registrar. Largura fixa: sem ela, a linha de um lead que não tem
          botão primário encolhe aqui e desalinha todas as colunas. */}
      <div className="flex shrink-0 items-center gap-2 lg:w-56 lg:justify-end">
        <AcaoRapidaLinha
          lead={lead}
          config={config}
          acoes={acoes}
          onAbrirLead={onAbrirLead}
        />
        <WhatsAppButton telefone={lead.telefone} size="icon" />
      </div>
    </div>
  );
}

// ==========================================
// AUXILIARES
// ==========================================

/**
 * Cada filtro tem a sua urgência: a fila do dia vai por data, o silêncio vai
 * pelo mais abandonado, os novos pelo mais recente.
 */
function ordenar(filtro: FiltroId, buscando: boolean) {
  return (a: CrmLeadComputed, b: CrmLeadComputed): number => {
    if (buscando) return a.nome.localeCompare(b.nome, "pt-BR");

    if (filtro === "silencio") {
      return (b.derived.diasEmSilencio ?? 0) - (a.derived.diasEmSilencio ?? 0);
    }

    if (filtro === "novos") {
      return b.created_at.localeCompare(a.created_at);
    }

    // Pendências primeiro, por data; encerrados no fim.
    const qa = a.derived.quando ?? "9999-12-31";
    const qb = b.derived.quando ?? "9999-12-31";
    if (qa !== qb) return qa < qb ? -1 : 1;
    return a.nome.localeCompare(b.nome, "pt-BR");
  };
}

function Vazio({ buscando, filtro }: { buscando: boolean; filtro: FiltroId }) {
  const mensagens: Record<FiltroId, { titulo: string; dica: string }> = {
    hoje: {
      titulo: "Nada pendente para hoje",
      dica: "Você já passou por todo mundo que precisava de você.",
    },
    aguardando: {
      titulo: "Nenhuma resposta pendente",
      dica: "Todas as conversas em aberto já foram registradas.",
    },
    silencio: {
      titulo: "Ninguém em silêncio",
      dica: "Todo mundo que você procurou respondeu.",
    },
    novos: {
      titulo: "Nenhum lead cadastrado hoje",
      dica: "Use o botão Novo lead para começar.",
    },
    todos: {
      titulo: "Nenhum lead ainda",
      dica: "Cadastre o primeiro contato para começar o atendimento.",
    },
  };

  const { titulo, dica } = buscando
    ? { titulo: "Nada encontrado", dica: "Tente outro nome ou telefone." }
    : mensagens[filtro];

  return (
    <div className="rounded-lg border border-border bg-card py-16 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
      <p className="mt-3 font-medium">{titulo}</p>
      <p className="mt-1 text-sm text-muted-foreground">{dica}</p>
    </div>
  );
}

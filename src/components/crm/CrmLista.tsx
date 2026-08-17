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
 *
 * Abaixo deles vêm os REFINOS — etapa e data do casamento. Eles não competem
 * com os filtros de cima, se somam: "quem vence hoje, está na Proposta e quer
 * casar em março de 2027" é uma pergunta só, e é assim que se escolhe com quem
 * falar quando a lista fica grande.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ListFilter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MONTHS } from "@/constants/visits";
import { hoje } from "@/lib/crm/dates";
import { anoDoCasamento, mesDoCasamento } from "@/lib/crm/lead";
import type { useCrmLeads } from "@/hooks/useCrmLeads";
import type { CrmConfig, CrmLeadComputed } from "@/types/crm.types";
import { QuandoBadge, SituacaoBadge, WhatsAppButton } from "./CrmBadges";
import { AcaoRapidaLinha } from "./AcaoRapida";
import { CadastroRapido } from "./CadastroRapido";
import { QualificacaoNaLinha } from "./Qualificacao";

type FiltroId = "hoje" | "aguardando" | "silencio" | "novos" | "todos";

/** Refino desligado. Não pode ser "" — o Radix reserva a string vazia. */
const TODOS = "__todos";

/** Quem ainda não disse quando casa: é a lista de quem falta perguntar. */
const SEM_ANO = "__sem_ano";

const OPCOES_MES = [
  { valor: TODOS, label: "Qualquer mês" },
  ...MONTHS.map((mes) => ({ valor: mes.value, label: mes.label })),
];

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
  const [etapa, setEtapa] = useState(TODOS);
  const [ano, setAno] = useState(TODOS);
  const [mes, setMes] = useState(TODOS);
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

  const opcoesEtapa = useMemo(
    () => [
      { valor: TODOS, label: "Todas as etapas" },
      ...config.stages.map((s) => ({ valor: s.id, label: s.nome })),
    ],
    [config.stages],
  );

  // Só os anos que alguém realmente citou: uma lista fixa de anos futuros
  // encheria o menu de opções que não devolvem ninguém. O ano escolhido entra
  // junto mesmo que suma dos dados, senão o campo ficaria em branco.
  const opcoesAno = useMemo(() => {
    const encontrados = new Set<string>();
    leads.forEach((lead) => {
      const doLead = anoDoCasamento(lead);
      if (doLead) encontrados.add(doLead);
    });
    if (ano !== TODOS && ano !== SEM_ANO) encontrados.add(ano);

    return [
      { valor: TODOS, label: "Qualquer ano" },
      ...[...encontrados].sort().map((a) => ({ valor: a, label: a })),
      { valor: SEM_ANO, label: "Ainda sem ano" },
    ];
  }, [leads, ano]);

  const refinando = etapa !== TODOS || ano !== TODOS || mes !== TODOS;

  // Etapa e data do casamento estreitam a base ANTES dos filtros de rotina,
  // para que as contagens dos chips digam quantos sobram de fato — um "Hoje 12"
  // que na verdade são 3 depois do refino seria pior do que não contar.
  const refinados = useMemo(() => {
    if (!refinando) return leads;

    return leads.filter((lead) => {
      // Encerrados não têm etapa atual: filtrar por etapa é olhar o que está
      // em aberto, e é isso que se espera ao escolher "Proposta".
      if (etapa !== TODOS && lead.derived.etapaAtual?.id !== etapa) return false;

      if (ano !== TODOS) {
        const doLead = anoDoCasamento(lead);
        if (ano === SEM_ANO ? doLead !== null : doLead !== ano) return false;
      }

      if (mes !== TODOS && mesDoCasamento(lead) !== mes) return false;

      return true;
    });
  }, [leads, refinando, etapa, ano, mes]);

  const contagens = useMemo(() => {
    const mapa = {} as Record<FiltroId, number>;
    FILTROS.forEach((f) => {
      mapa[f.id] = refinados.filter(f.inclui).length;
    });
    return mapa;
  }, [refinados]);

  const visiveis = useMemo(() => {
    const termo = normalizar(busca);
    const digitos = busca.replace(/\D/g, "");
    const ativo = FILTROS.find((f) => f.id === filtro)!;

    // A busca varre tudo: procurar alguém não deve depender do filtro aberto.
    const base = termo
      ? leads.filter(
          (l) =>
            normalizar(l.nome).includes(termo) ||
            // O telefone só entra quando você digitou algum número. Sem esta
            // guarda, procurar por nome deixava `digitos` vazio e
            // `includes("")` é sempre verdadeiro — todo lead passava por aqui
            // e a busca devolvia a lista inteira, como se não filtrasse nada.
            (digitos !== "" && l.telefone.replace(/\D/g, "").includes(digitos)),
        )
      : refinados.filter(ativo.inclui);

    return [...base].sort(ordenar(filtro, !!termo));
  }, [leads, refinados, filtro, busca]);

  const filtroAtivo = FILTROS.find((f) => f.id === filtro)!;
  const buscando = busca.trim() !== "";

  /**
   * Mexer num refino sai da busca, como já acontece ao clicar num filtro: a
   * busca ignora os filtros de propósito, então deixar as duas coisas ligadas
   * ao mesmo tempo mostraria um resultado que contraria os campos na tela.
   */
  const escolher = (definir: (valor: string) => void) => (valor: string) => {
    definir(valor);
    setBusca("");
  };

  const limparRefinos = () => {
    setEtapa(TODOS);
    setAno(TODOS);
    setMes(TODOS);
  };

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

      {/* Refinos: cruzam com o filtro de cima em vez de substituí-lo. */}
      <div className="flex flex-wrap items-center gap-2">
        <ListFilter className="h-4 w-4 shrink-0 text-muted-foreground" />

        <SelectFiltro
          rotulo="Filtrar por etapa"
          valor={etapa}
          aoMudar={escolher(setEtapa)}
          opcoes={opcoesEtapa}
          largura="w-52"
        />
        <SelectFiltro
          rotulo="Filtrar por ano do casamento"
          valor={ano}
          aoMudar={escolher(setAno)}
          opcoes={opcoesAno}
          largura="w-40"
        />
        <SelectFiltro
          rotulo="Filtrar por mês do casamento"
          valor={mes}
          aoMudar={escolher(setMes)}
          opcoes={OPCOES_MES}
          largura="w-40"
        />

        {refinando && (
          <button
            type="button"
            onClick={limparRefinos}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {buscando
          ? `${visiveis.length} resultado${visiveis.length === 1 ? "" : "s"} para “${busca.trim()}”`
          : filtroAtivo.descricao}
      </p>

      {/* Linhas */}
      {visiveis.length === 0 ? (
        <Vazio buscando={buscando} refinando={refinando} filtro={filtro} />
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
        // Só o Enter na própria linha abre a gaveta. Sem esta checagem, o
        // Enter dado dentro de um popover ou menu da linha sobe pela árvore
        // do React — portal não isola evento — e abre a gaveta no meio da
        // digitação.
        if (evento.key === "Enter" && evento.target === evento.currentTarget) {
          onAbrirLead(lead.id);
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center",
        derived.urgencia === "atrasado" && "bg-destructive/5",
        derived.urgencia === "hoje" && "bg-warning/5",
        derived.encerrado && "opacity-60",
      )}
    >
      {/* Quem é, junto do que já se sabe do casamento */}
      <div className="min-w-0 lg:flex-1">
        {/* O sublinhado no hover avisa que a linha toda abre o detalhe. */}
        <p className="truncate font-medium underline-offset-4 group-hover:underline">
          {lead.nome}
        </p>
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
 * Deixa o texto comparável: sem espaço nas pontas, sem caixa e sem acento.
 * O acento sai porque ninguém digita "Thainá" com o acento no meio do
 * expediente — e sem isso o nome certo simplesmente não aparece.
 */
function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

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

/**
 * Um select de refino. Todos têm uma opção "qualquer" como primeiro item e
 * nunca ficam sem valor, então o gatilho já mostra o que está escolhido e não
 * precisa de placeholder. A largura é fixa para a linha não pular de tamanho
 * quando o rótulo selecionado é mais curto que o anterior.
 */
function SelectFiltro({
  rotulo,
  valor,
  aoMudar,
  opcoes,
  largura,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  opcoes: { valor: string; label: string }[];
  largura: string;
}) {
  return (
    <Select value={valor} onValueChange={aoMudar}>
      <SelectTrigger aria-label={rotulo} className={cn("h-9 bg-card", largura)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((opcao) => (
          <SelectItem key={opcao.valor} value={opcao.valor}>
            {opcao.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Vazio({
  buscando,
  refinando,
  filtro,
}: {
  buscando: boolean;
  refinando: boolean;
  filtro: FiltroId;
}) {
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

  // Com um refino ligado o vazio não é boa notícia, é uma seleção que não
  // devolveu ninguém — dizer "você já falou com todo mundo" seria mentira.
  const { titulo, dica } = buscando
    ? { titulo: "Nada encontrado", dica: "Tente outro nome ou telefone." }
    : refinando
      ? {
          titulo: "Nenhum lead com esses filtros",
          dica: "Troque a etapa ou a data do casamento — ou limpe os filtros.",
        }
      : mensagens[filtro];

  const semResultado = buscando || refinando;

  return (
    <div className="rounded-lg border border-border bg-card py-16 text-center">
      {semResultado ? (
        <ListFilter className="mx-auto h-10 w-10 text-muted-foreground" />
      ) : (
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
      )}
      <p className="mt-3 font-medium">{titulo}</p>
      <p className="mt-1 text-sm text-muted-foreground">{dica}</p>
    </div>
  );
}

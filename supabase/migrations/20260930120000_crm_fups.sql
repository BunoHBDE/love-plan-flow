-- FUP (follow-up) do CRM.
--
-- Cada vez que o usuário registra um FUP num lead, nasce uma linha aqui:
-- quem entrou, em qual etapa estava, de quantos dias foi o FUP e se o lead
-- voltou. Entrou de novo no FUP = linha nova (o histórico não é reescrito).
-- Serve a duas coisas: o dia a dia (quem está em FUP agora) e a análise
-- (em qual etapa o FUP mais é necessário, quantos FUPs até o lead voltar).

create table public.crm_fups (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references public.crm_leads(id) on delete cascade,
  dias              integer not null check (dias > 0),
  etapa_id          uuid references public.crm_stages(id) on delete set null,
  etapa_nome        text,
  numero_fup        integer not null default 1,
  proxima_mensagem  date not null,
  iniciado_em       timestamptz not null default now(),
  status            text not null default 'aguardando'
                      check (status in ('aguardando', 'voltou')),
  voltou_em         timestamptz,
  created_by        uuid not null,
  constraint crm_fups_voltou_coerente
    check ((status = 'voltou') = (voltou_em is not null))
);

create index crm_fups_lead_status_idx on public.crm_fups (lead_id, status);
create index crm_fups_status_idx      on public.crm_fups (status);
create index crm_fups_etapa_idx       on public.crm_fups (etapa_id);

alter table public.crm_fups enable row level security;

create policy "Users manage own crm_fups" on public.crm_fups
  for all
  using (exists (
    select 1 from public.crm_leads l
    where l.id = crm_fups.lead_id
      and (l.created_by = auth.uid() or has_role(auth.uid(), 'admin'::app_role))
  ))
  with check (exists (
    select 1 from public.crm_leads l
    where l.id = crm_fups.lead_id
      and (l.created_by = auth.uid() or has_role(auth.uid(), 'admin'::app_role))
  ));

-- ------------------------------------------------------------------
-- Detecção de "voltou"
-- ------------------------------------------------------------------
-- Uma mensagem recebida (inbound) depois do início do FUP marca os FUPs
-- abertos do lead como "voltou". `messages` é preenchida fora do app e o
-- vínculo com o lead (`crm_lead_id`) pode chegar depois, num UPDATE — por
-- isso o gatilho cobre INSERT e UPDATE do vínculo.
create or replace function public.crm_fups_marcar_voltou()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.direction = 'inbound' and new.crm_lead_id is not null then
    update public.crm_fups
       set status = 'voltou',
           voltou_em = coalesce(new.sent_at, now())
     where lead_id = new.crm_lead_id
       and status = 'aguardando'
       and iniciado_em <= coalesce(new.sent_at, now());
  end if;
  return new;
end;
$$;

create trigger trg_crm_fups_voltou_insert
  after insert on public.messages
  for each row execute function public.crm_fups_marcar_voltou();

create trigger trg_crm_fups_voltou_vinculo
  after update of crm_lead_id on public.messages
  for each row
  when (old.crm_lead_id is distinct from new.crm_lead_id)
  execute function public.crm_fups_marcar_voltou();

-- Rede de segurança: reconcilia FUPs abertos com mensagens recebidas que o
-- gatilho não viu (carga em lote, ingestão que atravessa o vínculo etc.).
-- Idempotente; o front chama ao carregar a lista e dá para agendar no cron.
create or replace function public.crm_fups_reconciliar()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  atualizados integer;
begin
  with resposta as (
    select f.id, min(m.sent_at) as quando
      from public.crm_fups f
      join public.crm_leads l on l.id = f.lead_id
      join public.messages m
        on m.crm_lead_id = f.lead_id
       and m.direction = 'inbound'
       and m.sent_at >= f.iniciado_em
     where f.status = 'aguardando'
       and (l.created_by = auth.uid()
            or public.has_role(auth.uid(), 'admin'::app_role)
            or auth.uid() is null)
     group by f.id
  )
  update public.crm_fups f
     set status = 'voltou', voltou_em = r.quando
    from resposta r
   where f.id = r.id;
  get diagnostics atualizados = row_count;
  return atualizados;
end;
$$;

revoke all on function public.crm_fups_reconciliar() from public, anon;
grant execute on function public.crm_fups_reconciliar() to authenticated;

-- ------------------------------------------------------------------
-- Análise
-- ------------------------------------------------------------------
-- Por etapa: quantos FUPs, quantos voltaram e a taxa.
create or replace view public.crm_fups_resumo
with (security_invoker = true) as
select coalesce(etapa_nome, 'Sem etapa')                      as etapa,
       count(*)                                               as total,
       count(*) filter (where status = 'voltou')              as voltaram,
       round(100.0 * count(*) filter (where status = 'voltou')
             / nullif(count(*), 0), 1)                        as taxa_volta_pct
  from public.crm_fups
 group by 1;

-- Por lead que voltou: em qual FUP (1º, 2º…) a resposta veio.
create or replace view public.crm_fups_ate_voltar
with (security_invoker = true) as
select lead_id,
       min(numero_fup) filter (where status = 'voltou') as fups_ate_voltar,
       count(*)                                         as fups_total
  from public.crm_fups
 group by lead_id;

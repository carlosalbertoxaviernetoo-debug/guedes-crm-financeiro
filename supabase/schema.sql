-- ============================================================
-- Guedes CRM Financeiro — Complete Supabase Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- products table
create table if not exists produtos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  imagem_url  text,
  custo       numeric(12, 2) not null default 0 check (custo >= 0),
  preco_venda numeric(12, 2) not null default 0 check (preco_venda >= 0),
  estoque     integer not null default 0 check (estoque >= 0),
  categoria   text,
  descricao   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- clients table
create table if not exists clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  telefone    text,
  cpf         text,
  instagram   text,
  cidade      text,
  observacoes text,
  created_at  timestamptz not null default now()
);

-- sales table
create table if not exists vendas (
  id              uuid primary key default gen_random_uuid(),
  produto_id      uuid not null references produtos(id) on delete restrict,
  cliente_id      uuid references clientes(id) on delete set null,
  quantidade      integer not null check (quantidade > 0),
  preco_unitario  numeric(12, 2) not null check (preco_unitario >= 0),
  custo_unitario  numeric(12, 2) not null check (custo_unitario >= 0),
  valor_total     numeric(12, 2) not null check (valor_total >= 0),
  lucro           numeric(12, 2) not null,
  observacoes     text,
  created_at      timestamptz not null default now()
);

-- goals table
create table if not exists metas (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('mensal', 'anual')),
  valor      numeric(12, 2) not null check (valor > 0),
  mes        integer check (mes between 1 and 12),
  ano        integer not null,
  created_at timestamptz not null default now(),
  -- only one goal per period per type
  constraint metas_unique_mensal unique (tipo, mes, ano),
  constraint metas_mensal_requires_mes check (
    (tipo = 'mensal' and mes is not null) or
    (tipo = 'anual' and mes is null)
  )
);

-- monthly history snapshot table
create table if not exists historico_mensal (
  id                uuid primary key default gen_random_uuid(),
  mes               integer not null check (mes between 1 and 12),
  ano               integer not null,
  faturamento_bruto numeric(12, 2) not null default 0,
  lucro_liquido     numeric(12, 2) not null default 0,
  total_vendas      integer not null default 0,
  produtos_vendidos integer not null default 0,
  meta_mensal       numeric(12, 2),
  meta_atingida     boolean,
  dados_json        jsonb,
  created_at        timestamptz not null default now(),
  constraint historico_mensal_unique unique (mes, ano)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_produtos_created_at on produtos(created_at desc);
create index if not exists idx_clientes_created_at on clientes(created_at desc);

create index if not exists idx_vendas_created_at    on vendas(created_at desc);
create index if not exists idx_vendas_produto_id    on vendas(produto_id);
create index if not exists idx_vendas_cliente_id    on vendas(cliente_id);
create index if not exists idx_vendas_period        on vendas(date_trunc('month', created_at));

create index if not exists idx_metas_lookup         on metas(tipo, ano, mes);
create index if not exists idx_historico_period     on historico_mensal(ano, mes);

-- ============================================================
-- TRIGGER: auto-update produtos.updated_at
-- ============================================================

create or replace function trg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_produtos_updated_at on produtos;
create trigger set_produtos_updated_at
  before update on produtos
  for each row execute function trg_set_updated_at();

-- ============================================================
-- VIEWS
-- ============================================================

-- Full sales view joining vendas + produtos + clientes
create or replace view vw_vendas_completas as
select
  v.id,
  v.produto_id,
  v.cliente_id,
  v.quantidade,
  v.preco_unitario,
  v.custo_unitario,
  v.valor_total,
  v.lucro,
  v.observacoes,
  v.created_at,

  -- produto fields
  p.nome              as produto_nome,
  p.imagem_url        as produto_imagem_url,
  p.categoria         as produto_categoria,

  -- cliente fields (nullable — anonymous sales allowed)
  c.nome              as cliente_nome,
  c.telefone          as cliente_telefone,
  c.cidade            as cliente_cidade
from vendas v
join produtos p on p.id = v.produto_id
left join clientes c on c.id = v.cliente_id;

-- Per-client stats view
create or replace view vw_cliente_stats as
select
  cl.id,
  cl.nome,
  cl.telefone,
  cl.cpf,
  cl.instagram,
  cl.cidade,
  cl.observacoes,
  cl.created_at,
  coalesce(stats.total_compras, 0)::integer  as total_compras,
  coalesce(stats.total_gasto,   0)           as total_gasto,
  stats.ultima_compra
from clientes cl
left join (
  select
    cliente_id,
    count(*)           as total_compras,
    sum(valor_total)   as total_gasto,
    max(created_at)    as ultima_compra
  from vendas
  where cliente_id is not null
  group by cliente_id
) stats on stats.cliente_id = cl.id;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table produtos        enable row level security;
alter table clientes        enable row level security;
alter table vendas          enable row level security;
alter table metas           enable row level security;
alter table historico_mensal enable row level security;

-- Authenticated users (single-admin system) get full access to all tables

create policy "authenticated_all_produtos"
  on produtos for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_clientes"
  on clientes for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_vendas"
  on vendas for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_metas"
  on metas for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_historico"
  on historico_mensal for all
  to authenticated
  using (true)
  with check (true);

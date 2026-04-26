-- Supabase ダッシュボードの SQL Editor で実行してください

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS を有効化
alter table public.tasks enable row level security;

-- 認証なしのデモ用ポリシー (anon キーから誰でも CRUD 可能)
-- 本番では auth.uid() ベースの所有者ポリシーへ差し替えること
create policy "anon can read tasks"
  on public.tasks for select
  to anon, authenticated
  using (true);

create policy "anon can insert tasks"
  on public.tasks for insert
  to anon, authenticated
  with check (true);

create policy "anon can update tasks"
  on public.tasks for update
  to anon, authenticated
  using (true) with check (true);

create policy "anon can delete tasks"
  on public.tasks for delete
  to anon, authenticated
  using (true);

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.boards (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scraps (
  id text primary key,
  board_id text not null references public.boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('note', 'image', 'link')),
  x double precision not null,
  y double precision not null,
  width double precision not null,
  height double precision not null,
  title text,
  body text,
  src text,
  alt text,
  caption text,
  url text,
  site_name text,
  description text,
  preview_image text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists boards_user_id_idx on public.boards (user_id);
create index if not exists scraps_user_id_idx on public.scraps (user_id);
create index if not exists scraps_board_id_idx on public.scraps (board_id);

drop trigger if exists set_boards_updated_at on public.boards;
create trigger set_boards_updated_at
before update on public.boards
for each row
execute function public.set_updated_at();

drop trigger if exists set_scraps_updated_at on public.scraps;
create trigger set_scraps_updated_at
before update on public.scraps
for each row
execute function public.set_updated_at();

alter table public.boards enable row level security;
alter table public.scraps enable row level security;

drop policy if exists "Users can view their own boards" on public.boards;
create policy "Users can view their own boards"
on public.boards
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own boards" on public.boards;
create policy "Users can create their own boards"
on public.boards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own boards" on public.boards;
create policy "Users can update their own boards"
on public.boards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own boards" on public.boards;
create policy "Users can delete their own boards"
on public.boards
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own scraps" on public.scraps;
create policy "Users can view their own scraps"
on public.scraps
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own scraps" on public.scraps;
create policy "Users can create their own scraps"
on public.scraps
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.boards
    where boards.id = board_id
      and boards.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update their own scraps" on public.scraps;
create policy "Users can update their own scraps"
on public.scraps
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.boards
    where boards.id = board_id
      and boards.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete their own scraps" on public.scraps;
create policy "Users can delete their own scraps"
on public.scraps
for delete
to authenticated
using ((select auth.uid()) = user_id);

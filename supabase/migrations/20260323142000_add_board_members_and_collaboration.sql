create table if not exists public.board_members (
  board_id text not null references public.boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (board_id, user_id)
);

create index if not exists board_members_user_id_idx on public.board_members (user_id);

create or replace function public.ensure_board_owner_membership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.board_members (
    board_id,
    user_id,
    role,
    invited_by
  )
  values (
    new.id,
    new.user_id,
    'owner',
    new.user_id
  )
  on conflict (board_id, user_id) do update
  set
    role = 'owner',
    invited_by = excluded.invited_by;

  return new;
end;
$$;

drop trigger if exists ensure_board_owner_membership on public.boards;
create trigger ensure_board_owner_membership
after insert on public.boards
for each row
execute function public.ensure_board_owner_membership();

insert into public.board_members (
  board_id,
  user_id,
  role,
  invited_by
)
select
  boards.id,
  boards.user_id,
  'owner',
  boards.user_id
from public.boards
on conflict (board_id, user_id) do update
set role = 'owner';

create or replace function public.is_board_owner(
  p_board_id text,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards as board_row
    where board_row.id = p_board_id
      and board_row.user_id = p_user_id
      and board_row.deleted_at is null
  );
$$;

create or replace function public.can_access_board(
  p_board_id text,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards as board_row
    where board_row.id = p_board_id
      and board_row.deleted_at is null
      and (
        board_row.user_id = p_user_id
        or exists (
          select 1
          from public.board_members as member_row
          where member_row.board_id = board_row.id
            and member_row.user_id = p_user_id
            and member_row.role in ('owner', 'editor')
        )
      )
  );
$$;

revoke all on function public.is_board_owner(text, uuid) from public;
grant execute on function public.is_board_owner(text, uuid) to authenticated;

revoke all on function public.can_access_board(text, uuid) from public;
grant execute on function public.can_access_board(text, uuid) to authenticated;

alter table public.board_members enable row level security;

drop policy if exists "Users can view accessible boards" on public.boards;
drop policy if exists "Users can create their own boards" on public.boards;
drop policy if exists "Users can update accessible boards" on public.boards;
drop policy if exists "Owners can delete their own boards" on public.boards;
drop policy if exists "Users can view their own boards" on public.boards;
drop policy if exists "Users can update their own boards" on public.boards;
drop policy if exists "Users can delete their own boards" on public.boards;

create policy "Users can view accessible boards"
on public.boards
for select
to authenticated
using (public.can_access_board(id, (select auth.uid())));

create policy "Users can create their own boards"
on public.boards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update accessible boards"
on public.boards
for update
to authenticated
using (public.can_access_board(id, (select auth.uid())))
with check (public.can_access_board(id, (select auth.uid())));

create policy "Owners can delete their own boards"
on public.boards
for delete
to authenticated
using (public.is_board_owner(id, (select auth.uid())));

drop policy if exists "Users can view accessible notes" on public.notes;
drop policy if exists "Users can create notes on accessible boards" on public.notes;
drop policy if exists "Users can update notes on accessible boards" on public.notes;
drop policy if exists "Users can delete notes on accessible boards" on public.notes;
drop policy if exists "Users can view their own notes" on public.notes;
drop policy if exists "Users can create their own notes" on public.notes;
drop policy if exists "Users can update their own notes" on public.notes;
drop policy if exists "Users can delete their own notes" on public.notes;

create policy "Users can view accessible notes"
on public.notes
for select
to authenticated
using (public.can_access_board(board_id, (select auth.uid())));

create policy "Users can create notes on accessible boards"
on public.notes
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and public.can_access_board(board_id, (select auth.uid()))
);

create policy "Users can update notes on accessible boards"
on public.notes
for update
to authenticated
using (public.can_access_board(board_id, (select auth.uid())))
with check (public.can_access_board(board_id, (select auth.uid())));

create policy "Users can delete notes on accessible boards"
on public.notes
for delete
to authenticated
using (public.can_access_board(board_id, (select auth.uid())));

drop policy if exists "Users can view their own memberships" on public.board_members;
drop policy if exists "Board owners can view memberships" on public.board_members;
drop policy if exists "Board owners can insert memberships" on public.board_members;
drop policy if exists "Board owners can update memberships" on public.board_members;
drop policy if exists "Board owners can delete memberships" on public.board_members;

create policy "Users can view their own memberships"
on public.board_members
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Board owners can view memberships"
on public.board_members
for select
to authenticated
using (public.is_board_owner(board_id, (select auth.uid())));

create policy "Board owners can insert memberships"
on public.board_members
for insert
to authenticated
with check (public.is_board_owner(board_id, (select auth.uid())));

create policy "Board owners can update memberships"
on public.board_members
for update
to authenticated
using (public.is_board_owner(board_id, (select auth.uid())))
with check (public.is_board_owner(board_id, (select auth.uid())));

create policy "Board owners can delete memberships"
on public.board_members
for delete
to authenticated
using (public.is_board_owner(board_id, (select auth.uid())));

create or replace function public.invite_board_member(
  p_board_id text,
  p_invitee_email text,
  p_role text default 'editor'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invitee_user_id uuid;
  v_normalized_email text := lower(trim(coalesce(p_invitee_email, '')));
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not public.is_board_owner(p_board_id, auth.uid()) then
    raise exception 'Only board owners can invite collaborators.';
  end if;

  if v_normalized_email = '' then
    raise exception 'Invite email is required.';
  end if;

  if p_role is null or p_role <> 'editor' then
    raise exception 'Unsupported collaborator role.';
  end if;

  select users.id
  into v_invitee_user_id
  from auth.users as users
  where lower(users.email) = v_normalized_email
  limit 1;

  if v_invitee_user_id is null then
    raise exception 'No user exists with that email.';
  end if;

  insert into public.board_members (
    board_id,
    user_id,
    role,
    invited_by
  )
  values (
    p_board_id,
    v_invitee_user_id,
    p_role,
    auth.uid()
  )
  on conflict (board_id, user_id) do update
  set
    role = excluded.role,
    invited_by = excluded.invited_by;

  return v_invitee_user_id;
end;
$$;

revoke all on function public.invite_board_member(text, text, text) from public;
grant execute on function public.invite_board_member(text, text, text) to authenticated;

create or replace function public.save_boards_snapshot(
  p_user_id uuid,
  p_boards jsonb,
  p_notes jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_soft_deleted_at timestamptz := timezone('utc', now());
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  create temp table temp_boards (
    id text primary key,
    title text not null,
    description text not null
  ) on commit drop;

  create temp table temp_notes (
    id text primary key,
    board_id text not null,
    type text not null,
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
    preview_image text
  ) on commit drop;

  if coalesce(jsonb_typeof(p_boards), 'null') = 'array' then
    insert into temp_boards (id, title, description)
    select id, title, description
    from jsonb_to_recordset(p_boards) as payload(
      id text,
      title text,
      description text
    );
  end if;

  if coalesce(jsonb_typeof(p_notes), 'null') = 'array' then
    insert into temp_notes (
      id,
      board_id,
      type,
      x,
      y,
      width,
      height,
      title,
      body,
      src,
      alt,
      caption,
      url,
      site_name,
      description,
      preview_image
    )
    select
      id,
      board_id,
      type,
      x,
      y,
      width,
      height,
      title,
      body,
      src,
      alt,
      caption,
      url,
      site_name,
      description,
      preview_image
    from jsonb_to_recordset(p_notes) as payload(
      id text,
      board_id text,
      type text,
      x double precision,
      y double precision,
      width double precision,
      height double precision,
      title text,
      body text,
      src text,
      alt text,
      caption text,
      url text,
      site_name text,
      description text,
      preview_image text
    );
  end if;

  if exists (
    select 1
    from temp_boards as incoming
    join public.boards as existing on existing.id = incoming.id
    where not public.can_access_board(existing.id, p_user_id)
  ) then
    raise exception 'Unauthorized board snapshot.';
  end if;

  if exists (
    select 1
    from temp_notes as incoming
    join public.notes as existing on existing.id = incoming.id
    where not public.can_access_board(existing.board_id, p_user_id)
  ) then
    raise exception 'Unauthorized note snapshot.';
  end if;

  update public.boards as existing
  set deleted_at = v_soft_deleted_at
  where existing.user_id = p_user_id
    and existing.deleted_at is null
    and not exists (
      select 1
      from temp_boards as incoming
      where incoming.id = existing.id
    );

  update public.notes as existing
  set deleted_at = v_soft_deleted_at
  where existing.deleted_at is null
    and public.can_access_board(existing.board_id, p_user_id)
    and exists (
      select 1
      from temp_boards as incoming_board
      where incoming_board.id = existing.board_id
    )
    and not exists (
      select 1
      from temp_notes as incoming_note
      where incoming_note.id = existing.id
    );

  insert into public.boards (
    id,
    user_id,
    title,
    description,
    deleted_at
  )
  select
    incoming.id,
    p_user_id,
    incoming.title,
    incoming.description,
    null
  from temp_boards as incoming
  on conflict (id) do update
  set
    title = excluded.title,
    description = excluded.description,
    deleted_at = null;

  insert into public.notes (
    id,
    board_id,
    user_id,
    type,
    x,
    y,
    width,
    height,
    title,
    body,
    src,
    alt,
    caption,
    url,
    site_name,
    description,
    preview_image,
    deleted_at
  )
  select
    incoming.id,
    incoming.board_id,
    p_user_id,
    incoming.type,
    incoming.x,
    incoming.y,
    incoming.width,
    incoming.height,
    incoming.title,
    incoming.body,
    incoming.src,
    incoming.alt,
    incoming.caption,
    incoming.url,
    incoming.site_name,
    incoming.description,
    incoming.preview_image,
    null
  from temp_notes as incoming
  where exists (
    select 1
    from temp_boards as incoming_board
    where incoming_board.id = incoming.board_id
  )
    and public.can_access_board(incoming.board_id, p_user_id)
  on conflict (id) do update
  set
    board_id = excluded.board_id,
    type = excluded.type,
    x = excluded.x,
    y = excluded.y,
    width = excluded.width,
    height = excluded.height,
    title = excluded.title,
    body = excluded.body,
    src = excluded.src,
    alt = excluded.alt,
    caption = excluded.caption,
    url = excluded.url,
    site_name = excluded.site_name,
    description = excluded.description,
    preview_image = excluded.preview_image,
    deleted_at = null;
end;
$$;

revoke all on function public.save_boards_snapshot(uuid, jsonb, jsonb) from public;
grant execute on function public.save_boards_snapshot(uuid, jsonb, jsonb) to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_rel publication_rel
    join pg_publication publication on publication.oid = publication_rel.prpubid
    join pg_class relation on relation.oid = publication_rel.prrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where publication.pubname = 'supabase_realtime'
      and namespace.nspname = 'public'
      and relation.relname = 'board_members'
  ) then
    alter publication supabase_realtime add table public.board_members;
  end if;
end
$$;

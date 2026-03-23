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
  where existing.user_id = p_user_id
    and existing.deleted_at is null
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
    user_id = excluded.user_id,
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
  on conflict (id) do update
  set
    board_id = excluded.board_id,
    user_id = excluded.user_id,
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

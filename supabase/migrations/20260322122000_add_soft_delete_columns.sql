alter table public.boards
add column if not exists deleted_at timestamptz;

alter table public.notes
add column if not exists deleted_at timestamptz;

create index if not exists boards_user_id_deleted_at_idx
on public.boards (user_id, deleted_at);

create index if not exists notes_user_id_deleted_at_idx
on public.notes (user_id, deleted_at);

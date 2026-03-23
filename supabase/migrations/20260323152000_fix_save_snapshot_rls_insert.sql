alter function public.save_boards_snapshot(uuid, jsonb, jsonb)
security definer;

alter function public.save_boards_snapshot(uuid, jsonb, jsonb)
set search_path = public;

revoke all on function public.save_boards_snapshot(uuid, jsonb, jsonb) from public;
grant execute on function public.save_boards_snapshot(uuid, jsonb, jsonb) to authenticated;

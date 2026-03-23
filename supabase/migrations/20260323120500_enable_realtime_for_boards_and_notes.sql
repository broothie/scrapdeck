do $$
begin
  if not exists (
    select 1
    from pg_publication_rel publication_rel
    join pg_publication publication on publication.oid = publication_rel.prpubid
    join pg_class relation on relation.oid = publication_rel.prrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where publication.pubname = 'supabase_realtime'
      and namespace.nspname = 'public'
      and relation.relname = 'boards'
  ) then
    alter publication supabase_realtime add table public.boards;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel publication_rel
    join pg_publication publication on publication.oid = publication_rel.prpubid
    join pg_class relation on relation.oid = publication_rel.prrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where publication.pubname = 'supabase_realtime'
      and namespace.nspname = 'public'
      and relation.relname = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end
$$;

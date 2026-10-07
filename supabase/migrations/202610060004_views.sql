begin;
-- Caller RLS is retained for both sides of the join.
create view public.process_overview with (security_invoker=true) as
 select p.*,v.content as published_content
 from public.processes p left join public.process_versions v on v.process_id=p.id and v.version=p.published_version;
grant select on public.process_overview to authenticated;
revoke all on public.process_overview from anon;
commit;

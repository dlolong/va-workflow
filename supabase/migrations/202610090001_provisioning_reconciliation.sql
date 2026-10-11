begin;
-- Upgrade aliases share the original durable record IDs. Existing APIs/grants remain unchanged.
create function public.reconcile_workspace_setup(
 p_workspace uuid,p_target uuid,p_owner uuid,p_setup_key text,p_items jsonb,
 p_previous_setup_keys text[],p_apply boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); entry private.provisioning_items; item jsonb; effective jsonb;
 effective_items jsonb:='[]'; plan jsonb:='[]'; action jsonb;
 namespaces text[]; k text; kind text; ident uuid; state text; reason text;
 candidates integer; proc public.processes; task public.runs; conflicts integer:=0;
 deferred integer:=0; result jsonb;
begin
 -- The original preflight verifies actor, workspace lock, owner/VA and every workflow/reference.
 -- Its title/input conflicts are resolved below through prior durable identities, never by overwrite.
 perform public.provision_workspace_setup(p_workspace,p_target,p_owner,p_setup_key,p_items,false);
 if p_previous_setup_keys is null or cardinality(p_previous_setup_keys) not between 1 and 10
 or p_setup_key=any(p_previous_setup_keys)
 or exists(select 1 from unnest(p_previous_setup_keys) x where x is null or x !~ '^[a-zA-Z0-9_-]{1,60}$')
 or cardinality(p_previous_setup_keys)<>(select count(distinct x) from unnest(p_previous_setup_keys) x)
 then raise exception 'Invalid previous setup namespaces.'; end if;
 namespaces:=array_prepend(p_setup_key,p_previous_setup_keys);
 for item in select value from jsonb_array_elements(p_items) loop
  k:=item->>'key'; kind:=item->>'kind'; ident:=null; state:='create'; reason:=null; effective:=item;
  if kind not in ('process','preparation') then raise exception 'Reconciliation supports process drafts and preparation only.'; end if;
  select count(distinct record_id) into candidates from private.provisioning_items
   where workspace_id=p_workspace and target_id=p_target and setup_key=any(namespaces) and item_key=k;
  if candidates>1 then state:='conflict'; reason:='Multiple durable records for this logical key.';
  elsif candidates=1 then
   select * into entry from private.provisioning_items
    where workspace_id=p_workspace and target_id=p_target and setup_key=any(namespaces) and item_key=k
    order by (setup_key=p_setup_key) desc,created_at desc limit 1;
   ident:=entry.record_id;
   if exists(select 1 from private.provisioning_items pi where pi.workspace_id=p_workspace and pi.target_id=p_target
     and pi.setup_key=any(namespaces) and pi.item_key=k and pi.kind<>item->>'kind')
   then state:='conflict'; reason:='Durable item kind conflict.';
   elsif kind='process' then
    select * into proc from public.processes where id=ident and workspace_id=p_workspace;
    if not found then state:='conflict'; reason:='Missing or foreign process record.';
    elsif proc.draft=item->'content' then state:='reuse_preserved';
    elsif proc.archived or proc.published_version is not null or proc.draft is distinct from entry.input->'content'
    then state:='deferred'; reason:='Edited, published or archived draft preserved for human reconciliation.'; effective:=entry.input;
    else state:='update_draft'; end if;
   else
    select * into task from public.runs where id=ident and workspace_id=p_workspace and assignee_id=p_target;
    if not found or task.process_id is not null or task.schedule_id is not null
    then state:='conflict'; reason:='Missing, reassigned, foreign or operational preparation record.';
    else
     -- Never rewrite an existing run snapshot, even when unstarted. Keep answers/history/links intact.
     effective:=entry.input; state:='reuse_preserved';
     if entry.input<>item then reason:='Existing preparation snapshot retained; revised instructions deferred to human review.'; end if;
    end if;
   end if;
  else
   -- A title/logical-key candidate without provenance needs explicit reconciliation, not a new copy.
   if kind='process' then
    select count(*) into candidates from public.processes where workspace_id=p_workspace
     and (title=item->'content'->>'title' or split_part(title,' ',1)=k);
   else
    select count(*) into candidates from public.runs where workspace_id=p_workspace
     and (title=item->'content'->>'title' or reference in (
       select 'setup:'||x||':'||p_target||':'||k from unnest(namespaces) x));
   end if;
   if candidates>0 then state:='conflict'; reason:='Unledgered matching record exists; no automatic adoption or duplicate.'; end if;
  end if;
  if state='conflict' then conflicts:=conflicts+1; end if;
  if state='deferred' then deferred:=deferred+1; end if;
  effective_items:=effective_items||jsonb_build_array(effective);
  plan:=plan||jsonb_build_array(jsonb_build_object('key',k,'kind',kind,'state',state,'id',ident,'reason',reason));
 end loop;
 if p_apply and conflicts>0 then raise exception 'Reconciliation conflicts; no records changed.'; end if;
 if p_apply then
  for action in select value from jsonb_array_elements(plan) loop
   k:=action->>'key'; ident:=(action->>'id')::uuid;
   select value into effective from jsonb_array_elements(effective_items) where value->>'key'=k;
   if action->>'state'='update_draft' then
    perform public.app_command(p_workspace,'save_process',jsonb_build_object(
      'request_id',pg_catalog.gen_random_uuid(),'id',ident,'content',effective->'content'));
   end if;
   if ident is not null then
    insert into private.provisioning_items(workspace_id,target_id,setup_key,item_key,kind,input,record_id,created_by)
     values(p_workspace,p_target,p_setup_key,k,action->>'kind',effective,ident,actor)
     on conflict(workspace_id,target_id,setup_key,item_key) do update set input=excluded.input;
   end if;
  end loop;
  -- Uses the original atomic creation path and its scoped notification-email suppression.
  result:=public.provision_workspace_setup(p_workspace,p_target,p_owner,p_setup_key,effective_items,true);
  if (result->>'conflicts')::integer<>0 then raise exception 'Creation conflict; reconciliation rolled back.'; end if;
  perform private.audit(p_workspace,null,'workspace_setup_reconciled',jsonb_build_object(
   'setup_key',p_setup_key,'previous_setup_keys',p_previous_setup_keys,'target_id',p_target,'deferred',deferred));
 end if;
 return jsonb_build_object('applied',p_apply,'conflicts',conflicts,'deferred',deferred,'items',plan);
end $$;
revoke all on function public.reconcile_workspace_setup(uuid,uuid,uuid,text,jsonb,text[],boolean) from public,anon,service_role;
grant execute on function public.reconcile_workspace_setup(uuid,uuid,uuid,text,jsonb,text[],boolean) to authenticated;
commit;

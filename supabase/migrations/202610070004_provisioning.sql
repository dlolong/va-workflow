begin;
-- Durable setup identity is independent of editable titles and expiring retry receipts.
create table private.provisioning_items (
 workspace_id uuid not null references public.workspaces(id),
 target_id uuid not null references public.profiles(id),
 setup_key text not null,
 item_key text not null,
 kind text not null check(kind in ('process','preparation','training')),
 input jsonb not null,
 record_id uuid not null,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 primary key(workspace_id,target_id,setup_key,item_key)
);
revoke all on private.provisioning_items from public,anon,authenticated;

create function public.provision_workspace_setup(p_workspace uuid,p_target uuid,p_owner uuid,p_setup_key text,p_items jsonb,p_apply boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); item jsonb; entry private.provisioning_items; k text; kind text;
 content jsonb; payload jsonb; result jsonb; ident uuid; v_process_id uuid; trainer uuid;
 ids jsonb:='{}'; report jsonb:='[]'; existing_notifications uuid[]; conflicts integer:=0;
 pass integer; state text; reused boolean; row_found boolean; reference_key text;
begin
 if actor is null or coalesce(public.workspace_role(p_workspace),'') not in ('owner','manager') then raise exception 'Owner or manager session required.' using errcode='42501'; end if;
 -- Same lock as normal commands; concurrent provisioning attempts serialize.
 perform 1 from public.workspaces where id=p_workspace for update;
 if coalesce(public.workspace_role(p_workspace),'') not in ('owner','manager') then raise exception 'Workspace access revoked.'; end if;
 if not exists(select 1 from public.workspaces where id=p_workspace and owner_id=p_owner and archived_at is null) then raise exception 'Confirmed owner/workspace mismatch or archived workspace.'; end if;
 if p_owner=p_target or not exists(select 1 from public.memberships where workspace_id=p_workspace and user_id=p_target and role='va' and active) then raise exception 'Target must be an active VA with a separate owner.'; end if;
 if not exists(select 1 from public.memberships where workspace_id=p_workspace and user_id=p_owner and role='owner' and active) then raise exception 'Owner membership mismatch.'; end if;
 if p_setup_key is null or p_setup_key !~ '^[a-zA-Z0-9_-]{1,60}$' or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 100 or length(p_items::text)>1000000 then raise exception 'Invalid setup manifest.'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) x group by x->>'key' having count(*)>1) then raise exception 'Duplicate setup item keys.'; end if;
 -- Pass one validates every item without mutations. Pass two applies atomically.
 for pass in 1..(case when p_apply then 2 else 1 end) loop
  for item in select value from jsonb_array_elements(p_items) order by case value->>'kind' when 'process' then 0 when 'preparation' then 1 else 2 end loop
   k:=item->>'key'; kind:=item->>'kind';
   if k is null or k !~ '^[a-zA-Z0-9_-]{1,60}$' or kind is null or kind not in ('process','preparation','training') then raise exception 'Invalid setup item.'; end if;
   select * into entry from private.provisioning_items where workspace_id=p_workspace and target_id=p_target and setup_key=p_setup_key and item_key=k;
   reused:=found; state:='create'; ident:=null;
   if reused then
    ident:=entry.record_id;
    if entry.input<>item or entry.kind<>kind then state:='conflict';
    else
     if kind='process' then select exists(select 1 from public.processes where workspace_id=p_workspace and id=ident) into row_found;
     elsif kind='preparation' then select exists(select 1 from public.runs where workspace_id=p_workspace and id=ident and assignee_id=p_target) into row_found;
     else select exists(select 1 from public.training where workspace_id=p_workspace and id=ident and user_id=p_target) into row_found;
     end if;
     state:=case when row_found then 'reuse_preserved' else 'conflict' end;
    end if;
   end if;
   if kind in ('process','preparation') then
    content:=item->'content'; perform private.validate_workflow(content);
    if kind='preparation' and ((content->>'review_required')::boolean or exists(select 1 from jsonb_array_elements(content->'steps') s where (s->>'approval_before')::boolean)) then raise exception 'Preparation cannot require or substitute operational approval.'; end if;
    if kind='preparation' and item ? 'process_keys' then
     if jsonb_typeof(item->'process_keys') is distinct from 'array' then raise exception 'Invalid process references.'; end if;
     for reference_key in select jsonb_array_elements_text(item->'process_keys') loop
      if not exists(select 1 from jsonb_array_elements(p_items) x where x->>'key'=reference_key and x->>'kind'='process') then raise exception 'Unknown preparation process reference.'; end if;
     end loop;
    end if;
    if not reused then
     if kind='process' then
      if exists(select 1 from public.processes where workspace_id=p_workspace and title=content->>'title') then state:='conflict'; end if;
     else
      reference_key:='setup:'||p_setup_key||':'||p_target||':'||k;
      if exists(select 1 from public.runs where workspace_id=p_workspace and (reference=reference_key or (assignee_id=p_target and title=content->>'title'))) then state:='conflict'; end if;
     end if;
    end if;
   else
    trainer:=(item->>'trainer_id')::uuid;
    if trainer is null or trainer=p_target then raise exception 'A verified separate trainer is required.'; end if;
    perform private.assert_member(p_workspace,trainer);
    if not exists(select 1 from jsonb_array_elements(p_items) x where x->>'key'=item->>'process_key' and x->>'kind'='process') then raise exception 'Unknown training process key.'; end if;
    if not reused and ids ? (item->>'process_key') and exists(select 1 from public.training where workspace_id=p_workspace and process_id=(ids->>(item->>'process_key'))::uuid and user_id=p_target) then state:='conflict'; end if;
   end if;
   if kind='process' and ident is not null then ids:=ids||jsonb_build_object(k,ident); end if;
   if pass=1 then
    report:=report||jsonb_build_array(jsonb_build_object('key',k,'kind',kind,'state',state,'id',ident));
    if state='conflict' then conflicts:=conflicts+1; end if;
   elsif not reused then
    if kind='process' then
     result:=public.app_command(p_workspace,'save_process',jsonb_build_object('request_id',pg_catalog.gen_random_uuid(),'id',null,'content',content));
     ident:=(result->>'id')::uuid; ids:=ids||jsonb_build_object(k,ident);
    elsif kind='preparation' then
     -- Resolve only IDs created/reused in this same manifest. Links stay inside this workspace.
     if item ? 'process_keys' then
      for reference_key in select jsonb_array_elements_text(item->'process_keys') loop
       if not ids ? reference_key then raise exception 'Preparation process reference unresolved.'; end if;
       content:=jsonb_set(content,'{sop}',to_jsonb((content->>'sop')||E'\nRelated draft: /workspaces/'||p_workspace||'/processes#edit-process-'||(ids->>reference_key)));
      end loop;
     end if;
     select coalesce(array_agg(id),'{}') into existing_notifications from public.notifications where workspace_id=p_workspace;
     payload:=jsonb_build_object('request_id',pg_catalog.gen_random_uuid(),'process_id',null,'content',content,'assignee_id',p_target,'reviewer_id',null,'due_at',null,'reference','setup:'||p_setup_key||':'||p_target||':'||k,'source_url','','priority','normal');
     result:=public.app_command(p_workspace,'create_run',payload); ident:=(result->>'id')::uuid;
     -- Suppress only mail jobs just created in this transaction. In-app notices/audit remain truthful.
     delete from private.email_outbox o using public.notifications n where o.notification_id=n.id and n.workspace_id=p_workspace and n.run_id=ident and not(n.id=any(existing_notifications));
    else
     v_process_id:=(ids->>(item->>'process_key'))::uuid;
     if v_process_id is null or exists(select 1 from public.training where workspace_id=p_workspace and public.training.process_id=v_process_id and user_id=p_target) then raise exception 'Training already exists or process unresolved; refusing overwrite.'; end if;
     perform public.app_command(p_workspace,'save_training',jsonb_build_object('request_id',pg_catalog.gen_random_uuid(),'process_id',v_process_id,'user_id',p_target,'trainer_id',trainer,'stage','not_started','note','Setup preparation only; actual progress is not verified. Demonstration → Guided run → Independent run → SOP drafted → SOP approved → Owned.'));
     select id into ident from public.training where workspace_id=p_workspace and public.training.process_id=v_process_id and user_id=p_target;
    end if;
    insert into private.provisioning_items(workspace_id,target_id,setup_key,item_key,kind,input,record_id,created_by) values(p_workspace,p_target,p_setup_key,k,kind,item,ident,actor);
   end if;
  end loop;
  if pass=1 and conflicts>0 then
   if p_apply then raise exception 'Provisioning conflicts require explicit resolution; no changes applied.'; end if;
  end if;
 end loop;
 if p_apply then perform private.audit(p_workspace,null,'workspace_setup_applied',jsonb_build_object('target_id',p_target,'setup_key',p_setup_key,'mail_delivery','suppressed_for_new_setup_runs')); end if;
 return jsonb_build_object('applied',p_apply,'conflicts',conflicts,'items',report,'process_ids',ids);
end $$;
revoke all on function public.provision_workspace_setup(uuid,uuid,uuid,text,jsonb,boolean) from public,anon,service_role;
grant execute on function public.provision_workspace_setup(uuid,uuid,uuid,text,jsonb,boolean) to authenticated;
commit;

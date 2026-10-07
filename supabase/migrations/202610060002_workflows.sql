begin;
create function private.validate_workflow(w jsonb) returns void language plpgsql set search_path='' as $$
declare s jsonb; r jsonb; seen text[] := '{}';
begin
 if jsonb_typeof(w) is distinct from 'object' or coalesce(length(btrim(w->>'title')),0) not between 1 and 200 then raise exception 'A process title is required.'; end if;
 if jsonb_typeof(w->'steps') is distinct from 'array' or jsonb_array_length(w->'steps') not between 1 and 100 then raise exception 'Include 1 to 100 steps.'; end if;
 if jsonb_typeof(w->'review_required') is distinct from 'boolean' then raise exception 'Review requirement must be true or false.'; end if;
 if length(w::text)>200000 then raise exception 'Process content is too large.'; end if;
 for s in select value from jsonb_array_elements(w->'steps') loop
  if coalesce(s->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$' or s->>'id'=any(seen) then raise exception 'Step identifiers must be unique.'; end if;
  seen:=array_append(seen,s->>'id');
  if coalesce(length(btrim(s->>'title')),0) not between 1 and 200 then raise exception 'Every step needs a title.'; end if;
  if coalesce(s->>'kind','') not in ('checkbox','text','number','amount','date','url','yes_no','select') then raise exception 'Invalid step input type.'; end if;
  if coalesce(s->>'evidence','') not in ('none','file','before_after') then raise exception 'Invalid evidence type.'; end if;
  if jsonb_typeof(s->'required') is distinct from 'boolean' or jsonb_typeof(s->'allow_na') is distinct from 'boolean' or jsonb_typeof(s->'approval_before') is distinct from 'boolean' then raise exception 'Invalid step rules.'; end if;
  if s->>'kind'='select' and (jsonb_typeof(s->'options') is distinct from 'array' or jsonb_array_length(s->'options')<1) then raise exception 'Dropdown steps need options.'; end if;
 end loop;
 if jsonb_typeof(w->'resources') is distinct from 'array' then raise exception 'Resources must be an array.'; end if;
 for r in select value from jsonb_array_elements(w->'resources') loop
  if coalesce(r->>'url','') !~ '^https?://[^[:space:]]+$' then raise exception 'Resource links must use HTTP or HTTPS.'; end if;
 end loop;
end $$;
create function private.validate_answer(s jsonb,v jsonb,na boolean,reason text) returns void language plpgsql set search_path='' as $$
begin
 if na then
  if not (s->>'allow_na')::boolean or coalesce(length(btrim(reason)),0)=0 then raise exception 'This step needs a valid not-applicable reason.'; end if;
  return;
 end if;
 if v is null or v='null'::jsonb or v='""'::jsonb then return; end if;
 if length(v::text)>20000 then raise exception 'Answer is too long.'; end if;
 if s->>'kind' in ('checkbox','yes_no') and jsonb_typeof(v)<>'boolean' then raise exception 'Use a boolean answer.'; end if;
 if s->>'kind' in ('number','amount') and jsonb_typeof(v)<>'number' then raise exception 'Use a numeric answer.'; end if;
 if s->>'kind' in ('text','url','date','select') and jsonb_typeof(v)<>'string' then raise exception 'Use a text answer.'; end if;
 if s->>'kind'='url' and (v#>>'{}') !~ '^https?://[^[:space:]]+$' then raise exception 'Use an HTTP(S) URL.'; end if;
 if s->>'kind'='date' then
  if (v#>>'{}') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Use a date in YYYY-MM-DD format.'; end if;
  perform (v#>>'{}')::date;
 end if;
 if s->>'kind'='select' and not (s->'options' @> jsonb_build_array(v)) then raise exception 'Select one of the configured options.'; end if;
end $$;
create function private.check_complete(r public.runs) returns void language plpgsql security definer set search_path='' as $$
declare s jsonb; a public.step_responses; label_needed text;
begin
 for s in select value from jsonb_array_elements(r.snapshot->'steps') loop
  select * into a from public.step_responses where run_id=r.id and step_id=s->>'id';
  if a.not_applicable then perform private.validate_answer(s,a.value,true,a.na_reason); continue; end if;
  if (s->>'approval_before')::boolean and not exists(select 1 from public.approvals where run_id=r.id and step_id=s->>'id' and status='approved') then raise exception 'Permission required: %',s->>'title'; end if;
  if (s->>'required')::boolean and (a.value is null or a.value='null'::jsonb or a.value='""'::jsonb or (jsonb_typeof(a.value)='string' and length(btrim(a.value#>>'{}'))=0) or (s->>'kind'='checkbox' and a.value<>'true'::jsonb)) then raise exception 'Complete the required step: %',s->>'title'; end if;
  perform private.validate_answer(s,a.value,false,'');
  if s->>'evidence'='file' and not exists(select 1 from public.evidence where run_id=r.id and step_id=s->>'id' and state='attached') then raise exception 'Evidence required: %',s->>'title'; end if;
  if s->>'evidence'='before_after' then
   foreach label_needed in array array['before','after'] loop
    if not exists(select 1 from public.evidence where run_id=r.id and step_id=s->>'id' and state='attached' and label=label_needed) then raise exception '% evidence required: %',label_needed,s->>'title'; end if;
   end loop;
  end if;
 end loop;
 if exists(select 1 from public.issues where run_id=r.id and status='open' and blocking) then raise exception 'Resolve blocking issues before submitting.'; end if;
end $$;

-- Compute the next WALL-CLOCK occurrence in a named timezone. Monthly day 29-31
-- clamps to month-end. Postgres resolves DST using its timezone database; see docs.
create function private.next_occurrence(freq text,tz text,tm time,dow integer,dom integer,after_at timestamptz) returns timestamptz language plpgsql stable set search_path='' as $$
declare d date; candidate timestamptz; actual_dom integer; i integer;
begin
 if not private.valid_zone(tz) then raise exception 'Unknown timezone.'; end if;
 for i in 0..370 loop
  d := (after_at at time zone tz)::date+i;
  actual_dom:=least(dom,extract(day from (date_trunc('month',d)+interval '1 month - 1 day'))::integer);
  if freq='daily' or (freq='weekdays' and extract(isodow from d)<6) or (freq='weekly' and extract(dow from d)=dow) or (freq='monthly' and extract(day from d)=actual_dom) then
   candidate := (d+tm) at time zone tz;
   if candidate>after_at then return candidate; end if;
  end if;
 end loop;
 raise exception 'No next occurrence found.';
end $$;
create function private.generate_for_workspace(w uuid,max_per_schedule integer default 31) returns integer language plpgsql security definer set search_path='' as $$
declare s public.schedules; p public.processes; content jsonb; run_id uuid; n integer:=0; j integer;
begin
 perform 1 from public.workspaces where id=w for update;
 if exists(select 1 from public.workspaces where id=w and archived_at is not null) then return 0; end if;
 for s in select * from public.schedules where workspace_id=w and active and next_due_at <= now()+make_interval(mins=>lead_minutes) order by next_due_at for update skip locked loop
  select * into p from public.processes where id=s.process_id and not archived;
  if not found or p.published_version is null then continue; end if;
  -- No task is silently assigned to a removed member.
  if not exists(select 1 from public.memberships where workspace_id=w and user_id=s.assignee_id and active) then continue; end if;
  select v.content into content from public.process_versions v where v.process_id=p.id and v.version=p.published_version;
  if (content->>'review_required')::boolean or exists(select 1 from jsonb_array_elements(content->'steps') x where (x->>'approval_before')::boolean) then
   if s.reviewer_id is null or s.reviewer_id=s.assignee_id or not exists(select 1 from public.memberships where workspace_id=w and user_id=s.reviewer_id and active and role in ('owner','manager','client')) then continue; end if;
  end if;
  for j in 1..max_per_schedule loop
   exit when s.next_due_at>now()+make_interval(mins=>s.lead_minutes);
   run_id:=null;
   insert into public.runs(workspace_id,process_id,process_version,schedule_id,occurrence_at,title,snapshot,assignee_id,reviewer_id,due_at)
    values(w,p.id,p.published_version,s.id,s.next_due_at,content->>'title',content,s.assignee_id,s.reviewer_id,s.next_due_at)
    on conflict(schedule_id,occurrence_at) do nothing returning id into run_id;
   if run_id is not null then
    n:=n+1;
    perform private.audit(w,run_id,'scheduled_run_created',jsonb_build_object('schedule_id',s.id,'due_at',s.next_due_at));
    perform private.notify(w,s.assignee_id,run_id,'Scheduled work is ready',p.title,'run:'||run_id||':assigned');
   end if;
   s.next_due_at:=private.next_occurrence(s.frequency,s.timezone,s.local_time,s.weekday,s.monthday,s.next_due_at);
  end loop;
  update public.schedules set next_due_at=s.next_due_at where id=s.id;
 end loop;
 return n;
end $$;

create function public.app_command(p_workspace uuid,p_action text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); actor_role text; request_key uuid; previous private.command_receipts; result jsonb:='{}';
 w uuid:=p_workspace; ident uuid; target uuid; reviewer uuid; replacement uuid; token text; em text;
 r public.runs; proc public.processes; a public.approvals; ev public.evidence; inv public.invitations;
 flow jsonb; step jsonb; v integer; status_next text; member_role text; count_generated integer;
begin
 if actor is null then raise exception 'Sign in to continue.' using errcode='42501'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or length(p_payload::text)>250000 then raise exception 'Invalid request.'; end if;
 request_key:=(p_payload->>'request_id')::uuid;
 if request_key is null then raise exception 'A request identifier is required.'; end if;
 perform private.ensure_profile();
 if p_action not in ('create_workspace','accept_invitation','update_profile') then
  actor_role:=public.workspace_role(w);
  if actor_role is null then raise exception 'Workspace access denied.' using errcode='42501'; end if;
  -- Serializes member removal with workspace writes, closing authorization races.
  perform 1 from public.workspaces where id=w for update;
  actor_role:=public.workspace_role(w);
  if actor_role is null then raise exception 'Workspace access revoked.' using errcode='42501'; end if;
  if exists(select 1 from public.workspaces where id=w and archived_at is not null) and p_action not in ('update_workspace','mark_read') then raise exception 'This workspace is archived.'; end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||request_key::text,0));
 select * into previous from private.command_receipts where actor_id=actor and request_id=request_key;
 if found then
  if previous.action<>p_action or previous.workspace_id is distinct from p_workspace then raise exception 'Request identifier was already used for another action.'; end if;
  if previous.payload_hash is distinct from encode(extensions.digest(p_payload::text,'sha256'),'hex') then raise exception 'Request identifier was already used for a different payload.'; end if;
  return previous.result;
 end if;

 if p_action in ('publish_process','archive_process','save_schedule','toggle_schedule','generate_schedules','invite_member','revoke_invitation','remove_member','change_role','update_workspace') and actor_role not in ('owner','manager') then raise exception 'Manager permission required.' using errcode='42501'; end if;

 -- Lock an existing run for run-scoped commands. Payload cannot substitute a run
 -- in another client workspace. Optimistic locking prevents stale-tab overwrites.
 if p_action in ('save_response','set_status','submit_run','review_run','reassign_run','request_approval','decide_approval','register_evidence','confirm_evidence','create_issue','resolve_issue','comment') then
  select * into r from public.runs where id=(p_payload->>'run_id')::uuid and workspace_id=w for update;
  if not found then raise exception 'Run not found.' using errcode='42501'; end if;
  if p_action in ('save_response','set_status','submit_run','review_run','reassign_run') and (p_payload->>'expected_version')::integer is distinct from r.version then raise exception 'This task changed in another session. Reload before retrying.' using errcode='40001'; end if;
  if p_action in ('save_response','submit_run','set_status','request_approval','register_evidence','confirm_evidence') and actor<>r.assignee_id and actor_role not in ('owner','manager') then raise exception 'Only the assignee or a manager can execute this work.' using errcode='42501'; end if;
  if p_action in ('save_response','submit_run','request_approval','register_evidence','confirm_evidence') and r.status not in ('not_started','in_progress','blocked','waiting_on_client','changes_requested') then raise exception 'This run is read-only. Request changes or reopen it first.'; end if;
 end if;

 case p_action
 when 'update_profile' then
  if not private.valid_zone(p_payload->>'timezone') then raise exception 'Choose a valid timezone.'; end if;
  update public.profiles set display_name=btrim(p_payload->>'display_name'),timezone=p_payload->>'timezone',email_notifications=(p_payload->>'email_notifications')::boolean where id=actor;
  result:=jsonb_build_object('id',actor);
 when 'create_workspace' then
  if not private.valid_zone(p_payload->>'timezone') then raise exception 'Choose a valid timezone.'; end if;
  insert into public.workspaces(name,timezone,owner_id) values(btrim(p_payload->>'name'),p_payload->>'timezone',actor) returning id into w;
  insert into public.memberships(workspace_id,user_id,role) values(w,actor,'owner');
  perform private.audit(w,null,'workspace_created');
  result:=jsonb_build_object('id',w);
 when 'update_workspace' then
  if actor_role<>'owner' then raise exception 'Only the workspace owner can change workspace settings.'; end if;
  if not private.valid_zone(p_payload->>'timezone') then raise exception 'Choose a valid timezone.'; end if;
  update public.workspaces set name=btrim(p_payload->>'name'),timezone=p_payload->>'timezone',archived_at=case when (p_payload->>'archived')::boolean then coalesce(archived_at,now()) else null end where id=w;
  perform private.audit(w,null,'workspace_updated',jsonb_build_object('archived',(p_payload->>'archived')::boolean));
  result:=jsonb_build_object('id',w);
 when 'invite_member' then
  member_role:=p_payload->>'role';
  if member_role not in ('va','client','manager') or (member_role='manager' and actor_role<>'owner') then raise exception 'You cannot grant that role.'; end if;
  em:=lower(btrim(p_payload->>'email'));
  if em !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email.'; end if;
  token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.invitations(workspace_id,email,role,token_hash,invited_by) values(w,em,member_role,encode(extensions.digest(token,'sha256'),'hex'),actor) returning id into ident;
  perform private.audit(w,null,'invitation_created',jsonb_build_object('invitation_id',ident,'role',member_role));
  result:=jsonb_build_object('id',ident,'token',token);
 when 'revoke_invitation' then
  update public.invitations set revoked_at=now() where id=(p_payload->>'id')::uuid and workspace_id=w and accepted_at is null;
  perform private.audit(w,null,'invitation_revoked',jsonb_build_object('invitation_id',p_payload->>'id'));
 when 'accept_invitation' then
  select * into inv from public.invitations where token_hash=encode(extensions.digest(p_payload->>'token','sha256'),'hex');
  if found then
   perform 1 from public.workspaces where id=inv.workspace_id for update;
   select * into inv from public.invitations where id=inv.id for update;
  end if;
  if not found or inv.revoked_at is not null or inv.accepted_at is not null or inv.expires_at<now() then raise exception 'Invitation is invalid, expired, or already accepted.'; end if;
  -- Read the verified server-side user record, never user-editable metadata.
  select lower(email) into em from auth.users where id=actor and email_confirmed_at is not null;
  if em is distinct from inv.email then raise exception 'Sign in with the verified email address that was invited.' using errcode='42501'; end if;
  perform 1 from public.workspaces where id=inv.workspace_id and archived_at is null for update;
  if not found then raise exception 'Workspace is unavailable.'; end if;
  -- An old invite must not resurrect authority from an offboarded inviter.
  if not exists(select 1 from public.memberships where workspace_id=inv.workspace_id and user_id=inv.invited_by and active and role in ('owner','manager') and (inv.role<>'manager' or role='owner')) then raise exception 'The inviter no longer has authority. Request a new invitation.'; end if;
  if exists(select 1 from public.memberships where workspace_id=inv.workspace_id and user_id=actor and active) then raise exception 'You are already an active member. Ask the owner to change your role.'; end if;
  insert into public.memberships(workspace_id,user_id,role,active) values(inv.workspace_id,actor,inv.role,true) on conflict(workspace_id,user_id) do update set role=excluded.role,active=true;
  update public.invitations set accepted_at=now() where id=inv.id;
  perform private.audit(inv.workspace_id,null,'invitation_accepted',jsonb_build_object('member_id',actor));
  result:=jsonb_build_object('id',inv.workspace_id);
 when 'change_role' then
  target:=(p_payload->>'user_id')::uuid; member_role:=p_payload->>'role';
  if actor_role<>'owner' or target=actor or member_role not in ('manager','client','va') then raise exception 'Only the owner can change other members between manager, client and VA roles.'; end if;
  perform private.assert_member(w,target);
  if member_role='va' and (exists(select 1 from public.runs where workspace_id=w and reviewer_id=target and status not in ('completed','cancelled')) or exists(select 1 from public.schedules where workspace_id=w and reviewer_id=target and active) or exists(select 1 from public.approvals where workspace_id=w and reviewer_id=target and status='pending')) then raise exception 'Reassign this person''s review responsibilities before making them a VA.'; end if;
  update public.memberships set role=member_role where workspace_id=w and user_id=target;
  perform private.audit(w,null,'member_role_changed',jsonb_build_object('member_id',target,'role',member_role));
 when 'remove_member' then
  target:=(p_payload->>'user_id')::uuid; replacement:=(p_payload->>'replacement_id')::uuid;
  perform private.assert_member(w,target); perform private.assert_member(w,replacement);
  select role into member_role from public.memberships where workspace_id=w and user_id=target;
  if target=actor or target=replacement or member_role='owner' or (member_role='manager' and actor_role<>'owner') then raise exception 'You cannot remove this member.'; end if;
  if coalesce(length(btrim(p_payload->>'note')),0)<1 then raise exception 'Add a handover note.'; end if;
  if exists(select 1 from public.runs where workspace_id=w and reviewer_id=target and status not in ('completed','cancelled')) or exists(select 1 from public.approvals where workspace_id=w and reviewer_id=target and status='pending') or exists(select 1 from public.schedules where workspace_id=w and reviewer_id=target and active) then perform private.assert_member(w,replacement,true); end if;
  if exists(select 1 from public.runs where workspace_id=w and status not in ('completed','cancelled') and ((assignee_id=target and reviewer_id=replacement) or (reviewer_id=target and assignee_id=replacement))) then raise exception 'Transfer reviews separately first: replacement cannot review their own work.'; end if;
  if exists(select 1 from public.schedules where workspace_id=w and active and ((assignee_id=target and reviewer_id=replacement) or (reviewer_id=target and assignee_id=replacement))) then raise exception 'Update schedules first to avoid self-review.'; end if;
  update public.runs set assignee_id=case when assignee_id=target then replacement else assignee_id end,reviewer_id=case when reviewer_id=target then replacement else reviewer_id end,waiting_on_id=case when waiting_on_id=target then replacement else waiting_on_id end,follow_up_owner_id=case when follow_up_owner_id=target then replacement else follow_up_owner_id end,handover_note=p_payload->>'note',version=version+1,updated_at=now() where workspace_id=w and status not in ('completed','cancelled') and target in (assignee_id,reviewer_id,waiting_on_id,follow_up_owner_id);
  update public.schedules set assignee_id=case when assignee_id=target then replacement else assignee_id end,reviewer_id=case when reviewer_id=target then replacement else reviewer_id end where workspace_id=w and active and target in (assignee_id,reviewer_id);
  update public.approvals set reviewer_id=replacement where workspace_id=w and reviewer_id=target and status='pending';
  update public.issues set owner_id=replacement where workspace_id=w and owner_id=target and status='open';
  update public.training set trainer_id=replacement,updated_at=now() where workspace_id=w and trainer_id=target;
  update public.invitations set revoked_at=now() where workspace_id=w and invited_by=target and accepted_at is null;
  update public.memberships set active=false where workspace_id=w and user_id=target;
  perform private.audit(w,null,'member_offboarded',jsonb_build_object('member_id',target,'replacement_id',replacement,'note',p_payload->>'note'));
  perform private.notify(w,replacement,null,'Work handed over to you','Review reassigned tasks and handover notes.','offboard:'||request_key);
 when 'save_process' then
  if actor_role not in ('owner','manager','va') then raise exception 'Only an operator or manager can draft a process.' using errcode='42501'; end if;
  flow:=p_payload->'content'; perform private.validate_workflow(flow);
  ident:=nullif(p_payload->>'id','')::uuid;
  if ident is null then
   insert into public.processes(workspace_id,title,draft) values(w,flow->>'title',flow) returning id into ident;
  else
   update public.processes set title=flow->>'title',draft=flow,updated_at=now() where id=ident and workspace_id=w;
   if not found then raise exception 'Process not found.'; end if;
  end if;
  perform private.audit(w,null,'process_draft_saved',jsonb_build_object('process_id',ident));
  result:=jsonb_build_object('id',ident);
 when 'publish_process' then
  select * into proc from public.processes where id=(p_payload->>'id')::uuid and workspace_id=w and not archived for update;
  if not found then raise exception 'Process not found or archived.'; end if;
  perform private.validate_workflow(proc.draft);
  v:=coalesce(proc.published_version,0)+1;
  insert into public.process_versions(process_id,workspace_id,version,content,published_by) values(proc.id,w,v,proc.draft,actor);
  update public.processes set published_version=v,updated_at=now() where id=proc.id;
  perform private.audit(w,null,'process_published',jsonb_build_object('process_id',proc.id,'version',v));
  for target in select user_id from public.memberships where workspace_id=w and active and user_id<>actor loop
   perform private.notify(w,target,null,'SOP published',proc.title||' — version '||v,'sop:'||proc.id||':'||v||':'||target);
  end loop;
  result:=jsonb_build_object('id',proc.id,'version',v);
 when 'archive_process' then
  ident:=(p_payload->>'id')::uuid;
  update public.processes set archived=(p_payload->>'archived')::boolean,updated_at=now() where id=ident and workspace_id=w;
  if not found then raise exception 'Process not found.'; end if;
  if (p_payload->>'archived')::boolean then update public.schedules set active=false where process_id=ident and workspace_id=w; end if;
  perform private.audit(w,null,'process_archive_changed',jsonb_build_object('process_id',ident,'archived',p_payload->'archived'));
 when 'create_run' then
  target:=(p_payload->>'assignee_id')::uuid; reviewer:=nullif(p_payload->>'reviewer_id','')::uuid;
  perform private.assert_member(w,target);
  if actor_role='va' and target<>actor then raise exception 'VAs can create work for themselves only.'; end if;
  if reviewer is not null then perform private.assert_member(w,reviewer,true); end if;
  if reviewer=target then raise exception 'Reviewer must be different from the assignee.'; end if;
  ident:=nullif(p_payload->>'process_id','')::uuid;
  if ident is not null then
   select * into proc from public.processes where id=ident and workspace_id=w and not archived;
   if not found or proc.published_version is null then raise exception 'Choose a published process.'; end if;
   select content into flow from public.process_versions where process_id=ident and version=proc.published_version;
  else
   flow:=p_payload->'content'; perform private.validate_workflow(flow);
  end if;
  if ((flow->>'review_required')::boolean or exists(select 1 from jsonb_array_elements(flow->'steps') s where (s->>'approval_before')::boolean)) and reviewer is null then raise exception 'This process needs a reviewer.'; end if;
  if coalesce(p_payload->>'source_url','')<>'' and (p_payload->>'source_url') !~ '^https?://[^[:space:]]+$' then raise exception 'Use a valid HTTP(S) source link.'; end if;
  insert into public.runs(workspace_id,process_id,process_version,title,snapshot,assignee_id,reviewer_id,created_by,due_at,reference,source_url,priority)
   values(w,ident,case when ident is not null then proc.published_version else null end,coalesce(nullif(btrim(p_payload->>'title'),''),flow->>'title'),flow,target,reviewer,actor,nullif(p_payload->>'due_at','')::timestamptz,coalesce(p_payload->>'reference',''),coalesce(p_payload->>'source_url',''),coalesce(p_payload->>'priority','normal')) returning id into ident;
  perform private.audit(w,ident,'run_created',jsonb_build_object('assignee_id',target));
  perform private.notify(w,target,ident,'New work assigned',flow->>'title','run:'||ident||':assigned');
  result:=jsonb_build_object('id',ident);
 when 'save_schedule' then
  ident:=nullif(p_payload->>'id','')::uuid;
  target:=(p_payload->>'assignee_id')::uuid; reviewer:=nullif(p_payload->>'reviewer_id','')::uuid;
  perform private.assert_member(w,target);
  if reviewer is not null then perform private.assert_member(w,reviewer,true); end if;
  if reviewer=target then raise exception 'Reviewer must differ from assignee.'; end if;
  select * into proc from public.processes where id=(p_payload->>'process_id')::uuid and workspace_id=w and not archived;
  if not found or proc.published_version is null then raise exception 'Select a published process.'; end if;
  select content into flow from public.process_versions where process_id=proc.id and version=proc.published_version;
  if ((flow->>'review_required')::boolean or exists(select 1 from jsonb_array_elements(flow->'steps') s where (s->>'approval_before')::boolean)) and reviewer is null then raise exception 'This process needs a reviewer.'; end if;
  if not private.valid_zone(p_payload->>'timezone') then raise exception 'Choose a valid timezone.'; end if;
  if ident is null then
   insert into public.schedules(workspace_id,process_id,assignee_id,reviewer_id,frequency,weekday,monthday,local_time,timezone,lead_minutes,next_due_at)
   values(w,proc.id,target,reviewer,p_payload->>'frequency',(p_payload->>'weekday')::integer,(p_payload->>'monthday')::integer,(p_payload->>'local_time')::time,p_payload->>'timezone',(p_payload->>'lead_minutes')::integer,
    private.next_occurrence(p_payload->>'frequency',p_payload->>'timezone',(p_payload->>'local_time')::time,(p_payload->>'weekday')::integer,(p_payload->>'monthday')::integer,coalesce(nullif(p_payload->>'starts_after','')::timestamptz,now()))) returning id into ident;
  else
   update public.schedules set process_id=proc.id,assignee_id=target,reviewer_id=reviewer,frequency=p_payload->>'frequency',weekday=(p_payload->>'weekday')::integer,monthday=(p_payload->>'monthday')::integer,local_time=(p_payload->>'local_time')::time,timezone=p_payload->>'timezone',lead_minutes=(p_payload->>'lead_minutes')::integer,
    next_due_at=private.next_occurrence(p_payload->>'frequency',p_payload->>'timezone',(p_payload->>'local_time')::time,(p_payload->>'weekday')::integer,(p_payload->>'monthday')::integer,now()) where id=ident and workspace_id=w;
   if not found then raise exception 'Schedule not found.'; end if;
  end if;
  perform private.audit(w,null,'schedule_saved',jsonb_build_object('schedule_id',ident));
  result:=jsonb_build_object('id',ident);
 when 'toggle_schedule' then
  update public.schedules set active=(p_payload->>'active')::boolean where id=(p_payload->>'id')::uuid and workspace_id=w;
  if not found then raise exception 'Schedule not found.'; end if;
  perform private.audit(w,null,'schedule_toggled',jsonb_build_object('schedule_id',p_payload->>'id','active',p_payload->'active'));
 when 'generate_schedules' then
  count_generated:=private.generate_for_workspace(w);
  result:=jsonb_build_object('generated',count_generated);
 when 'save_response' then
  select value into step from jsonb_array_elements(r.snapshot->'steps') where value->>'id'=p_payload->>'step_id';
  if step is null then raise exception 'Step not found in this run version.'; end if;
  if (step->>'approval_before')::boolean and not coalesce((p_payload->>'not_applicable')::boolean,false) and not exists(select 1 from public.approvals where run_id=r.id and step_id=step->>'id' and status='approved') then raise exception 'Permission is required before this step.'; end if;
  perform private.validate_answer(step,p_payload->'value',coalesce((p_payload->>'not_applicable')::boolean,false),coalesce(p_payload->>'na_reason',''));
  insert into public.step_responses(run_id,workspace_id,step_id,value,not_applicable,na_reason,updated_by)
   values(r.id,w,step->>'id',p_payload->'value',coalesce((p_payload->>'not_applicable')::boolean,false),coalesce(p_payload->>'na_reason',''),actor)
   on conflict(run_id,step_id) do update set value=excluded.value,not_applicable=excluded.not_applicable,na_reason=excluded.na_reason,updated_by=actor,updated_at=now();
  update public.runs set status=case when status='not_started' then 'in_progress' else status end,version=version+1,updated_at=now() where id=r.id;
  perform private.audit(w,r.id,'step_answer_saved',jsonb_build_object('step_id',step->>'id'));
 when 'set_status' then
  status_next:=p_payload->>'status';
  if status_next not in ('in_progress','blocked','waiting_on_client','cancelled') then raise exception 'Invalid manual transition.'; end if;
  if r.status in ('completed','cancelled','for_review') and actor_role not in ('owner','manager') then raise exception 'A manager must reopen this task.'; end if;
  if r.status in ('completed','cancelled','for_review') and coalesce(length(btrim(p_payload->>'reason')),0)=0 then raise exception 'Explain why this task is being reopened.'; end if;
  if status_next='cancelled' and actor_role not in ('owner','manager') then raise exception 'A manager must cancel this task.'; end if;
  if status_next in ('blocked','waiting_on_client') then
   perform private.assert_member(w,(p_payload->>'waiting_on_id')::uuid);
   perform private.assert_member(w,(p_payload->>'follow_up_owner_id')::uuid);
   if nullif(btrim(p_payload->>'reason'),'') is null or nullif(p_payload->>'follow_up_at','') is null then raise exception 'A reason, next-action owner and follow-up date are required.'; end if;
  end if;
  update public.runs set status=status_next,waiting_reason=coalesce(p_payload->>'reason',''),waiting_on_id=case when status_next in ('blocked','waiting_on_client') then (p_payload->>'waiting_on_id')::uuid else null end,follow_up_owner_id=case when status_next in ('blocked','waiting_on_client') then (p_payload->>'follow_up_owner_id')::uuid else null end,follow_up_at=case when status_next in ('blocked','waiting_on_client') then (p_payload->>'follow_up_at')::timestamptz else null end,completed_at=null,submitted_at=null,version=version+1,updated_at=now() where id=r.id;
  if status_next='cancelled' then update public.approvals set status='rejected',decision_note='Run cancelled by manager; no permission granted.',decided_at=now() where run_id=r.id and status='pending'; end if;
  perform private.audit(w,r.id,'run_status_changed',jsonb_build_object('from',r.status,'to',status_next,'reason',p_payload->>'reason'));
  if status_next in ('blocked','waiting_on_client') then perform private.notify(w,(p_payload->>'waiting_on_id')::uuid,r.id,'Your action is needed',r.title,'waiting:'||request_key); end if;
 when 'submit_run' then
  perform private.check_complete(r);
  if (r.snapshot->>'review_required')::boolean then
   perform private.assert_member(w,r.reviewer_id,true);
   if r.assignee_id=r.reviewer_id then raise exception 'Self-review is not allowed.'; end if;
   status_next:='for_review';
   perform private.notify(w,r.reviewer_id,r.id,'Work is ready for review',r.title,'review:'||request_key);
  else status_next:='completed'; end if;
  update public.runs set status=status_next,submitted_at=now(),completed_at=case when status_next='completed' then now() else null end,follow_up_at=null,follow_up_owner_id=null,waiting_on_id=null,waiting_reason='',version=version+1,updated_at=now() where id=r.id;
  perform private.audit(w,r.id,'run_submitted',jsonb_build_object('status',status_next));
 when 'review_run' then
  if r.status<>'for_review' then raise exception 'This run is not awaiting review.'; end if;
  if actor=r.assignee_id or (actor<>r.reviewer_id and actor_role not in ('owner','manager')) then raise exception 'Only an authorized, separate reviewer can review this work.' using errcode='42501'; end if;
  status_next:=p_payload->>'decision';
  if status_next not in ('completed','changes_requested') then raise exception 'Choose accept or request changes.'; end if;
  if status_next='changes_requested' and nullif(btrim(p_payload->>'note'),'') is null then raise exception 'Explain the requested corrections.'; end if;
  if status_next='completed' then perform private.check_complete(r); end if;
  update public.runs set status=status_next,review_note=coalesce(p_payload->>'note',''),completed_at=case when status_next='completed' then now() else null end,version=version+1,updated_at=now() where id=r.id;
  perform private.audit(w,r.id,'run_reviewed',jsonb_build_object('decision',status_next,'note',p_payload->>'note'));
  perform private.notify(w,r.assignee_id,r.id,case when status_next='completed' then 'Work accepted' else 'Changes requested' end,r.title,'reviewed:'||request_key);
 when 'reassign_run' then
  if actor_role not in ('owner','manager') then raise exception 'Manager permission required.'; end if;
  if r.status in ('completed','cancelled') then raise exception 'Reopen before reassigning.'; end if;
  target:=(p_payload->>'assignee_id')::uuid; reviewer:=nullif(p_payload->>'reviewer_id','')::uuid;
  perform private.assert_member(w,target); if reviewer is not null then perform private.assert_member(w,reviewer,true); end if;
  if reviewer=target then raise exception 'Self-review is not allowed.'; end if;
  if ((r.snapshot->>'review_required')::boolean or exists(select 1 from jsonb_array_elements(r.snapshot->'steps') s where (s->>'approval_before')::boolean)) and reviewer is null then raise exception 'This process requires a reviewer.'; end if;
  if nullif(btrim(p_payload->>'note'),'') is null then raise exception 'Add a handover note.'; end if;
  update public.runs set assignee_id=target,reviewer_id=reviewer,handover_note=p_payload->>'note',due_at=nullif(p_payload->>'due_at','')::timestamptz,version=version+1,updated_at=now() where id=r.id;
  if reviewer is not null then update public.approvals set reviewer_id=reviewer where run_id=r.id and status='pending'; end if;
  perform private.audit(w,r.id,'run_reassigned',jsonb_build_object('previous_assignee',r.assignee_id,'assignee_id',target,'reviewer_id',reviewer,'old_due_at',r.due_at,'new_due_at',p_payload->>'due_at','note',p_payload->>'note'));
  perform private.notify(w,target,r.id,'Work handed over to you',r.title,'reassigned:'||request_key);
 when 'request_approval' then
  select value into step from jsonb_array_elements(r.snapshot->'steps') where value->>'id'=p_payload->>'step_id';
  if step is null or not (step->>'approval_before')::boolean then raise exception 'This step is not an approval gate.'; end if;
  perform private.assert_member(w,r.reviewer_id,true);
  if r.reviewer_id=actor or r.reviewer_id=r.assignee_id then raise exception 'Another person must grant permission.'; end if;
  if nullif(btrim(p_payload->>'reason'),'') is null then raise exception 'Explain the action requiring approval.'; end if;
  if exists(select 1 from public.approvals where run_id=r.id and step_id=step->>'id' and status='approved') then raise exception 'Permission has already been granted.'; end if;
  insert into public.approvals(workspace_id,run_id,step_id,requested_by,reviewer_id,reason) values(w,r.id,step->>'id',actor,r.reviewer_id,p_payload->>'reason') returning id into ident;
  perform private.audit(w,r.id,'permission_requested',jsonb_build_object('approval_id',ident,'step_id',step->>'id'));
  perform private.notify(w,r.reviewer_id,r.id,'Permission requested',r.title,'approval:'||ident);
 when 'decide_approval' then
  if r.status in ('completed','cancelled') then raise exception 'This run is closed. Reopen it before deciding permissions.'; end if;
  select * into a from public.approvals where id=(p_payload->>'id')::uuid and run_id=r.id and workspace_id=w for update;
  if not found or a.status<>'pending' then raise exception 'This request is not awaiting a decision.'; end if;
  if actor=a.requested_by or actor=r.assignee_id or (actor<>a.reviewer_id and actor_role not in ('owner','manager')) then raise exception 'Only a separate authorized reviewer can decide.' using errcode='42501'; end if;
  status_next:=p_payload->>'decision';
  if status_next not in ('approved','rejected') then raise exception 'Invalid decision.'; end if;
  if nullif(btrim(p_payload->>'note'),'') is null then raise exception 'Add a decision note.'; end if;
  update public.approvals set status=status_next,decision_note=p_payload->>'note',decided_at=now() where id=a.id;
  perform private.audit(w,r.id,'permission_decided',jsonb_build_object('approval_id',a.id,'decision',status_next,'note',p_payload->>'note'));
  perform private.notify(w,a.requested_by,r.id,'Permission '||status_next,r.title,'approval-decided:'||a.id);
 when 'register_evidence' then
  select value into step from jsonb_array_elements(r.snapshot->'steps') where value->>'id'=p_payload->>'step_id';
  if step is null then raise exception 'Step not found.'; end if;
  if (step->>'approval_before')::boolean and not exists(select 1 from public.approvals where run_id=r.id and step_id=step->>'id' and status='approved') then raise exception 'Permission is required before this step.'; end if;
  ident:=gen_random_uuid(); token:=w::text||'/'||r.id::text||'/'||ident::text;
  insert into public.evidence(id,workspace_id,run_id,step_id,object_path,filename,content_type,size_bytes,label,created_by)
   values(ident,w,r.id,step->>'id',token,p_payload->>'filename',p_payload->>'content_type',(p_payload->>'size_bytes')::bigint,p_payload->>'label',actor);
  result:=jsonb_build_object('id',ident,'path',token);
 when 'confirm_evidence' then
  select * into ev from public.evidence where id=(p_payload->>'id')::uuid and run_id=r.id and workspace_id=w for update;
  if not found or ev.created_by<>actor then raise exception 'Evidence registration not found.'; end if;
  if not exists(select 1 from storage.objects where bucket_id='evidence' and name=ev.object_path and (metadata->>'size')::bigint=ev.size_bytes and (metadata->>'mimetype')=ev.content_type) then raise exception 'The upload is incomplete or its type/size does not match. Retry the upload.'; end if;
  update public.evidence set state='attached' where id=ev.id;
  perform private.audit(w,r.id,'evidence_attached',jsonb_build_object('evidence_id',ev.id,'step_id',ev.step_id,'label',ev.label));
 when 'create_issue' then
  if r.status in ('completed','cancelled') then raise exception 'Reopen the run before raising a new issue.'; end if;
  target:=(p_payload->>'owner_id')::uuid; perform private.assert_member(w,target);
  if nullif(btrim(p_payload->>'detail'),'') is null or nullif(btrim(p_payload->>'recommendation'),'') is null then raise exception 'Explain the issue and recommended next action.'; end if;
  insert into public.issues(workspace_id,run_id,title,detail,recommendation,owner_id,follow_up_at,blocking,created_by)
   values(w,r.id,p_payload->>'title',p_payload->>'detail',p_payload->>'recommendation',target,(p_payload->>'follow_up_at')::timestamptz,(p_payload->>'blocking')::boolean,actor) returning id into ident;
  perform private.audit(w,r.id,'issue_raised',jsonb_build_object('issue_id',ident,'owner_id',target));
  perform private.notify(w,target,r.id,'Issue needs your action',p_payload->>'title','issue:'||ident);
 when 'resolve_issue' then
  if nullif(btrim(p_payload->>'resolution'),'') is null then raise exception 'Describe the resolution.'; end if;
  update public.issues set status='resolved',resolution=p_payload->>'resolution' where id=(p_payload->>'id')::uuid and run_id=r.id and workspace_id=w and status='open' and (owner_id=actor or actor_role in ('owner','manager'));
  if not found then raise exception 'Only the issue owner or a manager can resolve this open issue.' using errcode='42501'; end if;
  perform private.audit(w,r.id,'issue_resolved',jsonb_build_object('issue_id',p_payload->>'id','resolution',p_payload->>'resolution'));
  perform private.notify(w,r.assignee_id,r.id,'Issue resolved',r.title,'issue-resolved:'||request_key);
 when 'comment' then
  insert into public.comments(workspace_id,run_id,author_id,body) values(w,r.id,actor,btrim(p_payload->>'body')) returning id into ident;
  perform private.audit(w,r.id,'comment_added',jsonb_build_object('comment_id',ident));
  for target in select distinct u from unnest(array[r.assignee_id,r.reviewer_id,r.created_by]) u where u is not null and u<>actor loop
   perform private.notify(w,target,r.id,'New task comment',r.title,'comment:'||ident||':'||target);
  end loop;
 when 'save_training' then
  target:=(p_payload->>'user_id')::uuid; reviewer:=(p_payload->>'trainer_id')::uuid;
  perform private.assert_member(w,target); perform private.assert_member(w,reviewer);
  if actor_role not in ('owner','manager') and not exists(select 1 from public.training where workspace_id=w and process_id=(p_payload->>'process_id')::uuid and user_id=target and trainer_id=actor) then raise exception 'Only a manager or the assigned trainer can update handover progress.'; end if;
  if actor_role not in ('owner','manager') and reviewer<>actor then raise exception 'Only managers can change the trainer.'; end if;
  if not exists(select 1 from public.processes where id=(p_payload->>'process_id')::uuid and workspace_id=w) then raise exception 'Process not found.'; end if;
  if p_payload->>'stage' in ('sop_approved','owned') and (actor=target or nullif(btrim(p_payload->>'note'),'') is null) then raise exception 'A separate trainer must sign off with a note.'; end if;
  if p_payload->>'stage' in ('sop_approved','owned') and not exists(select 1 from public.processes where id=(p_payload->>'process_id')::uuid and published_version is not null) then raise exception 'Publish the SOP before signing off ownership.'; end if;
  insert into public.training(workspace_id,process_id,user_id,trainer_id,stage,note,signed_off_at)
   values(w,(p_payload->>'process_id')::uuid,target,reviewer,p_payload->>'stage',coalesce(p_payload->>'note',''),case when p_payload->>'stage' in ('sop_approved','owned') then now() else null end)
   on conflict(process_id,user_id) do update set trainer_id=excluded.trainer_id,stage=excluded.stage,note=excluded.note,signed_off_at=excluded.signed_off_at,updated_at=now();
  perform private.audit(w,null,'training_updated',jsonb_build_object('process_id',p_payload->>'process_id','user_id',target,'stage',p_payload->>'stage','note',p_payload->>'note'));
 when 'mark_read' then
  update public.notifications set read_at=now() where workspace_id=w and recipient_id=actor and (nullif(p_payload->>'id','') is null or id=(p_payload->>'id')::uuid) and read_at is null;
 else raise exception 'Unknown command.';
 end case;
 if r.id is not null then
  select version into v from public.runs where id=r.id;
  result:=jsonb_build_object('run_id',r.id,'version',v)||result;
 end if;
 insert into private.command_receipts(actor_id,request_id,workspace_id,action,payload_hash,result) values(actor,request_key,p_workspace,p_action,encode(extensions.digest(p_payload::text,'sha256'),'hex'),result);
 return result;
end $$;
revoke all on function public.app_command(uuid,text,jsonb) from public,anon;
grant execute on function public.app_command(uuid,text,jsonb) to authenticated;
revoke all on all functions in schema private from public,anon,authenticated;
commit;

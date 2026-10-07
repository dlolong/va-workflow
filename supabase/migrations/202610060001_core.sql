-- VA Relay V1. Apply to a NEW Supabase project via `supabase db push` or SQL Editor.
-- Explicit read policies; all business writes are transactional, validated RPCs.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 120),
  timezone text not null default 'Asia/Manila',
  email_notifications boolean not null default true
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name) between 1 and 120),
  timezone text not null default 'Asia/Manila',
  owner_id uuid not null references public.profiles(id),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  role text not null check(role in ('owner','manager','client','va')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key(workspace_id,user_id)
);
create index membership_user_idx on public.memberships(user_id,workspace_id) where active;
create table public.processes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  title text not null,
  draft jsonb not null,
  published_version integer,
  archived boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(workspace_id,id)
);
create table public.process_versions (
  process_id uuid not null references public.processes(id),
  workspace_id uuid not null,
  version integer not null,
  content jsonb not null,
  published_by uuid not null references public.profiles(id),
  published_at timestamptz not null default now(),
  primary key(process_id,version),
  foreign key(workspace_id,process_id) references public.processes(workspace_id,id)
);
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  process_id uuid not null,
  assignee_id uuid not null,
  reviewer_id uuid,
  frequency text not null check(frequency in ('daily','weekdays','weekly','monthly')),
  weekday integer not null default 1 check(weekday between 0 and 6),
  monthday integer not null default 1 check(monthday between 1 and 31),
  local_time time not null,
  timezone text not null,
  lead_minutes integer not null default 1440 check(lead_minutes between 0 and 43200),
  next_due_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(workspace_id,id),
  foreign key(workspace_id,process_id) references public.processes(workspace_id,id),
  foreign key(workspace_id,assignee_id) references public.memberships(workspace_id,user_id),
  foreign key(workspace_id,reviewer_id) references public.memberships(workspace_id,user_id)
);
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  process_id uuid,
  process_version integer,
  schedule_id uuid,
  occurrence_at timestamptz,
  title text not null check(length(title) between 1 and 200),
  snapshot jsonb not null,
  assignee_id uuid not null,
  reviewer_id uuid,
  created_by uuid references public.profiles(id),
  status text not null default 'not_started' check(status in ('not_started','in_progress','blocked','waiting_on_client','for_review','changes_requested','completed','cancelled')),
  due_at timestamptz,
  reference text not null default '' check(length(reference)<=200),
  source_url text not null default '',
  priority text not null default 'normal' check(priority in ('normal','high')),
  waiting_on_id uuid,
  waiting_reason text not null default '',
  follow_up_at timestamptz,
  follow_up_owner_id uuid,
  submitted_at timestamptz,
  completed_at timestamptz,
  review_note text not null default '',
  handover_note text not null default '',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  unique(schedule_id,occurrence_at),
  foreign key(workspace_id,process_id) references public.processes(workspace_id,id),
  foreign key(process_id,process_version) references public.process_versions(process_id,version),
  foreign key(workspace_id,schedule_id) references public.schedules(workspace_id,id),
  foreign key(workspace_id,assignee_id) references public.memberships(workspace_id,user_id),
  foreign key(workspace_id,reviewer_id) references public.memberships(workspace_id,user_id),
  foreign key(workspace_id,waiting_on_id) references public.memberships(workspace_id,user_id),
  foreign key(workspace_id,follow_up_owner_id) references public.memberships(workspace_id,user_id)
);
create index runs_due_idx on public.runs(workspace_id,due_at) where status not in ('completed','cancelled');
create index runs_assignee_idx on public.runs(assignee_id,workspace_id,created_at desc);
create index runs_workspace_created_idx on public.runs(workspace_id,created_at desc);
create table public.step_responses (
  run_id uuid not null,
  workspace_id uuid not null,
  step_id text not null,
  value jsonb,
  not_applicable boolean not null default false,
  na_reason text not null default '',
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key(run_id,step_id),
  foreign key(workspace_id,run_id) references public.runs(workspace_id,id)
);
create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  run_id uuid not null,
  step_id text not null,
  object_path text not null unique,
  filename text not null check(length(filename) between 1 and 150),
  content_type text not null check(content_type in ('image/png','image/jpeg','image/webp','application/pdf','text/plain','text/csv')),
  size_bytes bigint not null check(size_bytes between 1 and 10485760),
  label text not null default 'general' check(label in ('general','before','after')),
  state text not null default 'pending' check(state in ('pending','attached')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  foreign key(workspace_id,run_id) references public.runs(workspace_id,id)
);
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  run_id uuid not null,
  step_id text not null,
  requested_by uuid not null references public.profiles(id),
  reviewer_id uuid not null,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  reason text not null,
  decision_note text not null default '',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key(workspace_id,run_id) references public.runs(workspace_id,id),
  foreign key(workspace_id,reviewer_id) references public.memberships(workspace_id,user_id)
);
create unique index approval_one_pending_idx on public.approvals(run_id,step_id) where status='pending';
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  run_id uuid not null,
  title text not null check(length(title) between 1 and 200),
  detail text not null,
  recommendation text not null,
  owner_id uuid not null,
  follow_up_at timestamptz not null,
  blocking boolean not null default true,
  status text not null default 'open' check(status in ('open','resolved')),
  resolution text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  foreign key(workspace_id,run_id) references public.runs(workspace_id,id),
  foreign key(workspace_id,owner_id) references public.memberships(workspace_id,user_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  run_id uuid not null,
  author_id uuid not null references public.profiles(id),
  body text not null check(length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  foreign key(workspace_id,run_id) references public.runs(workspace_id,id)
);
create table public.training (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  process_id uuid not null,
  user_id uuid not null,
  trainer_id uuid not null,
  stage text not null default 'not_started' check(stage in ('not_started','demonstration','guided_run','independent_run','sop_drafted','sop_approved','owned')),
  note text not null default '',
  signed_off_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(process_id,user_id),
  foreign key(workspace_id,process_id) references public.processes(workspace_id,id),
  foreign key(workspace_id,user_id) references public.memberships(workspace_id,user_id),
  foreign key(workspace_id,trainer_id) references public.memberships(workspace_id,user_id)
);
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  email text not null check(length(email)<=254),
  role text not null check(role in ('manager','client','va')),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default(now()+interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id),
  run_id uuid,
  actor_id uuid references public.profiles(id),
  event text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now(),
  foreign key(workspace_id,run_id) references public.runs(workspace_id,id)
);
create index audit_workspace_idx on public.audit_events(workspace_id,id desc);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  recipient_id uuid not null references public.profiles(id),
  run_id uuid,
  title text not null,
  body text not null default '',
  dedupe_key text not null unique,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key(workspace_id,run_id) references public.runs(workspace_id,id)
);
create index notification_user_idx on public.notifications(recipient_id,created_at desc);
create table private.command_receipts (
  actor_id uuid not null,
  request_id uuid not null,
  workspace_id uuid,
  action text not null,
  payload_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);
create table private.email_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  last_error text
);
create table private.job_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  generated integer not null,
  reminders integer not null
);

-- SECURITY DEFINER helpers have a fixed search_path and explicit object names.
create function public.workspace_role(w uuid) returns text language sql stable security definer set search_path='' as $$
 select role from public.memberships where workspace_id=w and user_id=auth.uid() and active
$$;
create function public.is_workspace_member(w uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships where workspace_id=w and user_id=auth.uid() and active)
$$;
create function public.can_view_profile(u uuid) returns boolean language sql stable security definer set search_path='' as $$
 select u=auth.uid() or exists(select 1 from public.memberships a join public.memberships b on b.workspace_id=a.workspace_id where a.user_id=auth.uid() and a.active and b.user_id=u)
$$;
create function private.ensure_profile() returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) select id,coalesce(nullif(left(raw_user_meta_data->>'display_name',120),''),'Team member') from auth.users where id=auth.uid() on conflict(id) do nothing;
end $$;
create function private.assert_member(w uuid,u uuid, review boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
 if u is null or not exists(select 1 from public.memberships where workspace_id=w and user_id=u and active and (not review or role in ('owner','manager','client'))) then raise exception 'Select an active % in this workspace.',case when review then 'reviewer' else 'member' end using errcode='42501'; end if;
end $$;
create function private.valid_zone(t text) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from pg_catalog.pg_timezone_names where name=t)
$$;
create function private.audit(w uuid,r uuid,e text,d jsonb default '{}') returns void language sql security definer set search_path='' as $$
 insert into public.audit_events(workspace_id,run_id,actor_id,event,detail) values(w,r,auth.uid(),e,d)
$$;
create function private.notify(w uuid,u uuid,r uuid,t text,b text,k text) returns void language plpgsql security definer set search_path='' as $$
declare n uuid;
begin
 if u is null or not exists(select 1 from public.memberships where workspace_id=w and user_id=u and active) then return; end if;
 insert into public.notifications(workspace_id,recipient_id,run_id,title,body,dedupe_key) values(w,u,r,t,b,k) on conflict(dedupe_key) do nothing returning id into n;
 if n is not null then insert into private.email_outbox(notification_id) values(n); end if;
end $$;

-- RLS is enabled on every application table; no direct INSERT/UPDATE/DELETE grants.
do $$ declare t text; begin
 foreach t in array array['profiles','workspaces','memberships','processes','process_versions','schedules','runs','step_responses','evidence','approvals','issues','comments','training','invitations','audit_events','notifications'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
 foreach t in array array['memberships','processes','process_versions','schedules','runs','step_responses','evidence','approvals','issues','comments','training','audit_events'] loop
 execute format('create policy member_read on public.%I for select to authenticated using(public.is_workspace_member(workspace_id))',t);
 end loop;
end $$;
create policy profile_read on public.profiles for select to authenticated using(public.can_view_profile(id));
create policy workspace_read on public.workspaces for select to authenticated using(public.is_workspace_member(id));
create policy invitation_read on public.invitations for select to authenticated using(public.workspace_role(workspace_id) in ('owner','manager'));
create policy notification_read on public.notifications for select to authenticated using(recipient_id=auth.uid() and public.is_workspace_member(workspace_id));

-- A storage object must have a pending/attached metadata row for the exact path.
-- There is deliberately no public bucket, overwrite policy, or arbitrary upload path.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('evidence','evidence',false,10485760,array['image/png','image/jpeg','image/webp','application/pdf','text/plain','text/csv']) on conflict(id) do nothing;
create function public.can_read_evidence(path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.evidence e where e.object_path=path and public.is_workspace_member(e.workspace_id))
$$;
create function public.can_upload_evidence(path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.evidence e join public.runs r on r.id=e.run_id join public.workspaces w on w.id=e.workspace_id where e.object_path=path and e.state='pending' and e.created_by=auth.uid() and public.is_workspace_member(e.workspace_id) and w.archived_at is null and r.status in ('not_started','in_progress','blocked','waiting_on_client','changes_requested') and (r.assignee_id=auth.uid() or public.workspace_role(e.workspace_id) in ('owner','manager')))
$$;
create policy evidence_read on storage.objects for select to authenticated using(bucket_id='evidence' and public.can_read_evidence(name));
create policy evidence_upload on storage.objects for insert to authenticated with check(bucket_id='evidence' and public.can_upload_evidence(name));

-- Revoke the default public EXECUTE grant; selectively expose safe read helpers.
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.workspace_role(uuid),public.is_workspace_member(uuid),public.can_view_profile(uuid),public.can_read_evidence(text),public.can_upload_evidence(text) from public,anon;
grant execute on function public.workspace_role(uuid),public.is_workspace_member(uuid),public.can_view_profile(uuid),public.can_read_evidence(text),public.can_upload_evidence(text) to authenticated;
commit;

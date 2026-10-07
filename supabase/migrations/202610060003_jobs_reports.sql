begin;
-- Explicit grants restrict these worker functions to the server-only service role.
create function public.run_automation() returns jsonb language plpgsql security definer set search_path='' as $$
declare w uuid; r public.runs; issue public.issues; generated integer:=0; reminders integer:=0; timekey text;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Worker access only.' using errcode='42501'; end if;
 -- Singleton worker lease is transaction-scoped; overlapping cron invocations are harmless.
 if not pg_try_advisory_xact_lock(626230160) then return jsonb_build_object('skipped','already_running'); end if;
 for w in select id from public.workspaces where archived_at is null loop
  generated:=generated+private.generate_for_workspace(w);
 end loop;
 for r in select x.* from public.runs x join public.workspaces w on w.id=x.workspace_id where w.archived_at is null and x.status not in ('completed','cancelled') and (x.due_at<now()+interval '1 day' or x.follow_up_at<=now()) loop
  timekey:=to_char(now() at time zone 'UTC','YYYY-MM-DD');
  if r.due_at<now() then
   perform private.notify(r.workspace_id,r.assignee_id,r.id,'Deadline overdue',r.title||' — original deadline remains visible.','overdue:'||r.id||':'||timekey); reminders:=reminders+1;
   if r.status='for_review' then perform private.notify(r.workspace_id,r.reviewer_id,r.id,'Review is overdue',r.title,'review-overdue:'||r.id||':'||timekey); end if;
  elsif r.due_at is not null then
   perform private.notify(r.workspace_id,r.assignee_id,r.id,'Due within 24 hours',r.title,'due:'||r.id||':'||r.due_at); reminders:=reminders+1;
  end if;
  if r.follow_up_at<=now() then
   perform private.notify(r.workspace_id,r.follow_up_owner_id,r.id,'Follow-up is due',r.title,'followup:'||r.id||':'||r.follow_up_at||':'||timekey); reminders:=reminders+1;
  end if;
 end loop;
 for issue in select i.* from public.issues i join public.workspaces w on w.id=i.workspace_id where w.archived_at is null and i.status='open' and i.follow_up_at<=now() loop
  perform private.notify(issue.workspace_id,issue.owner_id,issue.run_id,'Issue follow-up due',issue.title,'issue-followup:'||issue.id||':'||to_char(now() at time zone 'UTC','YYYY-MM-DD')); reminders:=reminders+1;
 end loop;
 insert into private.job_runs(generated,reminders) values(generated,reminders);
 -- Receipts beyond 30 days are not needed for routine retry safety.
 delete from private.command_receipts where created_at<now()-interval '30 days';
 return jsonb_build_object('generated',generated,'reminder_checks',reminders);
end $$;
create function public.claim_notification_emails(batch_size integer default 25) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Worker access only.' using errcode='42501'; end if;
 -- A crashed final attempt must become visibly failed after its lease expires.
 update private.email_outbox set failed_at=now(),locked_until=null,last_error=coalesce(last_error,'Final worker lease expired before acknowledgement.')
 where sent_at is null and failed_at is null and attempts>=5 and locked_until<now();
 with jobs as (
  select o.id from private.email_outbox o join public.notifications n on n.id=o.notification_id join public.profiles p on p.id=n.recipient_id join public.memberships m on m.user_id=p.id and m.workspace_id=n.workspace_id join public.workspaces w on w.id=n.workspace_id join auth.users u on u.id=n.recipient_id
  where u.email_confirmed_at is not null and o.sent_at is null and o.failed_at is null and o.available_at<=now() and (o.locked_until is null or o.locked_until<now()) and o.attempts<5 and m.active and w.archived_at is null and p.email_notifications
  order by o.available_at limit least(greatest(batch_size,1),50) for update of o skip locked
 ), claimed as (
  update private.email_outbox o set locked_until=now()+interval '5 minutes',attempts=attempts+1 where o.id in(select id from jobs) returning o.*
 ) select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'notification_id',n.id,'email',u.email,'workspace_id',n.workspace_id,'run_id',n.run_id,'attempts',c.attempts)),'[]') into result
 from claimed c join public.notifications n on n.id=c.notification_id join auth.users u on u.id=n.recipient_id where u.email_confirmed_at is not null;
 return result;
end $$;
create function public.finish_notification_email(job_id uuid,successful boolean,error_message text default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Worker access only.' using errcode='42501'; end if;
 update private.email_outbox set sent_at=case when successful then now() else null end,failed_at=case when not successful and attempts>=5 then now() else null end,last_error=case when successful then null else left(error_message,500) end,locked_until=null,available_at=now()+make_interval(mins=>least(60,power(2,attempts)::integer)) where id=job_id and sent_at is null;
end $$;
create function public.workspace_stats(p_workspace uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare data jsonb; tz text;
begin
 if not public.is_workspace_member(p_workspace) then raise exception 'Workspace access denied.' using errcode='42501'; end if;
 select timezone into tz from public.workspaces where id=p_workspace;
 select jsonb_build_object(
  'open',count(*) filter(where status not in ('completed','cancelled')),
  'overdue',count(*) filter(where status not in ('completed','cancelled') and due_at<now()),
  'waiting',count(*) filter(where status in ('waiting_on_client','blocked')),
  'reviews',count(*) filter(where status='for_review'),
  'completed_week',count(*) filter(where completed_at>=date_trunc('week',now() at time zone tz) at time zone tz),
  'completed_week_on_time',count(*) filter(where completed_at>=date_trunc('week',now() at time zone tz) at time zone tz and submitted_at<=due_at),
  'completed_week_with_deadline',count(*) filter(where completed_at>=date_trunc('week',now() at time zone tz) at time zone tz and due_at is not null),
  'submitted_week',count(*) filter(where submitted_at>=date_trunc('week',now() at time zone tz) at time zone tz),
  'timezone',tz,
  'week_start',(date_trunc('week',now() at time zone tz) at time zone tz)
 ) into data from public.runs where workspace_id=p_workspace;
 return data;
end $$;
create function public.automation_health(p_workspace uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if public.workspace_role(p_workspace) not in ('owner','manager') or public.workspace_role(p_workspace) is null then raise exception 'Manager permission required.'; end if;
 select jsonb_build_object('last_job_at',(select max(ran_at) from private.job_runs),'pending_email',count(*) filter(where o.sent_at is null and o.failed_at is null),'failed_email',count(*) filter(where o.failed_at is not null),'sent_email',count(*) filter(where o.sent_at is not null),'pending_uploads',(select count(*) from public.evidence where workspace_id=p_workspace and state='pending')) into result from private.email_outbox o join public.notifications n on n.id=o.notification_id where n.workspace_id=p_workspace;
 return result;
end $$;
revoke all on function public.run_automation(),public.claim_notification_emails(integer),public.finish_notification_email(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.run_automation(),public.claim_notification_emails(integer),public.finish_notification_email(uuid,boolean,text) to service_role;
revoke all on function public.workspace_stats(uuid),public.automation_health(uuid) from public,anon;
grant execute on function public.workspace_stats(uuid),public.automation_health(uuid) to authenticated;
commit;

begin;
-- An expired worker may not acknowledge a job reclaimed by another attempt.
create function public.finish_notification_email(job_id uuid,successful boolean,error_message text,expected_attempt integer) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Worker access only.' using errcode='42501'; end if;
 update private.email_outbox set sent_at=case when successful then now() else null end,
  failed_at=case when not successful and attempts>=5 then now() else null end,
  last_error=case when successful then null else left(error_message,500) end,
  locked_until=null,available_at=now()+make_interval(mins=>least(60,power(2,attempts)::integer))
 where id=job_id and sent_at is null and failed_at is null and attempts=expected_attempt and locked_until>=now();
 if not found then raise exception 'Email lease expired or was superseded; acknowledgement rejected.' using errcode='40001'; end if;
end $$;
revoke all on function public.finish_notification_email(uuid,boolean,text) from public,anon,authenticated,service_role;
revoke all on function public.finish_notification_email(uuid,boolean,text,integer) from public,anon,authenticated;
grant execute on function public.finish_notification_email(uuid,boolean,text,integer) to service_role;
commit;

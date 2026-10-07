-- Forward-only hardening: initial migrations may already have been applied.
begin;
create function private.valid_http_url(v text) returns boolean language sql immutable set search_path='' as $$
 select v is not null and length(v) between 1 and 2000
   and v ~ '^https?://(\[[0-9a-fA-F:]+\]|[a-zA-Z0-9][a-zA-Z0-9.-]*)(:[0-9]{1,5})?([/?#][^[:space:]\\]*)?$'
$$;
create or replace function private.validate_workflow(w jsonb) returns void language plpgsql set search_path='' as $$
declare s jsonb; r jsonb; opt jsonb; k text; seen text[] := '{}';
begin
 if jsonb_typeof(w) is distinct from 'object' or jsonb_typeof(w->'title') is distinct from 'string' or coalesce(length(btrim(w->>'title')),0) not between 1 and 200 then raise exception 'A text process title is required.'; end if;
 if jsonb_typeof(w->'steps') is distinct from 'array' then raise exception 'Steps must be an array.'; end if;
 if jsonb_array_length(w->'steps') not between 1 and 100 then raise exception 'Include 1 to 100 steps.'; end if;
 if jsonb_typeof(w->'review_required') is distinct from 'boolean' then raise exception 'Review requirement must be true or false.'; end if;
 if length(w::text)>200000 then raise exception 'Process content is too large.'; end if;
 foreach k in array array['description','sop','can_do','ask_first','never_do'] loop
  if w ? k and (jsonb_typeof(w->k) is distinct from 'string' or length(w->>k)>20000) then raise exception 'Process % must be text of at most 20000 characters.',k; end if;
 end loop;
 for s in select value from jsonb_array_elements(w->'steps') loop
  if jsonb_typeof(s) is distinct from 'object' then raise exception 'Every step must be an object.'; end if;
  if jsonb_typeof(s->'id') is distinct from 'string' or coalesce(s->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$' or s->>'id'=any(seen) then raise exception 'Step identifiers must be unique text.'; end if;
  seen:=array_append(seen,s->>'id');
  if jsonb_typeof(s->'title') is distinct from 'string' or coalesce(length(btrim(s->>'title')),0) not between 1 and 200 then raise exception 'Every step needs a text title.'; end if;
  if s ? 'instructions' and (jsonb_typeof(s->'instructions') is distinct from 'string' or length(s->>'instructions')>20000) then raise exception 'Step instructions must be text of at most 20000 characters.'; end if;
  if coalesce(s->>'kind','') not in ('checkbox','text','number','amount','date','url','yes_no','select') then raise exception 'Invalid step input type.'; end if;
  if coalesce(s->>'evidence','') not in ('none','file','before_after') then raise exception 'Invalid evidence type.'; end if;
  if jsonb_typeof(s->'required') is distinct from 'boolean' or jsonb_typeof(s->'allow_na') is distinct from 'boolean' or jsonb_typeof(s->'approval_before') is distinct from 'boolean' then raise exception 'Invalid step rules.'; end if;
  if jsonb_typeof(s->'options') is distinct from 'array' then raise exception 'Options must be an array.'; end if;
  if jsonb_array_length(s->'options')>50 or (s->>'kind'='select' and jsonb_array_length(s->'options')=0) then raise exception 'Dropdown steps need 1 to 50 options.'; end if;
  for opt in select value from jsonb_array_elements(s->'options') loop
   if jsonb_typeof(opt) is distinct from 'string' or length(opt#>>'{}') not between 1 and 200 then raise exception 'Every option must be text of 1 to 200 characters.'; end if;
  end loop;
 end loop;
 if jsonb_typeof(w->'resources') is distinct from 'array' then raise exception 'Resources must be an array.'; end if;
 if jsonb_array_length(w->'resources')>30 then raise exception 'At most 30 resources are allowed.'; end if;
 for r in select value from jsonb_array_elements(w->'resources') loop
  if jsonb_typeof(r->'label') is distinct from 'string' or coalesce(length(btrim(r->>'label')),0) not between 1 and 200 then raise exception 'Resource labels must be text of 1 to 200 characters.'; end if;
  if jsonb_typeof(r->'url') is distinct from 'string' or not private.valid_http_url(r->>'url') then raise exception 'Resource links must use HTTP(S) with a host and without credentials.'; end if;
 end loop;
end $$;
revoke all on all functions in schema private from public,anon,authenticated;
commit;

/** Real Auth/Storage/concurrency checks. Dedicated disposable local stack only. */
import './load-env.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const api = process.env.NEXT_PUBLIC_SUPABASE_URL;
const database = process.env.TEST_DATABASE_URL;
if (!api || !database || !['localhost','127.0.0.1'].includes(new URL(api).hostname) || !['localhost','127.0.0.1'].includes(new URL(database).hostname) || process.env.QA_DISPOSABLE !== 'va-relay') throw new Error('Requires QA_DISPOSABLE=va-relay and dedicated local API/database URLs. No remote fixtures allowed.');
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const sql = new pg.Client({connectionString:database});
await sql.connect();
const clients=[];
let total=0;
async function test(name,fn){await fn(); console.log(`PASS ${++total}: ${name}`);}
async function user(name){const client=createClient(api,key,{auth:{persistSession:false,autoRefreshToken:false}}); const {data,error}=await client.auth.signUp({email:`qa-${name}-${randomUUID()}@example.test`,password:randomUUID()+randomUUID(),options:{data:{display_name:`QA ${name}`}}}); if(error)throw error; assert.ok(data.session,'Local signup must return a confirmed test session'); clients.push(client);return {client,id:data.user.id,email:data.user.email};}
async function command(u,w,action,payload={},request_id=randomUUID()){const {data,error}=await u.client.rpc('app_command',{p_workspace:w,p_action:action,p_payload:{...payload,request_id}});if(error)throw new Error(error.message);return data;}
const step=(id,patch={})=>({id,title:id,instructions:'Synthetic QA only',kind:'checkbox',required:true,allow_na:false,evidence:'none',approval_before:false,options:[],...patch});
const flow=(steps,review_required=false)=>({title:'QA service flow',description:'',sop:'',can_do:'',ask_first:'',never_do:'',resources:[],steps,review_required});
async function row(u,id){const {data,error}=await u.client.from('runs').select('*').eq('id',id).single();if(error)throw error;return data;}
try{
 const owner=await user('owner'),va=await user('va'),reviewer=await user('reviewer'),outsider=await user('outsider');
 const w=(await command(owner,null,'create_workspace',{name:'QA services',timezone:'Europe/Amsterdam'})).id;
 for(const [u,role] of [[va,'va'],[reviewer,'client']]){const invite=await command(owner,w,'invite_member',{email:u.email,role});await command(u,null,'accept_invitation',{token:invite.token});}
 const run=(await command(owner,w,'create_run',{content:flow([step('proof',{evidence:'before_after'})]),assignee_id:va.id})).id;
 await test('concurrent saves admit exactly one version',async()=>{const p={run_id:run,expected_version:1,step_id:'proof',not_applicable:false,na_reason:''}; const results=await Promise.allSettled([command(va,w,'save_response',{...p,value:true}),command(va,w,'save_response',{...p,value:false})]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.match(results.find(x=>x.status==='rejected').reason.message,/changed in another session/);});
 await command(va,w,'save_response',{run_id:run,expected_version:(await row(va,run)).version,step_id:'proof',value:true,not_applicable:false,na_reason:''});
 await test('simultaneous identical request IDs return one created run',async()=>{const request=randomUUID(),p={content:flow([step('one')]),assignee_id:owner.id};const [a,b]=await Promise.all([command(owner,w,'create_run',p,request),command(owner,w,'create_run',p,request)]);assert.equal(a.id,b.id);});
 const file=Buffer.from('Synthetic QA evidence. No client data.');
 const reg=await command(va,w,'register_evidence',{run_id:run,step_id:'proof',filename:'qa.txt',content_type:'text/plain',size_bytes:file.length,label:'before'});
 await test('fabricated confirmation fails before upload',()=>assert.rejects(command(va,w,'confirm_evidence',{run_id:run,id:reg.id}),/incomplete/));
 await test('unrelated client cannot upload to registered path',async()=>{const r=await outsider.client.storage.from('evidence').upload(reg.path,file,{contentType:'text/plain'});assert.ok(r.error);});
 await test('wrong MIME is rejected by real Storage API',async()=>{const r=await va.client.storage.from('evidence').upload(reg.path,file,{contentType:'text/html'});assert.ok(r.error);});
 await test('oversized real Storage upload is rejected',async()=>{const r=await va.client.storage.from('evidence').upload(reg.path,Buffer.alloc(10485761),{contentType:'text/plain'});assert.ok(r.error);});
 await test('valid real file uploads and confirms',async()=>{const r=await va.client.storage.from('evidence').upload(reg.path,file,{contentType:'text/plain',upsert:false});assert.equal(r.error,null);await command(va,w,'confirm_evidence',{run_id:run,id:reg.id});});
 await test('duplicate immutable upload cannot overwrite',async()=>{assert.ok((await va.client.storage.from('evidence').upload(reg.path,file,{contentType:'text/plain',upsert:false})).error);assert.ok((await va.client.storage.from('evidence').upload(reg.path,Buffer.from('tamper'),{contentType:'text/plain',upsert:true})).error);});
 await test('confirmation retry produces no duplicate attachment audit',async()=>{await command(va,w,'confirm_evidence',{run_id:run,id:reg.id});const r=await owner.client.from('audit_events').select('id').eq('run_id',run).eq('event','evidence_attached');assert.equal(r.data.length,1);});
 await test('authorized download returns actual bytes',async()=>{const r=await va.client.storage.from('evidence').download(reg.path);assert.equal(r.error,null);assert.equal(await r.data.text(),file.toString());});
 await test('unrelated and anonymous downloads fail',async()=>{assert.ok((await outsider.client.storage.from('evidence').download(reg.path)).error);const anon=createClient(api,key,{auth:{persistSession:false}});assert.ok((await anon.storage.from('evidence').download(reg.path)).error);});
 await test('before evidence alone cannot satisfy before/after',()=>assert.rejects(command(va,w,'submit_run',{run_id:run,expected_version:3}),/after evidence required/));
 const after=await command(va,w,'register_evidence',{run_id:run,step_id:'proof',filename:'after.txt',content_type:'text/plain',size_bytes:file.length,label:'after'});
 await test('retry after uncertain upload response confirms same object',async()=>{assert.equal((await va.client.storage.from('evidence').upload(after.path,file,{contentType:'text/plain'})).error,null);assert.ok((await va.client.storage.from('evidence').upload(after.path,file,{contentType:'text/plain'})).error);await command(va,w,'confirm_evidence',{run_id:run,id:after.id});await command(va,w,'submit_run',{run_id:run,expected_version:3});assert.equal((await row(va,run)).status,'completed');});
 const proc=(await command(owner,w,'save_process',{content:flow([step('scheduled')])})).id;
 await command(owner,w,'publish_process',{id:proc});
 const schedule=(await command(owner,w,'save_schedule',{process_id:proc,assignee_id:va.id,reviewer_id:null,frequency:'daily',weekday:1,monthday:1,local_time:'17:00',timezone:'UTC',lead_minutes:1440,starts_after:null})).id;
 await test('concurrent scheduler commands create no duplicate occurrences',async()=>{await Promise.all([command(owner,w,'generate_schedules'),command(owner,w,'generate_schedules')]);const r=await owner.client.from('runs').select('id,occurrence_at').eq('schedule_id',schedule);assert.ok(r.data.length>0);assert.equal(new Set(r.data.map(x=>x.occurrence_at)).size,r.data.length);});
 await test('actual worker overlap respects singleton transaction lock',async()=>{const a=new pg.Client({connectionString:database}),b=new pg.Client({connectionString:database});await a.connect();await b.connect();try{for(const c of [a,b]){await c.query('begin');await c.query("set local role service_role; select set_config('request.jwt.claims','{\"role\":\"service_role\"}',true)");}await a.query('select public.run_automation()');const skipped=(await b.query('select public.run_automation() as r')).rows[0].r;assert.equal(skipped.skipped,'already_running');}finally{await a.query('rollback');await b.query('rollback');await a.end();await b.end();}});
 const signed=await va.client.storage.from('evidence').createSignedUrl(reg.path,60);assert.equal(signed.error,null);
 await command(owner,w,'remove_member',{user_id:va.id,replacement_id:owner.id,note:'Synthetic QA handover'});
 await test('offboarded session cannot obtain new downloads or signed URLs',async()=>{assert.ok((await va.client.storage.from('evidence').download(reg.path)).error);assert.ok((await va.client.storage.from('evidence').createSignedUrl(reg.path,60)).error);});
 await test('previously signed URL remains a bounded revocation limitation',async()=>{const response=await fetch(signed.data.signedUrl);assert.equal(response.status,200);assert.equal(await response.text(),file.toString());});
 console.log(`${total} real local Auth/Storage/concurrency checks passed. Synthetic fixtures remain only in disposable QA stack.`);
}finally{for(const c of clients)await c.auth.signOut();await sql.end();}

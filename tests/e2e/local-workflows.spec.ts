import { test, expect, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
const local = process.env.QA_DISPOSABLE === 'va-relay' && ['localhost','127.0.0.1'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://invalid.test').hostname);
test.skip(!local, 'Requires explicit disposable local Auth/Storage stack; never runs against hosted data.');
test.setTimeout(180000);
type Actor={client:SupabaseClient; id:string;email:string;password:string};
async function actor(name:string):Promise<Actor>{
 const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const email=`qa-browser-${randomUUID()}@example.test`,password=randomUUID()+randomUUID();
 const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:`QA ${name}`}}});if(error)throw error;
 return {client,id:data.user!.id,email,password};
}
async function cmd(u:Actor,w:string|null,action:string,payload:Record<string,unknown>={}){const {data,error}=await u.client.rpc('app_command',{p_workspace:w,p_action:action,p_payload:{...payload,request_id:randomUUID()}});if(error)throw new Error(error.message);return data;}
async function login(page:Page,u:Actor){await page.goto('/login');await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);await page.locator('#auth-submit').click();await expect(page).toHaveURL(/dashboard/);}
const step=(id:string,patch:Record<string,unknown>={})=>({id,title:id,instructions:'Synthetic QA instruction',kind:'checkbox',required:true,allow_na:false,evidence:'none',approval_before:false,options:[],...patch});
const flow=(steps:ReturnType<typeof step>[],review_required=false)=>({title:'QA browser SOP',description:'',sop:'Synthetic QA procedure',can_do:'Check',ask_first:'Changes',never_do:'Real transactions',resources:[],steps,review_required});
async function save(page:Page,id:string){await page.locator(`#save-step-${id}`).click();await expect(page.locator(`#run-step-${id}`).getByText('Saved to workspace.')).toBeVisible();}

test('workspace, draft/publish, modal focus, quick task, archive and screenshots',async({page},info)=>{
 const owner=await actor('owner');await login(page,owner);
 await page.locator('#create-workspace').click();await expect(page.locator('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#create-workspace')).toBeFocused();
 await page.locator('#create-workspace').click();await page.locator('#workspace-name').fill('QA browser workspace');await page.locator('#workspace-form-submit').click();await expect(page).toHaveURL(/workspaces\/.+\/today/);
 const w=page.url().split('/workspaces/')[1]!.split('/')[0]!;
 await page.goto(`/workspaces/${w}/processes`);await page.locator('#new-process').click();await page.locator('#process-title').fill('QA published SOP');await page.locator('input[id^="step-"][id$="-title"]').fill('Check result');await page.locator('#process-form-submit').click();await expect(page.locator('dialog')).toHaveCount(0);await page.locator('button[id^="publish-process-"]').click();await expect(page.getByText('New SOP version published. Existing runs are unchanged.')).toBeVisible();
 await page.locator('#new-work').click();await page.locator('#task-title').fill('QA quick task');await page.locator('#task-instructions').fill('Synthetic action only');await page.locator('#new-task-form-submit').click();await expect(page).toHaveURL(/runs\//);const id=await page.locator('input[id^="step-value-"]').getAttribute('id');const sid=id!.replace('step-value-','');await page.locator(`#${id}`).check();await save(page,sid);await page.reload();await expect(page.locator(`#${id}`)).toBeChecked();await page.locator('#submit-run').click();await expect(page.getByText('Work completed.')).toBeVisible();
 await page.screenshot({path:`artifacts/qa/${info.project.name}-completed.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await cmd(owner,w,'update_workspace',{name:'QA browser workspace',timezone:'Asia/Manila',archived:true});await page.goto(`/workspaces/${w}/processes`);await expect(page.locator('#new-work')).toHaveCount(0);await expect(page.locator('button[id^="publish-process-"]')).toHaveCount(0);await expect(page.locator('button[id^="start-process-"]')).toHaveCount(0);await page.goto(`/workspaces/${w}/team`);await expect(page.locator('#invite-member')).toHaveCount(0);
 await cmd(owner,w,'update_workspace',{name:'QA browser workspace',timezone:'Asia/Manila',archived:false});await page.goto(`/workspaces/${w}/reports`);const csv=await page.request.get(`/api/export/${w}?format=csv`);expect(csv.status()).toBe(200);const json=await page.request.get(`/api/export/${w}`);expect((await json.json()).attachment_bytes_included).toBe(false);
});

test('two real sessions: permission, typed answers, upload retention, correction and isolation',async({page,browser},info)=>{
 const owner=await actor('owner'),va=await actor('VA'),reviewer=await actor('reviewer'),other=await actor('other client');
 const w=(await cmd(owner,null,'create_workspace',{name:'QA approval workspace',timezone:'UTC'})).id;
 for(const [u,role] of [[va,'va'],[reviewer,'client']] as const){const inv=await cmd(owner,w,'invite_member',{email:u.email,role});await cmd(u,null,'accept_invitation',{token:inv.token});}
 const run=(await cmd(owner,w,'create_run',{content:flow([step('gate',{approval_before:true,evidence:'file'}),step('zero',{kind:'number'}),step('no',{kind:'yes_no'}),step('text',{kind:'text'})],true),assignee_id:va.id,reviewer_id:reviewer.id})).id;
 await login(page,va);await page.goto(`/workspaces/${w}/runs/${run}`);
 const reviewContext=await browser.newContext();const reviewPage=await reviewContext.newPage();await login(reviewPage,reviewer);
 await expect(page.locator('#step-value-gate')).toBeDisabled();await page.locator('#request-permission-gate').click();await page.locator('#permission-reason-gate').fill('Synthetic QA permission request');await page.locator('#permission-request-gate-submit').click();await expect(page.locator('dialog')).toHaveCount(0);
 await reviewPage.goto(`/workspaces/${w}/runs/${run}`);await reviewPage.locator('button[id^="decide-permission-"]').click();await reviewPage.locator('#permission-note').fill('Approved for synthetic QA');await reviewPage.locator('#permission-decision-form-submit').click();await expect(reviewPage.locator('dialog')).toHaveCount(0);
 await page.reload();await page.locator('#run-step-gate summary').filter({hasText:'Attach evidence'}).click();await page.locator('#evidence-file-gate').setInputFiles({name:'synthetic.txt',mimeType:'text/plain',buffer:Buffer.from('Synthetic QA evidence')});await page.locator('#step-value-gate').check();await save(page,'gate');
 // Saving used to remount this input and silently discard the selected file.
 await expect(page.locator('#upload-evidence-gate')).toBeEnabled();expect(await page.locator('#evidence-file-gate').evaluate((el:HTMLInputElement)=>el.files?.length)).toBe(1);
 // The real upload succeeds; lose only the command response, then retry the same registration.
 let interrupted=false;await page.route('**/api/command',async route=>{if(route.request().postDataJSON().action==='confirm_evidence'&&!interrupted){interrupted=true;await route.fetch();await route.fulfill({status:200,contentType:'application/json',body:'{"data":'});}else await route.continue();});
 await page.locator('#upload-evidence-gate').click();await expect(page.getByText(/server response was interrupted/).first()).toBeVisible();await page.locator('#upload-evidence-gate').click();await expect(page.locator('a[id^="evidence-"]')).toBeVisible();await page.unroute('**/api/command');
 await page.locator('#step-value-zero').fill('0');await save(page,'zero');await page.locator('#step-value-no').selectOption('no');await save(page,'no');await page.locator('#step-value-text').fill('Unsaved QA answer');
 page.once('dialog',d=>d.dismiss());await page.locator('#nav-workspaces').click({force:true});await expect(page).toHaveURL(new RegExp(run));await expect(page.locator('#step-value-text')).toHaveValue('Unsaved QA answer');
 await page.context().setOffline(true);await page.locator('#save-step-text').click();await expect(page.locator('#run-step-text').getByRole('alert')).toBeVisible();await page.context().setOffline(false);await save(page,'text');
 await page.locator('#submit-run').click();await expect(page.getByText('Submitted for review.')).toBeVisible();
 await reviewPage.reload();await reviewPage.locator('#run-review-decision').selectOption('changes_requested');await reviewPage.locator('#run-review-note').fill('Please correct the synthetic note');await reviewPage.locator('#review-run-form-submit').click();
 await expect(reviewPage.getByText('Changes requested.')).toBeVisible();await page.reload();await page.locator('#step-value-text').fill('Corrected synthetic note');await save(page,'text');await page.locator('#submit-run').click();await expect(page.getByText('Submitted for review.')).toBeVisible();await reviewPage.reload();await reviewPage.locator('#run-review-note').fill('Accepted after correction');await reviewPage.locator('#review-run-form-submit').click();await expect(reviewPage.getByText('Work accepted.')).toBeVisible();
 await page.reload();await expect(page.locator('#step-value-zero')).toHaveValue('0');await expect(page.locator('#step-value-no')).toHaveValue('no');await expect(page.locator('#step-value-gate')).toBeDisabled();await page.screenshot({path:`artifacts/qa/${info.project.name}-reviewed.png`,fullPage:true});
 const otherContext=await browser.newContext();const otherPage=await otherContext.newPage();await login(otherPage,other);const response=await otherPage.goto(`/workspaces/${w}/runs/${run}`);expect(response?.status()).toBe(404);expect((await otherPage.request.get(`/api/export/${w}`)).status()).toBe(403);await otherContext.close();await reviewContext.close();
});

test('cron rejects missing and incorrect bearer tokens',async({request})=>{for(const headers of [{},{Authorization:'Bearer wrong'}]){const r=await request.post('/api/cron',{headers});expect(r.status()).toBe(401);}});

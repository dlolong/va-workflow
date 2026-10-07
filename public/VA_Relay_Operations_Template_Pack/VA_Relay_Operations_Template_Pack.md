# VA Relay — Operations Template Pack

**18 work areas · 20 ready-to-configure processes · Role-based instructions**

This pack is for administrative and e-commerce operations VAs. It is a draft starting point, not a universal job description. Keep the work within each client's agreed responsibilities. Promotion registration, start and end are separate processes so removal is not forgotten.

A **process** is the reusable method. A **run** is one assigned occurrence, such as one invoice or one listing check. An **issue** is a problem with an internal owner, next action and follow-up date.

## Before publishing a template

Replace bracketed setup items; add real approved resource links; name the VA, trainer and authorized reviewer; agree the actual due date and client timezone. Confirm which actions are permitted and which require an owner decision. Review the suggested evidence and final-review defaults. No schedules, members, real files or business accounts are included.

Use these role labels as setup placeholders, not extra application roles: **Operations lead**, **Customer service lead**, **Content lead**, **Marketplace lead**, and **Business owner**. Map them to actual authorized workspace members. A trainer, a final reviewer and a business decision-maker are not automatically the same person.

## Add a process manually

Open **Processes & SOPs → + Create process**. Copy the title and goal. Put the When, One run covers, Client setup, Who to ask and Done when information in **SOP / how to perform the work**. Copy **VA can do**, **Ask first** and **Never do** into their matching fields.

Paste the supplied step titles into **Paste an existing checklist → Append as steps**. Remove the unused default “First step.” Configure each step's instructions, input type, required answer, evidence, N/A and permission settings using the detailed template. Pasting titles alone does not configure those settings. Add approved resource links, click **Save draft**, then have an owner/manager approve and **Publish draft**.

For selected templates, a developer can instead add the supplied TypeScript catalog. This does not require a database migration. The JSON file is developer data, not a file the existing app can upload/import.

## Start work

Use **Start run**, enter a clear title and reference, assign the VA, select a separate reviewer when required, and set the agreed deadline. For example: `Invoice | INV-001` or `Listing check | Channel | SKU-001` (dummy identifiers).

Open **My Day → the run → View SOP**. Do the actual work in the approved tool, click **Save step**, attach the required evidence, and only then submit or complete. Save one changed step at a time. Wait for uploads to finish. Refresh after another person records a decision.

## Read the settings correctly

All listed steps require an answer unless the client changes the configuration. N/A is disabled except on the two explicitly optional B2B document stages. A permission-gated step never allows N/A. **Before and after files** means upload one file labelled Before and one labelled After. A selected file is not an attached file until the upload succeeds.

**Require review after submission** is enabled for selected training-sensitive templates. These are suggested controls, not a rule that all routine VA work needs review. Before-action permission is separate from final review. A run with either requirement needs a different active owner, manager or client as reviewer; a VA cannot review their own work.

## Common issue / waiting rules

An adverse answer does not automatically create an issue. Use **Issues & exceptions → + Report issue** and record what happened, what you checked, your proposed next action, an internal owner and a follow-up date. Make it blocking when the assigned outcome cannot be completed while it remains unresolved.

For an entire run that is waiting, also use **Update status / follow-up** and keep both records consistent. A waiting task can still be overdue. Completing a daily review or investigation does not mean all separately routed work is resolved. Do not mark a failed operation as successful to clear the queue.

## What stays outside this operations scope

Strategy and departmental decisions, creating ads/content, customer replies, supply-chain decisions, SEO, webshop development and making payments stay with the designated business owners or specialists. A different client agreement needs a separately approved scope, not a quiet change to these templates.

## Template index

| Code | Template | When to use |
|---|---|---|
| 01 | Get access to the approved tools | At onboarding and whenever the client assigns a new tool or storefront. |
| 02 | Collect and send an invoice | When an invoice or receipt is received or requested. Agree any inbox-check cadence with the client. |
| 03 | Update SOP and deadline trackers | When a procedure, obligation, owner or file location changes; agree any routine review cadence. |
| 04 | Check marketplace account notifications | On an assigned account review or a new account/policy notification. Agree recurring coverage with the client. |
| 05 | Create a return label and track arrival | After the customer service lead has decided the return and requested label creation. |
| 06 | Prepare B2B documents and check payment | When the customer service lead or business owner requests B2B invoice documents. |
| 07 | Keep marketplace rules easy to find | At the initial consolidation and when approved channel rules change. |
| 08 | Prepare content research and files | When the content lead requests research, organization or repetitive preparation work. |
| 09A | Get approval and register a campaign | When campaign registration is requested, before its confirmed registration deadline. |
| 09B | Start an approved promotion | On the approved promotion start date/time in the agreed client timezone. |
| 09C | End a promotion and verify the price | On the approved promotion end date/time in the agreed client timezone. |
| 10 | Apply an approved price change | When a standard price change is assigned, at its approved effective time. |
| 11 | Update product cost rules | When updated cost data or a cost-rule update is assigned. Inventory-value reports are separate requests when asked. |
| 12 | Prepare and submit compliance information | For each compliance request. Use monthly recurrence only for a confirmed monthly obligation. |
| 13 | Check a product listing each week | Weekly. Agree the weekday, deadline time and client timezone before creating a schedule. |
| 14 | Check inventory sync and route alerts | At the client-agreed check cadence or when an inventory-sync/stock alert is assigned. |
| 15 | Apply approved storefront changes | When the business owner assigns a storefront change or approved audit correction. |
| 16 | Prepare and verify a product launch | When the business owner assigns a product launch and confirms the target channels and timing. |
| 17 | Review platform mail and record deadlines | Daily. Confirm account coverage and the client-local deadline; do not silently change daily coverage to weekdays. |
| 18 | Investigate a payment or account issue | When a failed payment, reminder, blocked account or payout/refund-blocking issue is assigned. |

---

## 01 — Get access to the approved tools

**Work area:** Accounts and access

**Goal:** Open the correct tools, recognize each storefront, and report missing access.

**When:** At onboarding and whenever the client assigns a new tool or storefront.

**One run covers:** One agreed set of tools and storefronts for one client.

**Who to ask:** Operations lead or access administrator

**Client setup — fill before publishing:** [Tool and storefront list]; [approved access-request method]; [training/reference links]; [access-check deadline]. Use approved support or AI references only within client data rules.

**Done when:** Every required access test passes and the tool/storefront list is recorded. Keep missing required access open with an owner.

**VA can do:** Request the approved access; test assigned accounts; record which storefront each account belongs to.

**Ask first:** A missing invitation, wrong account, unexpected permission, unfamiliar tool, or blocked login.

**Never do:** Store passwords, recovery codes or tokens in the task; grant yourself extra permissions; use an unapproved account.

**Final review default:** Not required. Enable for training when agreed.

### Paste these checklist titles

```text
Confirm the tool and storefront list
Request the approved access
Test each assigned login
Save the approved reference links
Resolve required access gaps
Record the completed access handover
```

### Configure each step

#### 1. Confirm the tool and storefront list

Record the required tools, storefronts and account labels. Ask the client about any unclear account mapping.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Request the approved access

Follow the client access-request method. Never ask for credentials in a task comment.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Test each assigned login

Open each required account and check that the expected storefront is accessible. Record pass/fail results without secrets.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Save the approved reference links

Add approved help/training links to the process resources, or record them for the manager to add. No copied credentials.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Resolve required access gaps

Do not tick this until all required access is usable. Record any earlier issue and its resolution in the run.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 6. Record the completed access handover

Summarize the accounts you can use and the person to contact if access stops working.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 02 — Collect and send an invoice

**Work area:** Receipts and invoice inbox

**Goal:** Find the correct invoice or receipt and send it to bookkeeping with a traceable handoff.

**When:** When an invoice or receipt is received or requested. Agree any inbox-check cadence with the client.

**One run covers:** One invoice or receipt, not an entire month of expenses.

**Who to ask:** Operations lead; business owner for non-routine accountant questions

**Client setup — fill before publishing:** [Supplier and reporting period]; [approved invoice sources]; [bookkeeping destination]; [owner to copy on accountant replies]; [due date]. Start with receipts/subscriptions, then the agreed expense scope.

**Done when:** The correct document has reached the approved bookkeeping destination and its handoff reference is saved.

**VA can do:** Collect documents; check completeness against the request; find missing invoices; answer approved standard questions with the owner copied.

**Ask first:** A missing document, conflicting details, unclear amount/currency/tax information, or a question outside the agreed standard replies.

**Never do:** Pay an invoice, fabricate a document, change financial facts, or invent tax treatment.

**Final review default:** Required — suggested training safeguard.

**Important:** Final review is enabled as a suggested training default, not a universal requirement. A manager can change it after agreeing the process.

### Paste these checklist titles

```text
Record the requested document
Find the invoice or receipt
Check the document and attach it
Send the document to bookkeeping
Save the handoff reference
Record questions or follow-ups
```

### Configure each step

#### 1. Record the requested document

Enter the supplier, period and invoice/receipt reference. Put the identifier in the task title too.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Find the invoice or receipt

Locate the correct document using the approved source. If missing, leave this unfinished and create an issue.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Check the document and attach it

Check it against the request; attach the approved, necessary document. Route discrepancies before continuing.

Input: **Checkbox** · Required: **Yes** · Evidence: **File / screenshot** · N/A: **No** · Permission before action: **No**.

#### 4. Send the document to bookkeeping

Use the client-approved external channel. The app does not send it for you.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Save the handoff reference

Record the message, submission or delivery reference and recipient. Do not write only "sent".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 6. Record questions or follow-ups

Write "None" when there are no questions. For standard accountant replies, use the approved response and copy the owner externally; route anything else.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 03 — Update SOP and deadline trackers

**Work area:** Admin trackers

**Goal:** Keep procedure ownership, obligations and document locations clear and findable.

**When:** When a procedure, obligation, owner or file location changes; agree any routine review cadence.

**One run covers:** One requested tracker update or explicitly defined tracker review.

**Who to ask:** Operations lead

**Client setup — fill before publishing:** [SOP index]; [compliance tracker]; [folder conventions]; [scope of this update]; [owner for each obligation].

**Done when:** The agreed updates are recorded, links work, and each affected obligation has its requirement, country, deadline and owner.

**VA can do:** Update agreed tracker entries; record responsibility; organize approved links and folders.

**Ask first:** An unclear owner, conflicting deadline, unknown country requirement, or an uncertain move/delete instruction.

**Never do:** Invent a deadline or obligation; publish unapproved procedures; delete client records without authorization.

**Final review default:** Not required. Enable for training when agreed.

### Paste these checklist titles

```text
Identify the records to update
Update SOP status and owner
Record compliance details
Create or update dated work
Check folders and links
Save an update summary
```

### Configure each step

#### 1. Identify the records to update

Record the tracker, affected entries and reason for the update.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Update SOP status and owner

Record each affected SOP, its agreed status and responsible person. Use Processes & SOPs and Handovers where appropriate.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Record compliance details

Record requirement, country, exact deadline and owner for affected obligations. Write "No compliance changes" when outside this run.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Create or update dated work

For actionable deadlines, create or deliberately update the relevant run. Notes alone do not populate Deadlines.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Check folders and links

Use the approved folder structure; verify intended members can open the links without broadening access.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 6. Save an update summary

Record what changed and where it can be found. Leave unresolved required details open.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 04 — Check marketplace account notifications

**Work area:** Marketplace account admin

**Goal:** Handle approved seller-portal administration and route account or policy problems.

**When:** On an assigned account review or a new account/policy notification. Agree recurring coverage with the client.

**One run covers:** One account review or one clearly identified portal case.

**Who to ask:** Operations lead; customer service lead for customer-facing decisions

**Client setup — fill before publishing:** [Approved seller portal and storefront]; [account-health checks]; [routine response rules]; [case ownership]; [review cadence or case deadline].

**Done when:** The assigned notifications and portal cases are handled within authority or routed with references and next actions.

**VA can do:** Review account health, follow approved policy steps and handle the portal side of return cases.

**Ask first:** An account restriction, ambiguous policy requirement, appeal, refund decision or customer-facing response.

**Never do:** Answer customers, decide refunds, change policy or make account decisions outside the approved instructions.

**Final review default:** Not required. Enable for training when agreed.

**Important:** This is a review-and-routing template. An unresolved account problem may live in a separate owned case; do not describe the account as fixed unless verified.

### Paste these checklist titles

```text
Confirm the account and case scope
Review account-health notifications
Complete permitted portal follow-ups
Coordinate the customer-facing handoff
Record handled and routed cases
```

### Configure each step

#### 1. Confirm the account and case scope

Record the seller account/storefront and review scope or case reference.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Review account-health notifications

Read the assigned notifications. Record important messages and any exact deadlines.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Complete permitted portal follow-ups

Carry out only the approved routine steps. Record the portal/case references or "No routine follow-up".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Coordinate the customer-facing handoff

Route customer decisions to the customer service lead. Record the recipient and request, or "Not needed".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Record handled and routed cases

Summarize completed portal actions and open issues with their owners and follow-up dates.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 05 — Create a return label and track arrival

**Work area:** Return labels and shipment follow-ups

**Goal:** Create the authorized return label and follow the shipment until arrival is verified.

**When:** After the customer service lead has decided the return and requested label creation.

**One run covers:** One return shipment.

**Who to ask:** Customer service lead

**Client setup — fill before publishing:** [Return decision reference]; [approved shipping/returns tool]; [label instructions]; [tracking source]; [arrival confirmation method]; [follow-up interval].

**Done when:** The authorized label is created, the tracking reference is recorded, and shipment arrival is verified.

**VA can do:** Prepare the approved label and follow the shipment; record status and delivery proof.

**Ask first:** No return decision, inconsistent shipment details, a failed label, a delayed/lost parcel, or uncertain arrival.

**Never do:** Decide or issue a refund; assume a return is approved; close the run merely because a label was created.

**Final review default:** Not required. Enable for training when agreed.

**Important:** For a waiting status, choose the internal follow-up owner and describe the carrier dependency in the reason. Do not invite a carrier just to fill the waiting-person field.

### Paste these checklist titles

```text
Record the approved return decision
Check the shipment details
Create the return label
Record the tracking reference
Follow the shipment
Verify the shipment arrived
Notify the customer service lead
```

### Configure each step

#### 1. Record the approved return decision

Enter the order/return reference and the customer service decision authorizing the label. If absent, stop and ask.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Check the shipment details

Confirm the approved sender, destination and package details. Do not copy unnecessary customer details into comments.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Create the return label

Use the approved external shipping/returns tool and follow the client method. Record the label reference.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Record the tracking reference

Enter the tracking link or identifier and the current carrier status.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Follow the shipment

Record checks and the next follow-up while it is travelling. Keep the arrival step unfinished.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 6. Verify the shipment arrived

Complete only after approved arrival confirmation. Attach the permitted delivery/receipt evidence.

Input: **Checkbox** · Required: **Yes** · Evidence: **File / screenshot** · N/A: **No** · Permission before action: **No**.

#### 7. Notify the customer service lead

Record the arrival handoff reference. A refund remains a separate authorized decision.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 06 — Prepare B2B documents and check payment

**Work area:** B2B pro formas and invoices

**Goal:** Prepare requested invoice documents and verify the incoming bank transfer before shipment.

**When:** When the customer service lead or business owner requests B2B invoice documents.

**One run covers:** One B2B order and its requested pro forma/final-invoice stages.

**Who to ask:** Customer service lead or business owner

**Client setup — fill before publishing:** [Order details]; [approved pro forma/final templates]; [authorized tax instructions]; [incoming-payment verification method]; [shipping contact]; [due date].

**Done when:** The requested documents are prepared, transfer arrival is verified, and the shipping contact receives the verification reference.

**VA can do:** Prepare requested documents from approved templates and check incoming payment through authorized access.

**Ask first:** Unclear tax treatment, mismatched order details, missing transfer, a discrepancy or missing verification access.

**Never do:** Choose a tax rate; claim a payment arrived without evidence; pay vendors; authorize dispatch beyond your role.

**Final review default:** Required — suggested training safeguard.

**Important:** Use 0% VAT reverse charge only when the client has confirmed it applies and supplied the approved instruction. This template does not determine tax treatment. Arrange document stages in the client-approved order; no invoice-issuance sequence is prescribed here. A blocked run does not physically prevent external shipping.

### Paste these checklist titles

```text
Check the invoice request
Prepare the pro forma if requested
Prepare the final invoice if requested
Verify the bank transfer arrived
Record payment verification
Tell the shipping contact the result
```

### Configure each step

#### 1. Check the invoice request

Record the order reference, requested document stages and approved template.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Prepare the pro forma if requested

Use the approved template and tax instruction. Upload the permitted copy. N/A is allowed only when not requested.

Input: **Checkbox** · Required: **Yes** · Evidence: **File / screenshot** · N/A: **Allowed with reason** · Permission before action: **No**.

#### 3. Prepare the final invoice if requested

Follow the approved issuance timing and template. Attach the permitted copy. N/A is allowed only when not requested.

Input: **Checkbox** · Required: **Yes** · Evidence: **File / screenshot** · N/A: **Allowed with reason** · Permission before action: **No**.

#### 4. Verify the bank transfer arrived

Use the approved verification source. Leave unfinished and raise a blocking issue if payment is missing, uncertain or inconsistent.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Record payment verification

Record the order, verified amount/currency and authorized verification reference without exposing banking credentials.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 6. Tell the shipping contact the result

Send the verification through the real shipping workflow and record the communication reference. Do not rely on this checklist to hold an order.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 07 — Keep marketplace rules easy to find

**Work area:** Marketplace rules in one place

**Goal:** Maintain one clear reference per channel using completed, approved policy research.

**When:** At the initial consolidation and when approved channel rules change.

**One run covers:** One channel rule page or one approved update to it.

**Who to ask:** Customer service lead

**Client setup — fill before publishing:** [Channel]; [completed policy research]; [approved rule-page location]; [reviewer]; [effective date/version if supplied].

**Done when:** The channel reference accurately records return policy, label payer and refund rules, and is approved and findable.

**VA can do:** Organize and transcribe approved research into the agreed reference format.

**Ask first:** Conflicting, missing or unclear research; a proposed rule change; uncertain validity.

**Never do:** Invent policy, choose who pays, decide refunds, or replace approved research with assumptions.

**Final review default:** Required — suggested training safeguard.

### Paste these checklist titles

```text
Open the completed policy research
Record the return policy
Record who pays for the label
Record the refund rules
Save and check the channel page
Submit the reference for review
```

### Configure each step

#### 1. Open the completed policy research

Record the approved research reference and channel.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Record the return policy

Summarize the approved return conditions without changing their meaning.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Record who pays for the label

Use the approved research; escalate an unclear or conditional answer.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Record the refund rules

Preserve the approved conditions and decision authority.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Save and check the channel page

Save it in the approved location and record a working link.

Input: **URL** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 6. Submit the reference for review

Check it against the research and submit for the designated reviewer. Do not describe it as approved before review.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 08 — Prepare content research and files

**Work area:** Content research and organisation

**Goal:** Prepare useful references and organized files for the content lead to decide and create.

**When:** When the content lead requests research, organization or repetitive preparation work.

**One run covers:** One research/preparation brief with an agreed deliverable.

**Who to ask:** Content lead

**Client setup — fill before publishing:** [Research brief]; [reference/competitor scope]; [approved sources]; [folder conventions]; [required deliverable]; [due date].

**Done when:** The requested references and organized files are handed to the content lead with a clear location.

**VA can do:** Research approved reference/competitor content, organize files, and complete agreed repetitive preparation.

**Ask first:** An unclear brief, missing materials, a requested creative decision or a change in scope.

**Never do:** Create or publish ads/content, choose strategy, or make creative decisions under this preparation-only scope.

**Final review default:** Not required. Enable for training when agreed.

### Paste these checklist titles

```text
Read the preparation brief
Collect relevant references
Organize the working files
Complete the agreed preparation
Hand the materials to the content lead
```

### Configure each step

#### 1. Read the preparation brief

Record the topic, scope and expected deliverable. Ask before researching outside it.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Collect relevant references

Record reference/competitor links and a short note explaining relevance to the brief.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Organize the working files

Use the approved folder names and locations; keep the requested materials findable.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Complete the agreed preparation

Record the repetitive preparation performed, or "No additional preparation requested".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Hand the materials to the content lead

Save the deliverable location and handoff reference. The content lead decides and creates.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 09A — Get approval and register a campaign

**Work area:** Promotions - registration

**Goal:** Register for a marketplace campaign only after the business owner approves the exact proposal.

**When:** When campaign registration is requested, before its confirmed registration deadline.

**One run covers:** One campaign-registration request for one channel or explicitly approved group.

**Who to ask:** Business owner for permission; marketplace lead for preparation

**Client setup — fill before publishing:** [Campaign/channel]; [approved commercial plan]; [registration requirements]; [deadline]; [business owner as run reviewer].

**Done when:** The approved registration is submitted, its result is recorded, and separate start/end work is arranged where needed.

**VA can do:** Prepare campaign details and register only after the owner gives the required permission.

**Ask first:** Campaign eligibility, changed terms, missing approval, registration errors or any unapproved price/commitment.

**Never do:** Register without the owner’s go-ahead; change the approved commercial terms; treat approval as unlimited authority.

**Final review default:** Not required. Enable for training when agreed.

**Important:** Assign the business owner as the run reviewer. Registration permission is not final review and does not create promotion start/end tasks automatically.

### Paste these checklist titles

```text
Record the campaign proposal
Confirm the registration deadline
Get permission and register
Save the registration result
Arrange the promotion start and end runs
```

### Configure each step

#### 1. Record the campaign proposal

Enter the campaign/channel, proposed products and approved plan reference. Include exact terms for the owner to decide.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Confirm the registration deadline

Record the source wording and confirmed deadline. Make sure the run due date matches the approved cutoff.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Get permission and register

Click Request permission with the exact proposal. Wait for the business owner’s approval, refresh, then register externally. Do not act while waiting.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **Required**.

#### 4. Save the registration result

Record the confirmation/case reference. If submission failed, leave required registration unfinished and route the problem.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Arrange the promotion start and end runs

Record links or references to the separate start and end tasks, or explain why no execution tasks are needed for this registration.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 09B — Start an approved promotion

**Work area:** Promotions - start

**Goal:** Apply approved promotion prices on the correct start date and verify the live result.

**When:** On the approved promotion start date/time in the agreed client timezone.

**One run covers:** One product/channel, or a clearly listed batch with a coverage record.

**Who to ask:** Marketplace lead; business owner for changes to campaign decisions

**Client setup — fill before publishing:** [Campaign reference]; [products/channels]; [approved promo prices and currencies]; [start cutoff/timezone]; [separate end-task reference]; [permitted update method].

**Done when:** Every target in this run has the approved promotion price and verified before/after records, or required failures remain open.

**VA can do:** Enter the exact approved promotion prices and check before/after states.

**Ask first:** A missing end task, unclear timezone, unapproved price, conflicting live result or rejected update.

**Never do:** Choose promotion terms/prices; register an unapproved campaign; assume an end task will be created automatically.

**Final review default:** Not required. Enable for training when agreed.

### Paste these checklist titles

```text
Check the plan and start time
Confirm a separate end task exists
Record the current price
Apply and verify the promotion price
Record coverage and exceptions
```

### Configure each step

#### 1. Check the plan and start time

Record the campaign reference, targets, currency and agreed start time. Confirm the plan is approved.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Confirm a separate end task exists

Record the end-run reference and removal deadline before beginning the promotion.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Record the current price

Verify the correct live product/channel and record its current price and currency.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Apply and verify the promotion price

Follow the approved external method at the correct time. Attach the initial state as Before and verified result as After.

Input: **Checkbox** · Required: **Yes** · Evidence: **Before and after files** · N/A: **No** · Permission before action: **No**.

#### 5. Record coverage and exceptions

List targets verified and any issue references. Unapplied or unverified required targets block completion.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 09C — End a promotion and verify the price

**Work area:** Promotions - end

**Goal:** Remove the promotion on its end date and verify the approved post-promotion price.

**When:** On the approved promotion end date/time in the agreed client timezone.

**One run covers:** One product/channel, or a clearly listed batch with a coverage record.

**Who to ask:** Marketplace lead

**Client setup — fill before publishing:** [Campaign and start-run references]; [end deadline/timezone]; [target products/channels]; [approved post-promotion prices/currencies]; [removal method].

**Done when:** Promotion pricing is removed for every target in scope and the approved replacement prices are verified.

**VA can do:** Remove the promotion and enter the client-approved post-promotion prices.

**Ask first:** An unclear replacement price, conflicting end time, removal failure or live price mismatch.

**Never do:** Assume the original price must be restored; decide new prices; close the run before verifying the live result.

**Final review default:** Not required. Enable for training when agreed.

### Paste these checklist titles

```text
Confirm the removal scope and deadline
Check the approved replacement prices
Remove the promotion and verify
Record coverage and any failed removals
Record the final removal result
```

### Configure each step

#### 1. Confirm the removal scope and deadline

Record the campaign, targets and confirmed end date/time.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Check the approved replacement prices

Record the source of the approved post-promotion prices and currencies.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Remove the promotion and verify

Use the approved external method. Attach the promotional state as Before and the checked replacement state as After.

Input: **Checkbox** · Required: **Yes** · Evidence: **Before and after files** · N/A: **No** · Permission before action: **No**.

#### 4. Record coverage and any failed removals

List the targets checked. Create owned issues for failed or unverified required changes and leave them incomplete.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Record the final removal result

Confirm what was removed and where the final prices can be checked.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 10 — Apply an approved price change

**Work area:** Price adjustments

**Goal:** Make each requested channel price match the approved plan and check before and after.

**When:** When a standard price change is assigned, at its approved effective time.

**One run covers:** One requested product/channel price change or an explicitly defined batch.

**Who to ask:** Marketplace lead

**Client setup — fill before publishing:** [Price plan]; [products/channels]; [approved price/currency]; [effective time/timezone]; [permitted portal method].

**Done when:** All requested prices in scope match the approved plan and before/after results are recorded.

**VA can do:** Enter standard changes exactly as approved and verify live prices.

**Ask first:** An inconsistent price plan, unclear currency, rejected update or unexpected live result.

**Never do:** Choose a pricing strategy, invent a discount or make unapproved changes.

**Final review default:** Not required. Enable for training when agreed.

### Paste these checklist titles

```text
Read the approved price plan
Check the effective time
Record the current live price
Change and verify the live price
Log every change or failed update
```

### Configure each step

#### 1. Read the approved price plan

Record the request, target products/channels, approved price and currency.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Check the effective time

Confirm when the new prices should apply before changing them.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Record the current live price

Check the correct product/channel and save the existing price and currency.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Change and verify the live price

Use the approved portal method. Attach Before and After evidence with the correct labels.

Input: **Checkbox** · Required: **Yes** · Evidence: **Before and after files** · N/A: **No** · Permission before action: **No**.

#### 5. Log every change or failed update

Record target coverage and issue references. Do not complete while a required change is unverified.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 11 — Update product cost rules

**Work area:** Product cost rules

**Goal:** Keep landed costs and product cost rules aligned with the approved cost information.

**When:** When updated cost data or a cost-rule update is assigned. Inventory-value reports are separate requests when asked.

**One run covers:** One requested product cost update or an agreed batch.

**Who to ask:** Marketplace lead; business owner for financial decisions

**Client setup — fill before publishing:** [Approved cost tool]; [source cost data]; [products/rules in scope]; [currency/units]; [authorized calculation instructions]; [due date].

**Done when:** The approved values and rules are saved in the cost tool and checked against the supplied source.

**VA can do:** Maintain landed costs and rules using approved data; prepare a requested inventory-value output.

**Ask first:** Missing cost components, conflicting units/currencies, uncertain rules or an unexplained margin result.

**Never do:** Invent costs or calculation rules; make accounting decisions; present an unverified margin as correct.

**Final review default:** Not required. Enable for training when agreed.

**Important:** For an accountant’s inventory-value request, create a separate dated run with the requested period, scope and delivery reference. This checklist is not a calculation engine.

### Paste these checklist titles

```text
Confirm the cost-update scope
Check values, currency and units
Update the authorized cost rules
Verify the saved result
Record the update and exceptions
```

### Configure each step

#### 1. Confirm the cost-update scope

Record the product identifiers, requested rules and approved data source.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Check values, currency and units

Verify that the source contains the information needed. Resolve discrepancies rather than guessing.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Update the authorized cost rules

Apply the approved values and instructions in the actual cost tool.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Verify the saved result

Compare saved costs/rules with the approved source. Attach a permitted verification record.

Input: **Checkbox** · Required: **Yes** · Evidence: **File / screenshot** · N/A: **No** · Permission before action: **No**.

#### 5. Record the update and exceptions

Record what changed, source references and any remaining requested follow-up.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 12 — Prepare and submit compliance information

**Work area:** Compliance requests

**Goal:** Send the requested compliance information on time and retain a submission reference.

**When:** For each compliance request. Use monthly recurrence only for a confirmed monthly obligation.

**One run covers:** One obligation for one reporting period and country, unless the client explicitly groups them.

**Who to ask:** Marketplace lead or designated compliance owner

**Client setup — fill before publishing:** [Requirement]; [country]; [reporting period]; [requested data/units]; [approved data source]; [submission channel]; [confirmed cutoff and timezone].

**Done when:** The complete requested information is submitted through the approved channel and its submission reference is recorded.

**VA can do:** Gather and check requested information; track documents/deadlines; submit as instructed.

**Ask first:** Missing data, uncertain units or period, a conflicting cutoff, or anything requiring interpretation of a requirement.

**Never do:** Invent compliance rules, weights or deadlines; assume the same cutoff applies to all countries/reports.

**Final review default:** Not required. Enable for training when agreed.

**Important:** For a monthly WEEE-weight workflow using a "before the 10th" instruction, confirm the exact cutoff with the client. Do not silently change it to "on the 10th" or apply it to unrelated reports. Use the client’s definitions and data instructions.

### Paste these checklist titles

```text
Confirm the exact request and deadline
Gather the requested information
Check completeness against the request
Submit through the approved channel
Save submission proof
Update the deadline record
```

### Configure each step

#### 1. Confirm the exact request and deadline

Record requirement, country, period, source wording and confirmed cutoff/timezone. Resolve ambiguity before scheduling.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Gather the requested information

Use the approved data source for the exact reporting period and units.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Check completeness against the request

Resolve missing or inconsistent entries with the internal owner; keep required gaps open.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Submit through the approved channel

Use the actual approved service or communication tool before the confirmed deadline.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Save submission proof

Record the actual submission/receipt reference and attach the permitted confirmation or submitted record.

Input: **Text** · Required: **Yes** · Evidence: **File / screenshot** · N/A: **No** · Permission before action: **No**.

#### 6. Update the deadline record

Record completion against the actual obligation. Route any new follow-up requirement as separate dated work.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 13 — Check a product listing each week

**Work area:** Weekly listing check

**Goal:** Check listing health, fix only permitted problems, and record every fix or escalation.

**When:** Weekly. Agree the weekday, deadline time and client timezone before creating a schedule.

**One run covers:** One product on one channel; use a documented coverage list for an approved batch.

**Who to ask:** Marketplace lead

**Client setup — fill before publishing:** [Product/channel list]; [live listing link]; [approved content and prices]; [Buy Box expectation]; [permitted fixes]; [weekly deadline].

**Done when:** All required checks are performed, every fix is logged, and unresolved exceptions have an owner and next action.

**VA can do:** Inspect every required listing attribute and make only explicitly permitted corrections.

**Ask first:** An offline listing, unapproved price/content difference, uncertain Buy Box result or a problem outside permitted fixes.

**Never do:** Choose new prices/content, make supply-chain decisions, or claim a problem was fixed merely because it was reported.

**Final review default:** Not required. Enable for training when agreed.

**Important:** This is an inspection-and-routing outcome. A documented exception is not a successful repair. Create a separate repair run when needed; an unresolved blocking issue on this run prevents submission.

### Paste these checklist titles

```text
Confirm the listing being checked
Record whether the listing is live
Check the Buy Box
Check category and delivery promise
Check images and content
Record the live price and currency
Fix permitted issues and route the rest
Attach the listing-check record
```

### Configure each step

#### 1. Confirm the listing being checked

Record the product identifier, channel and live listing reference.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Record whether the listing is live

Choose the observed status. An issue result does not open an issue automatically; record and route it in the fixes/issues step.

Input: **Dropdown** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

Dropdown options: Live; Offline; Unable to verify.

#### 3. Check the Buy Box

Record the observed Buy Box result against the client’s expectation. Ask when unclear; do not invent a passed result.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Check category and delivery promise

Compare both with the approved setup and record discrepancies, or "Matches approved setup".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Check images and content

Compare the listing with approved material. Record differences, or "Matches approved material".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 6. Record the live price and currency

Enter the observed price/currency and compare them with the approved plan.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 7. Fix permitted issues and route the rest

Log each actual fix and verification. For unresolved problems, create an issue with owner/next action/follow-up; write "None" only if no issues.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 8. Attach the listing-check record

Attach a permitted screenshot or coverage record showing the target and findings.

Input: **Checkbox** · Required: **Yes** · Evidence: **File / screenshot** · N/A: **No** · Permission before action: **No**.


---

## 14 — Check inventory sync and route alerts

**Work area:** Inventory sync and stock alerts

**Goal:** Check each assigned channel for inventory-sync errors and pass low-stock alerts to the right owner.

**When:** At the client-agreed check cadence or when an inventory-sync/stock alert is assigned.

**One run covers:** One agreed set of channels, with each channel explicitly covered.

**Who to ask:** Marketplace lead

**Client setup — fill before publishing:** [Inventory-sync tool]; [channels]; [approved sync checks/fixes]; [client-defined stock alerts]; [review cadence]; [escalation contact].

**Done when:** All assigned channels are checked, permitted fixes are verified, and remaining errors/low-stock alerts are routed and logged.

**VA can do:** Check channel sync, perform approved corrections and pass low-stock alerts to the marketplace lead.

**Ask first:** Unresolved sync errors, conflicting inventory figures, unexpected alerts or a correction outside the agreed method.

**Never do:** Invent stock thresholds, place replenishment orders or make supply-chain decisions.

**Final review default:** Not required. Enable for training when agreed.

### Paste these checklist titles

```text
Confirm the channels to check
Check inventory sync on each channel
Fix only permitted sync errors
Pass on low-stock alerts
Log unresolved errors with owners
```

### Configure each step

#### 1. Confirm the channels to check

Record the expected channel list and review scope.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Check inventory sync on each channel

Record each channel’s observed sync result. Do not assume one successful channel covers the rest.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Fix only permitted sync errors

Follow approved instructions and record the actual correction and verification, or "No permitted correction needed".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Pass on low-stock alerts

Record relevant alerts and the handoff to the marketplace lead, or "No low-stock alerts".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Log unresolved errors with owners

Create linked issues and next checks for unresolved problems; summarize the resulting coverage.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 15 — Apply approved storefront changes

**Work area:** Back-end changes on storefronts

**Goal:** Apply supplied settings, profile and legal-text changes in the correct seller portal.

**When:** When the business owner assigns a storefront change or approved audit correction.

**One run covers:** One approved change request for one storefront, or a defined list of changes.

**Who to ask:** Business owner

**Client setup — fill before publishing:** [Approved change request or audit]; [storefront/portal]; [exact settings/text]; [business owner as reviewer]; [verification method]; [deadline].

**Done when:** The approved changes are saved and the resulting settings/profile/text are verified and recorded.

**VA can do:** Prepare and apply the exact supplied changes within the approved request.

**Ask first:** Missing approved text, ambiguous instructions, a request to interpret legal terms or an unexpected result.

**Never do:** Draft legal policy, choose new business terms, change unrequested settings or broaden permissions.

**Final review default:** Required — suggested training safeguard.

**Important:** Before-action permission and final review are suggested safeguards for this template, not automatic business authority. Choose the business owner as reviewer, and never permit N/A on the gated change step.

### Paste these checklist titles

```text
Record the requested changes
Check the current configuration
Get permission and apply the exact change
Verify the saved or published result
Record the change handoff
```

### Configure each step

#### 1. Record the requested changes

Identify the storefront and list the exact approved settings/text or audit fixes.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Check the current configuration

Compare the current portal state with the request. Ask about unclear differences before editing.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Get permission and apply the exact change

Request the business owner’s decision on the exact change. After approval, apply it externally and attach Before/After evidence.

Input: **Checkbox** · Required: **Yes** · Evidence: **Before and after files** · N/A: **No** · Permission before action: **Required**.

#### 4. Verify the saved or published result

Check the agreed verification location. Record results for all requested items; route unresolved failures.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Record the change handoff

Summarize completed changes and provide the approved verification reference.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 16 — Prepare and verify a product launch

**Work area:** New product launches

**Goal:** Help a product go live on the required marketplace using approved content and settings.

**When:** When the business owner assigns a product launch and confirms the target channels and timing.

**One run covers:** One product on one marketplace; make separate runs for other required channels.

**Who to ask:** Business owner; marketplace lead for operational assistance

**Client setup — fill before publishing:** [Product reference]; [target marketplace]; [approved content/assets/settings]; [launch timing]; [publishing authority]; [verification checklist].

**Done when:** The listing is created, approved content is entered, publishing is completed as instructed, and the live result is checked.

**VA can do:** Prepare listings, enter approved content, publish only as authorized and verify the live result.

**Ask first:** Missing approved assets/settings, uncertain launch timing, an unpublished/rejected listing or content outside the brief.

**Never do:** Invent marketing content, choose a launch strategy, or publish outside the approved scope/timing.

**Final review default:** Required — suggested training safeguard.

**Important:** The application does not publish listings. Final review is a suggested training safeguard; add a before-action gate if the client requires a separate live-publish decision.

### Paste these checklist titles

```text
Confirm the launch brief
Create the required listing
Enter the approved content and settings
Publish as instructed
Check the live listing
Save the live reference and handoff
```

### Configure each step

#### 1. Confirm the launch brief

Record the product, marketplace, approved materials and agreed launch timing.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Create the required listing

Follow the approved portal method for the correct product and channel.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Enter the approved content and settings

Use the supplied material without making unapproved content/strategy decisions.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Publish as instructed

Use the actual marketplace workflow only within the confirmed publishing authority and timing.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Check the live listing

Verify the live result against the agreed checklist and attach the permitted proof. Keep publishing/verification failures open.

Input: **Checkbox** · Required: **Yes** · Evidence: **File / screenshot** · N/A: **No** · Permission before action: **No**.

#### 6. Save the live reference and handoff

Record the live link and notify the owner through the agreed channel.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 17 — Review platform mail and record deadlines

**Work area:** Platform mail and deadline register

**Goal:** Read marketplace/compliance messages, capture every actionable deadline, and route non-routine work.

**When:** Daily. Confirm account coverage and the client-local deadline; do not silently change daily coverage to weekdays.

**One run covers:** One day’s review of the agreed marketplace and compliance accounts.

**Who to ask:** Business owner; designated owner for each routed request

**Client setup — fill before publishing:** [Approved accounts]; [routine-response SOPs]; [daily coverage/deadline]; [deadline tracker]; [escalation owners]; [client timezone].

**Done when:** All assigned accounts are reviewed, every actionable deadline has dated work, and routine/routed outcomes are recorded.

**VA can do:** Read messages, enter deadlines, handle approved routine matters and propose next actions for the rest.

**Ask first:** Ambiguous deadline wording, non-routine requests, blocked access or an action requiring a business decision.

**Never do:** Guess deadlines, make unapproved decisions, answer customers under this operations-only scope, or mark routed work as resolved.

**Final review default:** Not required. Enable for training when agreed.

**Important:** Completing this daily review does not complete the separate obligations it discovers. The app has no business-holiday calculator; ask the owner to resolve unclear working-day cutoffs.

### Paste these checklist titles

```text
Review the assigned inboxes and portals
Record messages and exact deadlines
Create separate dated work
Handle approved routine requests
Route other requests with a proposal
Check the deadline register
```

### Configure each step

#### 1. Review the assigned inboxes and portals

Read the marketplace/compliance messages for every agreed account. This app does not read email for you.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Record messages and exact deadlines

Record the source/reference and deadline wording for actionable messages, or "No actionable deadlines". Ask about ambiguity.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Create separate dated work

Create or link a run for each actionable obligation with confirmed due date, reference and source. Record run references, or "None needed".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Handle approved routine requests

Use the approved routine instructions. Record actions and evidence references, or "No routine actions".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Route other requests with a proposal

Create issues or assigned follow-up work with an internal owner, recommendation and follow-up date. Record references or "None".

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 6. Check the deadline register

Confirm the dated runs appear in Deadlines. Recording a date in notes alone is not enough.

Input: **Checkbox** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.


---

## 18 — Investigate a payment or account issue

**Work area:** Payment and account issues

**Goal:** Find out what happened, recommend the next action, and put the decision with the business owner.

**When:** When a failed payment, reminder, blocked account or payout/refund-blocking issue is assigned.

**One run covers:** One investigation and owner handoff. Any later resolution work is separately assigned or explicitly added to scope.

**Who to ask:** Business owner

**Client setup — fill before publishing:** [Account/case reference]; [approved investigation access]; [symptom]; [owner]; [handoff deadline]; [follow-up date].

**Done when:** The investigation, findings and proposed next action are handed to the owner, with a traceable decision/follow-up record.

**VA can do:** Investigate observed errors and account/payment status; record findings and recommend a next action.

**Ask first:** A decision, payment, access change or corrective action outside the approved investigation instructions.

**Never do:** Make payments, issue refunds, alter payment credentials, or describe the issue as fixed without verification.

**Final review default:** Required — suggested training safeguard.

**Important:** The business owner pays and approves. For an investigation-only run, a routed issue may be non-blocking if the owner agrees; it remains open separately. If the assigned outcome includes resolution, keep the run blocked/waiting until the authorized result is verified.

### Paste these checklist titles

```text
Identify the problem and affected account
Check the approved information
Prepare the recommended next action
Create the owned issue and handoff
Record the investigation outcome
```

### Configure each step

#### 1. Identify the problem and affected account

Record the account/case reference, observed error and impact without including credentials.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 2. Check the approved information

Record what you inspected and the findings. Distinguish observation from an untested explanation.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 3. Prepare the recommended next action

State what needs to happen next and which decision belongs to the owner.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 4. Create the owned issue and handoff

Create a linked issue for the owner with recommendation and follow-up date. Record its reference and the owner handoff.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

#### 5. Record the investigation outcome

State "Investigated and handed to owner" when that is the completed scope. Keep any remaining decision/resolution visible.

Input: **Text** · Required: **Yes** · Evidence: **No file required** · N/A: **No** · Permission before action: **No**.

---

## Training and process ownership

For each process, create a **Handovers → + Add handover** record with a VA/trainee and trainer. Do not mark a stage complete just because a date has passed.

| Stage | What must actually happen |
|---|---|
| Not started | The process has not yet been taught. |
| Demonstration | The trainer shows the task once, on a call or recording. |
| Guided run | The VA does it while the trainer watches. |
| Independent run | The VA performs the task alone. |
| SOP drafted | The VA writes the SOP and saves a draft. |
| SOP approved | An authorized person approves the SOP; an owner/manager publishes it. Record the handover sign-off separately. |
| Owned | Responsibility is formally handed to the trained VA. |

Suggested training groups: Operations lead for 01–04; Customer service lead for 05–07; Content lead for 08; Marketplace lead for 09–14; Business owner for 15–18. Campaign-registration approval in 09A still belongs to the Business owner, even when a Marketplace lead teaches the process. Agree actual training sessions and responsibility assignments.

Publication does not automatically advance the handover. An “owned” stage does not grant extra permissions or decision authority. Existing runs retain the SOP version used when they were created.

Later work can include product/channel margin sheets, an operating-expense sheet, subscription audit, payout reconciliation and cashflow/forecast sheets. Keep these as later-phase work to start with the owner from month 3 when agreed; they are not included in this initial set of processes. The app is not an accounting or forecasting engine.

## Reusable blank template

**Process title:** [Verb + object + scope]

**Goal:** [What result does the client need?]

**When:** [Request, event or agreed recurrence; do not invent a frequency]

**One run covers:** [One invoice, shipment, listing, channel, case or defined batch]

**Client setup:** [Approved tools, resources, policy, permitted actions and deadlines]

**Who to ask:** [Authorized internal person and backup if agreed]

**Done when:** [Observable completion condition, not “all boxes ticked”]

**VA can do:** [Permitted actions]

**Ask first:** [Decision points and exceptions]

**Never do:** [Excluded actions]

**Checklist:**

1. [Action] — [How / expected result]. Input: [type]. Proof: [none/file/before-after].
2. [Action] — [How / expected result]. Input: [type]. Proof: [none/file/before-after].
3. [Verify the actual result and record the handoff].

**Review:** [Not required / separate reviewer required].

**Before-action permission:** [Which step; authorized decision-maker].

**Reminder:** These labels describe content to enter in existing V1 fields; they are not new application fields or an automatic import form.

## Reusable escalation message

> **Task / reference:** [Exact run and business reference]  
> **What happened:** [Observed problem]  
> **What I checked:** [Actions and findings]  
> **What I recommend:** [Proposed next action]  
> **Who needs to act:** [Authorized internal person]  
> **Deadline / next follow-up:** [Confirmed dates in the client timezone]  
> **Evidence:** [Approved reference; no passwords or unnecessary personal data]

## Practical limits

These templates coordinate manual work; they do not connect to external email, seller portals, shipping, accounting or inventory tools. Put the real approved links in Resources. No automatic email sending, marketplace changes, payments, product fan-out or campaign start/end creation is implied.

For recurring work, create the schedule separately with an owner/manager. Supported V1 options are daily, weekdays, weekly and monthly. Only the daily message review and weekly listing audit have fixed cadences here; monthly compliance applies only to an identified monthly obligation. Unattended generation/reminders require configured automation; otherwise use Generate due work when the occurrence is in its generation window.

Templates with missing client setup must remain drafts. All active members of a workspace can read its operational records and attachments, so use separate authorized workspaces and avoid unnecessary sensitive details. Do not store credentials in evidence.

The supplied module is matched to the original V1 Workflow type. Validate it against any changed application before integration. It is not evidence that a deployment, browser workflow or external operation has been tested.

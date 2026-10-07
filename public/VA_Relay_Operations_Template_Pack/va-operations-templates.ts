/**
 * VA Relay: role-based operations templates.
 * Additive catalog content; no database writes, people or schedules are created.
 * Review client instructions, evidence and permissions before publishing.
 * Matches Workflow from the supplied V1 starter. No JSON import UI is assumed.
 */
import type { Workflow } from "./types";

export const OPERATIONS_TEMPLATES: Workflow[] = [
  {
    "title": "01 | Get access to the approved tools",
    "description": "Open the correct tools, recognize each storefront, and report missing access.",
    "sop": "GOAL\nOpen the correct tools, recognize each storefront, and report missing access.\n\nWHEN TO USE\nAt onboarding and whenever the client assigns a new tool or storefront.\n\nONE RUN COVERS\nOne agreed set of tools and storefronts for one client.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Tool and storefront list]; [approved access-request method]; [training/reference links]; [access-check deadline]. Use approved support or AI references only within client data rules.\n\nWHO TO ASK\nOperations lead or access administrator. Replace this role with an authorized workspace member.\n\nDONE WHEN\nEvery required access test passes and the tool/storefront list is recorded. Keep missing required access open with an owner.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. ",
    "can_do": "Request the approved access; test assigned accounts; record which storefront each account belongs to.",
    "ask_first": "A missing invitation, wrong account, unexpected permission, unfamiliar tool, or blocked login.",
    "never_do": "Store passwords, recovery codes or tokens in the task; grant yourself extra permissions; use an unapproved account.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Confirm the tool and storefront list",
        "instructions": "Record the required tools, storefronts and account labels. Ask the client about any unclear account mapping.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-01-step-01"
      },
      {
        "title": "Request the approved access",
        "instructions": "Follow the client access-request method. Never ask for credentials in a task comment.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-01-step-02"
      },
      {
        "title": "Test each assigned login",
        "instructions": "Open each required account and check that the expected storefront is accessible. Record pass/fail results without secrets.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-01-step-03"
      },
      {
        "title": "Save the approved reference links",
        "instructions": "Add approved help/training links to the process resources, or record them for the manager to add. No copied credentials.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-01-step-04"
      },
      {
        "title": "Resolve required access gaps",
        "instructions": "Do not tick this until all required access is usable. Record any earlier issue and its resolution in the run.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-01-step-05"
      },
      {
        "title": "Record the completed access handover",
        "instructions": "Summarize the accounts you can use and the person to contact if access stops working.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-01-step-06"
      }
    ]
  },
  {
    "title": "02 | Collect and send an invoice",
    "description": "Find the correct invoice or receipt and send it to bookkeeping with a traceable handoff.",
    "sop": "GOAL\nFind the correct invoice or receipt and send it to bookkeeping with a traceable handoff.\n\nWHEN TO USE\nWhen an invoice or receipt is received or requested. Agree any inbox-check cadence with the client.\n\nONE RUN COVERS\nOne invoice or receipt, not an entire month of expenses.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Supplier and reporting period]; [approved invoice sources]; [bookkeeping destination]; [owner to copy on accountant replies]; [due date]. Start with receipts/subscriptions, then the agreed expense scope.\n\nWHO TO ASK\nOperations lead; business owner for non-routine accountant questions. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe correct document has reached the approved bookkeeping destination and its handoff reference is saved.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nFinal review is enabled as a suggested training default, not a universal requirement. A manager can change it after agreeing the process.",
    "can_do": "Collect documents; check completeness against the request; find missing invoices; answer approved standard questions with the owner copied.",
    "ask_first": "A missing document, conflicting details, unclear amount/currency/tax information, or a question outside the agreed standard replies.",
    "never_do": "Pay an invoice, fabricate a document, change financial facts, or invent tax treatment.",
    "resources": [],
    "review_required": true,
    "steps": [
      {
        "title": "Record the requested document",
        "instructions": "Enter the supplier, period and invoice/receipt reference. Put the identifier in the task title too.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-02-step-01"
      },
      {
        "title": "Find the invoice or receipt",
        "instructions": "Locate the correct document using the approved source. If missing, leave this unfinished and create an issue.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-02-step-02"
      },
      {
        "title": "Check the document and attach it",
        "instructions": "Check it against the request; attach the approved, necessary document. Route discrepancies before continuing.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "file",
        "approval_before": false,
        "options": [],
        "id": "operations-02-step-03"
      },
      {
        "title": "Send the document to bookkeeping",
        "instructions": "Use the client-approved external channel. The app does not send it for you.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-02-step-04"
      },
      {
        "title": "Save the handoff reference",
        "instructions": "Record the message, submission or delivery reference and recipient. Do not write only \"sent\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-02-step-05"
      },
      {
        "title": "Record questions or follow-ups",
        "instructions": "Write \"None\" when there are no questions. For standard accountant replies, use the approved response and copy the owner externally; route anything else.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-02-step-06"
      }
    ]
  },
  {
    "title": "03 | Update SOP and deadline trackers",
    "description": "Keep procedure ownership, obligations and document locations clear and findable.",
    "sop": "GOAL\nKeep procedure ownership, obligations and document locations clear and findable.\n\nWHEN TO USE\nWhen a procedure, obligation, owner or file location changes; agree any routine review cadence.\n\nONE RUN COVERS\nOne requested tracker update or explicitly defined tracker review.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[SOP index]; [compliance tracker]; [folder conventions]; [scope of this update]; [owner for each obligation].\n\nWHO TO ASK\nOperations lead. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe agreed updates are recorded, links work, and each affected obligation has its requirement, country, deadline and owner.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. ",
    "can_do": "Update agreed tracker entries; record responsibility; organize approved links and folders.",
    "ask_first": "An unclear owner, conflicting deadline, unknown country requirement, or an uncertain move/delete instruction.",
    "never_do": "Invent a deadline or obligation; publish unapproved procedures; delete client records without authorization.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Identify the records to update",
        "instructions": "Record the tracker, affected entries and reason for the update.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-03-step-01"
      },
      {
        "title": "Update SOP status and owner",
        "instructions": "Record each affected SOP, its agreed status and responsible person. Use Processes & SOPs and Handovers where appropriate.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-03-step-02"
      },
      {
        "title": "Record compliance details",
        "instructions": "Record requirement, country, exact deadline and owner for affected obligations. Write \"No compliance changes\" when outside this run.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-03-step-03"
      },
      {
        "title": "Create or update dated work",
        "instructions": "For actionable deadlines, create or deliberately update the relevant run. Notes alone do not populate Deadlines.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-03-step-04"
      },
      {
        "title": "Check folders and links",
        "instructions": "Use the approved folder structure; verify intended members can open the links without broadening access.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-03-step-05"
      },
      {
        "title": "Save an update summary",
        "instructions": "Record what changed and where it can be found. Leave unresolved required details open.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-03-step-06"
      }
    ]
  },
  {
    "title": "04 | Check marketplace account notifications",
    "description": "Handle approved seller-portal administration and route account or policy problems.",
    "sop": "GOAL\nHandle approved seller-portal administration and route account or policy problems.\n\nWHEN TO USE\nOn an assigned account review or a new account/policy notification. Agree recurring coverage with the client.\n\nONE RUN COVERS\nOne account review or one clearly identified portal case.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Approved seller portal and storefront]; [account-health checks]; [routine response rules]; [case ownership]; [review cadence or case deadline].\n\nWHO TO ASK\nOperations lead; customer service lead for customer-facing decisions. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe assigned notifications and portal cases are handled within authority or routed with references and next actions.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nThis is a review-and-routing template. An unresolved account problem may live in a separate owned case; do not describe the account as fixed unless verified.",
    "can_do": "Review account health, follow approved policy steps and handle the portal side of return cases.",
    "ask_first": "An account restriction, ambiguous policy requirement, appeal, refund decision or customer-facing response.",
    "never_do": "Answer customers, decide refunds, change policy or make account decisions outside the approved instructions.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Confirm the account and case scope",
        "instructions": "Record the seller account/storefront and review scope or case reference.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-04-step-01"
      },
      {
        "title": "Review account-health notifications",
        "instructions": "Read the assigned notifications. Record important messages and any exact deadlines.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-04-step-02"
      },
      {
        "title": "Complete permitted portal follow-ups",
        "instructions": "Carry out only the approved routine steps. Record the portal/case references or \"No routine follow-up\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-04-step-03"
      },
      {
        "title": "Coordinate the customer-facing handoff",
        "instructions": "Route customer decisions to the customer service lead. Record the recipient and request, or \"Not needed\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-04-step-04"
      },
      {
        "title": "Record handled and routed cases",
        "instructions": "Summarize completed portal actions and open issues with their owners and follow-up dates.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-04-step-05"
      }
    ]
  },
  {
    "title": "05 | Create a return label and track arrival",
    "description": "Create the authorized return label and follow the shipment until arrival is verified.",
    "sop": "GOAL\nCreate the authorized return label and follow the shipment until arrival is verified.\n\nWHEN TO USE\nAfter the customer service lead has decided the return and requested label creation.\n\nONE RUN COVERS\nOne return shipment.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Return decision reference]; [approved shipping/returns tool]; [label instructions]; [tracking source]; [arrival confirmation method]; [follow-up interval].\n\nWHO TO ASK\nCustomer service lead. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe authorized label is created, the tracking reference is recorded, and shipment arrival is verified.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nFor a waiting status, choose the internal follow-up owner and describe the carrier dependency in the reason. Do not invite a carrier just to fill the waiting-person field.",
    "can_do": "Prepare the approved label and follow the shipment; record status and delivery proof.",
    "ask_first": "No return decision, inconsistent shipment details, a failed label, a delayed/lost parcel, or uncertain arrival.",
    "never_do": "Decide or issue a refund; assume a return is approved; close the run merely because a label was created.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Record the approved return decision",
        "instructions": "Enter the order/return reference and the customer service decision authorizing the label. If absent, stop and ask.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-05-step-01"
      },
      {
        "title": "Check the shipment details",
        "instructions": "Confirm the approved sender, destination and package details. Do not copy unnecessary customer details into comments.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-05-step-02"
      },
      {
        "title": "Create the return label",
        "instructions": "Use the approved external shipping/returns tool and follow the client method. Record the label reference.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-05-step-03"
      },
      {
        "title": "Record the tracking reference",
        "instructions": "Enter the tracking link or identifier and the current carrier status.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-05-step-04"
      },
      {
        "title": "Follow the shipment",
        "instructions": "Record checks and the next follow-up while it is travelling. Keep the arrival step unfinished.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-05-step-05"
      },
      {
        "title": "Verify the shipment arrived",
        "instructions": "Complete only after approved arrival confirmation. Attach the permitted delivery/receipt evidence.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "file",
        "approval_before": false,
        "options": [],
        "id": "operations-05-step-06"
      },
      {
        "title": "Notify the customer service lead",
        "instructions": "Record the arrival handoff reference. A refund remains a separate authorized decision.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-05-step-07"
      }
    ]
  },
  {
    "title": "06 | Prepare B2B documents and check payment",
    "description": "Prepare requested invoice documents and verify the incoming bank transfer before shipment.",
    "sop": "GOAL\nPrepare requested invoice documents and verify the incoming bank transfer before shipment.\n\nWHEN TO USE\nWhen the customer service lead or business owner requests B2B invoice documents.\n\nONE RUN COVERS\nOne B2B order and its requested pro forma/final-invoice stages.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Order details]; [approved pro forma/final templates]; [authorized tax instructions]; [incoming-payment verification method]; [shipping contact]; [due date].\n\nWHO TO ASK\nCustomer service lead or business owner. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe requested documents are prepared, transfer arrival is verified, and the shipping contact receives the verification reference.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nUse 0% VAT reverse charge only when the client has confirmed it applies and supplied the approved instruction. This template does not determine tax treatment. Arrange document stages in the client-approved order; no invoice-issuance sequence is prescribed here. A blocked run does not physically prevent external shipping.",
    "can_do": "Prepare requested documents from approved templates and check incoming payment through authorized access.",
    "ask_first": "Unclear tax treatment, mismatched order details, missing transfer, a discrepancy or missing verification access.",
    "never_do": "Choose a tax rate; claim a payment arrived without evidence; pay vendors; authorize dispatch beyond your role.",
    "resources": [],
    "review_required": true,
    "steps": [
      {
        "title": "Check the invoice request",
        "instructions": "Record the order reference, requested document stages and approved template.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-06-step-01"
      },
      {
        "title": "Prepare the pro forma if requested",
        "instructions": "Use the approved template and tax instruction. Upload the permitted copy. N/A is allowed only when not requested.",
        "kind": "checkbox",
        "required": true,
        "allow_na": true,
        "evidence": "file",
        "approval_before": false,
        "options": [],
        "id": "operations-06-step-02"
      },
      {
        "title": "Prepare the final invoice if requested",
        "instructions": "Follow the approved issuance timing and template. Attach the permitted copy. N/A is allowed only when not requested.",
        "kind": "checkbox",
        "required": true,
        "allow_na": true,
        "evidence": "file",
        "approval_before": false,
        "options": [],
        "id": "operations-06-step-03"
      },
      {
        "title": "Verify the bank transfer arrived",
        "instructions": "Use the approved verification source. Leave unfinished and raise a blocking issue if payment is missing, uncertain or inconsistent.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-06-step-04"
      },
      {
        "title": "Record payment verification",
        "instructions": "Record the order, verified amount/currency and authorized verification reference without exposing banking credentials.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-06-step-05"
      },
      {
        "title": "Tell the shipping contact the result",
        "instructions": "Send the verification through the real shipping workflow and record the communication reference. Do not rely on this checklist to hold an order.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-06-step-06"
      }
    ]
  },
  {
    "title": "07 | Keep marketplace rules easy to find",
    "description": "Maintain one clear reference per channel using completed, approved policy research.",
    "sop": "GOAL\nMaintain one clear reference per channel using completed, approved policy research.\n\nWHEN TO USE\nAt the initial consolidation and when approved channel rules change.\n\nONE RUN COVERS\nOne channel rule page or one approved update to it.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Channel]; [completed policy research]; [approved rule-page location]; [reviewer]; [effective date/version if supplied].\n\nWHO TO ASK\nCustomer service lead. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe channel reference accurately records return policy, label payer and refund rules, and is approved and findable.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. ",
    "can_do": "Organize and transcribe approved research into the agreed reference format.",
    "ask_first": "Conflicting, missing or unclear research; a proposed rule change; uncertain validity.",
    "never_do": "Invent policy, choose who pays, decide refunds, or replace approved research with assumptions.",
    "resources": [],
    "review_required": true,
    "steps": [
      {
        "title": "Open the completed policy research",
        "instructions": "Record the approved research reference and channel.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-07-step-01"
      },
      {
        "title": "Record the return policy",
        "instructions": "Summarize the approved return conditions without changing their meaning.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-07-step-02"
      },
      {
        "title": "Record who pays for the label",
        "instructions": "Use the approved research; escalate an unclear or conditional answer.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-07-step-03"
      },
      {
        "title": "Record the refund rules",
        "instructions": "Preserve the approved conditions and decision authority.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-07-step-04"
      },
      {
        "title": "Save and check the channel page",
        "instructions": "Save it in the approved location and record a working link.",
        "kind": "url",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-07-step-05"
      },
      {
        "title": "Submit the reference for review",
        "instructions": "Check it against the research and submit for the designated reviewer. Do not describe it as approved before review.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-07-step-06"
      }
    ]
  },
  {
    "title": "08 | Prepare content research and files",
    "description": "Prepare useful references and organized files for the content lead to decide and create.",
    "sop": "GOAL\nPrepare useful references and organized files for the content lead to decide and create.\n\nWHEN TO USE\nWhen the content lead requests research, organization or repetitive preparation work.\n\nONE RUN COVERS\nOne research/preparation brief with an agreed deliverable.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Research brief]; [reference/competitor scope]; [approved sources]; [folder conventions]; [required deliverable]; [due date].\n\nWHO TO ASK\nContent lead. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe requested references and organized files are handed to the content lead with a clear location.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. ",
    "can_do": "Research approved reference/competitor content, organize files, and complete agreed repetitive preparation.",
    "ask_first": "An unclear brief, missing materials, a requested creative decision or a change in scope.",
    "never_do": "Create or publish ads/content, choose strategy, or make creative decisions under this preparation-only scope.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Read the preparation brief",
        "instructions": "Record the topic, scope and expected deliverable. Ask before researching outside it.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-08-step-01"
      },
      {
        "title": "Collect relevant references",
        "instructions": "Record reference/competitor links and a short note explaining relevance to the brief.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-08-step-02"
      },
      {
        "title": "Organize the working files",
        "instructions": "Use the approved folder names and locations; keep the requested materials findable.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-08-step-03"
      },
      {
        "title": "Complete the agreed preparation",
        "instructions": "Record the repetitive preparation performed, or \"No additional preparation requested\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-08-step-04"
      },
      {
        "title": "Hand the materials to the content lead",
        "instructions": "Save the deliverable location and handoff reference. The content lead decides and creates.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-08-step-05"
      }
    ]
  },
  {
    "title": "09A | Get approval and register a campaign",
    "description": "Register for a marketplace campaign only after the business owner approves the exact proposal.",
    "sop": "GOAL\nRegister for a marketplace campaign only after the business owner approves the exact proposal.\n\nWHEN TO USE\nWhen campaign registration is requested, before its confirmed registration deadline.\n\nONE RUN COVERS\nOne campaign-registration request for one channel or explicitly approved group.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Campaign/channel]; [approved commercial plan]; [registration requirements]; [deadline]; [business owner as run reviewer].\n\nWHO TO ASK\nBusiness owner for permission; marketplace lead for preparation. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe approved registration is submitted, its result is recorded, and separate start/end work is arranged where needed.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nAssign the business owner as the run reviewer. Registration permission is not final review and does not create promotion start/end tasks automatically.",
    "can_do": "Prepare campaign details and register only after the owner gives the required permission.",
    "ask_first": "Campaign eligibility, changed terms, missing approval, registration errors or any unapproved price/commitment.",
    "never_do": "Register without the owner’s go-ahead; change the approved commercial terms; treat approval as unlimited authority.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Record the campaign proposal",
        "instructions": "Enter the campaign/channel, proposed products and approved plan reference. Include exact terms for the owner to decide.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09a-step-01"
      },
      {
        "title": "Confirm the registration deadline",
        "instructions": "Record the source wording and confirmed deadline. Make sure the run due date matches the approved cutoff.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09a-step-02"
      },
      {
        "title": "Get permission and register",
        "instructions": "Click Request permission with the exact proposal. Wait for the business owner’s approval, refresh, then register externally. Do not act while waiting.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": true,
        "options": [],
        "id": "operations-09a-step-03"
      },
      {
        "title": "Save the registration result",
        "instructions": "Record the confirmation/case reference. If submission failed, leave required registration unfinished and route the problem.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09a-step-04"
      },
      {
        "title": "Arrange the promotion start and end runs",
        "instructions": "Record links or references to the separate start and end tasks, or explain why no execution tasks are needed for this registration.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09a-step-05"
      }
    ]
  },
  {
    "title": "09B | Start an approved promotion",
    "description": "Apply approved promotion prices on the correct start date and verify the live result.",
    "sop": "GOAL\nApply approved promotion prices on the correct start date and verify the live result.\n\nWHEN TO USE\nOn the approved promotion start date/time in the agreed client timezone.\n\nONE RUN COVERS\nOne product/channel, or a clearly listed batch with a coverage record.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Campaign reference]; [products/channels]; [approved promo prices and currencies]; [start cutoff/timezone]; [separate end-task reference]; [permitted update method].\n\nWHO TO ASK\nMarketplace lead; business owner for changes to campaign decisions. Replace this role with an authorized workspace member.\n\nDONE WHEN\nEvery target in this run has the approved promotion price and verified before/after records, or required failures remain open.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. ",
    "can_do": "Enter the exact approved promotion prices and check before/after states.",
    "ask_first": "A missing end task, unclear timezone, unapproved price, conflicting live result or rejected update.",
    "never_do": "Choose promotion terms/prices; register an unapproved campaign; assume an end task will be created automatically.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Check the plan and start time",
        "instructions": "Record the campaign reference, targets, currency and agreed start time. Confirm the plan is approved.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09b-step-01"
      },
      {
        "title": "Confirm a separate end task exists",
        "instructions": "Record the end-run reference and removal deadline before beginning the promotion.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09b-step-02"
      },
      {
        "title": "Record the current price",
        "instructions": "Verify the correct live product/channel and record its current price and currency.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09b-step-03"
      },
      {
        "title": "Apply and verify the promotion price",
        "instructions": "Follow the approved external method at the correct time. Attach the initial state as Before and verified result as After.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "before_after",
        "approval_before": false,
        "options": [],
        "id": "operations-09b-step-04"
      },
      {
        "title": "Record coverage and exceptions",
        "instructions": "List targets verified and any issue references. Unapplied or unverified required targets block completion.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09b-step-05"
      }
    ]
  },
  {
    "title": "09C | End a promotion and verify the price",
    "description": "Remove the promotion on its end date and verify the approved post-promotion price.",
    "sop": "GOAL\nRemove the promotion on its end date and verify the approved post-promotion price.\n\nWHEN TO USE\nOn the approved promotion end date/time in the agreed client timezone.\n\nONE RUN COVERS\nOne product/channel, or a clearly listed batch with a coverage record.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Campaign and start-run references]; [end deadline/timezone]; [target products/channels]; [approved post-promotion prices/currencies]; [removal method].\n\nWHO TO ASK\nMarketplace lead. Replace this role with an authorized workspace member.\n\nDONE WHEN\nPromotion pricing is removed for every target in scope and the approved replacement prices are verified.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. ",
    "can_do": "Remove the promotion and enter the client-approved post-promotion prices.",
    "ask_first": "An unclear replacement price, conflicting end time, removal failure or live price mismatch.",
    "never_do": "Assume the original price must be restored; decide new prices; close the run before verifying the live result.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Confirm the removal scope and deadline",
        "instructions": "Record the campaign, targets and confirmed end date/time.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09c-step-01"
      },
      {
        "title": "Check the approved replacement prices",
        "instructions": "Record the source of the approved post-promotion prices and currencies.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09c-step-02"
      },
      {
        "title": "Remove the promotion and verify",
        "instructions": "Use the approved external method. Attach the promotional state as Before and the checked replacement state as After.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "before_after",
        "approval_before": false,
        "options": [],
        "id": "operations-09c-step-03"
      },
      {
        "title": "Record coverage and any failed removals",
        "instructions": "List the targets checked. Create owned issues for failed or unverified required changes and leave them incomplete.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09c-step-04"
      },
      {
        "title": "Record the final removal result",
        "instructions": "Confirm what was removed and where the final prices can be checked.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-09c-step-05"
      }
    ]
  },
  {
    "title": "10 | Apply an approved price change",
    "description": "Make each requested channel price match the approved plan and check before and after.",
    "sop": "GOAL\nMake each requested channel price match the approved plan and check before and after.\n\nWHEN TO USE\nWhen a standard price change is assigned, at its approved effective time.\n\nONE RUN COVERS\nOne requested product/channel price change or an explicitly defined batch.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Price plan]; [products/channels]; [approved price/currency]; [effective time/timezone]; [permitted portal method].\n\nWHO TO ASK\nMarketplace lead. Replace this role with an authorized workspace member.\n\nDONE WHEN\nAll requested prices in scope match the approved plan and before/after results are recorded.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. ",
    "can_do": "Enter standard changes exactly as approved and verify live prices.",
    "ask_first": "An inconsistent price plan, unclear currency, rejected update or unexpected live result.",
    "never_do": "Choose a pricing strategy, invent a discount or make unapproved changes.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Read the approved price plan",
        "instructions": "Record the request, target products/channels, approved price and currency.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-10-step-01"
      },
      {
        "title": "Check the effective time",
        "instructions": "Confirm when the new prices should apply before changing them.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-10-step-02"
      },
      {
        "title": "Record the current live price",
        "instructions": "Check the correct product/channel and save the existing price and currency.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-10-step-03"
      },
      {
        "title": "Change and verify the live price",
        "instructions": "Use the approved portal method. Attach Before and After evidence with the correct labels.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "before_after",
        "approval_before": false,
        "options": [],
        "id": "operations-10-step-04"
      },
      {
        "title": "Log every change or failed update",
        "instructions": "Record target coverage and issue references. Do not complete while a required change is unverified.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-10-step-05"
      }
    ]
  },
  {
    "title": "11 | Update product cost rules",
    "description": "Keep landed costs and product cost rules aligned with the approved cost information.",
    "sop": "GOAL\nKeep landed costs and product cost rules aligned with the approved cost information.\n\nWHEN TO USE\nWhen updated cost data or a cost-rule update is assigned. Inventory-value reports are separate requests when asked.\n\nONE RUN COVERS\nOne requested product cost update or an agreed batch.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Approved cost tool]; [source cost data]; [products/rules in scope]; [currency/units]; [authorized calculation instructions]; [due date].\n\nWHO TO ASK\nMarketplace lead; business owner for financial decisions. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe approved values and rules are saved in the cost tool and checked against the supplied source.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nFor an accountant’s inventory-value request, create a separate dated run with the requested period, scope and delivery reference. This checklist is not a calculation engine.",
    "can_do": "Maintain landed costs and rules using approved data; prepare a requested inventory-value output.",
    "ask_first": "Missing cost components, conflicting units/currencies, uncertain rules or an unexplained margin result.",
    "never_do": "Invent costs or calculation rules; make accounting decisions; present an unverified margin as correct.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Confirm the cost-update scope",
        "instructions": "Record the product identifiers, requested rules and approved data source.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-11-step-01"
      },
      {
        "title": "Check values, currency and units",
        "instructions": "Verify that the source contains the information needed. Resolve discrepancies rather than guessing.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-11-step-02"
      },
      {
        "title": "Update the authorized cost rules",
        "instructions": "Apply the approved values and instructions in the actual cost tool.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-11-step-03"
      },
      {
        "title": "Verify the saved result",
        "instructions": "Compare saved costs/rules with the approved source. Attach a permitted verification record.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "file",
        "approval_before": false,
        "options": [],
        "id": "operations-11-step-04"
      },
      {
        "title": "Record the update and exceptions",
        "instructions": "Record what changed, source references and any remaining requested follow-up.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-11-step-05"
      }
    ]
  },
  {
    "title": "12 | Prepare and submit compliance information",
    "description": "Send the requested compliance information on time and retain a submission reference.",
    "sop": "GOAL\nSend the requested compliance information on time and retain a submission reference.\n\nWHEN TO USE\nFor each compliance request. Use monthly recurrence only for a confirmed monthly obligation.\n\nONE RUN COVERS\nOne obligation for one reporting period and country, unless the client explicitly groups them.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Requirement]; [country]; [reporting period]; [requested data/units]; [approved data source]; [submission channel]; [confirmed cutoff and timezone].\n\nWHO TO ASK\nMarketplace lead or designated compliance owner. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe complete requested information is submitted through the approved channel and its submission reference is recorded.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nFor a monthly WEEE-weight workflow using a \"before the 10th\" instruction, confirm the exact cutoff with the client. Do not silently change it to \"on the 10th\" or apply it to unrelated reports. Use the client’s definitions and data instructions.",
    "can_do": "Gather and check requested information; track documents/deadlines; submit as instructed.",
    "ask_first": "Missing data, uncertain units or period, a conflicting cutoff, or anything requiring interpretation of a requirement.",
    "never_do": "Invent compliance rules, weights or deadlines; assume the same cutoff applies to all countries/reports.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Confirm the exact request and deadline",
        "instructions": "Record requirement, country, period, source wording and confirmed cutoff/timezone. Resolve ambiguity before scheduling.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-12-step-01"
      },
      {
        "title": "Gather the requested information",
        "instructions": "Use the approved data source for the exact reporting period and units.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-12-step-02"
      },
      {
        "title": "Check completeness against the request",
        "instructions": "Resolve missing or inconsistent entries with the internal owner; keep required gaps open.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-12-step-03"
      },
      {
        "title": "Submit through the approved channel",
        "instructions": "Use the actual approved service or communication tool before the confirmed deadline.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-12-step-04"
      },
      {
        "title": "Save submission proof",
        "instructions": "Record the actual submission/receipt reference and attach the permitted confirmation or submitted record.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "file",
        "approval_before": false,
        "options": [],
        "id": "operations-12-step-05"
      },
      {
        "title": "Update the deadline record",
        "instructions": "Record completion against the actual obligation. Route any new follow-up requirement as separate dated work.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-12-step-06"
      }
    ]
  },
  {
    "title": "13 | Check a product listing each week",
    "description": "Check listing health, fix only permitted problems, and record every fix or escalation.",
    "sop": "GOAL\nCheck listing health, fix only permitted problems, and record every fix or escalation.\n\nWHEN TO USE\nWeekly. Agree the weekday, deadline time and client timezone before creating a schedule.\n\nONE RUN COVERS\nOne product on one channel; use a documented coverage list for an approved batch.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Product/channel list]; [live listing link]; [approved content and prices]; [Buy Box expectation]; [permitted fixes]; [weekly deadline].\n\nWHO TO ASK\nMarketplace lead. Replace this role with an authorized workspace member.\n\nDONE WHEN\nAll required checks are performed, every fix is logged, and unresolved exceptions have an owner and next action.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nThis is an inspection-and-routing outcome. A documented exception is not a successful repair. Create a separate repair run when needed; an unresolved blocking issue on this run prevents submission.",
    "can_do": "Inspect every required listing attribute and make only explicitly permitted corrections.",
    "ask_first": "An offline listing, unapproved price/content difference, uncertain Buy Box result or a problem outside permitted fixes.",
    "never_do": "Choose new prices/content, make supply-chain decisions, or claim a problem was fixed merely because it was reported.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Confirm the listing being checked",
        "instructions": "Record the product identifier, channel and live listing reference.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-13-step-01"
      },
      {
        "title": "Record whether the listing is live",
        "instructions": "Choose the observed status. An issue result does not open an issue automatically; record and route it in the fixes/issues step.",
        "kind": "select",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [
          "Live",
          "Offline",
          "Unable to verify"
        ],
        "id": "operations-13-step-02"
      },
      {
        "title": "Check the Buy Box",
        "instructions": "Record the observed Buy Box result against the client’s expectation. Ask when unclear; do not invent a passed result.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-13-step-03"
      },
      {
        "title": "Check category and delivery promise",
        "instructions": "Compare both with the approved setup and record discrepancies, or \"Matches approved setup\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-13-step-04"
      },
      {
        "title": "Check images and content",
        "instructions": "Compare the listing with approved material. Record differences, or \"Matches approved material\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-13-step-05"
      },
      {
        "title": "Record the live price and currency",
        "instructions": "Enter the observed price/currency and compare them with the approved plan.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-13-step-06"
      },
      {
        "title": "Fix permitted issues and route the rest",
        "instructions": "Log each actual fix and verification. For unresolved problems, create an issue with owner/next action/follow-up; write \"None\" only if no issues.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-13-step-07"
      },
      {
        "title": "Attach the listing-check record",
        "instructions": "Attach a permitted screenshot or coverage record showing the target and findings.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "file",
        "approval_before": false,
        "options": [],
        "id": "operations-13-step-08"
      }
    ]
  },
  {
    "title": "14 | Check inventory sync and route alerts",
    "description": "Check each assigned channel for inventory-sync errors and pass low-stock alerts to the right owner.",
    "sop": "GOAL\nCheck each assigned channel for inventory-sync errors and pass low-stock alerts to the right owner.\n\nWHEN TO USE\nAt the client-agreed check cadence or when an inventory-sync/stock alert is assigned.\n\nONE RUN COVERS\nOne agreed set of channels, with each channel explicitly covered.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Inventory-sync tool]; [channels]; [approved sync checks/fixes]; [client-defined stock alerts]; [review cadence]; [escalation contact].\n\nWHO TO ASK\nMarketplace lead. Replace this role with an authorized workspace member.\n\nDONE WHEN\nAll assigned channels are checked, permitted fixes are verified, and remaining errors/low-stock alerts are routed and logged.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. ",
    "can_do": "Check channel sync, perform approved corrections and pass low-stock alerts to the marketplace lead.",
    "ask_first": "Unresolved sync errors, conflicting inventory figures, unexpected alerts or a correction outside the agreed method.",
    "never_do": "Invent stock thresholds, place replenishment orders or make supply-chain decisions.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Confirm the channels to check",
        "instructions": "Record the expected channel list and review scope.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-14-step-01"
      },
      {
        "title": "Check inventory sync on each channel",
        "instructions": "Record each channel’s observed sync result. Do not assume one successful channel covers the rest.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-14-step-02"
      },
      {
        "title": "Fix only permitted sync errors",
        "instructions": "Follow approved instructions and record the actual correction and verification, or \"No permitted correction needed\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-14-step-03"
      },
      {
        "title": "Pass on low-stock alerts",
        "instructions": "Record relevant alerts and the handoff to the marketplace lead, or \"No low-stock alerts\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-14-step-04"
      },
      {
        "title": "Log unresolved errors with owners",
        "instructions": "Create linked issues and next checks for unresolved problems; summarize the resulting coverage.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-14-step-05"
      }
    ]
  },
  {
    "title": "15 | Apply approved storefront changes",
    "description": "Apply supplied settings, profile and legal-text changes in the correct seller portal.",
    "sop": "GOAL\nApply supplied settings, profile and legal-text changes in the correct seller portal.\n\nWHEN TO USE\nWhen the business owner assigns a storefront change or approved audit correction.\n\nONE RUN COVERS\nOne approved change request for one storefront, or a defined list of changes.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Approved change request or audit]; [storefront/portal]; [exact settings/text]; [business owner as reviewer]; [verification method]; [deadline].\n\nWHO TO ASK\nBusiness owner. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe approved changes are saved and the resulting settings/profile/text are verified and recorded.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nBefore-action permission and final review are suggested safeguards for this template, not automatic business authority. Choose the business owner as reviewer, and never permit N/A on the gated change step.",
    "can_do": "Prepare and apply the exact supplied changes within the approved request.",
    "ask_first": "Missing approved text, ambiguous instructions, a request to interpret legal terms or an unexpected result.",
    "never_do": "Draft legal policy, choose new business terms, change unrequested settings or broaden permissions.",
    "resources": [],
    "review_required": true,
    "steps": [
      {
        "title": "Record the requested changes",
        "instructions": "Identify the storefront and list the exact approved settings/text or audit fixes.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-15-step-01"
      },
      {
        "title": "Check the current configuration",
        "instructions": "Compare the current portal state with the request. Ask about unclear differences before editing.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-15-step-02"
      },
      {
        "title": "Get permission and apply the exact change",
        "instructions": "Request the business owner’s decision on the exact change. After approval, apply it externally and attach Before/After evidence.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "before_after",
        "approval_before": true,
        "options": [],
        "id": "operations-15-step-03"
      },
      {
        "title": "Verify the saved or published result",
        "instructions": "Check the agreed verification location. Record results for all requested items; route unresolved failures.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-15-step-04"
      },
      {
        "title": "Record the change handoff",
        "instructions": "Summarize completed changes and provide the approved verification reference.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-15-step-05"
      }
    ]
  },
  {
    "title": "16 | Prepare and verify a product launch",
    "description": "Help a product go live on the required marketplace using approved content and settings.",
    "sop": "GOAL\nHelp a product go live on the required marketplace using approved content and settings.\n\nWHEN TO USE\nWhen the business owner assigns a product launch and confirms the target channels and timing.\n\nONE RUN COVERS\nOne product on one marketplace; make separate runs for other required channels.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Product reference]; [target marketplace]; [approved content/assets/settings]; [launch timing]; [publishing authority]; [verification checklist].\n\nWHO TO ASK\nBusiness owner; marketplace lead for operational assistance. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe listing is created, approved content is entered, publishing is completed as instructed, and the live result is checked.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nThe application does not publish listings. Final review is a suggested training safeguard; add a before-action gate if the client requires a separate live-publish decision.",
    "can_do": "Prepare listings, enter approved content, publish only as authorized and verify the live result.",
    "ask_first": "Missing approved assets/settings, uncertain launch timing, an unpublished/rejected listing or content outside the brief.",
    "never_do": "Invent marketing content, choose a launch strategy, or publish outside the approved scope/timing.",
    "resources": [],
    "review_required": true,
    "steps": [
      {
        "title": "Confirm the launch brief",
        "instructions": "Record the product, marketplace, approved materials and agreed launch timing.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-16-step-01"
      },
      {
        "title": "Create the required listing",
        "instructions": "Follow the approved portal method for the correct product and channel.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-16-step-02"
      },
      {
        "title": "Enter the approved content and settings",
        "instructions": "Use the supplied material without making unapproved content/strategy decisions.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-16-step-03"
      },
      {
        "title": "Publish as instructed",
        "instructions": "Use the actual marketplace workflow only within the confirmed publishing authority and timing.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-16-step-04"
      },
      {
        "title": "Check the live listing",
        "instructions": "Verify the live result against the agreed checklist and attach the permitted proof. Keep publishing/verification failures open.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "file",
        "approval_before": false,
        "options": [],
        "id": "operations-16-step-05"
      },
      {
        "title": "Save the live reference and handoff",
        "instructions": "Record the live link and notify the owner through the agreed channel.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-16-step-06"
      }
    ]
  },
  {
    "title": "17 | Review platform mail and record deadlines",
    "description": "Read marketplace/compliance messages, capture every actionable deadline, and route non-routine work.",
    "sop": "GOAL\nRead marketplace/compliance messages, capture every actionable deadline, and route non-routine work.\n\nWHEN TO USE\nDaily. Confirm account coverage and the client-local deadline; do not silently change daily coverage to weekdays.\n\nONE RUN COVERS\nOne day’s review of the agreed marketplace and compliance accounts.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Approved accounts]; [routine-response SOPs]; [daily coverage/deadline]; [deadline tracker]; [escalation owners]; [client timezone].\n\nWHO TO ASK\nBusiness owner; designated owner for each routed request. Replace this role with an authorized workspace member.\n\nDONE WHEN\nAll assigned accounts are reviewed, every actionable deadline has dated work, and routine/routed outcomes are recorded.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nCompleting this daily review does not complete the separate obligations it discovers. The app has no business-holiday calculator; ask the owner to resolve unclear working-day cutoffs.",
    "can_do": "Read messages, enter deadlines, handle approved routine matters and propose next actions for the rest.",
    "ask_first": "Ambiguous deadline wording, non-routine requests, blocked access or an action requiring a business decision.",
    "never_do": "Guess deadlines, make unapproved decisions, answer customers under this operations-only scope, or mark routed work as resolved.",
    "resources": [],
    "review_required": false,
    "steps": [
      {
        "title": "Review the assigned inboxes and portals",
        "instructions": "Read the marketplace/compliance messages for every agreed account. This app does not read email for you.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-17-step-01"
      },
      {
        "title": "Record messages and exact deadlines",
        "instructions": "Record the source/reference and deadline wording for actionable messages, or \"No actionable deadlines\". Ask about ambiguity.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-17-step-02"
      },
      {
        "title": "Create separate dated work",
        "instructions": "Create or link a run for each actionable obligation with confirmed due date, reference and source. Record run references, or \"None needed\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-17-step-03"
      },
      {
        "title": "Handle approved routine requests",
        "instructions": "Use the approved routine instructions. Record actions and evidence references, or \"No routine actions\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-17-step-04"
      },
      {
        "title": "Route other requests with a proposal",
        "instructions": "Create issues or assigned follow-up work with an internal owner, recommendation and follow-up date. Record references or \"None\".",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-17-step-05"
      },
      {
        "title": "Check the deadline register",
        "instructions": "Confirm the dated runs appear in Deadlines. Recording a date in notes alone is not enough.",
        "kind": "checkbox",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-17-step-06"
      }
    ]
  },
  {
    "title": "18 | Investigate a payment or account issue",
    "description": "Find out what happened, recommend the next action, and put the decision with the business owner.",
    "sop": "GOAL\nFind out what happened, recommend the next action, and put the decision with the business owner.\n\nWHEN TO USE\nWhen a failed payment, reminder, blocked account or payout/refund-blocking issue is assigned.\n\nONE RUN COVERS\nOne investigation and owner handoff. Any later resolution work is separately assigned or explicitly added to scope.\n\nCLIENT SETUP - COMPLETE BEFORE PUBLISHING\n[Account/case reference]; [approved investigation access]; [symptom]; [owner]; [handoff deadline]; [follow-up date].\n\nWHO TO ASK\nBusiness owner. Replace this role with an authorized workspace member.\n\nDONE WHEN\nThe investigation, findings and proposed next action are handed to the owner, with a traceable decision/follow-up record.\n\nUSING VA RELAY\nRead the saved SOP, do the work in the approved external tool, and click Save step after each answer. Attach only the evidence requested. For a problem, create an issue with an internal owner, next action and follow-up date. Keep required unfinished work open. Waiting does not remove the deadline. Submit for review if enabled; otherwise use Complete work.\n\nTEMPLATE DEFAULTS\nThis is a draft starting point. Step detail, evidence and review settings are suggested controls for client approval. No accounts, URLs, assignees or schedules are preconfigured. The app does not carry out external actions or infer issues from an answer. Never publish unresolved bracketed placeholders. \n\nIMPORTANT\nThe business owner pays and approves. For an investigation-only run, a routed issue may be non-blocking if the owner agrees; it remains open separately. If the assigned outcome includes resolution, keep the run blocked/waiting until the authorized result is verified.",
    "can_do": "Investigate observed errors and account/payment status; record findings and recommend a next action.",
    "ask_first": "A decision, payment, access change or corrective action outside the approved investigation instructions.",
    "never_do": "Make payments, issue refunds, alter payment credentials, or describe the issue as fixed without verification.",
    "resources": [],
    "review_required": true,
    "steps": [
      {
        "title": "Identify the problem and affected account",
        "instructions": "Record the account/case reference, observed error and impact without including credentials.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-18-step-01"
      },
      {
        "title": "Check the approved information",
        "instructions": "Record what you inspected and the findings. Distinguish observation from an untested explanation.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-18-step-02"
      },
      {
        "title": "Prepare the recommended next action",
        "instructions": "State what needs to happen next and which decision belongs to the owner.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-18-step-03"
      },
      {
        "title": "Create the owned issue and handoff",
        "instructions": "Create a linked issue for the owner with recommendation and follow-up date. Record its reference and the owner handoff.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-18-step-04"
      },
      {
        "title": "Record the investigation outcome",
        "instructions": "State \"Investigated and handed to owner\" when that is the completed scope. Keep any remaining decision/resolution visible.",
        "kind": "text",
        "required": true,
        "allow_na": false,
        "evidence": "none",
        "approval_before": false,
        "options": [],
        "id": "operations-18-step-05"
      }
    ]
  }
];

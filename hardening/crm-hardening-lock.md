# CRM Hardening Lock

## Status

The base CRM is ready to harden and should stop expanding with new feature ideas unless they are universal to all industries.

This file locks the current CRM scope and defines what belongs in the base CRM, what must be wired next, and what should move into industry packs.

## Base CRM scope

The base CRM owns relationship management and customer/prospect history.

Base CRM includes:

- Customer List
- Prospect Customers
- customer/prospect record bubble
- customer/prospect search
- add customer
- add prospect
- convert prospect to customer
- communication timeline
- smart follow-up
- AI customer/prospect summary
- marketing and upsell plan
- Neroa Connect actions
- text/email/call/AI call actions
- calendar/meeting link setup
- Neroa Connect Calendar booking setup
- meeting provider selection
- meeting days/times/length/timezone/booking window
- Vault-backed records
- meeting records
- transcript/recording/summary link concept
- source and lead history preservation

## Base CRM promise

Every customer/prospect interaction should be captured, summarized, filed, and turned into next actions.

The CRM should answer:

- who is this customer/prospect?
- what happened last?
- what was sent?
- what was signed?
- what was discussed?
- what files exist?
- what is in Vault?
- what do they need?
- what is the next action?
- what can we sell or upsell intelligently?

## Hardening rules

### Rule 1: Do not add industry-specific fields to base CRM

The base CRM should not include realtor, screen print, builder, legal, medical, IT, or other vertical-specific objects.

Industry packs should add those later.

Examples:

- Realtor adds properties, showings, offers, buyers, sellers, transactions.
- Screen print adds artwork, proofs, garment counts, production jobs, reorders.
- Builder adds job sites, permits, SOV, change orders, photos, subcontractors.
- Legal adds matters, leases, filings, retention rules, signing packets.
- IT adds tickets, assets, user access, SaaS licenses, incidents, SOPs.

### Rule 2: CRM should display records, Vault should own files

CRM can show:

- signed packets
- quotes
- invoices
- uploads
- file requests
- meeting recordings
- transcripts
- summaries
- proof receipts

Vault owns:

- actual files
- folder paths
- permissions
- access history
- retention
- audit evidence
- proof receipts

### Rule 3: Neroa Connect owns communications

CRM should initiate and display communication activity, but Neroa Connect should handle the underlying communication layer.

Neroa Connect includes:

- native Neroa video
- Zoom-style meetings
- Google Meet-style meetings
- Twilio text/calls
- connected email
- AI calls
- calendar booking
- owner notifications

### Rule 4: AI is infrastructure, not a floating feature

AI must remain part of the operating layer.

AI in base CRM should handle:

- lead/prospect matching
- customer/prospect summary
- next-best action
- follow-up suggestions
- meeting/call summaries
- communication summary
- marketing/upsell suggestions
- missing information detection
- conversion readiness

### Rule 5: Buttons must resolve to workflows

Every visible CRM action should either:

- open a record
- open an action panel
- switch a workflow tab
- prepare a Connect action
- prepare a Vault-backed record
- configure a scheduled follow-up
- push to Neroa Connect Calendar

No decorative buttons should remain.

## Backend/data wiring required next

The current CRM is front-end/workflow hardened. The next phase should wire it to real services.

Required backend pieces:

### Database records

- customers
- prospects
- contacts
- companies
- activities
- tasks
- meeting records
- communication records
- customer intelligence summaries
- marketing/upsell plans
- Vault references
- Connect actions
- conversion history

### API routes

Needed routes:

- create customer
- update customer
- create prospect
- update prospect
- convert prospect to customer
- create activity
- create follow-up task
- schedule email
- schedule call
- schedule meeting
- create booking link
- push to Neroa Connect Calendar
- create Vault record reference
- attach Vault proof
- save AI summary
- save marketing/upsell plan

### Neroa Connect integration

Connect needs real service hooks for:

- email
- Twilio text
- Twilio calls
- native Neroa video
- Zoom-style meeting links
- Google Meet-style meeting links
- calendar booking
- AI call
- owner notifications

### Vault integration

Vault needs real service hooks for:

- meeting recording reference
- transcript reference
- AI meeting summary
- signed packet proof
- file upload reference
- quote/invoice link
- access history
- proof receipt

## UI hardening required next

Before production, the CRM UI needs:

- responsive pass for small screens
- action modal validation
- loading states
- save success states
- error states
- disabled states when Connect/Vault is not configured
- empty states
- permission-aware buttons
- keyboard/focus cleanup
- overflow cleanup
- form field validation

## Permission hardening

Base CRM permissions should define who can:

- view customers
- view prospects
- create customers
- create prospects
- convert prospects
- send text
- send email
- make call
- schedule meeting
- start AI call
- push to Neroa Connect Calendar
- view Vault records
- attach Vault records
- edit AI summary
- edit marketing/upsell plan
- delete/archive records

## Proof/audit hardening

Every important CRM action should eventually emit an evidence event:

- customer created
- prospect created
- prospect converted
- email sent
- text sent
- call logged
- AI call completed
- meeting scheduled
- meeting completed
- Vault record attached
- signed packet sent
- signed packet completed
- customer record edited
- follow-up scheduled
- task completed

Each event should include:

- actor
- timestamp
- record ID
- action type
- source
- outcome
- Vault path if applicable
- Connect provider if applicable

## Industry-pack boundary

The base CRM is now locked as the universal relationship layer.

Industry packs should extend it by adding their own objects, fields, workflows, dashboards, runners, and automations.

Do not add more vertical-specific logic to `src/LiveCanonicalPortal.jsx`.

## Next recommended step

Move to Accounting fixes after this CRM hardening lock.

Accounting should be cleaned in the same way:

- remove placeholder/demo language
- keep accounting as a real command center
- make buttons resolve to workflows
- define accounting runners
- define accounting proof events
- wire later to real backend and Vault

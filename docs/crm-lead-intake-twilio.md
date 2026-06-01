# CRM Lead Intake + Twilio Routing

The CRM should start from lead intake, not from the SEO crawler.

Lead sources such as Zillow, Realtor.com, marketplace forms, website quote forms, and other listing platforms should send lead emails into a controlled inbox. Those emails become CRM lead events.

## Correct flow

1. Lead email arrives from Zillow, Realtor.com, website form, or another source.
2. Email parser extracts lead details.
3. System creates a pending lead intake record.
4. Twilio call/text workflow starts before the lead is finalized into CRM.
5. The lead is routed into CRM based on what happened.
6. CRM stores communication status, follow-up status, and source attribution.
7. Optional website intelligence / SEO crawler can enrich the company/contact later.

## Source inbox pattern

Each tenant/customer should have a dedicated inbound lead email address.

Examples:

- `leads@customer-domain.com`
- `zillow@customer-domain.com`
- `realtor@customer-domain.com`
- `lead-intake+tenant-slug@app-domain.com`

Inbound email provider options:

- SendGrid Inbound Parse
- Mailgun Routes
- Postmark inbound email
- AWS SES inbound email
- Gmail/Google Workspace API later if needed

## Lead intake statuses

A lead should not go straight into the normal CRM pipeline without communication context.

Recommended statuses:

- `email_received`
- `parsed`
- `twilio_call_queued`
- `twilio_text_queued`
- `call_attempted`
- `call_connected`
- `call_missed`
- `sms_sent`
- `sms_delivered`
- `sms_failed`
- `email_sent`
- `email_opened`
- `needs_manual_review`
- `qualified`
- `unqualified`
- `created_in_crm`

## Twilio behavior

When a lead is parsed:

1. If the lead has a phone number, queue a Twilio call and SMS.
2. If there is no phone number but there is an email, queue an email response.
3. Log every attempt.
4. Use Twilio status callbacks to update call/SMS delivery state.
5. Route the lead into CRM based on the outcome.

Important limitation:

Twilio SMS/MMS can confirm delivery/failure through status callbacks, but it generally does not provide a true human read/open receipt like an email pixel. For SMS, track delivery, replies, link clicks, and conversation events instead.

## Read receipt behavior

There are two different kinds of tracking:

### Email open tracking

If the system sends the email, it can include a tracking pixel and/or use the sending provider's open tracking webhook.

Track:

- `email_sent`
- `email_delivered`
- `email_opened`
- `email_clicked`
- `email_bounced`

This only works reliably when the system sends the message and the recipient's email client loads tracking images or tracked links. Apple Mail Privacy Protection and other privacy tools can make opens less reliable.

### SMS/message tracking

For Twilio SMS, track:

- `queued`
- `sent`
- `delivered`
- `undelivered`
- `failed`
- inbound reply received
- tracked link clicked

Do not label SMS delivery as a read receipt. Use “delivery status” or “engagement status.”

## CRM routing rules

Examples:

- Call connected and positive response: move to `Hot Lead`.
- SMS delivered but no reply: move to `Follow Up`.
- SMS failed and email exists: move to `Email Follow Up`.
- Missing phone/email: move to `Needs Manual Review`.
- Lead source says buyer/seller/renter/vendor: route to the matching CRM pipeline.
- Duplicate phone/email: append new source event to existing contact instead of creating a duplicate lead.

## Data model

### `crm_lead_sources`

Stores source configuration.

Fields:

- `id`
- `tenant_id`
- `name`
- `source_type`
- `inbound_email`
- `is_active`
- `created_at`
- `updated_at`

### `crm_lead_intake_events`

Stores raw inbound lead events before normal CRM routing.

Fields:

- `id`
- `source_id`
- `raw_subject`
- `raw_from`
- `raw_body`
- `parsed_name`
- `parsed_email`
- `parsed_phone`
- `parsed_interest`
- `parsed_location`
- `parsed_budget`
- `parsed_source_label`
- `status`
- `created_at`
- `updated_at`

### `crm_leads`

Stores actual CRM lead records after intake/routing.

Fields:

- `id`
- `lead_intake_event_id`
- `name`
- `email`
- `phone`
- `source_name`
- `pipeline`
- `stage`
- `score`
- `assigned_to_user_id`
- `created_at`
- `updated_at`

### `crm_communications`

Stores every call, SMS, email, callback, and engagement event.

Fields:

- `id`
- `lead_id`
- `lead_intake_event_id`
- `channel`
- `direction`
- `provider`
- `provider_message_id`
- `provider_status`
- `to_address`
- `from_address`
- `body`
- `subject`
- `opened_at`
- `clicked_at`
- `delivered_at`
- `failed_at`
- `created_at`
- `updated_at`

## Backend routes

### Inbound email webhook

`POST /api/crm/lead-intake/email-webhook`

Receives email provider webhook payload, stores raw email, parses lead fields, queues Twilio workflow, and returns intake record.

### Twilio status callback

`POST /api/crm/communications/twilio/status`

Receives Twilio delivery/call status callbacks and updates `crm_communications`.

### Twilio inbound reply callback

`POST /api/crm/communications/twilio/inbound`

Receives inbound SMS replies and updates the CRM lead timeline.

### Email open tracking

`GET /api/crm/communications/email/open/:trackingId.png`

Stores `opened_at` and returns a transparent pixel.

### Link click tracking

`GET /api/crm/communications/click/:trackingId`

Stores `clicked_at` and redirects to the target URL.

## Relationship to SEO crawler

The SEO crawler is not the first CRM step.

Correct relationship:

- Lead intake creates the lead.
- Twilio/email engagement determines lead status.
- CRM routing places the lead in the correct pipeline.
- Website Intelligence can enrich the lead/company later if a website/domain exists.
- Website Optimizer remains locked unless repo/CMS/files/domain access is verified.

# Marketing SEO Optimizer

The SEO crawler and optimizer belong under Marketing, not CRM.

## Correct ownership

### CRM owns

- Lead inbox intake
- Zillow/Realtor.com/email lead parsing
- Twilio call/text workflow
- Email follow-up
- Read/open/click tracking
- Lead timeline
- Pipeline routing
- Lead scoring
- Optional Apollo-style enrichment connectors

### Marketing owns

- Public SEO crawl
- Website audit
- Metadata recommendations
- Schema recommendations
- Landing page and CTA recommendations
- Campaign page optimization
- Website performance/trust/conversion recommendations
- Access-gated optimizer execution

## Relationship between CRM and Marketing

CRM may reference Marketing SEO data as enrichment, but CRM should not own the SEO optimizer.

Example:

- CRM lead comes from Zillow.
- CRM handles the call/text/email response.
- CRM stores engagement history.
- If the lead/company has a website, Marketing SEO can enrich the account later.
- Marketing optimizer can recommend website changes.
- Marketing optimizer can only execute changes when source access is verified.

## Access rule

Marketing can crawl and recommend from public website data without source access.

Marketing cannot execute optimizer changes until at least one source access path is verified:

- Connected GitHub repository
- Connected CMS admin/API
- Uploaded website source files
- Verified domain ownership

## Suggested routes

Use Marketing route names going forward:

- `GET /api/marketing/seo-audits`
- `POST /api/marketing/seo-audits/crawl`
- `PATCH /api/marketing/seo-audits/:id/access`
- `POST /api/marketing/seo-audits/:id/optimizer/execute`

The older CRM website-intelligence routes should be considered legacy or transitional if they remain in the code temporarily.

## Suggested UI placement

Employee Portal → Marketing → SEO Optimizer

or, if Marketing becomes a top-level portal later:

Marketing Portal → SEO Optimizer

## UX language

Use this language in the product:

> Marketing SEO Optimizer can audit public website pages and recommend improvements. It cannot publish, edit code, create pull requests, or update CMS content until website source access is verified.

## CRM replacement language

Inside CRM, use:

> Lead Intake & Communications

Not:

> CRM Website Intelligence

CRM should show:

- Lead source
- Lead email parser result
- Call status
- SMS status
- Email open/click status
- Assignment
- Pipeline stage
- Follow-up due
- Timeline
- Optional enrichment source

Marketing should show:

- Website SEO score
- Trust score
- Conversion score
- Technical findings
- Content recommendations
- Landing page recommendations
- Optimizer execution gate

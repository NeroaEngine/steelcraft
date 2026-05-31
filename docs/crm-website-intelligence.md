# CRM Website Intelligence

CRM Website Intelligence is the public-website analysis layer for CRM prospecting and customer account review.

## Core rule

Website Intelligence can crawl, summarize, score, and recommend from public website data without repo access.

Website Optimizer can only execute changes when at least one source-access path is verified:

- Connected GitHub repository
- Connected CMS admin/API, such as WordPress, Webflow, Shopify, Squarespace, or Wix
- Uploaded website source files
- Verified domain ownership

No source access means recommendation-only mode.

## Permission split

### Website Intelligence permissions

- `crm.website_intelligence.view`
- `crm.website_intelligence.crawl`
- `crm.website_intelligence.score`
- `crm.website_intelligence.recommend`

These permissions allow the user to analyze public website data and create CRM lead intelligence.

### Website Optimizer permissions

- `crm.website_optimizer.view`
- `crm.website_optimizer.recommend`
- `crm.website_optimizer.execute`
- `crm.website_optimizer.publish`

Execution and publishing require both user permission and verified source access.

## Access gate

Use this decision rule anywhere execution is offered:

```ts
const canAnalyzeWebsite = true;
const canRecommendOptimizations = true;
const canExecuteOptimizations =
  sourceAccess.githubRepoConnected ||
  sourceAccess.cmsConnected ||
  sourceAccess.uploadedSiteFiles ||
  sourceAccess.domainOwnershipVerified;
```

## UX states

### Recommendation-only mode

Show when no source access is verified.

Copy:

> Optimizer locked: this CRM record can be crawled and scored, but the system cannot modify the website until repo, CMS, uploaded files, or domain ownership is verified.

Allowed actions:

- Crawl public pages
- Score lead, SEO, trust, and conversion strength
- Summarize business and service offering
- Generate outreach recommendations
- Generate plain-English website recommendations

Blocked actions:

- Create pull request
- Push code
- Edit CMS fields
- Publish or draft pages inside a CMS
- Modify uploaded source files

### Execution mode

Show when source access is verified and the user has optimizer execution permission.

Allowed actions:

- Generate implementation tasks
- Create GitHub pull requests
- Draft CMS updates
- Generate metadata/schema files
- Prepare page copy changes
- Route changes through approval before publish

## Data model

### `crm_website_profiles`

Stores the company-level website intelligence record.

Important fields:

- `id`
- `company_id`
- `domain`
- `website_url`
- `business_summary`
- `industry_guess`
- `lead_score`
- `seo_score`
- `trust_score`
- `conversion_score`
- `source_access_status`
- `crawl_status`
- `last_crawled_at`
- `created_at`
- `updated_at`

### `crm_website_optimizer_access`

Stores whether the optimizer is allowed to execute.

Important fields:

- `id`
- `website_profile_id`
- `github_repo_connected`
- `cms_connected`
- `uploaded_site_files`
- `domain_ownership_verified`
- `verified_by_user_id`
- `verified_at`
- `created_at`
- `updated_at`

### `crm_website_recommendations`

Stores public-analysis recommendations and execution tasks.

Important fields:

- `id`
- `website_profile_id`
- `recommendation_type`
- `title`
- `description`
- `requires_source_access`
- `execution_status`
- `created_at`
- `updated_at`

## Implementation guardrail

The backend must check source access again before any write action. The frontend lock is not enough.

Backend write endpoints should reject execution when `canExecuteOptimizations` is false, even if the user can view recommendations.

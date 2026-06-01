import React, { useMemo, useState } from 'react';

const defaultAudit = {
  brandName: 'Marketing Website',
  websiteUrl: 'https://example.com',
  crawlStatus: 'Ready for public SEO audit',
  seoScore: 64,
  trustScore: 72,
  conversionScore: 58,
  sourceAccess: {
    githubRepoConnected: false,
    cmsConnected: false,
    uploadedSiteFiles: false,
    domainOwnershipVerified: false,
  },
  findings: [
    'Public SEO crawl can inspect metadata, headings, sitemap, robots.txt, schema, OpenGraph, internal links, and calls to action.',
    'Marketing can recommend fixes without source access.',
    'Marketing cannot execute optimizer changes until repo, CMS, uploaded files, or domain ownership is verified.',
  ],
  recommendations: [
    'Write stronger page titles and meta descriptions.',
    'Add or improve service-area landing pages.',
    'Add structured data for organization, local business, services, and FAQs.',
    'Improve campaign landing page calls to action.',
  ],
};

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function ScoreCard({ label, value, detail }) {
  return (
    <Card>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </Card>
  );
}

export function canExecuteMarketingSeoOptimizations(sourceAccess = {}) {
  return Boolean(
    sourceAccess.githubRepoConnected ||
    sourceAccess.cmsConnected ||
    sourceAccess.uploadedSiteFiles ||
    sourceAccess.domainOwnershipVerified
  );
}

export default function MarketingSeoOptimizer({ audit = defaultAudit }) {
  const [sourceAccess, setSourceAccess] = useState(audit.sourceAccess || defaultAudit.sourceAccess);
  const optimizerUnlocked = useMemo(() => canExecuteMarketingSeoOptimizations(sourceAccess), [sourceAccess]);

  function toggleAccess(key) {
    setSourceAccess((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="stack">
      <Card>
        <div className="section-heading">
          <Badge tone="red">Marketing SEO Optimizer</Badge>
          <h2>{audit.brandName}</h2>
          <p>{audit.websiteUrl}</p>
          <p>
            SEO crawl, content recommendations, landing page improvements, metadata, schema, and conversion optimization belong under Marketing.
            CRM can reference this as enrichment, but CRM should not own the optimizer.
          </p>
        </div>
      </Card>

      <div className="metrics-grid">
        <ScoreCard label="SEO Score" value={audit.seoScore} detail="Titles, descriptions, headings, sitemap, schema" />
        <ScoreCard label="Trust Score" value={audit.trustScore} detail="Proof signals, contact clarity, authority" />
        <ScoreCard label="Conversion Score" value={audit.conversionScore} detail="Landing pages, CTAs, lead capture" />
        <ScoreCard label="Execution Access" value={optimizerUnlocked ? 'Unlocked' : 'Locked'} detail="Requires source access before edits" />
      </div>

      <div className="two-column wide-left">
        <Card>
          <div className="section-heading">
            <Badge tone="green">Marketing analysis</Badge>
            <h2>Public SEO audit</h2>
            <p>Marketing can crawl public pages and generate recommendations without touching the website source.</p>
          </div>
          <div className="stack">
            {audit.findings.map((finding) => (
              <article className="queue-item" key={finding}>
                <div>
                  <strong>SEO audit signal</strong>
                  <p>{finding}</p>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <div className="section-heading">
            <Badge tone={optimizerUnlocked ? 'green' : 'amber'}>{optimizerUnlocked ? 'Optimizer unlocked' : 'Optimizer locked'}</Badge>
            <h2>Execution gate</h2>
            <p>Recommendations are visible. Website changes, repo PRs, CMS edits, and publishing require verified source access.</p>
          </div>
          <div className="stack">
            <label className="check-row"><input type="checkbox" checked={sourceAccess.githubRepoConnected} onChange={() => toggleAccess('githubRepoConnected')} /> Connected GitHub repo</label>
            <label className="check-row"><input type="checkbox" checked={sourceAccess.cmsConnected} onChange={() => toggleAccess('cmsConnected')} /> Connected CMS admin/API</label>
            <label className="check-row"><input type="checkbox" checked={sourceAccess.uploadedSiteFiles} onChange={() => toggleAccess('uploadedSiteFiles')} /> Uploaded website source files</label>
            <label className="check-row"><input type="checkbox" checked={sourceAccess.domainOwnershipVerified} onChange={() => toggleAccess('domainOwnershipVerified')} /> Verified domain ownership</label>
          </div>
          {!optimizerUnlocked && (
            <div className="warning-box">
              Optimizer locked: Marketing can recommend improvements, but it cannot modify the website until source access is verified.
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="section-heading">
          <Badge>SEO recommendations</Badge>
          <h2>{optimizerUnlocked ? 'Ready for implementation workflow' : 'Recommendation-only mode'}</h2>
          <p>{optimizerUnlocked ? 'Create implementation tasks, CMS drafts, or repo pull requests for approval.' : 'Keep these as marketing recommendations until access is connected.'}</p>
        </div>
        <div className="module-grid four-up">
          {audit.recommendations.map((recommendation) => (
            <article className="module" key={recommendation}>
              <Badge tone={optimizerUnlocked ? 'green' : 'amber'}>{optimizerUnlocked ? 'Executable' : 'Recommendation'}</Badge>
              <h3>{recommendation}</h3>
              <p>{optimizerUnlocked ? 'Allowed to generate a task, draft, PR, or CMS update.' : 'Do not modify source until access is verified.'}</p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

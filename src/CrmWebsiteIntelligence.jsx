import React, { useMemo, useState } from 'react';

const defaultProfile = {
  companyName: 'Prospect Company',
  websiteUrl: 'https://example.com',
  crawlStatus: 'Ready to crawl public website',
  leadScore: 78,
  seoScore: 64,
  trustScore: 72,
  conversionScore: 58,
  sourceAccess: {
    githubRepoConnected: false,
    cmsConnected: false,
    uploadedSiteFiles: false,
    domainOwnershipVerified: false,
  },
  publicFindings: [
    'Homepage, service pages, contact page, metadata, schema, sitemap, robots.txt, and public CTAs can be analyzed without source access.',
    'Missing or weak SEO fields can be recommended from public page data.',
    'Lead outreach can be generated from public business signals and website gaps.',
  ],
  optimizerRecommendations: [
    'Improve homepage headline and primary call to action.',
    'Add service-area pages for target markets.',
    'Add organization, local business, and service schema where appropriate.',
    'Strengthen contact path with phone, quote request, and form visibility.',
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

export function canExecuteWebsiteOptimizations(sourceAccess = {}) {
  return Boolean(
    sourceAccess.githubRepoConnected ||
    sourceAccess.cmsConnected ||
    sourceAccess.uploadedSiteFiles ||
    sourceAccess.domainOwnershipVerified
  );
}

export default function CrmWebsiteIntelligence({ profile = defaultProfile }) {
  const [sourceAccess, setSourceAccess] = useState(profile.sourceAccess || defaultProfile.sourceAccess);
  const optimizerUnlocked = useMemo(() => canExecuteWebsiteOptimizations(sourceAccess), [sourceAccess]);

  function toggleAccess(key) {
    setSourceAccess((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="stack">
      <Card>
        <div className="section-heading">
          <Badge tone="red">CRM Website Intelligence</Badge>
          <h2>{profile.companyName}</h2>
          <p>{profile.websiteUrl}</p>
          <p>
            Public crawling, website scoring, lead intelligence, and plain-English recommendations are available without repo access.
            Execution stays locked until source access is verified.
          </p>
        </div>
      </Card>

      <div className="metrics-grid">
        <ScoreCard label="Lead Score" value={profile.leadScore} detail="Sales fit and outreach value" />
        <ScoreCard label="SEO Score" value={profile.seoScore} detail="Metadata, structure, sitemap, schema" />
        <ScoreCard label="Trust Score" value={profile.trustScore} detail="Credibility, contact info, proof signals" />
        <ScoreCard label="Conversion Score" value={profile.conversionScore} detail="CTA clarity and lead capture" />
      </div>

      <div className="two-column wide-left">
        <Card>
          <div className="section-heading">
            <Badge tone="green">Allowed without repo access</Badge>
            <h2>Website Intelligence</h2>
            <p>Reads public pages only. It does not bypass logins, private portals, or protected files.</p>
          </div>
          <div className="stack">
            {profile.publicFindings.map((finding) => (
              <article className="queue-item" key={finding}>
                <div>
                  <strong>Public analysis</strong>
                  <p>{finding}</p>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <div className="section-heading">
            <Badge tone={optimizerUnlocked ? 'green' : 'amber'}>{optimizerUnlocked ? 'Optimizer unlocked' : 'Optimizer locked'}</Badge>
            <h2>Source access gate</h2>
            <p>
              Recommendations are always visible, but code/CMS edits, pull requests, publishing, and source-file changes require verified access.
            </p>
          </div>
          <div className="stack">
            <label className="check-row"><input type="checkbox" checked={sourceAccess.githubRepoConnected} onChange={() => toggleAccess('githubRepoConnected')} /> Connected GitHub repo</label>
            <label className="check-row"><input type="checkbox" checked={sourceAccess.cmsConnected} onChange={() => toggleAccess('cmsConnected')} /> Connected CMS admin/API</label>
            <label className="check-row"><input type="checkbox" checked={sourceAccess.uploadedSiteFiles} onChange={() => toggleAccess('uploadedSiteFiles')} /> Uploaded website source files</label>
            <label className="check-row"><input type="checkbox" checked={sourceAccess.domainOwnershipVerified} onChange={() => toggleAccess('domainOwnershipVerified')} /> Verified domain ownership</label>
          </div>
          {!optimizerUnlocked && (
            <div className="warning-box">
              Optimizer locked: this CRM record can be crawled and scored, but the system cannot modify the website until repo, CMS, uploaded files, or domain ownership is verified.
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="section-heading">
          <Badge>Website Optimizer</Badge>
          <h2>{optimizerUnlocked ? 'Execution-ready recommendations' : 'Recommendation-only mode'}</h2>
          <p>
            {optimizerUnlocked
              ? 'Access is verified. The next step can create drafts, tasks, repo changes, or CMS updates for approval.'
              : 'Access is not verified. Keep these as recommendations and outreach talking points only.'}
          </p>
        </div>
        <div className="module-grid four-up">
          {profile.optimizerRecommendations.map((recommendation) => (
            <article className="module" key={recommendation}>
              <Badge tone={optimizerUnlocked ? 'green' : 'amber'}>{optimizerUnlocked ? 'Executable' : 'Recommendation'}</Badge>
              <h3>{recommendation}</h3>
              <p>{optimizerUnlocked ? 'Allowed to generate a task, PR, draft, or CMS update.' : 'Do not modify source until access is verified.'}</p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

const DEFAULT_TIMEOUT_MS = 9000;
const DEFAULT_MAX_PAGES = 6;

function normalizeStartUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('websiteUrl is required');
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  url.hash = '';
  return url;
}

function sameOrigin(url, origin) {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function normalizeHref(href, baseUrl) {
  try {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
    const url = new URL(href, baseUrl);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchOne(html, regex) {
  const match = html.match(regex);
  return match ? stripHtml(match[1] || match[2] || '') : '';
}

function matchAll(html, regex) {
  return Array.from(html.matchAll(regex)).map((match) => stripHtml(match[1] || match[2] || '')).filter(Boolean);
}

async function fetchText(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SteelCraftCRMWebsiteIntelligence/1.0 (+public SEO analysis)',
        Accept: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, finalUrl: response.url, text, contentType: response.headers.get('content-type') || '' };
  } finally {
    clearTimeout(timer);
  }
}

function extractSitemapUrls(xml, origin, maxUrls) {
  return matchAll(xml, /<loc[^>]*>([\s\S]*?)<\/loc>/gi)
    .map((url) => normalizeHref(url, origin))
    .filter((url) => url && sameOrigin(url, origin))
    .slice(0, maxUrls);
}

function extractInternalLinks(html, baseUrl, maxUrls) {
  const origin = new URL(baseUrl).origin;
  const links = matchAll(html, /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)
    .map((href) => normalizeHref(href, baseUrl))
    .filter((url) => url && sameOrigin(url, origin))
    .filter((url) => !/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|doc|docx|xls|xlsx)$/i.test(url));
  return Array.from(new Set(links)).slice(0, maxUrls);
}

function detectPageType(url, index) {
  const path = new URL(url).pathname.toLowerCase();
  if (index === 0 || path === '/' || path === '') return 'homepage';
  if (path.includes('about')) return 'about';
  if (path.includes('contact')) return 'contact';
  if (path.includes('service')) return 'services';
  if (path.includes('blog') || path.includes('news')) return 'content';
  if (path.includes('career')) return 'careers';
  return 'public';
}

function detectCtas(text) {
  const patterns = ['contact', 'call', 'quote', 'estimate', 'schedule', 'book', 'request', 'buy', 'shop', 'demo', 'consultation'];
  const lower = text.toLowerCase();
  return patterns.filter((pattern) => lower.includes(pattern)).slice(0, 8);
}

function analyzeHtml(url, html, status, index) {
  const title = matchOne(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = matchOne(html, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || matchOne(html, /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const headings = matchAll(html, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi).slice(0, 10);
  const h1s = matchAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const canonical = matchOne(html, /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i);
  const noindex = /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  const hasSchema = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html) || /itemscope|schema\.org/i.test(html);
  const hasOpenGraph = /<meta\s+[^>]*property=["']og:/i.test(html);
  const text = stripHtml(html);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const ctas = detectCtas(`${text} ${headings.join(' ')}`);

  return {
    url,
    pageType: detectPageType(url, index),
    title,
    metaDescription,
    headings,
    h1s,
    canonical,
    statusCode: status,
    indexedAllowed: !noindex,
    hasSchema,
    hasOpenGraph,
    wordCount,
    detectedCtas: ctas,
    extractedTextSummary: text.slice(0, 500),
    internalLinks: extractInternalLinks(html, url, 20),
  };
}

function scoreCrawl({ pages, robotsFound, sitemapFound }) {
  const homepage = pages[0] || {};
  const pagesWithTitles = pages.filter((page) => page.title && page.title.length >= 10 && page.title.length <= 70).length;
  const pagesWithDescriptions = pages.filter((page) => page.metaDescription && page.metaDescription.length >= 50 && page.metaDescription.length <= 170).length;
  const pagesWithH1 = pages.filter((page) => page.h1s?.length === 1).length;
  const pagesWithSchema = pages.filter((page) => page.hasSchema).length;
  const pagesWithCtas = pages.filter((page) => page.detectedCtas?.length).length;
  const hasContact = pages.some((page) => /contact/i.test(page.url) || page.detectedCtas?.includes('contact') || /phone|email|contact/i.test(page.extractedTextSummary || ''));
  const hasServices = pages.some((page) => /service|product|solution/i.test(`${page.url} ${page.headings?.join(' ')}`));
  const goodStatus = pages.filter((page) => page.statusCode >= 200 && page.statusCode < 400).length;
  const avgWords = pages.reduce((sum, page) => sum + (page.wordCount || 0), 0) / Math.max(pages.length, 1);

  const seoScore = Math.min(100, Math.round(
    15 +
    (pagesWithTitles / Math.max(pages.length, 1)) * 20 +
    (pagesWithDescriptions / Math.max(pages.length, 1)) * 20 +
    (pagesWithH1 / Math.max(pages.length, 1)) * 15 +
    (pagesWithSchema / Math.max(pages.length, 1)) * 10 +
    (sitemapFound ? 10 : 0) +
    (robotsFound ? 5 : 0) +
    (goodStatus / Math.max(pages.length, 1)) * 5
  ));

  const trustScore = Math.min(100, Math.round(
    20 +
    (hasContact ? 25 : 0) +
    (hasServices ? 15 : 0) +
    (homepage.hasOpenGraph ? 10 : 0) +
    (homepage.hasSchema ? 10 : 0) +
    (avgWords > 250 ? 10 : 0) +
    (goodStatus / Math.max(pages.length, 1)) * 10
  ));

  const conversionScore = Math.min(100, Math.round(
    20 +
    (pagesWithCtas / Math.max(pages.length, 1)) * 35 +
    (hasContact ? 20 : 0) +
    (hasServices ? 15 : 0) +
    (homepage.detectedCtas?.length ? 10 : 0)
  ));

  const leadScore = Math.min(100, Math.round((seoScore * 0.25) + (trustScore * 0.25) + (conversionScore * 0.3) + (hasContact ? 10 : 0) + (hasServices ? 10 : 0)));

  return { leadScore, seoScore, trustScore, conversionScore };
}

function buildRecommendations({ pages, robotsFound, sitemapFound }) {
  const recommendations = [];
  const homepage = pages[0] || {};
  const missingDescriptions = pages.filter((page) => !page.metaDescription).length;
  const missingTitles = pages.filter((page) => !page.title).length;
  const missingSchema = pages.filter((page) => !page.hasSchema).length;
  const missingH1 = pages.filter((page) => !page.h1s?.length).length;
  const weakCtas = pages.filter((page) => !page.detectedCtas?.length).length;

  if (!sitemapFound) recommendations.push(['SEO', 'Add or expose sitemap.xml.', 'A sitemap was not detected from public checks. Recommendation is visible now; adding or changing it requires source access.', true]);
  if (!robotsFound) recommendations.push(['SEO', 'Add or review robots.txt.', 'Robots.txt was not found from public checks. Recommendation is visible now; adding it requires source access.', true]);
  if (missingTitles) recommendations.push(['SEO', 'Add unique page titles.', `${missingTitles} crawled page(s) are missing a clear title.`, true]);
  if (missingDescriptions) recommendations.push(['SEO', 'Write meta descriptions for crawled pages.', `${missingDescriptions} crawled page(s) are missing meta descriptions.`, true]);
  if (missingH1) recommendations.push(['SEO', 'Add one clear H1 per important page.', `${missingH1} crawled page(s) did not expose an H1.`, true]);
  if (missingSchema) recommendations.push(['Schema', 'Add structured data where appropriate.', `${missingSchema} crawled page(s) did not expose JSON-LD or schema.org markup.`, true]);
  if (weakCtas) recommendations.push(['Conversion', 'Strengthen visible calls to action.', `${weakCtas} crawled page(s) did not show clear CTA language.`, false]);
  if (!/contact|phone|email/i.test(`${homepage.extractedTextSummary || ''} ${homepage.detectedCtas?.join(' ') || ''}`)) recommendations.push(['Trust', 'Make contact information easier to find.', 'The homepage did not clearly expose contact signals from the public crawl.', false]);

  if (!recommendations.length) recommendations.push(['SEO', 'Maintain current public SEO foundation.', 'The first crawl found core metadata, crawlability, and conversion signals in good shape.', false]);
  return recommendations;
}

export async function crawlPublicWebsite(inputUrl, options = {}) {
  const maxPages = Math.max(1, Math.min(Number(options.maxPages || DEFAULT_MAX_PAGES), 12));
  const start = normalizeStartUrl(inputUrl);
  const origin = start.origin;
  const homepage = await fetchText(start.toString());
  if (!homepage.ok && homepage.status >= 400) throw new Error(`Homepage returned HTTP ${homepage.status}`);

  let robotsFound = false;
  let sitemapFound = false;
  let robotsText = '';
  let sitemapUrls = [];

  try {
    const robots = await fetchText(`${origin}/robots.txt`, 4000);
    robotsFound = robots.ok && robots.text.trim().length > 0;
    robotsText = robots.text || '';
    const sitemapFromRobots = matchAll(robotsText, /^sitemap:\s*(.+)$/gim).map((url) => normalizeHref(url, origin)).filter(Boolean);
    for (const sitemapUrl of sitemapFromRobots.slice(0, 2)) {
      try {
        const sitemap = await fetchText(sitemapUrl, 5000);
        sitemapFound = sitemapFound || sitemap.ok;
        sitemapUrls = sitemapUrls.concat(extractSitemapUrls(sitemap.text, origin, maxPages));
      } catch {}
    }
  } catch {}

  if (!sitemapUrls.length) {
    try {
      const sitemap = await fetchText(`${origin}/sitemap.xml`, 5000);
      sitemapFound = sitemap.ok && sitemap.text.trim().length > 0;
      sitemapUrls = extractSitemapUrls(sitemap.text, origin, maxPages);
    } catch {}
  }

  const homepageAnalysis = analyzeHtml(homepage.finalUrl || start.toString(), homepage.text, homepage.status, 0);
  const discoveredLinks = sitemapUrls.length ? sitemapUrls : homepageAnalysis.internalLinks;
  const crawlQueue = Array.from(new Set([homepageAnalysis.url, ...discoveredLinks])).filter((url) => sameOrigin(url, origin)).slice(0, maxPages);
  const pages = [homepageAnalysis];

  for (const url of crawlQueue.slice(1)) {
    try {
      const page = await fetchText(url);
      if (!/html/i.test(page.contentType) && !/<html|<title|<body/i.test(page.text)) continue;
      pages.push(analyzeHtml(page.finalUrl || url, page.text, page.status, pages.length));
    } catch {}
  }

  const scores = scoreCrawl({ pages, robotsFound, sitemapFound });
  const recommendations = buildRecommendations({ pages, robotsFound, sitemapFound });
  const headings = pages.flatMap((page) => page.headings || []).slice(0, 12);

  return {
    domain: start.hostname.toLowerCase(),
    websiteUrl: start.toString(),
    robotsFound,
    sitemapFound,
    pages,
    recommendations,
    scores,
    industryGuess: 'Public website crawl',
    businessSummary: `Crawled ${pages.length} public page(s). Found ${robotsFound ? 'robots.txt' : 'no robots.txt'} and ${sitemapFound ? 'a sitemap signal' : 'no sitemap signal'}.`,
    serviceSummary: headings.length ? headings.join(' | ').slice(0, 700) : 'Service summary pending; crawler did not find enough public heading text.',
  };
}

import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

/**
 * Extract text content from HTML, stripping tags
 */
function extractText(html: string): string {
  // Remove scripts and styles
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  cleaned = cleaned.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Decode basic entities
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&nbsp;/g, ' ');

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Extract internal links from HTML for further crawling
 */
function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const linkRegex = /href="([^"]+)"/gi;
  let match;

  const base = new URL(baseUrl);

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      // Skip anchors, javascript, and external links
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;

      let resolved: URL;
      if (href.startsWith('http')) {
        resolved = new URL(href);
      } else {
        resolved = new URL(href, baseUrl);
      }

      // Only follow same-domain links
      if (resolved.hostname === base.hostname && !links.includes(resolved.href)) {
        links.push(resolved.href);
      }
    } catch {
      // Skip malformed URLs
    }
  }

  return links;
}

/**
 * Detect monetization signals on a website
 */
function detectMonetization(html: string): string[] {
  const signals: string[] = [];
  const lower = html.toLowerCase();

  // Ad networks
  if (lower.includes('googletag') || lower.includes('adsbygoogle') || lower.includes('google_ad_client')) {
    signals.push('Google AdSense detected');
  }
  if (lower.includes('amazon-adsystem') || lower.includes('amzn_assoc')) {
    signals.push('Amazon Associates detected');
  }
  if (lower.includes('mediavine') || lower.includes('adthrive') || lower.includes('ezoic')) {
    signals.push('Premium ad network detected');
  }
  if (lower.includes('taboola') || lower.includes('outbrain')) {
    signals.push('Native advertising detected');
  }

  // Affiliate links
  if (lower.includes('affiliate') || lower.includes('ref=') || lower.includes('tag=')) {
    signals.push('Affiliate links detected');
  }
  if (lower.includes('amzn.to') || lower.includes('amazon.com/dp') || lower.includes('amazon.com/gp')) {
    signals.push('Amazon affiliate links');
  }
  if (lower.includes('shareasale') || lower.includes('cj.com') || lower.includes('impact.com')) {
    signals.push('Affiliate network links detected');
  }

  // E-commerce / Sponsors
  if (lower.includes('shopify') || lower.includes('woocommerce') || lower.includes('bigcommerce')) {
    signals.push('E-commerce platform detected');
  }
  if (lower.includes('sponsor') || lower.includes('partner') || lower.includes('advertise with')) {
    signals.push('Sponsorship/advertising page detected');
  }
  if (lower.includes('patreon') || lower.includes('ko-fi') || lower.includes('buymeacoffee')) {
    signals.push('Creator monetization (Patreon/Ko-fi) detected');
  }
  if (lower.includes('stripe') || lower.includes('paypal') || lower.includes('checkout')) {
    signals.push('Payment processing detected');
  }

  // Newsletter
  if (lower.includes('newsletter') || lower.includes('subscribe') || lower.includes('mailchimp') || lower.includes('convertkit')) {
    signals.push('Email list/newsletter detected');
  }

  return signals;
}

/**
 * Extract site title from HTML
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  if (ogTitleMatch) return ogTitleMatch[1].trim();

  return '';
}

/**
 * Estimate website traffic tier based on available signals
 */
function estimateTrafficTier(
  monetizationSignals: string[],
  pageCount: number,
  contentLength: number,
): number {
  let estimate = 1000;

  // More monetization = likely more traffic
  estimate += monetizationSignals.length * 5000;

  // Premium ad networks imply 50K+ monthly visits
  if (monetizationSignals.some(s => s.includes('Premium ad network'))) estimate += 50000;

  // E-commerce implies active business
  if (monetizationSignals.some(s => s.includes('E-commerce'))) estimate += 20000;

  // More pages crawled with content = more established site
  estimate += pageCount * 2000;

  // More content = more established
  estimate += Math.floor(contentLength / 1000) * 500;

  return Math.min(500000, estimate);
}

/**
 * Main website analyzer -- generic spider
 */
export async function analyzeWebsite(url: string): Promise<AnalysisResult> {
  const baseUrl = new URL(url).origin;
  const pagesToCrawl = [url];
  const crawled = new Set<string>();
  let allText = '';
  let allHtml = '';
  let siteName = '';

  // Crawl up to 10 pages from the domain
  const maxPages = 10;

  for (let i = 0; i < pagesToCrawl.length && crawled.size < maxPages; i++) {
    const pageUrl = pagesToCrawl[i];
    if (crawled.has(pageUrl)) continue;
    crawled.add(pageUrl);

    try {
      const resp = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SponsorAgent/1.0)',
          Accept: 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });

      if (!resp.ok) continue;
      const contentType = resp.headers.get('content-type') ?? '';
      if (!contentType.includes('html')) continue;

      const html = await resp.text();
      allHtml += html + ' ';

      // Extract site name from first page
      if (i === 0) {
        siteName = extractTitle(html);
      }

      // Extract text content
      const text = extractText(html);
      allText += text + ' ';

      // Find more links to crawl (only from first few pages to avoid going too deep)
      if (i < 3) {
        const links = extractLinks(html, pageUrl);
        // Prioritize interesting pages
        const priorityPaths = ['/about', '/blog', '/sponsors', '/advertise', '/partners', '/contact', '/services'];
        const sortedLinks = links.sort((a, b) => {
          const aP = priorityPaths.some(p => a.toLowerCase().includes(p)) ? -1 : 0;
          const bP = priorityPaths.some(p => b.toLowerCase().includes(p)) ? -1 : 0;
          return aP - bP;
        });

        for (const link of sortedLinks.slice(0, 20)) {
          if (!crawled.has(link) && !pagesToCrawl.includes(link)) {
            pagesToCrawl.push(link);
          }
        }
      }
    } catch {
      // Skip failed pages
    }
  }

  if (!allText.trim()) {
    return formatResult({
      platform: 'website',
      url,
      channelName: new URL(url).hostname,
      followerCount: null,
      brandMentions: [],
      themes: ['lifestyle'] as ContentTheme[],
      sponsorScore: 20,
      rateRange: estimateRateRange(0),
      recommendations: ['Could not fetch or parse the website content. The site may be blocking automated requests.'],
    });
  }

  const channelName = siteName || new URL(url).hostname;

  // Scan for brand mentions
  const mentionResults = scanForBrandMentions(allText);
  const brandMentions: BrandMention[] = mentionResults.map(r => ({
    brand: r.brand.name,
    category: r.brand.category,
    mentions: r.mentions,
    avgDealRange: r.brand.avgDealRange,
  }));

  // Detect themes
  const themeResults = detectThemes(allText);
  let themes = themeResults.slice(0, 5).map(t => t.theme) as ContentTheme[];
  if (themes.length === 0) {
    themes = ['lifestyle' as ContentTheme];
  }

  // Detect monetization
  const monetizationSignals = detectMonetization(allHtml);

  // Estimate traffic/audience size
  const trafficEstimate = estimateTrafficTier(monetizationSignals, crawled.size, allText.length);
  const rateRange = estimateRateRange(trafficEstimate);

  const sponsorScore = calculateSponsorScore({
    followerCount: trafficEstimate,
    brandMentionCount: brandMentions.length,
    themeCount: themes.length,
    contentVolume: crawled.size * 3,
    platformWeight: 2 + Math.min(3, monetizationSignals.length),
  });

  const recommendations = buildRecommendations(
    'website', themes, brandMentions, trafficEstimate, sponsorScore,
  );

  // Add website-specific insights
  if (monetizationSignals.length > 0) {
    recommendations.unshift(`Monetization detected: ${monetizationSignals.slice(0, 3).join(', ')}. You have existing revenue infrastructure.`);
  } else {
    recommendations.unshift('No monetization signals found. Consider adding affiliate links, ad networks, or a sponsorship page to your site.');
  }

  recommendations.push(`Crawled ${crawled.size} page(s) from ${new URL(url).hostname}. More content means more data points for brand matching.`);

  return formatResult({
    platform: 'website',
    url,
    channelName,
    followerCount: trafficEstimate,
    brandMentions,
    themes,
    sponsorScore,
    rateRange,
    recommendations: recommendations.slice(0, 5),
  });
}

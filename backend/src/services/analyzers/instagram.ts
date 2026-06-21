import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

/**
 * Extract Instagram handle from URL
 * Handles: instagram.com/handle, instagram.com/p/POST_ID, instagram.com/reel/REEL_ID
 */
function extractHandle(url: string): string {
  const u = new URL(url);
  const segments = u.pathname.split('/').filter(Boolean);
  const nonUserPaths = ['p', 'reel', 'reels', 'explore', 'direct', 'accounts', 'stories', 'tv', 'about'];

  if (segments.length > 0 && !nonUserPaths.includes(segments[0].toLowerCase())) {
    return segments[0].replace(/^@/, '');
  }

  // For post/reel URLs, try to get the author handle from the page
  return '';
}

/**
 * Fetch Instagram public profile data
 * Instagram is heavily restricted, so we scrape what we can from the public page
 */
async function fetchInstagramProfile(handle: string): Promise<{
  displayName: string;
  bio: string;
  followers: number | null;
  following: number | null;
  postCount: number | null;
  isVerified: boolean;
  externalUrl: string | null;
} | null> {
  try {
    const resp = await fetch(`https://www.instagram.com/${handle}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    // Extract from meta description (Instagram always includes this)
    // Format: "X Followers, Y Following, Z Posts - See Instagram photos and videos from Name (@handle)"
    const metaMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/);
    const metaContent = metaMatch ? metaMatch[1] : '';

    let followers: number | null = null;
    let following: number | null = null;
    let postCount: number | null = null;
    let displayName = handle;

    // Parse meta description
    const statsMatch = metaContent.match(/([\d,.]+[KMB]?)\s*Follower/i);
    if (statsMatch) followers = parseHumanNumber(statsMatch[1]);

    const followingMatch = metaContent.match(/([\d,.]+[KMB]?)\s*Following/i);
    if (followingMatch) following = parseHumanNumber(followingMatch[1]);

    const postMatch = metaContent.match(/([\d,.]+[KMB]?)\s*Post/i);
    if (postMatch) postCount = parseHumanNumber(postMatch[1]);

    const nameMatch = metaContent.match(/from\s+(.+?)\s*\(@/);
    if (nameMatch) displayName = nameMatch[1].trim();

    // Try to get bio from page content
    const bioMatch = html.match(/"biography"\s*:\s*"([^"]*)"/) ?? html.match(/<meta\s+property="og:description"\s+content="[^"]*-\s*([^"]+)"/);
    const bio = bioMatch ? bioMatch[1].replace(/\\n/g, ' ').replace(/\\/g, '') : metaContent;

    // External URL
    const urlMatch = html.match(/"external_url"\s*:\s*"([^"]+)"/);
    const externalUrl = urlMatch ? urlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '') : null;

    // Verified status
    const isVerified = html.includes('"is_verified":true') || html.includes('VerifiedBadge');

    return { displayName, bio, followers, following, postCount, isVerified, externalUrl };
  } catch {
    return null;
  }
}

function parseHumanNumber(str: string): number {
  const cleaned = str.replace(/,/g, '').trim();
  const numMatch = cleaned.match(/([\d.]+)\s*([KMBkmb])?/);
  if (!numMatch) return 0;
  let num = parseFloat(numMatch[1]);
  const suffix = (numMatch[2] ?? '').toUpperCase();
  if (suffix === 'K') num *= 1000;
  if (suffix === 'M') num *= 1000000;
  if (suffix === 'B') num *= 1000000000;
  return Math.round(num);
}

/**
 * Detect Instagram-specific sponsored content patterns
 */
function detectSponsoredPatterns(text: string): string[] {
  const patterns: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('#ad')) patterns.push('#ad tags');
  if (lower.includes('#sponsored')) patterns.push('#sponsored tags');
  if (lower.includes('#gifted') || lower.includes('#pr')) patterns.push('Gifted/PR content');
  if (lower.includes('#ambassador') || lower.includes('#brandambassador')) patterns.push('Brand ambassador status');
  if (lower.includes('#collab') || lower.includes('#collaboration')) patterns.push('Brand collaborations');
  if (lower.includes('use code') || lower.includes('promo code') || lower.includes('link in bio')) patterns.push('Promo/affiliate mentions');
  if (lower.includes('paid partnership') || lower.includes('branded content')) patterns.push('Paid partnership tags');

  return patterns;
}

/**
 * Main Instagram analyzer
 */
export async function analyzeInstagram(url: string): Promise<AnalysisResult> {
  const handle = extractHandle(url);
  if (!handle) {
    return formatResult({
      platform: 'instagram',
      url,
      channelName: 'Unknown',
      followerCount: null,
      brandMentions: [],
      themes: ['lifestyle'] as ContentTheme[],
      sponsorScore: 25,
      rateRange: estimateRateRange(0),
      recommendations: ['Could not extract an Instagram handle. Please provide a link like instagram.com/handle.'],
    });
  }

  const profile = await fetchInstagramProfile(handle);
  const channelName = profile?.displayName ?? handle;
  const followerCount = profile?.followers ?? null;

  // Combine available text
  let allText = channelName + ' ' + handle + ' ' + (profile?.bio ?? '');

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

  // Instagram defaults lean toward lifestyle/visual
  if (themes.length === 0) {
    themes = ['lifestyle' as ContentTheme, 'fashion' as ContentTheme];
  }
  if (!themes.includes('lifestyle') && themes.length < 5) {
    themes.push('lifestyle' as ContentTheme);
  }

  // Detect sponsored patterns
  const sponsoredPatterns = detectSponsoredPatterns(allText);

  // Instagram rates tend to be higher per follower than most platforms
  const rateRange = estimateRateRange(followerCount ?? 0);
  // Boost rate slightly for Instagram's premium positioning
  rateRange.min = Math.round(rateRange.min * 1.2);
  rateRange.max = Math.round(rateRange.max * 1.3);

  const verifiedBonus = profile?.isVerified ? 3 : 0;
  const sponsorPatternBonus = Math.min(3, sponsoredPatterns.length);

  const sponsorScore = calculateSponsorScore({
    followerCount,
    brandMentionCount: brandMentions.length,
    themeCount: themes.length,
    contentVolume: profile?.postCount ? Math.min(30, profile.postCount) : 5,
    platformWeight: 4 + verifiedBonus + sponsorPatternBonus,
  });

  const recommendations = buildRecommendations(
    'instagram', themes, brandMentions, followerCount, sponsorScore,
  );

  // Instagram-specific insights
  if (profile?.isVerified) {
    recommendations.unshift('Verified account -- significantly increases brand trust and sponsorship value.');
  }

  if (sponsoredPatterns.length > 0) {
    recommendations.push(`Existing sponsor signals: ${sponsoredPatterns.join(', ')}. You are already sponsor-ready.`);
  }

  if (profile?.externalUrl) {
    recommendations.push('External URL in bio is set up -- make sure it leads to a professional landing page or media kit.');
  } else {
    recommendations.push('Add a link-in-bio tool (Linktree, Beacons) to your profile to showcase your media kit and sponsor information.');
  }

  if (profile?.postCount !== null && profile?.postCount !== undefined) {
    if (profile.postCount < 30) {
      recommendations.push('Increase your post count -- brands prefer accounts with consistent posting history (3+ posts per week).');
    }
  }

  return formatResult({
    platform: 'instagram',
    url,
    channelName: `@${handle}`,
    followerCount,
    brandMentions,
    themes,
    sponsorScore,
    rateRange,
    recommendations: recommendations.slice(0, 5),
  });
}

import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

/**
 * Extract Twitter/X handle from URL
 * Handles: twitter.com/handle, x.com/handle, twitter.com/handle/status/123
 */
function extractHandle(url: string): string {
  const u = new URL(url);
  const segments = u.pathname.split('/').filter(Boolean);
  const nonUserPaths = ['home', 'explore', 'search', 'settings', 'notifications', 'messages', 'i', 'compose', 'hashtag'];

  if (segments.length > 0 && !nonUserPaths.includes(segments[0].toLowerCase())) {
    return segments[0].replace(/^@/, '');
  }
  return '';
}

/**
 * Fetch public Twitter/X profile by scraping the page
 */
async function fetchTwitterProfile(handle: string): Promise<{
  displayName: string;
  bio: string;
  followers: number | null;
  following: number | null;
  tweetCount: number | null;
  verified: boolean;
  headerText: string;
} | null> {
  try {
    // Try nitter or direct fetch for public profiles
    const resp = await fetch(`https://x.com/${handle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    // Extract display name from title or meta
    const titleMatch = html.match(/<title[^>]*>([^(<]+)/);
    const displayName = titleMatch ? titleMatch[1].replace(/\s*\(@.*$/, '').trim() : handle;

    // Extract description from meta tags
    const descMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/);
    const bio = descMatch ? descMatch[1] : '';

    // Extract follower count from meta/page content
    let followers: number | null = null;
    const followerMatch = html.match(/(\d[\d,.]*[KMBkmb]?)\s*(?:Follower|follower)/);
    if (followerMatch) {
      followers = parseHumanNumber(followerMatch[1]);
    }

    // Try from structured data / JSON in page
    const jsonLdMatch = html.match(/"followers_count"\s*:\s*(\d+)/);
    if (jsonLdMatch && !followers) {
      followers = parseInt(jsonLdMatch[1], 10);
    }

    // Following count
    let following: number | null = null;
    const followingMatch = html.match(/(\d[\d,.]*[KMBkmb]?)\s*Following/);
    if (followingMatch) {
      following = parseHumanNumber(followingMatch[1]);
    }

    return {
      displayName,
      bio,
      followers,
      following,
      tweetCount: null,
      verified: html.includes('verified') || html.includes('VerifiedBadge'),
      headerText: bio,
    };
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
 * Detect hashtag patterns that suggest sponsored content
 */
function detectSponsoredPatterns(text: string): string[] {
  const patterns: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('#ad') || lower.includes('#sponsored')) patterns.push('#ad/#sponsored tags detected');
  if (lower.includes('#partner') || lower.includes('#ambassador')) patterns.push('Brand partnership tags detected');
  if (lower.includes('use code') || lower.includes('promo code') || lower.includes('discount code')) patterns.push('Promo code mentions detected');
  if (lower.includes('affiliate') || lower.includes('commission')) patterns.push('Affiliate marketing detected');
  if (lower.includes('gifted') || lower.includes('pr package')) patterns.push('PR/gifted product mentions detected');

  return patterns;
}

/**
 * Main Twitter/X analyzer
 */
export async function analyzeTwitter(url: string): Promise<AnalysisResult> {
  const handle = extractHandle(url);
  if (!handle) {
    return formatResult({
      platform: 'twitter',
      url,
      channelName: 'Unknown',
      followerCount: null,
      brandMentions: [],
      themes: ['entertainment'] as ContentTheme[],
      sponsorScore: 25,
      rateRange: estimateRateRange(0),
      recommendations: ['Could not extract a Twitter/X handle. Please provide a link like twitter.com/handle or x.com/handle.'],
    });
  }

  const profile = await fetchTwitterProfile(handle);
  const channelName = profile?.displayName ?? handle;
  const followerCount = profile?.followers ?? null;

  // Combine available text for analysis
  let allText = channelName + ' ' + (profile?.bio ?? '') + ' ' + handle;

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
    themes = ['lifestyle' as ContentTheme, 'entertainment' as ContentTheme];
  }

  // Detect sponsored patterns
  const sponsoredPatterns = detectSponsoredPatterns(allText);

  const rateRange = estimateRateRange(followerCount ?? 0);

  // Twitter verification and sponsorship patterns give bonus points
  const verifiedBonus = profile?.verified ? 3 : 0;
  const sponsorPatternBonus = Math.min(3, sponsoredPatterns.length);

  const sponsorScore = calculateSponsorScore({
    followerCount,
    brandMentionCount: brandMentions.length,
    themeCount: themes.length,
    contentVolume: 15, // Can't easily count tweets without API
    platformWeight: 3 + verifiedBonus + sponsorPatternBonus,
  });

  const recommendations = buildRecommendations(
    'twitter', themes, brandMentions, followerCount, sponsorScore,
  );

  // Add Twitter-specific insights
  if (profile?.verified) {
    recommendations.unshift('Verified account detected -- this adds credibility and increases brand trust for sponsorships.');
  }

  if (sponsoredPatterns.length > 0) {
    recommendations.push(`Existing sponsor signals found: ${sponsoredPatterns.join('; ')}. This shows sponsor readiness.`);
  }

  if (followerCount !== null && profile && profile.following !== null && profile.following > 0) {
    const ratio = followerCount / profile.following;
    if (ratio > 10) {
      recommendations.push(`Strong follower-to-following ratio (${ratio.toFixed(0)}:1) signals authority -- brands value this metric.`);
    }
  }

  return formatResult({
    platform: 'twitter',
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

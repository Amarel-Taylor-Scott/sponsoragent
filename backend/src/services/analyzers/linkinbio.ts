import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

// Import individual analyzers for routing
import { analyzeYouTube } from './youtube.js';
import { analyzeTwitch } from './twitch.js';
import { analyzeDiscord } from './discord.js';
import { analyzeReddit } from './reddit.js';
import { analyzeTwitter } from './twitter.js';
import { analyzeInstagram } from './instagram.js';
import { analyzeFacebook } from './facebook.js';

/**
 * Detect which platform a URL belongs to
 */
function detectPlatformFromUrl(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('twitch.tv')) return 'twitch';
  if (lower.includes('discord.gg') || lower.includes('discord.com/invite')) return 'discord';
  if (lower.includes('reddit.com/u/') || lower.includes('reddit.com/user/')) return 'reddit';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('kick.com')) return 'kick';
  return null;
}

/**
 * Route a URL to the appropriate platform analyzer
 */
async function analyzeLink(url: string): Promise<AnalysisResult | null> {
  const platform = detectPlatformFromUrl(url);
  try {
    switch (platform) {
      case 'youtube': return await analyzeYouTube(url);
      case 'twitch': return await analyzeTwitch(url);
      case 'discord': return await analyzeDiscord(url);
      case 'reddit': return await analyzeReddit(url);
      case 'twitter': return await analyzeTwitter(url);
      case 'instagram': return await analyzeInstagram(url);
      case 'facebook': return await analyzeFacebook(url);
      default: return null; // Skip unknown platforms to avoid recursion
    }
  } catch {
    return null;
  }
}

/**
 * Extract outbound links from a link-in-bio page
 */
async function fetchLinkInBioPage(url: string): Promise<{
  displayName: string;
  bio: string;
  links: { url: string; title: string }[];
} | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    // Extract display name from title or h1
    const titleMatch = html.match(/<title[^>]*>([^<|]+)/);
    let displayName = titleMatch ? titleMatch[1].trim().replace(/\s*[|@].*$/, '') : '';

    // Try more specific patterns for Linktree/Beacons
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) ?? html.match(/"displayName"\s*:\s*"([^"]+)"/);
    if (nameMatch) displayName = nameMatch[1].trim();

    // Extract bio/description
    const descMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/);
    const bio = descMatch ? descMatch[1] : '';

    // Extract all outbound links
    const links: { url: string; title: string }[] = [];
    const linkRegex = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    const seenUrls = new Set<string>();
    const sourceHost = new URL(url).hostname;

    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const href = match[1];
        const linkHost = new URL(href).hostname;

        // Skip same-domain links and common non-content links
        if (linkHost === sourceHost) continue;
        if (linkHost.includes('linktr.ee') || linkHost.includes('beacons.ai') || linkHost.includes('bio.link')) continue;
        if (seenUrls.has(href)) continue;

        // Extract link title text
        const titleText = match[2].replace(/<[^>]+>/g, '').trim();

        seenUrls.add(href);
        links.push({ url: href, title: titleText || href });
      } catch {
        // Skip malformed URLs
      }
    }

    // Also try to find links in JSON data embedded in the page (Linktree uses this)
    const jsonLinksRegex = /"url"\s*:\s*"(https?:\/\/[^"]+)"/g;
    let jsonMatch;
    while ((jsonMatch = jsonLinksRegex.exec(html)) !== null) {
      const href = jsonMatch[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
      try {
        const linkHost = new URL(href).hostname;
        if (linkHost === sourceHost) continue;
        if (!seenUrls.has(href)) {
          seenUrls.add(href);
          links.push({ url: href, title: href });
        }
      } catch {
        // Skip
      }
    }

    return { displayName, bio, links };
  } catch {
    return null;
  }
}

/**
 * Combine multiple platform analysis results into a unified profile
 */
function combineResults(
  linkInBioUrl: string,
  displayName: string,
  bio: string,
  platformResults: AnalysisResult[],
): AnalysisResult {
  // Aggregate brand mentions across platforms
  const mentionMap = new Map<string, BrandMention>();
  for (const result of platformResults) {
    for (const mention of result.brandMentions) {
      const existing = mentionMap.get(mention.brand);
      if (existing) {
        existing.mentions += mention.mentions;
      } else {
        mentionMap.set(mention.brand, { ...mention });
      }
    }
  }
  const brandMentions = [...mentionMap.values()].sort((a, b) => b.mentions - a.mentions);

  // Aggregate themes (union, ordered by frequency)
  const themeCounts = new Map<ContentTheme, number>();
  for (const result of platformResults) {
    for (let i = 0; i < result.themes.length; i++) {
      const theme = result.themes[i];
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + (5 - i));
    }
  }
  // Also detect themes from the bio text
  const bioThemes = detectThemes(bio + ' ' + displayName);
  for (const bt of bioThemes) {
    themeCounts.set(bt.theme, (themeCounts.get(bt.theme) ?? 0) + bt.score);
  }

  const themes = [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  // Average sponsor score across platforms with bonus for multi-platform presence
  const avgScore = platformResults.length > 0
    ? Math.round(platformResults.reduce((sum, r) => sum + r.sponsorScore, 0) / platformResults.length)
    : 30;
  const multiPlatformBonus = Math.min(15, platformResults.length * 5);
  const sponsorScore = Math.min(100, avgScore + multiPlatformBonus);

  // Take the highest follower count for rate estimation
  const maxFollowers = platformResults.reduce((max, r) => {
    return Math.max(max, r.followerCount ?? 0);
  }, 0);
  const rateRange = estimateRateRange(maxFollowers);

  // Build recommendations
  const recommendations: string[] = [];
  recommendations.push(`Multi-platform presence detected across ${platformResults.length} platform(s) -- this significantly increases sponsor value.`);

  if (platformResults.length >= 3) {
    recommendations.push('Cross-platform packages (bundled sponsorships across your channels) can command 2-3x higher rates.');
  }

  const platforms = platformResults.map(r => r.platform);
  if (!platforms.includes('youtube') && !platforms.includes('twitch')) {
    recommendations.push('Consider adding a YouTube or Twitch presence -- video platforms command the highest sponsorship rates.');
  }

  if (brandMentions.length > 0) {
    recommendations.push(`${brandMentions.length} brand mention(s) detected across your platforms. Formalize top relationships into paid deals.`);
  }

  recommendations.push('Use your link-in-bio page to include a media kit link. Brands checking your profile will find it there first.');

  return formatResult({
    platform: 'linkinbio',
    url: linkInBioUrl,
    channelName: displayName || 'Multi-Platform Creator',
    followerCount: maxFollowers || null,
    brandMentions,
    themes,
    sponsorScore,
    rateRange,
    recommendations: recommendations.slice(0, 5),
  });
}

/**
 * Main Link-in-Bio analyzer (meta-analyzer)
 * Fetches the link-in-bio page, extracts all outbound links,
 * routes each to the matching platform analyzer, and combines results.
 */
export async function analyzeLinkInBio(url: string): Promise<AnalysisResult> {
  const pageData = await fetchLinkInBioPage(url);

  if (!pageData || pageData.links.length === 0) {
    // Fall back to just analyzing the page itself
    const allText = (pageData?.displayName ?? '') + ' ' + (pageData?.bio ?? '');
    const themeResults = detectThemes(allText);
    const themes = themeResults.slice(0, 3).map(t => t.theme) as ContentTheme[];
    const mentionResults = scanForBrandMentions(allText);

    return formatResult({
      platform: 'linkinbio',
      url,
      channelName: pageData?.displayName || new URL(url).pathname.replace(/^\//, ''),
      followerCount: null,
      brandMentions: mentionResults.map(r => ({
        brand: r.brand.name,
        category: r.brand.category,
        mentions: r.mentions,
        avgDealRange: r.brand.avgDealRange,
      })),
      themes: themes.length > 0 ? themes : ['lifestyle' as ContentTheme],
      sponsorScore: 30,
      rateRange: estimateRateRange(0),
      recommendations: [
        'Could not extract platform links from your link-in-bio page. Make sure your social links are visible.',
        'Add direct links to all your social platforms for best analysis results.',
      ],
    });
  }

  // Route each extracted link to the matching platform analyzer
  // Run up to 5 platform analyses in parallel (to avoid hammering)
  const platformLinks = pageData.links.filter(l => detectPlatformFromUrl(l.url) !== null);
  const linksToAnalyze = platformLinks.slice(0, 5);

  const platformResults: AnalysisResult[] = [];

  // Analyze in parallel with a per-request timeout
  const analyses = linksToAnalyze.map(async (link) => {
    try {
      const result = await Promise.race([
        analyzeLink(link.url),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
      ]);
      if (result) platformResults.push(result);
    } catch {
      // Skip failed analyses
    }
  });

  await Promise.allSettled(analyses);

  return combineResults(url, pageData.displayName, pageData.bio, platformResults);
}

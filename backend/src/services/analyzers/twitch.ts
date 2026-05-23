import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

/**
 * Extract Twitch username from URL
 * Handles: twitch.tv/username, twitch.tv/username/videos, etc.
 */
function extractUsername(url: string): string {
  const u = new URL(url);
  const segments = u.pathname.split('/').filter(Boolean);
  // Skip known non-username paths
  const nonUserPaths = ['directory', 'downloads', 'jobs', 'turbo', 'settings', 'subscriptions', 'inventory', 'wallet'];
  if (segments.length > 0 && !nonUserPaths.includes(segments[0].toLowerCase())) {
    return segments[0];
  }
  return '';
}

/**
 * Fetch public Twitch profile page and extract available data
 */
async function fetchTwitchProfile(username: string): Promise<{
  displayName: string;
  bio: string;
  followers: number | null;
  categories: string[];
  panelText: string;
} | null> {
  try {
    const resp = await fetch(`https://www.twitch.tv/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    // Extract display name
    const nameMatch = html.match(/<title>([^-<]+)/);
    const displayName = nameMatch ? nameMatch[1].trim() : username;

    // Extract bio/description from meta or page data
    const bioMatch = html.match(/(?:content="([^"]{10,500})"|"description"\s*:\s*"([^"]{10,500})")/);
    const bio = bioMatch ? (bioMatch[1] ?? bioMatch[2] ?? '') : '';

    // Try to extract follower count
    let followers: number | null = null;
    const followerMatch = html.match(/(\d[\d,.]*[KMBkmb]?)\s*(?:Follower|follower)/);
    if (followerMatch) {
      followers = parseHumanNumber(followerMatch[1]);
    }

    // Extract categories from page content
    const categories: string[] = [];
    const catRegex = /data-a-target="(?:stream-game-link|tw-tag)"[^>]*>([^<]+)/g;
    let catMatch;
    while ((catMatch = catRegex.exec(html)) !== null) {
      categories.push(catMatch[1].trim());
    }

    // Also check for category in structured data
    const gameMatch = html.match(/"game"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/g);
    if (gameMatch) {
      for (const m of gameMatch) {
        const nameInner = m.match(/"name"\s*:\s*"([^"]+)"/);
        if (nameInner) categories.push(nameInner[1]);
      }
    }

    // Extract panel text content
    const panelTexts: string[] = [];
    const panelRegex = /class="[^"]*panel[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    let panelMatch;
    while ((panelMatch = panelRegex.exec(html)) !== null) {
      const text = panelMatch[1].replace(/<[^>]+>/g, ' ').trim();
      if (text.length > 5) panelTexts.push(text);
    }

    return {
      displayName,
      bio,
      followers,
      categories: [...new Set(categories)],
      panelText: panelTexts.join(' '),
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
 * Main Twitch analyzer
 */
export async function analyzeTwitch(url: string): Promise<AnalysisResult> {
  const username = extractUsername(url);
  if (!username) {
    return formatResult({
      platform: 'twitch',
      url,
      channelName: 'Unknown',
      followerCount: null,
      brandMentions: [],
      themes: ['gaming', 'entertainment'] as ContentTheme[],
      sponsorScore: 30,
      rateRange: estimateRateRange(0),
      recommendations: ['Could not parse a Twitch username from this URL. Please provide a direct channel link like twitch.tv/username.'],
    });
  }

  const profile = await fetchTwitchProfile(username);

  const channelName = profile?.displayName ?? username;
  const followerCount = profile?.followers ?? null;

  // Combine all text for analysis
  let allText = channelName + ' ' + (profile?.bio ?? '') + ' ' + (profile?.panelText ?? '');
  if (profile?.categories.length) {
    allText += ' ' + profile.categories.join(' ');
  }

  // Scan for brand mentions in bio and panels
  const mentionResults = scanForBrandMentions(allText);
  const brandMentions: BrandMention[] = mentionResults.map(r => ({
    brand: r.brand.name,
    category: r.brand.category,
    mentions: r.mentions,
    avgDealRange: r.brand.avgDealRange,
  }));

  // Detect themes -- always include gaming for Twitch, plus detected
  const themeResults = detectThemes(allText);
  let themes = themeResults.slice(0, 4).map(t => t.theme) as ContentTheme[];
  if (!themes.includes('gaming')) {
    themes = ['gaming' as ContentTheme, ...themes].slice(0, 5);
  }

  // Add themes from Twitch categories
  const categoryText = (profile?.categories ?? []).join(' ').toLowerCase();
  if (categoryText.includes('just chatting') || categoryText.includes('irl')) {
    if (!themes.includes('entertainment')) themes.push('entertainment' as ContentTheme);
  }
  if (categoryText.includes('music') || categoryText.includes('singing')) {
    if (!themes.includes('music')) themes.push('music' as ContentTheme);
  }
  if (categoryText.includes('art') || categoryText.includes('creative')) {
    if (!themes.includes('diy')) themes.push('diy' as ContentTheme);
  }
  themes = themes.slice(0, 5) as ContentTheme[];

  const rateRange = estimateRateRange(followerCount ?? 0);

  const sponsorScore = calculateSponsorScore({
    followerCount,
    brandMentionCount: brandMentions.length,
    themeCount: themes.length,
    contentVolume: 10, // Twitch is live, so content volume is measured differently
    platformWeight: 4,
  });

  const recommendations = buildRecommendations(
    'twitch', themes, brandMentions, followerCount, sponsorScore,
  );

  return formatResult({
    platform: 'twitch',
    url,
    channelName,
    followerCount,
    brandMentions,
    themes,
    sponsorScore,
    rateRange,
    recommendations,
  });
}

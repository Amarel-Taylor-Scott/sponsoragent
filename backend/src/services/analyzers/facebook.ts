import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

/**
 * Extract Facebook page/profile identifier from URL
 * Handles: facebook.com/pagename, fb.com/pagename, facebook.com/profile.php?id=123
 */
function extractIdentifier(url: string): { type: string; value: string } {
  const u = new URL(url);
  const segments = u.pathname.split('/').filter(Boolean);

  // profile.php?id=
  const profileId = u.searchParams.get('id');
  if (profileId) return { type: 'profile_id', value: profileId };

  // /pages/ prefix
  if (segments[0]?.toLowerCase() === 'pages' && segments.length >= 2) {
    return { type: 'page', value: segments[segments.length - 1] };
  }

  // /groups/ prefix
  if (segments[0]?.toLowerCase() === 'groups' && segments.length >= 2) {
    return { type: 'group', value: segments[1] };
  }

  // Non-page paths to skip
  const nonPagePaths = [
    'watch', 'marketplace', 'gaming', 'events', 'places',
    'help', 'settings', 'notifications', 'messages', 'friends',
    'stories', 'bookmarks', 'fundraisers', 'ads', 'login',
  ];

  if (segments.length > 0 && !nonPagePaths.includes(segments[0].toLowerCase())) {
    return { type: 'page', value: segments[0] };
  }

  return { type: 'unknown', value: '' };
}

/**
 * Fetch Facebook page data by scraping the public page
 */
async function fetchFacebookPage(identifier: { type: string; value: string }): Promise<{
  name: string;
  description: string;
  likes: number | null;
  followers: number | null;
  category: string;
  about: string;
} | null> {
  if (!identifier.value) return null;

  try {
    let pageUrl = '';
    if (identifier.type === 'profile_id') {
      pageUrl = `https://www.facebook.com/profile.php?id=${identifier.value}`;
    } else if (identifier.type === 'group') {
      pageUrl = `https://www.facebook.com/groups/${identifier.value}`;
    } else {
      pageUrl = `https://www.facebook.com/${identifier.value}`;
    }

    const resp = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html',
      },
      redirect: 'follow',
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    // Extract page name from title
    const titleMatch = html.match(/<title[^>]*>([^<|]+)/);
    const name = titleMatch ? titleMatch[1].trim() : identifier.value;

    // Extract description from meta
    const descMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/);
    const description = descMatch ? descMatch[1] : '';

    // Try to find likes/followers from page content
    let likes: number | null = null;
    let followers: number | null = null;

    const likesMatch = html.match(/([\d,.]+[KMB]?)\s*(?:likes?|people like)/i);
    if (likesMatch) likes = parseHumanNumber(likesMatch[1]);

    const followersMatch = html.match(/([\d,.]+[KMB]?)\s*(?:followers?|people follow)/i);
    if (followersMatch) followers = parseHumanNumber(followersMatch[1]);

    // Try group member count
    if (identifier.type === 'group') {
      const memberMatch = html.match(/([\d,.]+[KMB]?)\s*(?:members?|total members)/i);
      if (memberMatch) followers = parseHumanNumber(memberMatch[1]);
    }

    // Page category
    const catMatch = html.match(/"category"\s*:\s*"([^"]+)"/);
    const category = catMatch ? catMatch[1] : '';

    return { name, description, likes, followers, category, about: description };
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
 * Main Facebook analyzer
 */
export async function analyzeFacebook(url: string): Promise<AnalysisResult> {
  const identifier = extractIdentifier(url);
  if (!identifier.value) {
    return formatResult({
      platform: 'facebook',
      url,
      channelName: 'Unknown',
      followerCount: null,
      brandMentions: [],
      themes: ['lifestyle'] as ContentTheme[],
      sponsorScore: 25,
      rateRange: estimateRateRange(0),
      recommendations: ['Could not extract a Facebook page identifier. Please provide a direct page or group URL.'],
    });
  }

  const pageData = await fetchFacebookPage(identifier);
  const channelName = pageData?.name ?? identifier.value;
  const followerCount = pageData?.followers ?? pageData?.likes ?? null;

  // Combine available text
  let allText = channelName + ' ';
  if (pageData?.description) allText += pageData.description + ' ';
  if (pageData?.about) allText += pageData.about + ' ';
  if (pageData?.category) allText += pageData.category + ' ';

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

  // Map Facebook page category to themes
  if (pageData?.category) {
    const cat = pageData.category.toLowerCase();
    if (cat.includes('gaming') && !themes.includes('gaming')) themes.push('gaming' as ContentTheme);
    if (cat.includes('music') && !themes.includes('music')) themes.push('music' as ContentTheme);
    if ((cat.includes('food') || cat.includes('restaurant')) && !themes.includes('cooking')) themes.push('cooking' as ContentTheme);
    if (cat.includes('fitness') && !themes.includes('fitness')) themes.push('fitness' as ContentTheme);
    if (cat.includes('education') && !themes.includes('education')) themes.push('education' as ContentTheme);
    themes = themes.slice(0, 5) as ContentTheme[];
  }

  const rateRange = estimateRateRange(followerCount ?? 0);

  const isGroup = identifier.type === 'group';
  const sponsorScore = calculateSponsorScore({
    followerCount,
    brandMentionCount: brandMentions.length,
    themeCount: themes.length,
    contentVolume: 10,
    platformWeight: isGroup ? 4 : 2, // Groups have higher engagement value
  });

  const recommendations = buildRecommendations(
    'facebook', themes, brandMentions, followerCount, sponsorScore,
  );

  if (isGroup) {
    recommendations.unshift('Facebook Groups have high sponsor value due to direct community engagement. Brands pay premium for group-based promotions.');
  }

  return formatResult({
    platform: 'facebook',
    url,
    channelName,
    followerCount,
    brandMentions,
    themes,
    sponsorScore,
    rateRange,
    recommendations: recommendations.slice(0, 5),
  });
}

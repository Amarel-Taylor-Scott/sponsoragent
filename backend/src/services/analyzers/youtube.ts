import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

/**
 * Extract YouTube channel identifier from URL
 * Handles: /channel/UC..., /c/name, /@handle, /user/name, watch?v=, youtu.be/
 */
function extractChannelInfo(url: string): { type: string; value: string } {
  const u = new URL(url);
  const path = u.pathname;

  // /@handle format
  const handleMatch = path.match(/^\/@([^/]+)/);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };

  // /channel/UC... format
  const channelMatch = path.match(/^\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelMatch) return { type: 'channel_id', value: channelMatch[1] };

  // /c/customname format
  const customMatch = path.match(/^\/c\/([^/]+)/);
  if (customMatch) return { type: 'custom', value: customMatch[1] };

  // /user/username format
  const userMatch = path.match(/^\/user\/([^/]+)/);
  if (userMatch) return { type: 'user', value: userMatch[1] };

  // watch?v= or youtu.be/ (video URL -- we analyze the video context)
  const videoId = u.searchParams.get('v') || (u.hostname === 'youtu.be' ? path.slice(1) : null);
  if (videoId) return { type: 'video', value: videoId };

  // Fallback: treat last path segment as handle
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) return { type: 'handle', value: segments[segments.length - 1] };

  return { type: 'unknown', value: url };
}

/**
 * Attempt to resolve a handle/custom name to a channel ID by fetching the channel page
 */
async function resolveChannelId(info: { type: string; value: string }): Promise<string | null> {
  if (info.type === 'channel_id') return info.value;

  try {
    let pageUrl = '';
    if (info.type === 'handle') {
      pageUrl = `https://www.youtube.com/@${info.value}`;
    } else if (info.type === 'custom') {
      pageUrl = `https://www.youtube.com/c/${info.value}`;
    } else if (info.type === 'user') {
      pageUrl = `https://www.youtube.com/user/${info.value}`;
    } else if (info.type === 'video') {
      pageUrl = `https://www.youtube.com/watch?v=${info.value}`;
    } else {
      return null;
    }

    const resp = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SponsorAgent/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    // Extract channel ID from meta tags or page data
    const cidMatch = html.match(/(?:"channelId"|"externalChannelId"|channel_id=|data-channel-external-id=")(["\s]?)(UC[a-zA-Z0-9_-]{22})/);
    if (cidMatch) return cidMatch[2];

    // Try another pattern
    const browseMatch = html.match(/"browseId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/);
    if (browseMatch) return browseMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch and parse the YouTube RSS feed for a channel
 */
async function fetchChannelFeed(channelId: string): Promise<{
  title: string;
  entries: { title: string; description: string; published: string }[];
} | null> {
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const resp = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SponsorAgent/1.0)' },
    });

    if (!resp.ok) return null;
    const xml = await resp.text();

    // Parse channel title
    const titleMatch = xml.match(/<title>([^<]+)<\/title>/);
    const channelTitle = titleMatch ? titleMatch[1] : 'Unknown Channel';

    // Parse entries
    const entries: { title: string; description: string; published: string }[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null && entries.length < 30) {
      const entry = match[1];
      const entryTitle = entry.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '';

      // Media description
      const desc = entry.match(/<media:description>([^<]*)<\/media:description>/)?.[1]
        ?? entry.match(/<content[^>]*>([^<]*)<\/content>/)?.[1]
        ?? '';

      entries.push({
        title: decodeXmlEntities(entryTitle),
        description: decodeXmlEntities(desc),
        published,
      });
    }

    return { title: decodeXmlEntities(channelTitle), entries };
  } catch {
    return null;
  }
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

/**
 * Extract subscriber count from channel page HTML (best effort)
 */
async function fetchSubscriberEstimate(channelId: string): Promise<number | null> {
  try {
    const resp = await fetch(`https://www.youtube.com/channel/${channelId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SponsorAgent/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // Try to find subscriber count in page metadata
    const subMatch = html.match(/(\d[\d,.]*[KMBkmb]?)\s*subscribers?/i);
    if (subMatch) {
      return parseHumanNumber(subMatch[1]);
    }

    // Try JSON-LD or structured data
    const jsonMatch = html.match(/"subscriberCountText"\s*:\s*\{[^}]*"simpleText"\s*:\s*"([^"]+)"/);
    if (jsonMatch) {
      return parseHumanNumber(jsonMatch[1]);
    }

    return null;
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
 * Main YouTube analyzer
 */
export async function analyzeYouTube(url: string): Promise<AnalysisResult> {
  const info = extractChannelInfo(url);
  let channelId = await resolveChannelId(info);
  let channelName = info.value;
  let feed: Awaited<ReturnType<typeof fetchChannelFeed>> = null;
  let subscriberCount: number | null = null;

  // If we resolved a channel ID, fetch the RSS feed
  if (channelId) {
    feed = await fetchChannelFeed(channelId);
    if (feed) {
      channelName = feed.title;
    }
    subscriberCount = await fetchSubscriberEstimate(channelId);
  }

  // Combine all text for analysis
  let allText = channelName + ' ';
  if (feed) {
    for (const entry of feed.entries) {
      allText += entry.title + ' ' + entry.description + ' ';
    }
  }

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
  const themes = themeResults.slice(0, 5).map(t => t.theme) as ContentTheme[];

  // Calculate rate range
  const rateRange = estimateRateRange(subscriberCount ?? 0);

  // Calculate sponsor score
  const sponsorScore = calculateSponsorScore({
    followerCount: subscriberCount,
    brandMentionCount: brandMentions.length,
    themeCount: themes.length,
    contentVolume: feed ? feed.entries.length : 0,
    platformWeight: 5, // YouTube is highest value platform
  });

  // Build recommendations
  const recommendations = buildRecommendations(
    'youtube', themes, brandMentions, subscriberCount, sponsorScore,
  );

  return formatResult({
    platform: 'youtube',
    url,
    channelName,
    followerCount: subscriberCount,
    brandMentions,
    themes,
    sponsorScore,
    rateRange,
    recommendations,
  });
}

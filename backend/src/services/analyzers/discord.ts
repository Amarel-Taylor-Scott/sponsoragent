import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

/**
 * Extract Discord invite code from URL
 * Handles: discord.gg/CODE, discord.com/invite/CODE
 */
function extractInviteCode(url: string): string {
  const u = new URL(url);

  // discord.gg/CODE
  if (u.hostname === 'discord.gg') {
    return u.pathname.replace(/^\//, '').split('/')[0];
  }

  // discord.com/invite/CODE
  const inviteMatch = u.pathname.match(/^\/invite\/([a-zA-Z0-9-]+)/);
  if (inviteMatch) return inviteMatch[1];

  return '';
}

interface DiscordInviteData {
  guild?: {
    id: string;
    name: string;
    description: string | null;
    features: string[];
    icon: string | null;
  };
  channel?: {
    id: string;
    name: string;
    type: number;
  };
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

/**
 * Fetch Discord invite data from the public API
 */
async function fetchInviteData(code: string): Promise<DiscordInviteData | null> {
  try {
    const resp = await fetch(
      `https://discord.com/api/v10/invites/${code}?with_counts=true&with_expiration=true`,
      {
        headers: {
          'User-Agent': 'SponsorAgent/1.0 (https://sponsoragent.com)',
          Accept: 'application/json',
        },
      },
    );

    if (!resp.ok) return null;
    return await resp.json() as DiscordInviteData;
  } catch {
    return null;
  }
}

/**
 * Infer themes from server name, description, and channel names
 */
function inferThemesFromServer(data: DiscordInviteData): ContentTheme[] {
  const textParts: string[] = [];

  if (data.guild?.name) textParts.push(data.guild.name);
  if (data.guild?.description) textParts.push(data.guild.description);
  if (data.channel?.name) textParts.push(data.channel.name.replace(/-/g, ' '));

  // Guild features can hint at the type of community
  if (data.guild?.features) {
    const features = data.guild.features.join(' ').toLowerCase();
    if (features.includes('community')) textParts.push('community lifestyle');
    if (features.includes('discoverable')) textParts.push('popular community');
    if (features.includes('partnered')) textParts.push('established community');
  }

  const allText = textParts.join(' ');
  const themeResults = detectThemes(allText);

  // Ensure we have at least some themes
  const themes = themeResults.slice(0, 4).map(t => t.theme) as ContentTheme[];
  if (themes.length === 0) {
    themes.push('entertainment' as ContentTheme);
  }

  return themes;
}

/**
 * Discord member count to sponsor rate estimation
 * Discord servers are valued differently -- larger community = higher value
 */
function estimateDiscordRate(memberCount: number): { label: string; min: number; max: number } {
  if (memberCount >= 100000) return { label: 'Mega Server (100K+)', min: 5000, max: 15000 };
  if (memberCount >= 50000)  return { label: 'Large Server (50K-100K)', min: 2000, max: 5000 };
  if (memberCount >= 10000)  return { label: 'Mid Server (10K-50K)', min: 500, max: 2000 };
  if (memberCount >= 1000)   return { label: 'Growing Server (1K-10K)', min: 200, max: 500 };
  return { label: 'Small Server (<1K)', min: 50, max: 200 };
}

/**
 * Main Discord analyzer
 */
export async function analyzeDiscord(url: string): Promise<AnalysisResult> {
  const code = extractInviteCode(url);
  if (!code) {
    return formatResult({
      platform: 'discord',
      url,
      channelName: 'Unknown Server',
      followerCount: null,
      brandMentions: [],
      themes: ['entertainment'] as ContentTheme[],
      sponsorScore: 25,
      rateRange: estimateRateRange(0),
      recommendations: ['Could not extract a Discord invite code. Please provide a link like discord.gg/CODE or discord.com/invite/CODE.'],
    });
  }

  const data = await fetchInviteData(code);

  if (!data || !data.guild) {
    return formatResult({
      platform: 'discord',
      url,
      channelName: 'Unknown Server',
      followerCount: null,
      brandMentions: [],
      themes: ['entertainment'] as ContentTheme[],
      sponsorScore: 30,
      rateRange: estimateRateRange(0),
      recommendations: [
        'Could not fetch server data. The invite may be expired or the server may have restricted API access.',
        'Try providing a permanent invite link.',
      ],
    });
  }

  const serverName = data.guild.name;
  const memberCount = data.approximate_member_count ?? 0;
  const onlineCount = data.approximate_presence_count ?? 0;
  const engagementRatio = memberCount > 0 ? onlineCount / memberCount : 0;

  // Combine all available text for brand/theme scanning
  let allText = serverName + ' ';
  if (data.guild.description) allText += data.guild.description + ' ';
  if (data.channel?.name) allText += data.channel.name.replace(/-/g, ' ') + ' ';

  // Scan for brand mentions
  const mentionResults = scanForBrandMentions(allText);
  const brandMentions: BrandMention[] = mentionResults.map(r => ({
    brand: r.brand.name,
    category: r.brand.category,
    mentions: r.mentions,
    avgDealRange: r.brand.avgDealRange,
  }));

  // Detect themes
  const themes = inferThemesFromServer(data);

  // Rate range based on member count
  const rateRange = estimateDiscordRate(memberCount);

  // Calculate sponsor score
  // Discord engagement ratio matters more than raw count
  const engagementBonus = engagementRatio > 0.1 ? 5 : engagementRatio > 0.05 ? 3 : 0;
  const sponsorScore = calculateSponsorScore({
    followerCount: memberCount,
    brandMentionCount: brandMentions.length,
    themeCount: themes.length,
    contentVolume: Math.min(15, Math.floor(memberCount / 1000)),
    platformWeight: 3 + engagementBonus,
  });

  // Build recommendations
  const recommendations = buildRecommendations(
    'discord', themes, brandMentions, memberCount, sponsorScore,
  );

  // Add Discord-specific engagement insights
  if (engagementRatio > 0) {
    const pct = (engagementRatio * 100).toFixed(1);
    if (engagementRatio > 0.1) {
      recommendations.unshift(`Excellent engagement: ${pct}% of members are online. This is well above average and very attractive to sponsors.`);
    } else if (engagementRatio > 0.05) {
      recommendations.unshift(`Good engagement: ${pct}% of members are online. This shows healthy community activity.`);
    } else {
      recommendations.unshift(`Low engagement: only ${pct}% of members are online. Focus on community activation to improve sponsor value.`);
    }
  }

  return formatResult({
    platform: 'discord',
    url,
    channelName: serverName,
    followerCount: memberCount,
    brandMentions,
    themes,
    sponsorScore,
    rateRange,
    recommendations: recommendations.slice(0, 5),
  });
}

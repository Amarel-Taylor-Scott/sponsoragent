import type { ContentTheme, Brand } from './brands.js';
import { BRAND_DATABASE, BRAND_CATEGORY_TO_THEMES } from './brands.js';

export interface BrandMention {
  brand: string;
  category: string;
  mentions: number;
  avgDealRange: [number, number];
}

export interface AnalysisResult {
  platform: string;
  channelName: string;
  subscriberTier: string;
  followerCount: number | null;
  brandMentions: BrandMention[];
  themes: ContentTheme[];
  sponsorScore: number;
  rateRange: { label: string; min: number; max: number };
  recommendations: string[];
  contentThemes: string[];
  brandMatches: {
    brand: string;
    matchScore: number;
    estimatedDeal: string;
    categories: string[];
    reason: string;
  }[];
  rateTier: string;
  url: string;
}

/**
 * Build standardized recommendations based on analysis results
 */
export function buildRecommendations(
  platform: string,
  themes: ContentTheme[],
  brandMentions: BrandMention[],
  followerCount: number | null,
  sponsorScore: number,
): string[] {
  const recs: string[] = [];

  // Content consistency
  if (themes.length < 3) {
    recs.push('Diversify your content themes to attract a wider range of brand sponsors.');
  } else {
    recs.push(`Strong multi-topic presence across ${themes.slice(0, 3).join(', ')} -- lean into these for maximum brand alignment.`);
  }

  // Brand mention guidance
  if (brandMentions.length > 0) {
    const topBrand = brandMentions[0];
    recs.push(`You frequently mention ${topBrand.brand} -- consider formalizing this into a paid sponsorship relationship.`);
  } else {
    recs.push('No existing brand mentions detected -- this is actually a clean slate for approaching brands without conflicts.');
  }

  // Growth guidance
  if (followerCount !== null) {
    if (followerCount < 10000) {
      recs.push('Focus on growing to 10K followers to unlock mid-tier sponsorship opportunities ($500-$1,500 per post).');
    } else if (followerCount < 50000) {
      recs.push('At your current size, micro-influencer campaigns are your best bet -- reach out to brands in your niche directly.');
    } else if (followerCount < 100000) {
      recs.push('You are in the sweet spot for mid-tier deals -- brands get strong engagement without macro pricing.');
    } else {
      recs.push('With your audience size, prioritize multi-video brand partnerships over one-off spots for higher total value.');
    }
  }

  // Platform-specific
  switch (platform) {
    case 'youtube':
      recs.push('Add dedicated sponsor segments in your videos with clear CTAs -- brands track click-through conversion.');
      break;
    case 'twitch':
      recs.push('Use stream overlays and panels to showcase current sponsors -- brands value persistent visibility.');
      break;
    case 'discord':
      recs.push('Create a dedicated sponsors/partners channel in your server to showcase brand relationships professionally.');
      break;
    case 'reddit':
      recs.push('Build authority in your subreddit niche -- brands value authentic community voices over follower counts on Reddit.');
      break;
    case 'twitter':
      recs.push('Pin your best-performing sponsored tweets and build a media kit highlighting your engagement rate.');
      break;
    case 'instagram':
      recs.push('Use Instagram Stories with swipe-up links for sponsors -- Stories convert better than feed posts for brand deals.');
      break;
    case 'facebook':
      recs.push('Focus on Facebook Group engagement metrics -- brands increasingly value community owners over page follower counts.');
      break;
    default:
      recs.push(`Optimize your ${platform} presence with consistent posting and clear sponsor integration points.`);
  }

  // Score-based
  if (sponsorScore >= 75) {
    recs.push('Your sponsor score is excellent -- you should be proactively pitching to brands, not waiting for inbound.');
  } else if (sponsorScore >= 50) {
    recs.push('Your sponsor score is solid -- focus on engagement rate and content consistency to push into the premium tier.');
  } else {
    recs.push('Build up your sponsor score by posting consistently and growing engagement before heavy brand outreach.');
  }

  return recs.slice(0, 5);
}

/**
 * Calculate a sponsor score (0-100) based on available signals
 */
export function calculateSponsorScore(params: {
  followerCount: number | null;
  brandMentionCount: number;
  themeCount: number;
  contentVolume: number;
  platformWeight: number;
}): number {
  let score = 30; // Base score for having a presence

  // Follower/subscriber tier (up to 25 pts)
  if (params.followerCount !== null) {
    if (params.followerCount >= 500000) score += 25;
    else if (params.followerCount >= 100000) score += 20;
    else if (params.followerCount >= 50000) score += 15;
    else if (params.followerCount >= 10000) score += 10;
    else if (params.followerCount >= 1000) score += 5;
  }

  // Brand mentions show sponsor-readiness (up to 15 pts)
  score += Math.min(15, params.brandMentionCount * 3);

  // Theme diversity (up to 10 pts)
  score += Math.min(10, params.themeCount * 2);

  // Content volume (up to 15 pts)
  score += Math.min(15, Math.floor(params.contentVolume / 2));

  // Platform weight bonus (up to 5 pts)
  score += Math.min(5, params.platformWeight);

  return Math.min(100, Math.max(0, score));
}

/**
 * Format the final analysis result with consistent shape for all analyzers
 */
export function formatResult(params: {
  platform: string;
  url: string;
  channelName: string;
  followerCount: number | null;
  brandMentions: BrandMention[];
  themes: ContentTheme[];
  sponsorScore: number;
  rateRange: { label: string; min: number; max: number };
  recommendations: string[];
}): AnalysisResult {
  const {
    platform, url, channelName, followerCount,
    brandMentions, themes, sponsorScore, rateRange, recommendations,
  } = params;

  // Build brand matches for the frontend
  const matchingBrands = findMatchingBrandsForDisplay(themes, brandMentions, sponsorScore);

  return {
    platform,
    url,
    channelName,
    subscriberTier: rateRange.label,
    followerCount,
    brandMentions,
    themes,
    sponsorScore,
    rateRange,
    recommendations,
    contentThemes: themes.slice(0, 5),
    brandMatches: matchingBrands,
    rateTier: `${rateRange.label} ($${rateRange.min.toLocaleString()} - $${rateRange.max.toLocaleString()}/post)`,
  };
}

function findMatchingBrandsForDisplay(
  themes: ContentTheme[],
  existingMentions: BrandMention[],
  sponsorScore: number,
) {
  const themeSet = new Set(themes);
  const mentionNames = new Set(existingMentions.map(m => m.brand.toLowerCase()));

  const results: any[] = [];

  for (const brand of BRAND_DATABASE) {
    const relatedThemes = BRAND_CATEGORY_TO_THEMES[brand.category] ?? [];
    let relevance = 0;
    const matchReasons: string[] = [];

    for (const t of relatedThemes) {
      if (themeSet.has(t)) {
        relevance += themes.indexOf(t) === 0 ? 4 : 2;
        matchReasons.push(t);
      }
    }

    // Boost brands already mentioned
    if (mentionNames.has(brand.name.toLowerCase())) {
      relevance += 10;
      matchReasons.unshift('already mentioned in content');
    }

    if (relevance > 0) {
      const matchScore = Math.min(95, Math.max(30, sponsorScore + relevance * 2 - 10));
      results.push({
        brand: brand.name,
        matchScore,
        estimatedDeal: `$${brand.avgDealRange[0].toLocaleString()} - $${brand.avgDealRange[1].toLocaleString()}`,
        categories: [brand.category, ...matchReasons.slice(0, 2)],
        reason: `Strong alignment with ${matchReasons.slice(0, 3).join(' & ')} content`,
      });
    }
  }

  return results
    .sort((a: any, b: any) => b.matchScore - a.matchScore)
    .slice(0, 10);
}

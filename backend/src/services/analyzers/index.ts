import type { AnalysisResult } from './types.js';
import { analyzeYouTube } from './youtube.js';
import { analyzeTwitch } from './twitch.js';
import { analyzeDiscord } from './discord.js';
import { analyzeReddit } from './reddit.js';
import { analyzeTwitter } from './twitter.js';
import { analyzeInstagram } from './instagram.js';
import { analyzeFacebook } from './facebook.js';
import { analyzeWebsite } from './website.js';
import { analyzeLinkInBio } from './linkinbio.js';

export type { AnalysisResult } from './types.js';

/**
 * Detect which platform a URL belongs to based on URL patterns
 */
export function detectPlatform(url: string): string {
  const lower = url.toLowerCase();

  // YouTube
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';

  // Twitch
  if (lower.includes('twitch.tv')) return 'twitch';

  // Discord
  if (lower.includes('discord.gg') || lower.includes('discord.com/invite')) return 'discord';

  // Reddit
  if (lower.includes('reddit.com/u/') || lower.includes('reddit.com/user/') || lower.includes('old.reddit.com/u/') || lower.includes('old.reddit.com/user/')) return 'reddit';

  // Twitter / X
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';

  // Facebook
  if (lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.me')) return 'facebook';

  // Instagram
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';

  // Link-in-bio services
  if (
    lower.includes('linktr.ee') ||
    lower.includes('linktree.') ||
    lower.includes('bio.link') ||
    lower.includes('beacons.ai') ||
    lower.includes('lnk.bio') ||
    lower.includes('campsite.bio') ||
    lower.includes('withkoji.com') ||
    lower.includes('carrd.co') ||
    lower.includes('linkin.bio')
  ) return 'linkinbio';

  // Everything else is treated as a generic website
  return 'website';
}

/**
 * Run the appropriate platform analyzer for a given URL
 * This is the main entry point used by the audit route
 */
export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const platform = detectPlatform(url);

  switch (platform) {
    case 'youtube':
      return analyzeYouTube(url);

    case 'twitch':
      return analyzeTwitch(url);

    case 'discord':
      return analyzeDiscord(url);

    case 'reddit':
      return analyzeReddit(url);

    case 'twitter':
      return analyzeTwitter(url);

    case 'instagram':
      return analyzeInstagram(url);

    case 'facebook':
      return analyzeFacebook(url);

    case 'linkinbio':
      return analyzeLinkInBio(url);

    case 'website':
    default:
      return analyzeWebsite(url);
  }
}

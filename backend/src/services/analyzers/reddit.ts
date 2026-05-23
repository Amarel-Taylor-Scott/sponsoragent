import { scanForBrandMentions, detectThemes, estimateRateRange } from './brands.js';
import type { ContentTheme } from './brands.js';
import type { BrandMention, AnalysisResult } from './types.js';
import { calculateSponsorScore, buildRecommendations, formatResult } from './types.js';

/**
 * Extract Reddit username from URL
 * Handles: reddit.com/u/username, reddit.com/user/username
 */
function extractUsername(url: string): string {
  const u = new URL(url);
  const userMatch = u.pathname.match(/^\/(?:u|user)\/([a-zA-Z0-9_-]+)/);
  if (userMatch) return userMatch[1];

  // Also handle old.reddit.com/user/ format
  const segments = u.pathname.split('/').filter(Boolean);
  if (segments.length >= 2 && (segments[0] === 'u' || segments[0] === 'user')) {
    return segments[1];
  }

  return '';
}

interface RedditUserData {
  name: string;
  link_karma: number;
  comment_karma: number;
  subreddit?: {
    display_name_prefixed: string;
    public_description: string;
    subscribers: number;
    title: string;
  };
  created_utc: number;
}

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
}

/**
 * Fetch Reddit user profile via public JSON API
 */
async function fetchRedditProfile(username: string): Promise<RedditUserData | null> {
  try {
    const resp = await fetch(`https://www.reddit.com/user/${username}/about.json`, {
      headers: {
        'User-Agent': 'SponsorAgent/1.0 (by /u/sponsoragent)',
        Accept: 'application/json',
      },
    });
    if (!resp.ok) return null;
    const json = await resp.json() as any;
    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch recent posts by a Reddit user
 */
async function fetchRecentPosts(username: string): Promise<RedditPost[]> {
  try {
    const resp = await fetch(`https://www.reddit.com/user/${username}/submitted.json?limit=30&sort=new`, {
      headers: {
        'User-Agent': 'SponsorAgent/1.0 (by /u/sponsoragent)',
        Accept: 'application/json',
      },
    });
    if (!resp.ok) return [];
    const json = await resp.json() as any;
    const posts: RedditPost[] = (json.data?.children ?? []).map((c: any) => c.data);
    return posts;
  } catch {
    return [];
  }
}

/**
 * Fetch recent comments by a Reddit user
 */
async function fetchRecentComments(username: string): Promise<{ body: string; subreddit: string }[]> {
  try {
    const resp = await fetch(`https://www.reddit.com/user/${username}/comments.json?limit=30&sort=new`, {
      headers: {
        'User-Agent': 'SponsorAgent/1.0 (by /u/sponsoragent)',
        Accept: 'application/json',
      },
    });
    if (!resp.ok) return [];
    const json = await resp.json() as any;
    return (json.data?.children ?? []).map((c: any) => ({
      body: c.data.body ?? '',
      subreddit: c.data.subreddit ?? '',
    }));
  } catch {
    return [];
  }
}

// Map subreddit names to content themes
const SUBREDDIT_THEME_MAP: Record<string, ContentTheme> = {
  gaming: 'gaming', games: 'gaming', pcgaming: 'gaming', ps5: 'gaming', xbox: 'gaming',
  nintendo: 'gaming', steam: 'gaming', valorant: 'gaming', leagueoflegends: 'gaming',
  overwatch: 'gaming', minecraft: 'gaming', fortnite: 'gaming', apexlegends: 'gaming',
  technology: 'tech', programming: 'tech', webdev: 'tech', javascript: 'tech',
  python: 'tech', machinelearning: 'tech', artificial: 'tech', gadgets: 'tech',
  makeupaddiction: 'beauty', skincareaddiction: 'beauty', beauty: 'beauty',
  fitness: 'fitness', bodybuilding: 'fitness', running: 'fitness', yoga: 'fitness',
  crossfit: 'fitness', gym: 'fitness', weightlifting: 'fitness',
  cooking: 'cooking', food: 'cooking', recipes: 'cooking', baking: 'cooking',
  mealprep: 'cooking', foodporn: 'cooking',
  education: 'education', learnprogramming: 'education', todayilearned: 'education',
  askscience: 'science', science: 'science', space: 'science', physics: 'science',
  movies: 'entertainment', television: 'entertainment', netflix: 'entertainment',
  music: 'music', hiphopheads: 'music', indieheads: 'music', listentothis: 'music',
  malefashionadvice: 'fashion', femalefashionadvice: 'fashion', streetwear: 'fashion',
  travel: 'travel', solotravel: 'travel', backpacking: 'travel',
  getmotivated: 'lifestyle', selfimprovement: 'lifestyle', minimalism: 'lifestyle',
  funny: 'comedy', memes: 'comedy', jokes: 'comedy',
  diy: 'diy', woodworking: 'diy', crafts: 'diy', homeimprovement: 'diy',
};

/**
 * Main Reddit analyzer
 */
export async function analyzeReddit(url: string): Promise<AnalysisResult> {
  const username = extractUsername(url);
  if (!username) {
    return formatResult({
      platform: 'reddit',
      url,
      channelName: 'Unknown',
      followerCount: null,
      brandMentions: [],
      themes: ['entertainment'] as ContentTheme[],
      sponsorScore: 25,
      rateRange: estimateRateRange(0),
      recommendations: ['Could not extract a Reddit username. Please provide a link like reddit.com/u/username.'],
    });
  }

  // Fetch profile, posts, and comments in parallel
  const [profile, posts, comments] = await Promise.all([
    fetchRedditProfile(username),
    fetchRecentPosts(username),
    fetchRecentComments(username),
  ]);

  const channelName = profile?.name ?? username;
  const totalKarma = (profile?.link_karma ?? 0) + (profile?.comment_karma ?? 0);
  const profileSubs = profile?.subreddit?.subscribers ?? null;

  // Combine all text for analysis
  let allText = channelName + ' ';
  if (profile?.subreddit?.public_description) {
    allText += profile.subreddit.public_description + ' ';
  }
  if (profile?.subreddit?.title) {
    allText += profile.subreddit.title + ' ';
  }
  for (const post of posts) {
    allText += post.title + ' ' + post.selftext + ' ';
  }
  for (const comment of comments) {
    allText += comment.body + ' ';
  }

  // Scan for brand mentions
  const mentionResults = scanForBrandMentions(allText);
  const brandMentions: BrandMention[] = mentionResults.map(r => ({
    brand: r.brand.name,
    category: r.brand.category,
    mentions: r.mentions,
    avgDealRange: r.brand.avgDealRange,
  }));

  // Detect themes from text + subreddit activity
  const themeResults = detectThemes(allText);
  const themes = themeResults.slice(0, 3).map(t => t.theme) as ContentTheme[];

  // Add themes from subreddit activity
  const subreddits = new Set<string>();
  for (const post of posts) subreddits.add(post.subreddit.toLowerCase());
  for (const comment of comments) subreddits.add(comment.subreddit.toLowerCase());

  for (const sub of subreddits) {
    const mapped = SUBREDDIT_THEME_MAP[sub];
    if (mapped && !themes.includes(mapped)) {
      themes.push(mapped);
      if (themes.length >= 5) break;
    }
  }

  // Reddit follower count is karma-based for sponsorship value
  // Use profile subscribers if available, otherwise estimate from karma
  const followerEstimate = profileSubs ?? Math.min(totalKarma, 100000);

  const rateRange = estimateRateRange(followerEstimate);

  // Calculate sponsor score -- Reddit values authenticity over raw numbers
  const avgPostScore = posts.length > 0
    ? posts.reduce((sum, p) => sum + p.score, 0) / posts.length
    : 0;

  const sponsorScore = calculateSponsorScore({
    followerCount: followerEstimate,
    brandMentionCount: brandMentions.length,
    themeCount: themes.length,
    contentVolume: posts.length + comments.length,
    platformWeight: 3 + (avgPostScore > 100 ? 2 : avgPostScore > 50 ? 1 : 0),
  });

  const recommendations = buildRecommendations(
    'reddit', themes, brandMentions, followerEstimate, sponsorScore,
  );

  // Add Reddit-specific insights
  if (totalKarma > 0) {
    const karmaStr = totalKarma >= 1000 ? `${(totalKarma / 1000).toFixed(1)}K` : String(totalKarma);
    recommendations.unshift(`Total karma: ${karmaStr}. Active across ${subreddits.size} subreddit(s) -- brands value niche authority on Reddit.`);
  }

  return formatResult({
    platform: 'reddit',
    url,
    channelName: `u/${channelName}`,
    followerCount: followerEstimate,
    brandMentions,
    themes: themes.slice(0, 5) as ContentTheme[],
    sponsorScore,
    rateRange,
    recommendations: recommendations.slice(0, 5),
  });
}

// Brand database for sponsor mention scanning across all platform analyzers

export interface Brand {
  name: string;
  aliases: string[];
  category: string;
  avgDealRange: [number, number];
}

export const BRAND_DATABASE: Brand[] = [
  // VPN / Privacy
  { name: 'NordVPN', aliases: ['nord vpn', 'nordvpn.com'], category: 'vpn', avgDealRange: [2000, 5000] },
  { name: 'ExpressVPN', aliases: ['express vpn', 'expressvpn.com'], category: 'vpn', avgDealRange: [2000, 5000] },
  { name: 'Surfshark', aliases: ['surfshark vpn', 'surfshark.com'], category: 'vpn', avgDealRange: [1000, 3000] },
  { name: 'Private Internet Access', aliases: ['pia', 'pia vpn', 'privateinternetaccess'], category: 'vpn', avgDealRange: [800, 2500] },
  { name: 'CyberGhost', aliases: ['cyberghost vpn', 'cyberghostvpn'], category: 'vpn', avgDealRange: [800, 2000] },

  // Gaming Peripherals
  { name: 'Razer', aliases: ['razer.com', 'razer gaming'], category: 'gaming', avgDealRange: [1500, 5000] },
  { name: 'Corsair', aliases: ['corsair.com', 'corsair gaming'], category: 'gaming', avgDealRange: [1500, 5000] },
  { name: 'SteelSeries', aliases: ['steel series', 'steelseries.com'], category: 'gaming', avgDealRange: [1200, 4000] },
  { name: 'HyperX', aliases: ['hyper x', 'hyperx.com', 'hyperx gaming'], category: 'gaming', avgDealRange: [1000, 3500] },
  { name: 'Logitech G', aliases: ['logitech', 'logi', 'logitechg'], category: 'gaming', avgDealRange: [1500, 5000] },
  { name: 'SCUF', aliases: ['scuf gaming', 'scufgaming'], category: 'gaming', avgDealRange: [800, 2500] },
  { name: 'Elgato', aliases: ['elgato.com', 'el gato'], category: 'gaming', avgDealRange: [1000, 3000] },

  // Gaming Energy / Supplements
  { name: 'GFuel', aliases: ['g fuel', 'gfuel.com', 'gamma labs'], category: 'gaming', avgDealRange: [500, 2000] },
  { name: 'GAMER SUPPS', aliases: ['gamersupps', 'gamer supps', 'gg supps'], category: 'gaming', avgDealRange: [400, 1500] },
  { name: 'Sneak Energy', aliases: ['sneak', 'sneakenergy'], category: 'gaming', avgDealRange: [500, 1800] },

  // Gaming / Mobile
  { name: 'Raid Shadow Legends', aliases: ['raid', 'raid shadow', 'raid sl', 'plarium'], category: 'gaming', avgDealRange: [3000, 10000] },
  { name: 'AFK Arena', aliases: ['afk arena', 'afkarena', 'lilith games'], category: 'gaming', avgDealRange: [2000, 6000] },
  { name: 'Rise of Kingdoms', aliases: ['rise of kingdoms', 'rok'], category: 'gaming', avgDealRange: [2000, 6000] },
  { name: 'Genshin Impact', aliases: ['genshin', 'mihoyo', 'hoyoverse'], category: 'gaming', avgDealRange: [3000, 8000] },

  // Tech / Software
  { name: 'Squarespace', aliases: ['squarespace.com', 'square space'], category: 'tech', avgDealRange: [2000, 5000] },
  { name: 'Wix', aliases: ['wix.com'], category: 'tech', avgDealRange: [1500, 4000] },
  { name: 'Notion', aliases: ['notion.so', 'notion app'], category: 'tech', avgDealRange: [1000, 3000] },
  { name: 'Brilliant', aliases: ['brilliant.org'], category: 'tech', avgDealRange: [2000, 5000] },
  { name: 'Dashlane', aliases: ['dashlane.com'], category: 'tech', avgDealRange: [1000, 3000] },
  { name: 'LastPass', aliases: ['lastpass.com', 'last pass'], category: 'tech', avgDealRange: [800, 2500] },
  { name: 'Grammarly', aliases: ['grammarly.com'], category: 'tech', avgDealRange: [1500, 4000] },
  { name: 'Opera GX', aliases: ['opera gx', 'opera browser', 'operagx'], category: 'tech', avgDealRange: [2000, 5000] },
  { name: 'Hostinger', aliases: ['hostinger.com'], category: 'tech', avgDealRange: [1000, 3000] },

  // Audio
  { name: 'Raycon', aliases: ['raycon.com', 'ray con'], category: 'audio', avgDealRange: [800, 2500] },
  { name: 'Bose', aliases: ['bose.com'], category: 'audio', avgDealRange: [2000, 6000] },
  { name: 'JBL', aliases: ['jbl.com'], category: 'audio', avgDealRange: [1500, 4000] },
  { name: 'Skullcandy', aliases: ['skullcandy.com', 'skull candy'], category: 'audio', avgDealRange: [800, 2000] },
  { name: 'Audible', aliases: ['audible.com', 'amazon audible'], category: 'audio', avgDealRange: [1500, 4000] },

  // Education
  { name: 'Skillshare', aliases: ['skillshare.com', 'skill share'], category: 'education', avgDealRange: [1000, 3000] },
  { name: 'CuriosityStream', aliases: ['curiositystream.com', 'curiosity stream'], category: 'education', avgDealRange: [700, 2000] },
  { name: 'Coursera', aliases: ['coursera.org'], category: 'education', avgDealRange: [1500, 4000] },
  { name: 'Masterclass', aliases: ['masterclass.com', 'master class'], category: 'education', avgDealRange: [2000, 5000] },
  { name: 'Blinkist', aliases: ['blinkist.com'], category: 'education', avgDealRange: [800, 2000] },

  // Food / Meal Kits
  { name: 'HelloFresh', aliases: ['hellofresh.com', 'hello fresh'], category: 'food', avgDealRange: [1500, 4000] },
  { name: 'Factor', aliases: ['factor75.com', 'factor meals', 'factor_'], category: 'food', avgDealRange: [1200, 3500] },
  { name: 'DoorDash', aliases: ['doordash.com', 'door dash'], category: 'food', avgDealRange: [2000, 5000] },
  { name: 'Blue Apron', aliases: ['blueapron.com', 'blue apron'], category: 'food', avgDealRange: [1000, 3000] },

  // Health / Wellness
  { name: 'Athletic Greens', aliases: ['ag1', 'athleticgreens.com', 'drinkag1'], category: 'health', avgDealRange: [2500, 7000] },
  { name: 'BetterHelp', aliases: ['betterhelp.com', 'better help'], category: 'health', avgDealRange: [1500, 4000] },
  { name: 'Keeps', aliases: ['keeps.com'], category: 'health', avgDealRange: [1000, 3000] },
  { name: 'Hims', aliases: ['forhims.com', 'hims.com', 'hims and hers'], category: 'health', avgDealRange: [1200, 3500] },
  { name: 'Liquid IV', aliases: ['liquid-iv', 'liquidiv', 'liquid iv'], category: 'health', avgDealRange: [800, 2500] },
  { name: 'Magic Spoon', aliases: ['magicspoon.com', 'magic spoon'], category: 'health', avgDealRange: [700, 2000] },

  // Grooming / Personal Care
  { name: 'Manscaped', aliases: ['manscaped.com'], category: 'grooming', avgDealRange: [1200, 3500] },
  { name: 'Dollar Shave Club', aliases: ['dollarshaveclub.com', 'dollar shave club', 'dsc'], category: 'grooming', avgDealRange: [1000, 3000] },
  { name: 'Dr. Squatch', aliases: ['drsquatch.com', 'dr squatch'], category: 'grooming', avgDealRange: [800, 2500] },
  { name: 'Harry\'s', aliases: ['harrys.com', 'harry\'s razors'], category: 'grooming', avgDealRange: [800, 2500] },

  // Fashion / Accessories
  { name: 'Ridge Wallet', aliases: ['ridgewallet.com', 'ridge wallet'], category: 'fashion', avgDealRange: [800, 2500] },
  { name: 'MVMT', aliases: ['mvmt.com', 'mvmt watches', 'movement watches'], category: 'fashion', avgDealRange: [800, 2500] },
  { name: 'Shein', aliases: ['shein.com', 'she in'], category: 'fashion', avgDealRange: [500, 2000] },
  { name: 'Fashion Nova', aliases: ['fashionnova.com', 'fashion nova'], category: 'fashion', avgDealRange: [500, 3000] },
  { name: 'ASOS', aliases: ['asos.com'], category: 'fashion', avgDealRange: [800, 3000] },

  // Finance / Shopping
  { name: 'Honey', aliases: ['joinhoney.com', 'paypal honey'], category: 'finance', avgDealRange: [1500, 4000] },
  { name: 'SeatGeek', aliases: ['seatgeek.com', 'seat geek'], category: 'finance', avgDealRange: [1500, 4000] },
  { name: 'Cash App', aliases: ['cashapp', 'cash app'], category: 'finance', avgDealRange: [2000, 6000] },
  { name: 'Coinbase', aliases: ['coinbase.com'], category: 'finance', avgDealRange: [3000, 8000] },
  { name: 'Acorns', aliases: ['acorns.com'], category: 'finance', avgDealRange: [1000, 3000] },
  { name: 'Robinhood', aliases: ['robinhood.com'], category: 'finance', avgDealRange: [2000, 5000] },

  // Mattress / Home
  { name: 'Helix Sleep', aliases: ['helixsleep.com', 'helix mattress'], category: 'home', avgDealRange: [1500, 4000] },
  { name: 'Purple', aliases: ['purple.com', 'purple mattress'], category: 'home', avgDealRange: [1500, 4000] },
  { name: 'Casper', aliases: ['casper.com', 'casper mattress'], category: 'home', avgDealRange: [1200, 3500] },

  // Fitness
  { name: 'Gymshark', aliases: ['gymshark.com', 'gym shark'], category: 'fitness', avgDealRange: [1000, 4000] },
  { name: 'MyProtein', aliases: ['myprotein.com', 'my protein'], category: 'fitness', avgDealRange: [800, 2500] },
  { name: 'Onnit', aliases: ['onnit.com'], category: 'fitness', avgDealRange: [1000, 3000] },
  { name: 'Peloton', aliases: ['peloton.com', 'onepeloton'], category: 'fitness', avgDealRange: [2000, 6000] },

  // Beauty / Skincare
  { name: 'Glossier', aliases: ['glossier.com'], category: 'beauty', avgDealRange: [800, 3000] },
  { name: 'Fenty Beauty', aliases: ['fentybeauty.com', 'fenty beauty'], category: 'beauty', avgDealRange: [1500, 5000] },
  { name: 'Sephora', aliases: ['sephora.com'], category: 'beauty', avgDealRange: [1500, 5000] },
  { name: 'CeraVe', aliases: ['cerave.com'], category: 'beauty', avgDealRange: [1000, 3000] },
  { name: 'The Ordinary', aliases: ['theordinary.com', 'the ordinary'], category: 'beauty', avgDealRange: [700, 2000] },
  { name: 'Morphe', aliases: ['morphe.com'], category: 'beauty', avgDealRange: [800, 2500] },
  { name: 'Olay', aliases: ['olay.com'], category: 'beauty', avgDealRange: [1500, 4000] },

  // Print / Merch
  { name: 'Printful', aliases: ['printful.com'], category: 'merch', avgDealRange: [500, 1500] },
  { name: 'Spring', aliases: ['spri.ng', 'teespring', 'spring.com'], category: 'merch', avgDealRange: [400, 1200] },

  // VoIP / Communication
  { name: 'Discord Nitro', aliases: ['discord nitro'], category: 'tech', avgDealRange: [500, 2000] },

  // Music / Streaming
  { name: 'Spotify', aliases: ['spotify.com'], category: 'music', avgDealRange: [2000, 6000] },
  { name: 'Epidemic Sound', aliases: ['epidemicsound.com', 'epidemic sound'], category: 'music', avgDealRange: [800, 2500] },
  { name: 'Artlist', aliases: ['artlist.io'], category: 'music', avgDealRange: [700, 2000] },

  // Hosting / Cloud
  { name: 'DigitalOcean', aliases: ['digitalocean.com', 'digital ocean'], category: 'tech', avgDealRange: [1000, 3000] },
  { name: 'Linode', aliases: ['linode.com', 'akamai linode'], category: 'tech', avgDealRange: [800, 2500] },

  // Mobile / Carriers
  { name: 'Mint Mobile', aliases: ['mintmobile.com', 'mint mobile'], category: 'tech', avgDealRange: [2000, 6000] },
  { name: 'Visible', aliases: ['visible.com', 'visible wireless'], category: 'tech', avgDealRange: [1500, 4000] },

  // Auto
  { name: 'Carvana', aliases: ['carvana.com'], category: 'auto', avgDealRange: [3000, 8000] },

  // Pet
  { name: 'BarkBox', aliases: ['barkbox.com', 'bark box', 'bark.co'], category: 'pet', avgDealRange: [800, 2500] },

  // Productivity
  { name: 'Monday.com', aliases: ['monday.com'], category: 'tech', avgDealRange: [1500, 4000] },
  { name: 'Airtable', aliases: ['airtable.com'], category: 'tech', avgDealRange: [1200, 3500] },

  // Travel
  { name: 'Away', aliases: ['awaytravel.com', 'away luggage'], category: 'travel', avgDealRange: [1000, 3000] },
  { name: 'Airbnb', aliases: ['airbnb.com'], category: 'travel', avgDealRange: [2000, 6000] },

  // Supplements
  { name: 'Organifi', aliases: ['organifi.com'], category: 'health', avgDealRange: [1000, 3000] },
  { name: 'Four Sigmatic', aliases: ['foursigmatic.com', 'four sigmatic'], category: 'health', avgDealRange: [700, 2000] },

  // DIY / Tools
  { name: 'Home Depot', aliases: ['homedepot.com', 'home depot'], category: 'diy', avgDealRange: [2000, 6000] },
  { name: 'Cricut', aliases: ['cricut.com'], category: 'diy', avgDealRange: [1000, 3000] },
];

// Theme definitions for content classification
export const CONTENT_THEMES = [
  'gaming', 'tech', 'beauty', 'fitness', 'cooking', 'education',
  'entertainment', 'music', 'fashion', 'travel', 'lifestyle',
  'comedy', 'science', 'diy',
] as const;

export type ContentTheme = typeof CONTENT_THEMES[number];

// Keywords mapped to themes for content classification
export const THEME_KEYWORDS: Record<ContentTheme, string[]> = {
  gaming: ['game', 'gaming', 'gamer', 'gameplay', 'playthrough', 'walkthrough', 'fps', 'rpg', 'mmorpg', 'esports', 'e-sports', 'twitch', 'stream', 'speedrun', 'lets play', 'let\'s play', 'fortnite', 'minecraft', 'valorant', 'league of legends', 'call of duty', 'apex legends', 'overwatch', 'xbox', 'playstation', 'nintendo', 'steam', 'console', 'pc gaming'],
  tech: ['tech', 'technology', 'software', 'hardware', 'programming', 'coding', 'developer', 'computer', 'phone', 'laptop', 'gadget', 'review', 'unboxing', 'cpu', 'gpu', 'ai', 'artificial intelligence', 'machine learning', 'startup', 'app', 'smartphone', 'tablet', 'monitor', 'keyboard', 'mouse'],
  beauty: ['beauty', 'makeup', 'skincare', 'cosmetics', 'tutorial', 'foundation', 'lipstick', 'mascara', 'eyeshadow', 'contour', 'highlight', 'serum', 'moisturizer', 'cleanser', 'routine', 'grwm', 'get ready with me', 'haul', 'swatch', 'concealer', 'palette', 'nail', 'lashes'],
  fitness: ['fitness', 'workout', 'exercise', 'gym', 'training', 'bodybuilding', 'cardio', 'hiit', 'yoga', 'pilates', 'running', 'marathon', 'crossfit', 'strength', 'muscle', 'protein', 'supplement', 'gains', 'bulk', 'cut', 'physique', 'lift', 'squat', 'deadlift', 'bench press'],
  cooking: ['cooking', 'recipe', 'food', 'chef', 'kitchen', 'baking', 'meal', 'dish', 'ingredient', 'cook', 'grill', 'oven', 'fry', 'boil', 'sauce', 'seasoning', 'restaurant', 'foodie', 'cuisine', 'dinner', 'lunch', 'breakfast', 'dessert', 'snack'],
  education: ['education', 'learn', 'teach', 'tutorial', 'course', 'lecture', 'study', 'school', 'university', 'college', 'exam', 'math', 'science', 'history', 'english', 'language', 'lesson', 'class', 'homework', 'academic', 'professor', 'student', 'knowledge', 'explain'],
  entertainment: ['entertainment', 'movie', 'film', 'series', 'tv show', 'netflix', 'react', 'reaction', 'commentary', 'podcast', 'interview', 'celebrity', 'drama', 'thriller', 'animation', 'anime', 'manga', 'cartoon', 'review', 'breakdown', 'analysis', 'ranking', 'tier list'],
  music: ['music', 'song', 'album', 'artist', 'singer', 'rapper', 'band', 'guitar', 'piano', 'drums', 'beat', 'production', 'vocal', 'lyrics', 'melody', 'concert', 'tour', 'performance', 'cover', 'remix', 'dj', 'edm', 'hip hop', 'rock', 'pop', 'jazz', 'classical'],
  fashion: ['fashion', 'style', 'outfit', 'clothing', 'wear', 'dress', 'shoes', 'sneakers', 'accessories', 'jewelry', 'watch', 'bag', 'designer', 'brand', 'trend', 'lookbook', 'ootd', 'wardrobe', 'thrift', 'vintage', 'streetwear', 'haute couture', 'model'],
  travel: ['travel', 'trip', 'vacation', 'destination', 'flight', 'hotel', 'hostel', 'backpack', 'adventure', 'explore', 'country', 'city', 'beach', 'mountain', 'hiking', 'camping', 'road trip', 'vlog', 'tourist', 'passport', 'airport', 'abroad', 'nomad'],
  lifestyle: ['lifestyle', 'daily', 'routine', 'vlog', 'day in my life', 'haul', 'organization', 'productivity', 'motivation', 'self care', 'self-care', 'wellness', 'mindfulness', 'meditation', 'journal', 'planner', 'home decor', 'apartment', 'minimalism', 'aesthetic'],
  comedy: ['comedy', 'funny', 'humor', 'joke', 'skit', 'prank', 'meme', 'parody', 'satire', 'stand up', 'standup', 'laugh', 'hilarious', 'comedian', 'roast', 'cringe', 'fail', 'blooper', 'impression'],
  science: ['science', 'experiment', 'physics', 'chemistry', 'biology', 'space', 'nasa', 'astronomy', 'quantum', 'atom', 'molecule', 'research', 'discovery', 'theory', 'lab', 'data', 'climate', 'environment', 'evolution', 'neuroscience', 'psychology'],
  diy: ['diy', 'do it yourself', 'craft', 'build', 'make', 'project', 'woodworking', 'renovation', 'restore', 'repair', 'custom', 'handmade', 'tools', 'workshop', 'hack', 'upcycle', 'recycle', 'garden', 'plant', 'sewing', '3d print'],
};

// Category to theme mapping for brand matching
export const BRAND_CATEGORY_TO_THEMES: Record<string, ContentTheme[]> = {
  vpn: ['tech', 'gaming', 'lifestyle'],
  gaming: ['gaming', 'tech', 'entertainment'],
  tech: ['tech', 'gaming', 'education', 'science'],
  audio: ['tech', 'music', 'gaming', 'lifestyle'],
  education: ['education', 'tech', 'science', 'lifestyle'],
  food: ['cooking', 'lifestyle', 'fitness'],
  health: ['fitness', 'lifestyle', 'beauty'],
  grooming: ['lifestyle', 'comedy', 'fitness'],
  fashion: ['fashion', 'beauty', 'lifestyle'],
  finance: ['tech', 'lifestyle', 'education'],
  home: ['lifestyle', 'diy'],
  fitness: ['fitness', 'lifestyle'],
  beauty: ['beauty', 'fashion', 'lifestyle'],
  merch: ['entertainment', 'gaming', 'lifestyle'],
  music: ['music', 'entertainment'],
  auto: ['tech', 'lifestyle'],
  pet: ['lifestyle', 'comedy', 'entertainment'],
  travel: ['travel', 'lifestyle'],
  diy: ['diy', 'lifestyle', 'education'],
};

/**
 * Scan text for brand mentions and return matches
 */
export function scanForBrandMentions(text: string): { brand: Brand; mentions: number }[] {
  const lower = text.toLowerCase();
  const results: { brand: Brand; mentions: number }[] = [];

  for (const brand of BRAND_DATABASE) {
    let count = 0;
    // Check brand name
    const namePattern = brand.name.toLowerCase();
    let idx = lower.indexOf(namePattern);
    while (idx !== -1) {
      count++;
      idx = lower.indexOf(namePattern, idx + namePattern.length);
    }
    // Check aliases
    for (const alias of brand.aliases) {
      const aliasLower = alias.toLowerCase();
      idx = lower.indexOf(aliasLower);
      while (idx !== -1) {
        count++;
        idx = lower.indexOf(aliasLower, idx + aliasLower.length);
      }
    }
    if (count > 0) {
      results.push({ brand, mentions: count });
    }
  }

  return results.sort((a, b) => b.mentions - a.mentions);
}

/**
 * Detect content themes from text using keyword matching
 */
export function detectThemes(text: string): { theme: ContentTheme; score: number }[] {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const theme of CONTENT_THEMES) {
    const keywords = THEME_KEYWORDS[theme];
    let score = 0;
    for (const kw of keywords) {
      let idx = lower.indexOf(kw);
      while (idx !== -1) {
        // Weight multi-word keywords higher
        score += kw.includes(' ') ? 3 : 1;
        idx = lower.indexOf(kw, idx + kw.length);
      }
    }
    if (score > 0) {
      scores[theme] = score;
    }
  }

  return Object.entries(scores)
    .map(([theme, score]) => ({ theme: theme as ContentTheme, score }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Given detected themes, find matching brands from the database
 */
export function findMatchingBrands(
  detectedThemes: ContentTheme[],
  existingMentions: string[] = [],
): Brand[] {
  const themeSet = new Set(detectedThemes);
  const mentionSet = new Set(existingMentions.map(m => m.toLowerCase()));

  const scored: { brand: Brand; relevance: number }[] = [];

  for (const brand of BRAND_DATABASE) {
    // Skip brands already mentioned (they are confirmed, not recommendations)
    if (mentionSet.has(brand.name.toLowerCase())) continue;

    const relatedThemes = BRAND_CATEGORY_TO_THEMES[brand.category] ?? [];
    let relevance = 0;
    for (const t of relatedThemes) {
      if (themeSet.has(t)) {
        relevance += detectedThemes.indexOf(t) === 0 ? 3 : 1;
      }
    }
    if (relevance > 0) {
      scored.push({ brand, relevance });
    }
  }

  return scored
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 15)
    .map(s => s.brand);
}

/**
 * Estimate rate range based on subscriber/follower count
 */
export function estimateRateRange(count: number): { label: string; min: number; max: number } {
  if (count >= 500000) return { label: 'Macro Creator (500K+)', min: 8000, max: 25000 };
  if (count >= 100000) return { label: 'Large Creator (100K-500K)', min: 3000, max: 8000 };
  if (count >= 50000)  return { label: 'Mid Creator (50K-100K)', min: 1500, max: 3000 };
  if (count >= 10000)  return { label: 'Rising Creator (10K-50K)', min: 500, max: 1500 };
  return { label: 'Nano Creator (<10K)', min: 200, max: 500 };
}

/**
 * Context Builder
 *
 * Compresses brand hub and campaign data into a reusable context package
 * that will be passed to all downstream agents (Strategy, Shot List, Post Generators).
 *
 * This is NOT an AI agent - just data transformation/compression.
 */

interface BrandHub {
  business_name: string;
  what_you_sell: string;
  what_makes_unique: string;
  target_customer: string;
  brand_vibe_words: string[];
}

interface Campaign {
  name: string;
  what_promoting: string;
  goal?: string;
  sales_channel_type: string;
  platforms: string[];
  start_date: string;
  end_date: string;
  important_date?: string;
  important_date_label?: string;
  num_posts?: number;
}

interface PlatformRules {
  priority_formats: string[];
  cta_format: string;
  best_times: string[];
  character_limits?: {
    caption?: number;
    hook?: number;
  };
}

interface ContextPackage {
  brand_voice_profile: {
    business: string;
    product_category: string;
    unique_value: string;
    target_audience: string;
    tone_markers: string[];
    avoid_words: string[];
    example_phrases: string[];
  };
  campaign_context: {
    what_promoting: string;
    goal?: string;
    target_emotion: string;
    cta_destination: string;
    urgency_moment?: string;
    campaign_duration_days: number;
  };
  platform_rules: {
    [platform: string]: PlatformRules;
  };
}

/**
 * Build context package from brand hub and campaign data
 */
export function buildContext(
  brandHub: BrandHub,
  campaign: Campaign
): ContextPackage {
  // Validate inputs
  if (!brandHub) {
    throw new Error('Brand Hub is required but was not provided');
  }

  if (!brandHub.business_name) {
    throw new Error('Brand Hub is missing required field: business_name');
  }

  // Calculate campaign duration
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Derive tone markers from brand vibe words
  const toneMarkers = brandHub.brand_vibe_words || [];

  // Generate example phrases based on tone
  const examplePhrases = generateExamplePhrases(toneMarkers);

  // Generate avoid words based on tone (corporate words for casual brands, etc.)
  const avoidWords = generateAvoidWords(toneMarkers);

  // Determine target emotion from campaign goal and brand vibe
  const targetEmotion = deriveTargetEmotion(campaign.goal, toneMarkers);

  // Map sales channel to CTA destination
  const ctaDestination = mapSalesChannelToCTA(campaign.sales_channel_type);

  // Format urgency moment
  const urgencyMoment = campaign.important_date
    ? `${campaign.important_date_label || 'Important Date'}: ${campaign.important_date}`
    : undefined;

  // Build platform-specific rules
  const platformRules: { [platform: string]: PlatformRules } = {};

  campaign.platforms.forEach(platform => {
    platformRules[platform.toLowerCase()] = getPlatformRules(platform);
  });

  return {
    brand_voice_profile: {
      business: brandHub.business_name,
      product_category: brandHub.what_you_sell,
      unique_value: brandHub.what_makes_unique,
      target_audience: brandHub.target_customer,
      tone_markers: toneMarkers,
      avoid_words: avoidWords,
      example_phrases: examplePhrases
    },
    campaign_context: {
      what_promoting: campaign.what_promoting,
      goal: campaign.goal,
      target_emotion: targetEmotion,
      cta_destination: ctaDestination,
      urgency_moment: urgencyMoment,
      campaign_duration_days: durationDays
    },
    platform_rules: platformRules
  };
}

/**
 * Generate example phrases based on brand tone
 */
function generateExamplePhrases(toneMarkers: string[]): string[] {
  const casual = ['warm', 'friendly', 'authentic', 'cozy', 'personal'];
  const professional = ['professional', 'elegant', 'sophisticated', 'refined'];
  const energetic = ['bold', 'playful', 'fun', 'vibrant', 'exciting'];

  const isCasual = toneMarkers.some(t => casual.includes(t.toLowerCase()));
  const isProfessional = toneMarkers.some(t => professional.includes(t.toLowerCase()));
  const isEnergetic = toneMarkers.some(t => energetic.includes(t.toLowerCase()));

  const phrases: string[] = [];

  if (isCasual) {
    phrases.push("Hey friends...", "I've been working on...", "Can't wait to share...");
  }

  if (isProfessional) {
    phrases.push("Introducing...", "We're excited to present...", "Discover...");
  }

  if (isEnergetic) {
    phrases.push("OMG you guys...", "This is happening!", "Big news...");
  }

  // Default if no matches
  if (phrases.length === 0) {
    phrases.push("Check this out...", "Here's something new...", "Excited to share...");
  }

  return phrases;
}

/**
 * Generate words to avoid based on brand tone
 */
function generateAvoidWords(toneMarkers: string[]): string[] {
  const casual = ['warm', 'friendly', 'authentic', 'cozy', 'personal'];
  const isCasual = toneMarkers.some(t => casual.includes(t.toLowerCase()));

  if (isCasual) {
    return ['corporate', 'leverage', 'synergy', 'ecosystem', 'disrupt', 'revolutionary'];
  }

  // For professional brands, avoid overly casual language
  return ['totally', 'literally', 'obsessed', 'vibes', 'lowkey'];
}

/**
 * Derive target emotion from campaign goal and tone
 */
function deriveTargetEmotion(goal: string | undefined, toneMarkers: string[]): string {
  if (!goal) {
    return toneMarkers.includes('cozy') || toneMarkers.includes('warm')
      ? 'comfortable anticipation'
      : 'positive excitement';
  }

  const goalLower = goal.toLowerCase();

  if (goalLower.includes('launch') || goalLower.includes('announce')) {
    return 'excited anticipation';
  }
  if (goalLower.includes('sale') || goalLower.includes('discount')) {
    return 'urgency and value';
  }
  if (goalLower.includes('awareness') || goalLower.includes('introduce')) {
    return 'curious interest';
  }
  if (goalLower.includes('engagement') || goalLower.includes('community')) {
    return 'connection and belonging';
  }

  return 'positive excitement';
}

/**
 * Map sales channel to CTA destination
 */
function mapSalesChannelToCTA(salesChannel: string): string {
  const channelMap: { [key: string]: string } = {
    website: 'website',
    etsy: 'Etsy shop',
    amazon: 'Amazon storefront',
    shopify: 'online store',
    instagram_shop: 'Instagram Shop',
    local_market: 'booth/market',
    physical_store: 'store',
    email_list: 'email list',
    other: 'link in bio'
  };

  return channelMap[salesChannel] || 'link in bio';
}

/**
 * Get platform-specific posting rules
 */
function getPlatformRules(platform: string): PlatformRules {
  const platformLower = platform.toLowerCase();

  const rules: { [key: string]: PlatformRules } = {
    instagram: {
      priority_formats: ['reel', 'carousel', 'story'],
      cta_format: 'link in bio',
      best_times: ['7-9am', '12-3pm', '7-9pm'],
      character_limits: {
        caption: 2200,
        hook: 100
      }
    },
    tiktok: {
      priority_formats: ['video'],
      cta_format: 'link in bio or pinned comment',
      best_times: ['12-3pm', '7-10pm'],
      character_limits: {
        caption: 2200,
        hook: 100
      }
    },
    facebook: {
      priority_formats: ['image', 'video', 'carousel'],
      cta_format: 'post link or Page CTA button',
      best_times: ['9-11am', '1-3pm'],
      character_limits: {
        caption: 500
      }
    },
    'google business': {
      priority_formats: ['image', 'short update'],
      cta_format: 'call to action button',
      best_times: ['8-10am', '5-7pm'],
      character_limits: {
        caption: 1500
      }
    }
  };

  return rules[platformLower] || {
    priority_formats: ['image', 'video'],
    cta_format: 'link in bio',
    best_times: ['9am-12pm', '3pm-6pm']
  };
}

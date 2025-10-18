/**
 * Strategy Agent
 *
 * Uses Claude Sonnet 4.5 to plan content distribution strategy:
 * - Weekly phases (awareness, education, conversion)
 * - Posting frequency (surge dates around important moments)
 * - Content themes (variety across campaign)
 * - Shot requirements (what needs to be filmed)
 */

import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.1";

interface ContextPackage {
  brand_voice_profile: any;
  campaign_context: any;
  platform_rules: any;
}

interface Campaign {
  start_date: string;
  end_date: string;
  important_date?: string;
  num_posts?: number;
}

interface StrategyOutput {
  weekly_phases: Array<{
    week: number;
    dates: string;
    phase: string;
    intent: string;
    post_count: number;
    format_mix: { [format: string]: number };
  }>;
  posting_frequency: {
    default: string;
    surge_dates: string[];
  };
  content_themes: Array<{
    theme: string;
    count: number;
  }>;
  shot_requirements: string[];
}

/**
 * Generate content strategy using Claude Sonnet 4.5
 */
export async function generateStrategy(
  context: ContextPackage,
  campaign: Campaign
): Promise<StrategyOutput> {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY")
  });

  // Calculate campaign duration
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);
  const dayCount = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1; // +1 to include end date

  // Calculate target post count
  const targetPosts = campaign.num_posts || Math.floor(dayCount * 0.7); // ~70% of days

  // Build the prompt
  const prompt = buildStrategyPrompt(context, campaign, dayCount, targetPosts);

  try {
    console.log('[strategy-agent] Starting API call to Claude Sonnet 4.5');
    console.log('[strategy-agent] Estimated input tokens:', Math.floor(prompt.length / 4));
    
    const startTime = Date.now();
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      temperature: 1.0,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const duration = Date.now() - startTime;
    
    console.log('[strategy-agent] API call completed:', {
      duration_ms: duration,
      input_tokens: message.usage?.input_tokens,
      output_tokens: message.usage?.output_tokens,
      model: message.model
    });

    // Extract JSON from response
    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Parse JSON (handle potential markdown code blocks)
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                     responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in strategy response");
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const strategy: StrategyOutput = JSON.parse(jsonText);

    console.log('[strategy-agent] Strategy parsed successfully');

    return strategy;

  } catch (error) {
    console.error("[strategy-agent] Error:", error);
    
    // Log rate limit info if available
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      console.error('[strategy-agent] API Error Details:', {
        status: apiError.status,
        type: apiError.error?.type,
        message: apiError.error?.error?.message,
        headers: apiError.headers
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate strategy: ${errorMessage}`);
  }
}

/**
 * Build the strategy prompt
 */
function buildStrategyPrompt(
  context: ContextPackage,
  campaign: Campaign,
  dayCount: number,
  targetPosts: number
): string {
  return `You are a social media strategist with deep algorithm expertise across Instagram, TikTok, Facebook, and Google Business.

BRAND CONTEXT (reference for all decisions):
${JSON.stringify(context.brand_voice_profile, null, 2)}

CAMPAIGN CONTEXT:
${JSON.stringify(context.campaign_context, null, 2)}

PLATFORM CAPABILITIES:
${JSON.stringify(context.platform_rules, null, 2)}

TASK: Plan content distribution for a ${dayCount}-day campaign.

TARGET POST COUNT: Generate between ${targetPosts - 2} and ${targetPosts + 2} posts total.

STRATEGIC RULES:

1. **Content Phases by Week:**
   - Week 1 (Awareness): Tease and build curiosity
     - Formats: Reels for discovery, Stories for BTS
     - Goal: Reach new audiences, create intrigue

   - Week 2 (Education): Show value and process
     - Formats: Carousels for engagement, Reels for how-to
     - Goal: Build desire, demonstrate expertise

   - Week 3 (Conversion): Launch and sell
     - Formats: Mix of all formats, increase frequency
     - Goal: Drive action, create urgency

   - Week 4+ (Momentum): Final push and gift positioning
     - Formats: Testimonials, last chance messaging
     - Goal: Capture fence-sitters, extend reach

2. **Posting Frequency:**
   - Baseline: Don't post every day (feels spammy and unsustainable)
   - Ideal: 1 post every 1-2 days normally
   - Surge: 2 posts per day around ${campaign.important_date ? campaign.important_date : 'launch moment'}
   - Rest days: Leave 1-2 days per week with no posts for audience breathing room

3. **Platform-Specific Best Practices:**
   - Instagram: Prioritize Reels (algorithm favors them), use Carousels for education
   - TikTok: Videos under 30s, leverage trending sounds, educational + entertaining
   - Facebook: Native content (no external links in posts), community-focused
   - Google Business: Product shots + local context, clear CTAs

4. **Content Variety (avoid repetition):**
   - 40% lifestyle/story content (show product in context)
   - 30% product showcase (hero shots, features)
   - 20% education/process (how it's made, tips)
   - 10% direct selling (offers, CTAs, urgency)

5. **Shot Requirements:**
   - List specific types of shots needed for filming day
   - Balance photos vs videos based on format mix
   - Prioritize reusable "hero" shots that work across multiple posts
   - Keep achievable with smartphone (no studio required)

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "weekly_phases": [
    {
      "week": 1,
      "dates": "Nov 1-7",
      "phase": "awareness",
      "intent": "tease collection, build curiosity",
      "post_count": 5,
      "format_mix": {"reel": 3, "image": 2}
    }
  ],
  "posting_frequency": {
    "default": "1 post every 1-2 days",
    "surge_dates": ["2024-11-14", "2024-11-15", "2024-11-16"]
  },
  "content_themes": [
    {"theme": "product beauty shots", "count": 8},
    {"theme": "behind-the-scenes process", "count": 6},
    {"theme": "lifestyle mood", "count": 5}
  ],
  "shot_requirements": [
    "3 hero product shots (different angles)",
    "2 BTS process videos",
    "4 lifestyle flatlay setups"
  ]
}

IMPORTANT:
- Total post_count across all weeks should equal ${targetPosts} (±2)
- Format mix should match platform capabilities
- Surge dates should align with important_date if provided
- Shot requirements should be specific and actionable
- Return ONLY valid JSON, no explanatory text

Begin:`;
}

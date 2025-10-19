/**
 * Post Generator
 *
 * Uses Claude Sonnet 4.5 to generate individual social media posts.
 * Runs in parallel (28x concurrent calls for full campaign).
 *
 * Each post includes:
 * - Post name, hook (if reel/story), caption
 * - Visual concept (which shots to use from shot list)
 * - Platform-specific notes
 * - Content strategy metadata
 */

import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.1";

interface ContextPackage {
  brand_voice_profile: any;
  campaign_context: any;
  platform_rules: any;
}

interface StrategyOutput {
  weekly_phases: any[];
  content_themes: Array<{ theme: string; count: number }>;
}

interface ShotListOutput {
  shots: Array<{
    shot_number: number;
    title: string;
    media_type: string;
    description: string;
  }>;
}

interface PostDetails {
  post_number: number;
  scheduled_date: string;
  post_type: string; // 'image', 'carousel', 'reel', 'story'
  phase: string; // 'awareness', 'education', 'conversion', etc.
  theme: string;
  platforms: string[];
}

interface PostOutput {
  post_number: number;
  post_name: string;
  scheduled_date: string;
  post_type: string;
  platforms: string[];
  hook: string | null;
  caption: string;
  visual_concept: {
    type: string;
    description: string;
    shots: Array<{
      shot_number: number;
      title: string;
      timing?: string;
      sequence_order: number;
    }>;
    props?: string[];
    setting?: string;
    style_notes?: string;
  };
  platform_notes: {
    [platform: string]: {
      format: string;
      cta: string;
      audio?: string;
      hashtags?: string;
      best_time?: string;
    };
  };
  // Content strategy metadata
  purpose: string;
  core_message: string;
  behavioral_trigger: string;
  format: string;
  strategy_type: string;
  tracking_focus: string;
  cta: string;
  status: string;
}

/**
 * Generate a single post using Claude Sonnet 4.5
 */
export async function generatePost(
  context: ContextPackage,
  strategy: StrategyOutput,
  shotList: ShotListOutput,
  postDetails: PostDetails
): Promise<PostOutput> {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY")
  });

  // Build the prompt
  const prompt = buildPostPrompt(context, strategy, shotList, postDetails);

  try {
    console.log(`[post-generator] Starting Post ${postDetails.post_number}:`, {
      type: postDetails.post_type,
      phase: postDetails.phase,
      theme: postDetails.theme,
      date: postDetails.scheduled_date
    });
    
    const startTime = Date.now();
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 1.0,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const duration = Date.now() - startTime;
    
    console.log(`[post-generator] Post ${postDetails.post_number} completed:`, {
      duration_ms: duration,
      input_tokens: message.usage?.input_tokens,
      output_tokens: message.usage?.output_tokens
    });

    // Extract JSON from response
    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Parse JSON (handle potential markdown code blocks)
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                     responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error(`No JSON found in post ${postDetails.post_number} response`);
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const post = JSON.parse(jsonText);

    // Validate and fix behavioral_trigger to match database constraint
    const validTriggers = ['reciprocity', 'FOMO', 'scarcity', 'trust', 'nostalgia', 'belonging', 'curiosity', 'urgency'];
    if (!validTriggers.includes(post.behavioral_trigger)) {
      console.warn(`[post-generator] Invalid behavioral_trigger: "${post.behavioral_trigger}", defaulting to 'curiosity'`);
      post.behavioral_trigger = 'curiosity';
    }

    console.log(`[post-generator] ✓ Post ${postDetails.post_number} parsed successfully`);

    // Ensure required fields are present
    return {
      post_number: postDetails.post_number,
      scheduled_date: postDetails.scheduled_date,
      post_type: postDetails.post_type,
      platforms: postDetails.platforms,
      status: "draft",
      ...post
    };

  } catch (error) {
    console.error(`[post-generator] ✗ Post ${postDetails.post_number} generation error:`, error);
    
    // Log rate limit info if available
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      console.error(`[post-generator] Post ${postDetails.post_number} API Error:`, {
        status: apiError.status,
        type: apiError.error?.type,
        message: apiError.error?.error?.message,
        rate_limit_headers: {
          requests_limit: apiError.headers?.['anthropic-ratelimit-requests-limit'],
          requests_remaining: apiError.headers?.['anthropic-ratelimit-requests-remaining'],
          tokens_limit: apiError.headers?.['anthropic-ratelimit-tokens-limit'],
          tokens_remaining: apiError.headers?.['anthropic-ratelimit-tokens-remaining'],
          input_tokens_limit: apiError.headers?.['anthropic-ratelimit-input-tokens-limit'],
          input_tokens_remaining: apiError.headers?.['anthropic-ratelimit-input-tokens-remaining'],
        }
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate post ${postDetails.post_number}: ${errorMessage}`);
  }
}

/**
 * Build the post generation prompt
 */
function buildPostPrompt(
  context: ContextPackage,
  strategy: StrategyOutput,
  shotList: ShotListOutput,
  postDetails: PostDetails
): string {
  // Find the phase this post belongs to
  const phase = strategy.weekly_phases.find(p => p.phase === postDetails.phase) ||
                strategy.weekly_phases[0];

  // Get platform rules for this post's platforms
  const platformRules = postDetails.platforms.map(
    p => ({ platform: p, rules: context.platform_rules[p.toLowerCase()] })
  );

  return `You are a social media content writer with expertise in ${postDetails.platforms.join(', ')}.

BRAND VOICE (use as reference, don't repeat verbatim):
${JSON.stringify(context.brand_voice_profile, null, 2)}

CAMPAIGN GOAL:
${JSON.stringify(context.campaign_context, null, 2)}

THIS POST:
- Post Number: ${postDetails.post_number}
- Date: ${postDetails.scheduled_date}
- Phase: ${postDetails.phase} (${phase.intent})
- Content Type: ${postDetails.post_type}
- Theme: ${postDetails.theme}
- Platforms: ${postDetails.platforms.join(', ')}

AVAILABLE SHOTS FROM SHOT LIST:
${JSON.stringify(shotList.shots, null, 2)}

PLATFORM RULES:
${JSON.stringify(platformRules, null, 2)}

TASK: Create compelling content for this specific post.

CONTENT REQUIREMENTS:

1. **Post Name:**
   - Short, descriptive title (3-5 words max)
   - Internal reference only, not shown to audience

2. **Hook (${['reel', 'story'].includes(postDetails.post_type) ? 'REQUIRED' : 'NOT NEEDED'}):**
   ${['reel', 'story'].includes(postDetails.post_type)
     ? '- First 3 seconds of video, <100 characters\n   - Attention-grabbing, pattern-interrupt\n   - Use "POV:", "When...", "This is your sign to..." patterns'
     : '- Set to null (not a reel/story format)'}

3. **Caption:**
   - 250-500 characters
   - Write in ${context.brand_voice_profile.tone_markers.join(', ')} tone
   - Sound like a REAL PERSON, not a brand
   - Use 1-2 relevant emojis naturally (not excessive)
   - Include clear CTA to ${context.campaign_context.cta_destination}
   - Avoid words: ${context.brand_voice_profile.avoid_words.join(', ')}
   - Use phrases like: ${context.brand_voice_profile.example_phrases.join(', ')}

4. **Visual Concept:**
   - Assign 1-3 shots from available shot list
   - For videos: specify timing for each shot (e.g., "0-3 sec", "3-5 sec")
   - Include sequence_order for multi-shot posts
   - Add props, setting, style_notes if relevant

5. **Platform Notes:**
   - Specific instructions per platform
   - Format guidance (e.g., "Post as REEL, not regular post")
   - CTA format for each platform
   - Audio suggestions for video content
   - Best posting times

6. **Content Strategy Metadata:**
   - purpose: What this post aims to achieve (awareness/consideration/conversion)
   - core_message: Main takeaway in one sentence (<150 chars)
   - behavioral_trigger: Must be EXACTLY ONE of these: reciprocity, FOMO, scarcity, trust, nostalgia, belonging, curiosity, urgency
   - format: Content format/style (tutorial, testimonial, behind-the-scenes, product showcase)
   - strategy_type: Category (educational, promotional, engagement, testimonial, behind-the-scenes)
   - tracking_focus: Primary KPI (views, saves, shares, comments, clicks, DMs, redemptions)
   - cta: Call-to-action text (<100 chars)

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "post_name": "Making Candles",
  "hook": ${['reel', 'story'].includes(postDetails.post_type) ? '"POV: Making candles at 6am because inspiration hit..."' : 'null'},
  "caption": "Okay friends, real talk...\\n\\nThese new winter scents have been my SECRET project for weeks and I'm SO ready to share them with you.\\n\\nThink: cozy cabin, hot cocoa, Sunday morning vibes.\\n\\nPre-orders open Nov 15 💫\\nLink in bio!",
  "visual_concept": {
    "type": "process video montage",
    "description": "Fast-paced clips showing candle-making process",
    "shots": [
      {
        "shot_number": 2,
        "title": "Pouring Wax Process",
        "timing": "0-3 sec",
        "sequence_order": 1
      },
      {
        "shot_number": 5,
        "title": "Wax Close-up",
        "timing": "3-5 sec",
        "sequence_order": 2
      }
    ],
    "props": ["measuring cup", "wax", "jars"],
    "setting": "kitchen counter with natural light",
    "style_notes": "warm tones, slightly fast-paced editing"
  },
  "platform_notes": {
    "instagram": {
      "format": "Post as REEL (not story, not regular post)",
      "cta": "Add 'Link in bio' at end of caption",
      "audio": "Use trending audio if possible, or original sound with captions",
      "hashtags": "#candlemaking #smallbusiness #handmade",
      "best_time": "7-9am or 7-9pm"
    },
    "tiktok": {
      "format": "Keep video under 30 seconds",
      "cta": "Pin shop link in first comment",
      "audio": "Trending sound preferred",
      "hashtags": "#candletok #smallbiz #behindthescenes",
      "best_time": "12-3pm or 7-10pm"
    }
  },
  "purpose": "Build anticipation and curiosity for upcoming launch",
  "core_message": "New winter candles coming soon, made with care and excitement",
  "behavioral_trigger": "curiosity",
  "format": "Behind-the-scenes process video",
  "strategy_type": "behind-the-scenes",
  "tracking_focus": "saves",
  "cta": "Save this post and check link in bio for launch updates"
}

IMPORTANT:
- Write like a human, not a corporate brand
- Align with ${postDetails.phase} phase intent: ${phase.intent}
- Use shots from provided shot list only
- Caption must include CTA to ${context.campaign_context.cta_destination}
- Hook required ONLY for reels/stories (set to null otherwise)
- tracking_focus should match funnel stage: awareness → views/reach, consideration → saves/shares, conversion → clicks/DMs
- Return ONLY valid JSON, no explanatory text

Begin:`;
}

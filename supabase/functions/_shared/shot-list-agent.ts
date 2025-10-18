/**
 * Shot List Agent
 *
 * Uses Claude Sonnet 4.5 to create a master shot list:
 * - 8-12 reusable shots (photos + videos)
 * - Organized for batch filming in one session
 * - Includes themes, props, locations, DIY tips
 */

import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";

interface ContextPackage {
  brand_voice_profile: any;
  campaign_context: any;
}

interface StrategyOutput {
  weekly_phases: any[];
  content_themes: Array<{ theme: string; count: number }>;
  shot_requirements: string[];
}

interface ShotListOutput {
  themes: Array<{
    name: string;
    mood: string;
    color_palette: string[];
  }>;
  props: Array<{
    item: string;
    where_to_find: string;
    themes: string[];
  }>;
  locations: Array<{
    location: string;
    lighting: string;
    setup_notes: string;
  }>;
  priority: {
    urgent: {
      description: string;
      shots: number[];
    };
    medium: {
      description: string;
      shots: number[];
    };
    flexible: {
      description: string;
      shots: number[];
    };
  };
  batch_sessions: Array<{
    session_name: string;
    duration: string;
    shots: number[];
    prep_needed: string[];
  }>;
  diy_tips: string[];
  shots: Array<{
    shot_number: number;
    title: string;
    media_type: 'photo' | 'video';
    description: string;
    file_format: string;
    reusable: boolean;
    estimated_uses: number;
    checked: boolean;
  }>;
}

/**
 * Generate shot list using Claude Sonnet 4.5
 */
export async function generateShotList(
  context: ContextPackage,
  strategy: StrategyOutput
): Promise<ShotListOutput> {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY")
  });

  // Count how many photos vs videos are needed from format mix
  const formatCounts = calculateFormatNeeds(strategy);

  // Build the prompt
  const prompt = buildShotListPrompt(context, strategy, formatCounts);

  try {
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

    // Extract JSON from response
    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Parse JSON (handle potential markdown code blocks)
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                     responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in shot list response");
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const shotList: ShotListOutput = JSON.parse(jsonText);

    // Ensure all shots have checked: false by default
    shotList.shots = shotList.shots.map(shot => ({
      ...shot,
      checked: shot.checked || false
    }));

    return shotList;

  } catch (error) {
    console.error("Shot list generation error:", error);
    throw new Error(`Failed to generate shot list: ${error.message}`);
  }
}

/**
 * Calculate how many photos vs videos are needed
 */
function calculateFormatNeeds(strategy: StrategyOutput): {
  photos: number;
  videos: number;
  total_posts: number;
} {
  let photos = 0;
  let videos = 0;

  strategy.weekly_phases.forEach(phase => {
    const mix = phase.format_mix || {};

    // Photo formats
    photos += mix.image || 0;
    photos += mix.carousel || 0;

    // Video formats
    videos += mix.reel || 0;
    videos += mix.story || 0;
    videos += mix.video || 0;
  });

  return {
    photos,
    videos,
    total_posts: photos + videos
  };
}

/**
 * Build the shot list prompt
 */
function buildShotListPrompt(
  context: ContextPackage,
  strategy: StrategyOutput,
  formatCounts: { photos: number; videos: number; total_posts: number }
): string {
  return `You are a content production planner specializing in batch content creation for small business owners.

BRAND CONTEXT:
${JSON.stringify(context.brand_voice_profile, null, 2)}

CAMPAIGN GOAL:
${JSON.stringify(context.campaign_context, null, 2)}

CONTENT STRATEGY:
${JSON.stringify({
  themes: strategy.content_themes,
  shot_requirements: strategy.shot_requirements
}, null, 2)}

POST FORMATS NEEDED:
- ${formatCounts.photos} photo-based posts (images, carousels)
- ${formatCounts.videos} video-based posts (reels, stories)
- ${formatCounts.total_posts} total posts

TASK: Create a master shot list that can be filmed in ONE 2-3 hour batch session.

REQUIREMENTS:

1. **Shot Efficiency:**
   - Create 8-12 master shots that are reusable across multiple posts
   - Each "hero" shot should be used 3-5 times across different posts
   - Mix of photos (${Math.ceil(formatCounts.photos / 3)} unique photos) and videos (${Math.ceil(formatCounts.videos / 3)} unique video clips)

2. **Smartphone-Friendly:**
   - All shots must be achievable with a smartphone
   - Natural lighting preferred (no studio setup required)
   - Simple props found around the house or business
   - Clear instructions for DIY execution

3. **Batch-Optimized:**
   - Group shots by location/setup to minimize transitions
   - Suggest prep needed before filming
   - Estimate session duration and groupings

4. **Visual Themes:**
   - Define 2-3 visual themes with mood and color palette
   - Align themes with content strategy (${strategy.content_themes.map(t => t.theme).join(', ')})

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "themes": [
    {
      "name": "Cozy Lifestyle",
      "mood": "Warm, inviting, personal",
      "color_palette": ["warm whites", "soft browns", "amber"]
    }
  ],
  "props": [
    {
      "item": "Cozy blanket",
      "where_to_find": "living room or bedroom",
      "themes": ["Cozy Lifestyle"]
    }
  ],
  "locations": [
    {
      "location": "Kitchen counter by window",
      "lighting": "Natural light from window (shoot 9-11am)",
      "setup_notes": "Clear counter, white surface preferred"
    }
  ],
  "priority": {
    "urgent": {
      "description": "Shots needed for week 1 posts (awareness phase)",
      "shots": [1, 2, 3]
    },
    "medium": {
      "description": "Shots for weeks 2-3 (education and conversion)",
      "shots": [4, 5, 6, 7]
    },
    "flexible": {
      "description": "Shots for week 4+ (can be filmed later if needed)",
      "shots": [8, 9, 10]
    }
  },
  "batch_sessions": [
    {
      "session_name": "Morning Product Shots",
      "duration": "45-60 minutes",
      "shots": [1, 3, 5],
      "prep_needed": ["Clear counter space", "Gather props", "Charge phone"]
    }
  ],
  "diy_tips": [
    "Use a stack of books to elevate your phone for overhead shots",
    "Set a 10-second timer to get yourself in the frame naturally",
    "Film each clip 3-4 times to have options in editing"
  ],
  "shots": [
    {
      "shot_number": 1,
      "title": "Cozy Flat Lay",
      "media_type": "photo",
      "description": "Product with book and blanket on wooden surface. Warm natural light, inviting aesthetic.",
      "file_format": "Shot-1-Cozy-Flat-Lay.jpg",
      "reusable": true,
      "estimated_uses": 4,
      "checked": false
    },
    {
      "shot_number": 2,
      "title": "Process BTS Video",
      "media_type": "video",
      "description": "5-7 second clip of hands working on product. Show authentic process, slight camera movement OK.",
      "file_format": "Shot-2-Process-BTS.mp4",
      "reusable": true,
      "estimated_uses": 5,
      "checked": false
    }
  ]
}

IMPORTANT:
- Create 8-12 total shots
- Mark shots with 3+ estimated uses as "reusable: true"
- File format should be descriptive (Shot-#-Descriptive-Name.jpg/mp4)
- All shots should have "checked: false" by default
- Include at least 5 DIY tips for smartphone filming
- Organize batch sessions to minimize setup changes
- Return ONLY valid JSON, no explanatory text

Begin:`;
}

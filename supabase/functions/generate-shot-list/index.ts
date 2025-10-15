import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentPlanId } = await req.json();

    if (!contentPlanId) {
      throw new Error('Missing required parameter: contentPlanId');
    }

    console.log(`[generate-shot-list] Starting generation for contentPlanId: ${contentPlanId}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch content plan
    const { data: contentPlan, error: planError } = await supabaseClient
      .from('content_plans')
      .select('*')
      .eq('id', contentPlanId)
      .single();

    if (planError || !contentPlan) {
      throw new Error('Content Plan not found');
    }

    // Fetch brand hub
    const { data: brandHub, error: brandError } = await supabaseClient
      .from('brand_hub')
      .select('*')
      .eq('user_id', contentPlan.user_id)
      .single();

    if (brandError || !brandHub) {
      throw new Error('Brand Hub not found');
    }

    // Fetch all posts for this content plan
    const { data: posts, error: postsError } = await supabaseClient
      .from('posts')
      .select('*')
      .eq('content_plan_id', contentPlanId)
      .order('scheduled_date', { ascending: true });

    if (postsError || !posts || posts.length === 0) {
      throw new Error('No posts found for this content plan');
    }

    console.log(`[generate-shot-list] Found ${posts.length} posts to create shot list for`);

    // Build the AI prompt
    const systemPrompt = `You are a creative director and visual content strategist specializing in small business content creation. Your role is to transform abstract content plans into practical, actionable shot lists that busy entrepreneurs can execute themselves.

Key Principles:
- Create visual concepts that are achievable with basic equipment (smartphone, natural lighting)
- Group shots by theme, location, and props to maximize efficiency
- Prioritize shots that can be batch-created in single filming sessions
- Consider the brand's aesthetic and target audience in every visual recommendation
- Make technical instructions clear and accessible for non-photographers
- Balance creativity with practicality

Shot List Best Practices:
- Group similar shots together (same location, same props, same outfit)
- Specify exact props, settings, angles, and lighting recommendations
- Prioritize shots by importance and timeline urgency
- Include backup shot ideas for flexibility
- Consider multi-purpose shots that can work across multiple posts
- Suggest DIY solutions for professional-looking results

Remember: Your audience is a busy business owner who needs to create a month's worth of content in a single afternoon. Make it achievable and efficient.`;

    // Format posts for the prompt
    const postsFormatted = posts.map((post, index) => `
Post #${index + 1}: ${post.post_name}
- Type: ${post.post_type}
- Scheduled: ${post.scheduled_date}
- Platforms: ${post.platforms.join(', ')}
- Visual Concept: ${JSON.stringify(post.visual_concept, null, 2)}
`).join('\n');

    const userPrompt = `Create a comprehensive shot list for ${brandHub.business_name}'s content campaign: ${contentPlan.name}.

BRAND AESTHETIC:
- Brand vibe: ${brandHub.brand_vibe_words.join(', ')}
- Target audience: ${brandHub.target_customer}

POSTS TO COVER:
${postsFormatted}

TASK:
Analyze all ${posts.length} posts and create an efficient, actionable shot list that:
1. Groups similar shots together by theme, location, props, and aesthetic
2. Maximizes batch filming efficiency (shoot multiple posts in one session)
3. Provides specific, practical instructions for non-professional photographers
4. Considers brand aesthetic (${brandHub.brand_vibe_words.join(', ')}) in every visual recommendation
5. Prioritizes shots by urgency and importance

OUTPUT STRUCTURE (return as JSON):

{
  "themes": [
    {
      "name": "Theme name",
      "description": "Aesthetic and mood description",
      "posts": ["Post #1", "Post #3"],
      "mood": "How this supports brand vibe"
    }
  ],
  "props": [
    {
      "theme": "Theme name",
      "items": [
        {
          "item": "Exact prop name",
          "source": "Where to get it (e.g., Amazon, Dollar Store)",
          "quantity": "How many",
          "purpose": "What it's for"
        }
      ]
    }
  ],
  "locations": [
    {
      "location": "Specific location description",
      "themes": ["Themes shot here"],
      "best_time": "Best time of day for lighting",
      "setup": "Setup requirements"
    }
  ],
  "priority": {
    "urgent": {
      "deadline": "Film by date",
      "posts": ["Post #1", "Post #2"],
      "time_needed": "Estimated hours",
      "shots": [
        {
          "post": "Post #1",
          "description": "What to shoot",
          "specific_directions": "Exact angle, framing, composition",
          "props": ["List"],
          "location": "Where"
        }
      ]
    },
    "medium": { ... },
    "flexible": { ... }
  },
  "batch_sessions": [
    {
      "session_name": "Session title",
      "duration": "Hours needed",
      "location": "Where",
      "props": ["List"],
      "shots": ["Detailed shot list"],
      "pro_tip": "Time-saving advice"
    }
  ],
  "diy_tips": [
    "Practical photography tip 1",
    "Practical photography tip 2"
  ]
}

IMPORTANT GUIDELINES:
- Every recommendation must be achievable with a smartphone and natural lighting
- Group shots that use the same props/location together
- Be specific (not "take a photo of the product" but "45-degree angle, soft window light from left, focus on [specific detail]")
- Consider the busy schedule of a small business owner - prioritize efficiency
- Make it foolproof - assume zero photography experience

Return ONLY the JSON object, no additional text.`;

    // Call Anthropic Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 16000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.content[0]?.text;

    if (!generatedContent) {
      throw new Error('No content generated by Claude');
    }

    console.log('[generate-shot-list] Claude response received');

    // Parse the JSON shot list
    let shotList;
    try {
      shotList = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse Claude JSON response:', parseError);
      throw new Error('Failed to parse shot list JSON from Claude');
    }

    // Update content_plans with the generated shot list
    const { error: updateError } = await supabaseClient
      .from('content_plans')
      .update({ shot_list: shotList })
      .eq('id', contentPlanId);

    if (updateError) {
      console.error('Error updating content plan with shot list:', updateError);
      throw updateError;
    }

    console.log(`[generate-shot-list] Successfully generated and saved shot list for contentPlanId: ${contentPlanId}`);

    return new Response(
      JSON.stringify({
        success: true,
        shotList,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-shot-list:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, userFeedback, regenerationType } = await req.json();

    if (!postId || !regenerationType) {
      throw new Error('Missing required parameters: postId and regenerationType');
    }

    console.log(`[regenerate-post] Starting regeneration for postId: ${postId}, type: ${regenerationType}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch post data
    const { data: post, error: postError } = await supabaseClient
      .from('posts')
      .select('*, content_plans!inner(*)')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error('Post not found');
    }

    // Fetch brand hub data
    const { data: brandHub, error: brandError } = await supabaseClient
      .from('brand_hub')
      .select('*')
      .eq('user_id', post.user_id)
      .single();

    if (brandError || !brandHub) {
      throw new Error('Brand Hub not found');
    }

    // Fetch user data to check regeneration limits
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('subscription_tier, ai_regenerations_used_this_period')
      .eq('id', post.user_id)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Build appropriate prompt based on regenerationType
    let systemPrompt = '';
    let userPrompt = '';

    const brandContext = `
BRAND CONTEXT:
- Business: ${brandHub.business_name}
- Brand vibe: ${brandHub.brand_vibe_words.join(', ')}
- Target customer: ${brandHub.target_customer}
- Unique value: ${brandHub.what_makes_unique}

CURRENT POST:
- Name: ${post.post_name}
- Type: ${post.post_type}
- Platforms: ${post.platforms.join(', ')}
- Scheduled for: ${post.scheduled_date}`;

    if (regenerationType === 'caption') {
      systemPrompt = 'You are a content marketing strategist specializing in social media copywriting. Your task is to rewrite captions based on user feedback while maintaining brand voice and post purpose.';
      userPrompt = `${brandContext}

CURRENT CAPTION:
${post.caption}

USER FEEDBACK:
"${userFeedback || 'Make it more engaging and conversational'}"

TASK:
Rewrite the caption incorporating the user's feedback while:
1. Maintaining the post's core purpose (${post.post_type})
2. Keeping the brand voice (${brandHub.brand_vibe_words.join(', ')})
3. Optimizing for the specified platforms (${post.platforms.join(', ')})
4. Addressing the target customer: ${brandHub.target_customer}
5. Highlighting what makes this business unique: ${brandHub.what_makes_unique}

If the feedback is vague (e.g., "make it better"), interpret it as:
- More engaging and conversational
- Clearer call-to-action
- Better storytelling
- More benefit-focused

Return only the new caption text (150-300 words depending on platform).`;
    } else if (regenerationType === 'hook') {
      systemPrompt = 'You are a content marketing strategist specializing in attention-grabbing hooks. Your task is to rewrite hooks based on user feedback.';
      userPrompt = `${brandContext}

CURRENT HOOK:
${post.hook}

CAPTION CONTEXT:
${post.caption}

USER FEEDBACK:
"${userFeedback || 'Make it more attention-grabbing'}"

TASK:
Rewrite the hook (1-2 sentences) incorporating the user's feedback while:
1. Grabbing attention in the first 3 seconds
2. Being platform-appropriate for ${post.platforms.join(', ')}
3. Matching the brand vibe: ${brandHub.brand_vibe_words.join(', ')}
4. Compelling the target customer (${brandHub.target_customer}) to stop scrolling

PLATFORM-SPECIFIC HOOKS:
- Instagram: Visual-first, emoji use encouraged, intrigue-based
- Facebook: Question-based, relatable scenarios, community-focused
- TikTok: Trend-aware, conversational, immediate value promise

Return only the new hook text (1-2 sentences maximum).`;
    } else if (regenerationType === 'visual_concept') {
      systemPrompt = 'You are a creative director specializing in DIY content creation. Your task is to create achievable visual concepts based on user feedback.';
      userPrompt = `${brandContext}

CURRENT VISUAL CONCEPT:
${JSON.stringify(post.visual_concept, null, 2)}

CAPTION CONTEXT:
${post.caption}

USER FEEDBACK:
"${userFeedback || 'Make it more visually interesting'}"

TASK:
Create a new visual concept incorporating the user's feedback while:
1. Remaining achievable with smartphone and basic equipment
2. Matching the brand aesthetic: ${brandHub.brand_vibe_words.join(', ')}
3. Being optimized for ${post.platforms.join(', ')}
4. Supporting the caption's message

Provide a JSON object with:
- type: "photo" or "video"
- description: Detailed shot description (angle, framing, focus point)
- props: Array of specific items needed
- setting: Where to shoot (be specific)
- style_notes: Lighting, mood, editing direction

Keep it practical and DIY-friendly. Small business owners should be able to execute this themselves.`;
    } else if (regenerationType === 'all') {
      systemPrompt = 'You are a content marketing strategist and creative director. Your task is to completely reimagine a post based on user feedback.';
      userPrompt = `${brandContext}

CURRENT POST:
- Hook: ${post.hook}
- Caption: ${post.caption}
- Visual concept: ${JSON.stringify(post.visual_concept, null, 2)}

USER FEEDBACK:
"${userFeedback || 'Reimagine this post entirely'}"

TASK:
Completely reimagine this post incorporating the user's feedback while:
1. Maintaining the post's scheduled date and type
2. Keeping the brand voice (${brandHub.brand_vibe_words.join(', ')})
3. Optimizing for ${post.platforms.join(', ')}
4. Staying true to the business's unique value: ${brandHub.what_makes_unique}
5. Targeting the right audience: ${brandHub.target_customer}

Return a JSON object with:
{
  "hook": "new hook text",
  "caption": "new caption text",
  "visual_concept": {
    "type": "photo or video",
    "description": "detailed shot description",
    "props": ["prop 1", "prop 2"],
    "setting": "location description",
    "style_notes": "lighting and mood notes"
  }
}`;
    } else {
      throw new Error(`Invalid regenerationType: ${regenerationType}`);
    }

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated by OpenAI');
    }

    console.log('[regenerate-post] OpenAI response received');

    // Parse and update post based on regenerationType
    let updateData: any = {};

    if (regenerationType === 'caption') {
      updateData.caption = generatedContent.trim();
    } else if (regenerationType === 'hook') {
      updateData.hook = generatedContent.trim();
    } else if (regenerationType === 'visual_concept') {
      try {
        updateData.visual_concept = JSON.parse(generatedContent);
      } catch {
        throw new Error('Failed to parse visual concept JSON from OpenAI');
      }
    } else if (regenerationType === 'all') {
      try {
        const parsed = JSON.parse(generatedContent);
        updateData = {
          hook: parsed.hook,
          caption: parsed.caption,
          visual_concept: parsed.visual_concept,
        };
      } catch {
        throw new Error('Failed to parse full post JSON from OpenAI');
      }
    }

    // Update post in database
    const { data: updatedPost, error: updateError } = await supabaseClient
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating post:', updateError);
      throw updateError;
    }

    // Increment user's ai_regenerations_used_this_period counter
    const { error: counterError } = await supabaseClient
      .from('users')
      .update({
        ai_regenerations_used_this_period: (user.ai_regenerations_used_this_period || 0) + 1
      })
      .eq('id', post.user_id);

    if (counterError) {
      console.error('Error updating regeneration counter:', counterError);
    }

    // Calculate regenerations remaining
    const tierLimits: Record<string, number | null> = {
      starter: 5,
      pro: 25,
      enterprise: null, // unlimited
    };
    const limit = tierLimits[user.subscription_tier] || 5;
    const used = (user.ai_regenerations_used_this_period || 0) + 1;
    const regenerationsRemaining = limit === null ? null : Math.max(0, limit - used);

    console.log(`[regenerate-post] Successfully regenerated ${regenerationType} for postId: ${postId}`);

    return new Response(
      JSON.stringify({
        success: true,
        updatedPost,
        regenerationsRemaining,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in regenerate-post:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

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
    const { brandHubId, contentPlanId, userMessage } = await req.json();

    if (!brandHubId || !contentPlanId) {
      throw new Error('Missing required parameters: brandHubId and contentPlanId');
    }

    console.log(`[generate-content-plan] Starting generation for contentPlanId: ${contentPlanId}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch brand hub data
    const { data: brandHub, error: brandError } = await supabaseClient
      .from('brand_hub')
      .select('*')
      .eq('id', brandHubId)
      .single();

    if (brandError || !brandHub) {
      throw new Error('Brand Hub not found');
    }

    // Fetch content plan data
    const { data: contentPlan, error: planError } = await supabaseClient
      .from('content_plans')
      .select('*')
      .eq('id', contentPlanId)
      .single();

    if (planError || !contentPlan) {
      throw new Error('Content Plan not found');
    }

    // Fetch user data to determine post limit
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('subscription_tier, posts_created_this_period')
      .eq('id', contentPlan.user_id)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Determine post limit based on subscription tier
    const postLimits: Record<string, number> = {
      starter: 10,
      pro: 50,
      enterprise: 100, // practical limit even for unlimited tier
    };
    const postLimit = postLimits[user.subscription_tier] || 10;

    console.log(`[generate-content-plan] User tier: ${user.subscription_tier}, generating ${postLimit} posts`);

    // Build the AI prompt
    const systemPrompt = `You are a content marketing strategist and copywriter for small business owners. Your role is to create engaging, authentic social media content that drives results while maintaining the brand's unique voice.

Key Principles:
- Write in the brand's voice using their specified vibe words
- Target the specific customer persona provided
- Focus on the unique value proposition that sets this business apart
- Balance promotional content with educational and engagement posts
- Use platform-specific best practices (character limits, hashtag strategies, etc.)
- Create actionable, scroll-stopping hooks that capture attention
- Write captions that tell stories and create emotional connections
- Include clear calls-to-action that drive business goals

Content Quality Standards:
- Every post must have a clear purpose aligned with the campaign goal
- Hooks must be attention-grabbing and platform-appropriate
- Captions should be conversational, not salesy
- Visual concepts should be specific, actionable, and achievable with basic equipment
- Posts should work together as a cohesive content strategy, not random individual pieces

Remember: You're helping a busy business owner who needs content that actually works, not just looks pretty. Prioritize conversion and engagement over perfection.`;

    const userPrompt = `Generate a complete content plan for ${brandHub.business_name}.

BRAND CONTEXT:
- Business: ${brandHub.business_name}
- What they sell: ${brandHub.what_you_sell}
- Brand vibe: ${brandHub.brand_vibe_words.join(', ')}
- Target customer: ${brandHub.target_customer}
- What makes them unique: ${brandHub.what_makes_unique}

CAMPAIGN DETAILS:
- Campaign name: ${contentPlan.name}
- What we're promoting: ${contentPlan.what_promoting}
- Goal: ${contentPlan.goal || 'Drive engagement and sales'}
- Platforms: ${contentPlan.platforms.join(', ')}
- Timeline: ${contentPlan.start_date} to ${contentPlan.end_date}
${contentPlan.important_date ? `- Important date: ${contentPlan.important_date} (${contentPlan.important_date_label})` : ''}
- Sales channel: ${contentPlan.sales_channel_type}

${userMessage ? `USER REFINEMENT REQUEST:\n"${userMessage}"\n` : ''}

TASK:
Create ${postLimit} social media posts that:
1. Build anticipation leading up to ${contentPlan.important_date || 'the campaign goal'}
2. Mix promotional content (40%) with educational (30%) and engagement (30%) posts
3. Maintain the brand voice (${brandHub.brand_vibe_words.join(', ')})
4. Drive the campaign goal: ${contentPlan.goal || 'increase engagement and sales'}
5. Are optimized for each platform in ${contentPlan.platforms.join(', ')}

POST DISTRIBUTION STRATEGY:
- Week 1-2: Awareness & education (tease what's coming)
- Week 3: Build excitement & anticipation
- Week 4: Launch & conversion focus
- After launch: Testimonials, results, last chance messaging

For each post, provide:
1. post_name: Descriptive title (e.g., "Pre-launch Teaser", "Behind the Scenes Day 3")
2. post_type: educational, promotional, engagement, testimonial, or behind-the-scenes
3. platforms: Which platforms this post is optimized for (array)
4. scheduled_date: Specific date within the campaign timeline (YYYY-MM-DD format)
5. hook: 1-2 sentence attention-grabbing opening (varies by platform)
6. caption: Full post copy optimized for each platform (150-300 words)
7. visual_concept: Object with {type: "photo" or "video", description: detailed shot description, props: array of props needed, setting: location, style_notes: lighting and mood}

PLATFORM-SPECIFIC REQUIREMENTS:
- Instagram: Hooks should be visual-first, captions 150-200 words, 3-5 hashtags
- Facebook: Longer storytelling captions (200-300 words), question-based hooks
- TikTok: Video-first concepts, trend-aware, casual tone, 1-2 sentence captions

IMPORTANT:
- Ensure posts flow logically from awareness → consideration → conversion
- Reference the ${contentPlan.important_date ? `important date (${contentPlan.important_date})` : 'campaign goal'} strategically throughout the campaign
- Every post should tie back to: ${brandHub.what_makes_unique}
- Use ${brandHub.brand_vibe_words.join(', ')} to guide tone and style
- Make visual concepts achievable for small business owners (smartphone-friendly)

Return the posts using the tool.`;

    // Call OpenAI with tool calling for structured output
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
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_content_posts',
              description: 'Generate social media posts for a content plan',
              parameters: {
                type: 'object',
                properties: {
                  posts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        post_name: { type: 'string' },
                        post_type: { type: 'string', enum: ['educational', 'promotional', 'engagement', 'testimonial', 'behind-the-scenes'] },
                        platforms: { type: 'array', items: { type: 'string' } },
                        scheduled_date: { type: 'string', format: 'date' },
                        hook: { type: 'string' },
                        caption: { type: 'string' },
                        visual_concept: {
                          type: 'object',
                          properties: {
                            type: { type: 'string', enum: ['photo', 'video'] },
                            description: { type: 'string' },
                            props: { type: 'array', items: { type: 'string' } },
                            setting: { type: 'string' },
                            style_notes: { type: 'string' }
                          },
                          required: ['type', 'description']
                        }
                      },
                      required: ['post_name', 'post_type', 'platforms', 'scheduled_date', 'caption', 'visual_concept']
                    }
                  }
                },
                required: ['posts']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_content_posts' } },
        max_completion_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[generate-content-plan] OpenAI response received');

    // Extract posts from tool call
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'create_content_posts') {
      throw new Error('No valid tool call in OpenAI response');
    }

    const generatedPosts = JSON.parse(toolCall.function.arguments).posts;
    console.log(`[generate-content-plan] Generated ${generatedPosts.length} posts`);

    // Insert posts into database
    const postsToInsert = generatedPosts.map((post: any, index: number) => ({
      content_plan_id: contentPlanId,
      user_id: contentPlan.user_id,
      post_number: index + 1,
      post_name: post.post_name,
      post_type: post.post_type,
      platforms: post.platforms,
      scheduled_date: post.scheduled_date,
      hook: post.hook || null,
      caption: post.caption,
      visual_concept: post.visual_concept,
      status: 'draft',
    }));

    const { data: insertedPosts, error: insertError } = await supabaseClient
      .from('posts')
      .insert(postsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting posts:', insertError);
      throw insertError;
    }

    // Update user's posts_created_this_period counter
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        posts_created_this_period: (user.posts_created_this_period || 0) + generatedPosts.length
      })
      .eq('id', contentPlan.user_id);

    if (updateError) {
      console.error('Error updating user counter:', updateError);
    }

    console.log(`[generate-content-plan] Successfully generated and saved ${insertedPosts?.length} posts`);

    return new Response(
      JSON.stringify({
        success: true,
        postsGenerated: insertedPosts?.length || 0,
        posts: insertedPosts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-content-plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

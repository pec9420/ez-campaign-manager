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
    const { brandHubId, contentPlanId, userMessage } = await req.json();

    if (!brandHubId || !contentPlanId) {
      throw new Error('Missing required parameters: brandHubId and contentPlanId');
    }

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
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
    const systemPrompt = `You are a senior social-media strategist and behavioral-marketing expert.
Your task: design a structured **content plan** that aligns with the business objective and real-world constraints.

**CRITICAL**: Do **NOT** write:
- Hooks or opening lines
- Captions or post copy
- Visual concepts or shot descriptions

Output **ONLY** strategic post blueprints with tactical metadata (purpose, triggers, formats, CTAs, tracking).

Key Principles:
- Design strategic post architecture that guides the customer journey
- Apply behavioral psychology triggers appropriately for each funnel stage
- Align content formats with platform algorithms and best practices
- Create cohesive campaigns with intentional pacing and distribution
- Ensure every post has measurable objectives and clear tracking focus
- Balance promotional, educational, and engagement content strategically
- Reflect the brand's unique voice, audience, and value proposition

Strategy Framework:
- Use proven behavioral triggers: reciprocity, FOMO, scarcity, trust, nostalgia, belonging, curiosity, urgency
- Match tracking metrics to funnel stage (awareness=views/reach, consideration=shares/saves, conversion=clicks/DMs)
- Distribute content across the timeline strategically, ramping up near important dates
- Keep all descriptions concise (≤25 words per field) and actionable

Remember: You're designing the strategic blueprint, not writing copy. Focus on what each post should accomplish and how it fits into the overall campaign arc.`;

    const userPrompt = `Generate a strategic content plan for ${brandHub.business_name}.

BRAND CONTEXT:
- Business: ${brandHub.business_name}
- What they sell: ${brandHub.what_you_sell}
- Brand vibe: ${brandHub.brand_vibe_words.join(', ')}
- Target customer: ${brandHub.target_customer}
- What makes them unique: ${brandHub.what_makes_unique}

CAMPAIGN DETAILS:
- Campaign name: ${contentPlan.name}
- What promoting: ${contentPlan.what_promoting}
- Goal: ${contentPlan.goal || 'Drive engagement and sales'}
- Platforms: ${contentPlan.platforms.join(', ')}
- Timeline: ${contentPlan.start_date} to ${contentPlan.end_date}
${contentPlan.important_date ? `- Important date: ${contentPlan.important_date} (${contentPlan.important_date_label})` : ''}
- Sales channel: ${contentPlan.sales_channel_type}
- Offers/Promotions: ${contentPlan.offers_promos || 'None'}

${userMessage ? `USER REFINEMENT REQUEST:\n"${userMessage}"\n` : ''}

PLATFORM SCOPE RULE:
Only generate posts for these platforms: ${contentPlan.platforms.join(', ')}
Exclude any unlisted platform.

PLATFORM FORMAT LOGIC:
- Instagram: Reels=reach, Carousel=educate, Photo=brand moment, Stories=real-time
- TikTok: Video (short=trends, long=tutorials, casual tone)
- Facebook: Reels=community, Photo=announcements, Stories=behind-the-scenes
- Google Business: Updates=news, Offers=deals, Events=attendance, Products=showcase

STRATEGY RULES:
1. Funnel mix → Awareness 30% | Consideration 30% | Conversion 30% | Retention 10%
2. Content mix → Promotional 40% | Educational 30% | Engagement 30%
3. Align metrics + CTAs with funnel stage:
   • Awareness → views/reach/saves
   • Consideration → shares/clicks/saves
   • Conversion → clicks/DMs/sign-ups
   • Retention → comments/UGC/redemptions
4. Reflect brand vibe (${brandHub.brand_vibe_words.join(', ')}), target customer, and unique value
5. Keep all text fields ≤25 words
6. Distribute posts evenly across timeline, ramping up near ${contentPlan.important_date ? contentPlan.important_date_label : 'campaign goal'}

TASK:
Create ${postLimit} post blueprints. For each post provide:
- post_name: Short descriptive title
- post_type: educational / promotional / engagement / testimonial / behind-the-scenes
- platforms: Subset of [${contentPlan.platforms.join(', ')}]
- scheduled_date: Evenly distributed between ${contentPlan.start_date} and ${contentPlan.end_date} (YYYY-MM-DD)
- purpose: One-sentence objective for this post
- core_message: Main takeaway or value proposition
- behavioral_trigger: ONE only (reciprocity / FOMO / scarcity / trust / nostalgia / belonging / curiosity / urgency)
- format: reel / carousel / photo / story / video / update / offer / event / product
- tracking_focus: Primary KPI (views / saves / shares / comments / clicks / DMs / redemptions / attendance)
- cta: Specific action (View Website / DM for Inquiries / Visit In-Store / Sign Up / Learn More / Share / Save)

IMPORTANT CONSTRAINTS:
- Return ONLY valid JSON, no markdown, no code fences
- **CRITICAL**: If Offers/Promotions = "None", do NOT invent or imply any sales, discounts, limited-time deals, or promotional offers in any posts
- If Offers/Promotions IS specified, use it strategically in conversion-focused posts (don't mention it in every post)
- Ensure posts are achievable for small business owners with limited resources
- Build strategic arc from awareness → consideration → conversion → retention

Return the post blueprints using the tool.`;

    // Call Claude with tool calling for structured output
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 16000,
        temperature: 0.5,
        system: systemPrompt,
        tools: [
          {
            name: 'create_content_posts',
            description: 'Generate strategic post blueprints for a content plan',
            input_schema: {
              type: 'object',
              properties: {
                posts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      post_name: { type: 'string', description: 'Short descriptive title' },
                      post_type: {
                        type: 'string',
                        enum: ['educational', 'promotional', 'engagement', 'testimonial', 'behind-the-scenes'],
                        description: 'Content strategy type'
                      },
                      platforms: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Target platforms for this post'
                      },
                      scheduled_date: {
                        type: 'string',
                        description: 'Date to publish (YYYY-MM-DD format)'
                      },
                      purpose: {
                        type: 'string',
                        description: 'One-sentence objective for this post (≤25 words)'
                      },
                      core_message: {
                        type: 'string',
                        description: 'Main takeaway or value proposition (≤25 words)'
                      },
                      behavioral_trigger: {
                        type: 'string',
                        enum: ['reciprocity', 'FOMO', 'scarcity', 'trust', 'nostalgia', 'belonging', 'curiosity', 'urgency'],
                        description: 'Primary psychological trigger'
                      },
                      format: {
                        type: 'string',
                        enum: ['reel', 'carousel', 'photo', 'story', 'video', 'update', 'offer', 'event', 'product'],
                        description: 'Content format type'
                      },
                      tracking_focus: {
                        type: 'string',
                        enum: ['views', 'saves', 'shares', 'comments', 'clicks', 'DMs', 'redemptions', 'attendance'],
                        description: 'Primary KPI to track'
                      },
                      cta: {
                        type: 'string',
                        description: 'Specific call-to-action'
                      }
                    },
                    required: ['post_name', 'post_type', 'platforms', 'scheduled_date', 'purpose', 'core_message', 'behavioral_trigger', 'format', 'tracking_focus', 'cta']
                  }
                }
              },
              required: ['posts']
            }
          }
        ],
        tool_choice: { type: 'tool', name: 'create_content_posts' },
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[generate-content-plan] Claude response received');

    // Extract posts from Claude tool use
    const toolUseBlock = data.content?.find((block: any) => block.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.name !== 'create_content_posts') {
      throw new Error('No valid tool use in Claude response');
    }

    const generatedPosts = toolUseBlock.input.posts;
    console.log(`[generate-content-plan] Generated ${generatedPosts.length} posts`);

    // Map blueprint format to database post_type (content format)
    const formatToPostType = (format: string): string => {
      const mapping: Record<string, string> = {
        'photo': 'image',
        'image': 'image',
        'carousel': 'carousel',
        'reel': 'reel',
        'video': 'reel',  // Default videos to reels
        'story': 'story',
        'update': 'image',  // Google Business updates as images
        'offer': 'carousel',  // Offers work well as carousels
        'event': 'image',
        'product': 'image'
      };
      return mapping[format] || 'image';
    };

    // Insert posts into database
    const postsToInsert = generatedPosts.map((post: any, index: number) => ({
      content_plan_id: contentPlanId,
      user_id: contentPlan.user_id,
      post_number: index + 1,
      post_name: post.post_name,
      post_type: formatToPostType(post.format),  // Map format to post_type (image/carousel/reel/story)
      platforms: post.platforms,
      scheduled_date: post.scheduled_date,
      // Strategy fields (from content plan agent)
      strategy_type: post.post_type,  // Strategy type (educational/promotional/etc)
      purpose: post.purpose,
      core_message: post.core_message,
      behavioral_trigger: post.behavioral_trigger,
      format: post.format,  // Original format from blueprint
      tracking_focus: post.tracking_focus,
      cta: post.cta,
      // Content fields (to be filled by copywriting/shot list agents)
      hook: null,
      caption: null,
      visual_concept: null,
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

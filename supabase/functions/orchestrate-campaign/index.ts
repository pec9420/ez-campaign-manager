/**
 * Orchestrate Campaign Edge Function
 *
 * Multi-agent workflow for generating complete content campaigns:
 * 1. Context Builder - Compress brand + campaign data
 * 2. Strategy Agent - Plan content distribution (Sonnet 4.5)
 * 3. Shot List Agent - Create master shot list (Sonnet 4.5)
 * 4. Post Generators - Generate all posts in parallel (28x Sonnet 4.5)
 *
 * Total AI calls: 2 sequential + N parallel (where N = num_posts)
 * Expected duration: 30-60 seconds for 28 posts
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { buildContext } from '../_shared/context-builder.ts';
import { generateStrategy } from '../_shared/strategy-agent.ts';
import { generateShotList } from '../_shared/shot-list-agent.ts';
import { generatePost } from '../_shared/post-generator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content_plan_id } = await req.json();

    if (!content_plan_id) {
      throw new Error('Missing required parameter: content_plan_id');
    }

    console.log(`[orchestrate-campaign] Starting campaign generation for: ${content_plan_id}`);

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ============================================
    // STEP 1: Fetch all required data
    // ============================================

    // Fetch content plan
    const { data: contentPlan, error: planError } = await supabaseClient
      .from('content_plans')
      .select('*')
      .eq('id', content_plan_id)
      .single();

    if (planError || !contentPlan) {
      throw new Error('Content Plan not found');
    }

    // Fetch user and brand hub
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*, brand_hub(*)')
      .eq('id', contentPlan.user_id)
      .single();

    if (userError || !user || !user.brand_hub || user.brand_hub.length === 0) {
      throw new Error('User or Brand Hub not found');
    }

    const brandHub = user.brand_hub[0];

    console.log(`[orchestrate-campaign] Data fetched for ${brandHub.business_name}`);

    // ============================================
    // STEP 2: Context Builder (no AI call)
    // ============================================

    console.log('[orchestrate-campaign] Building context package...');

    const context = buildContext(brandHub, contentPlan);

    console.log('[orchestrate-campaign] Context package built');

    // ============================================
    // STEP 3: Strategy Agent (Sonnet 4.5 call #1)
    // ============================================

    console.log('[orchestrate-campaign] Generating content strategy...');

    const strategy = await generateStrategy(context, contentPlan);

    console.log(`[orchestrate-campaign] Strategy generated: ${strategy.weekly_phases.length} phases`);

    // ============================================
    // STEP 4: Shot List Agent (Sonnet 4.5 call #2)
    // ============================================

    console.log('[orchestrate-campaign] Generating shot list...');

    const shotList = await generateShotList(context, strategy);

    console.log(`[orchestrate-campaign] Shot list generated: ${shotList.shots.length} shots`);

    // ============================================
    // STEP 5: Save strategy + shot list to database
    // ============================================

    const { error: updateError } = await supabaseClient
      .from('content_plans')
      .update({
        strategy_framework: strategy,
        shot_list: shotList
      })
      .eq('id', content_plan_id);

    if (updateError) {
      console.error('[orchestrate-campaign] Error saving strategy/shot list:', updateError);
      throw updateError;
    }

    console.log('[orchestrate-campaign] Strategy and shot list saved to database');

    // ============================================
    // STEP 6: Generate all posts in parallel
    // ============================================

    // Calculate total posts and assign details
    const totalPosts = strategy.weekly_phases.reduce((sum, phase) => sum + phase.post_count, 0);

    console.log(`[orchestrate-campaign] Generating ${totalPosts} posts in parallel...`);

    const postPromises = [];
    let postCounter = 0;

    // Iterate through weekly phases and assign posts
    for (const phase of strategy.weekly_phases) {
      const formatMix = phase.format_mix || {};
      const formats = Object.entries(formatMix).flatMap(([format, count]) =>
        Array(count as number).fill(format)
      );

      // Assign themes proportionally to posts in this phase
      const phaseThemes = strategy.content_themes.slice(0, 3).map(t => t.theme);

      for (let i = 0; i < phase.post_count; i++) {
        postCounter++;

        const postDetails = {
          post_number: postCounter,
          scheduled_date: calculateScheduledDate(
            contentPlan.start_date,
            contentPlan.end_date,
            postCounter,
            totalPosts,
            strategy.posting_frequency.surge_dates
          ),
          post_type: formats[i % formats.length] || 'image',
          phase: phase.phase,
          theme: phaseThemes[i % phaseThemes.length] || strategy.content_themes[0].theme,
          platforms: contentPlan.platforms
        };

        postPromises.push(
          generatePost(context, strategy, shotList, postDetails)
        );
      }
    }

    // Execute all post generations in parallel
    const posts = await Promise.all(postPromises);

    console.log(`[orchestrate-campaign] ${posts.length} posts generated successfully`);

    // ============================================
    // STEP 7: Bulk insert posts into database
    // ============================================

    const postsToInsert = posts.map((post) => ({
      content_plan_id,
      user_id: contentPlan.user_id,
      post_number: post.post_number,
      post_name: post.post_name,
      scheduled_date: post.scheduled_date,
      post_type: post.post_type,
      platforms: post.platforms,
      hook: post.hook,
      caption: post.caption,
      visual_concept: post.visual_concept,
      // Content strategy metadata
      purpose: post.purpose,
      core_message: post.core_message,
      behavioral_trigger: post.behavioral_trigger,
      format: post.format,
      strategy_type: post.strategy_type,
      tracking_focus: post.tracking_focus,
      cta: post.cta,
      status: post.status || 'draft',
      deleted: false
    }));

    const { data: insertedPosts, error: insertError } = await supabaseClient
      .from('posts')
      .insert(postsToInsert)
      .select();

    if (insertError) {
      console.error('[orchestrate-campaign] Error inserting posts:', insertError);
      throw insertError;
    }

    console.log(`[orchestrate-campaign] ${insertedPosts?.length} posts inserted into database`);

    // ============================================
    // STEP 8: Update user's posts counter
    // ============================================

    const { error: counterError } = await supabaseClient
      .from('users')
      .update({
        posts_created_this_period: (user.posts_created_this_period || 0) + posts.length
      })
      .eq('id', contentPlan.user_id);

    if (counterError) {
      console.error('[orchestrate-campaign] Error updating user counter:', counterError);
    }

    // ============================================
    // STEP 9: Return success response
    // ============================================

    console.log('[orchestrate-campaign] Campaign generation complete!');

    return new Response(
      JSON.stringify({
        success: true,
        posts_created: insertedPosts?.length || 0,
        shots_created: shotList.shots.length,
        strategy: {
          phases: strategy.weekly_phases.length,
          themes: strategy.content_themes.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[orchestrate-campaign] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Calculate scheduled date for a post based on:
 * - Campaign date range
 * - Post position in sequence
 * - Total posts
 * - Surge dates (post more frequently near important dates)
 */
function calculateScheduledDate(
  startDate: string,
  endDate: string,
  postNumber: number,
  totalPosts: number,
  surgeDates: string[]
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Simple distribution: spread posts evenly across campaign duration
  const dayInterval = totalDays / totalPosts;
  const dayOffset = Math.floor(dayInterval * (postNumber - 1));

  const scheduledDate = new Date(start);
  scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

  // Format as YYYY-MM-DD
  return scheduledDate.toISOString().split('T')[0];
}

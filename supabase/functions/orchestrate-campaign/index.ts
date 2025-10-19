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
    const requestBody = await req.json();
    console.log('[orchestrate-campaign] Request body:', requestBody);

    const { content_plan_id, dry_run = false } = requestBody;

    if (!content_plan_id) {
      console.error('[orchestrate-campaign] Missing content_plan_id in request');
      throw new Error('Missing required parameter: content_plan_id');
    }

    if (dry_run) {
      console.log(`[orchestrate-campaign] DRY RUN MODE - No database writes will occur`);
    }

    console.log(`[orchestrate-campaign] Starting campaign generation for: ${content_plan_id}`);

    // Log environment variables (mask the key)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    console.log('[orchestrate-campaign] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      supabaseUrl: supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      serviceRoleKeyLength: serviceRoleKey.length,
      serviceRoleKeyPrefix: serviceRoleKey.substring(0, 20) + '...'
    });

    // Create Supabase client with service role
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // ============================================
    // STEP 1: Fetch all required data
    // ============================================

    console.log('[orchestrate-campaign] Fetching content plan...');

    // Fetch content plan
    const { data: contentPlan, error: planError } = await supabaseClient
      .from('content_plans')
      .select('*')
      .eq('id', content_plan_id)
      .single();

    console.log('[orchestrate-campaign] Content plan query result:', {
      hasData: !!contentPlan,
      hasError: !!planError,
      error: planError,
      planId: contentPlan?.id,
      userId: contentPlan?.user_id
    });

    if (planError) {
      console.error('[orchestrate-campaign] Content plan query error:', planError);
      throw new Error(`Content plan query failed: ${planError.message}`);
    }

    if (!contentPlan) {
      console.error('[orchestrate-campaign] Content plan not found for ID:', content_plan_id);
      throw new Error('Content Plan not found');
    }

    console.log(`[orchestrate-campaign] Fetching user with ID: ${contentPlan.user_id}`);

    // Fetch user
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', contentPlan.user_id)
      .single();

    console.log('[orchestrate-campaign] User query result:', {
      hasData: !!user,
      hasError: !!userError,
      error: userError,
      userId: user?.id
    });

    if (userError) {
      console.error('[orchestrate-campaign] User query error:', userError);
      throw new Error(`User query failed: ${userError.message}`);
    }

    if (!user) {
      console.error('[orchestrate-campaign] User not found for ID:', contentPlan.user_id);
      throw new Error('User not found');
    }

    console.log(`[orchestrate-campaign] Fetching brand hub for user_id: ${contentPlan.user_id}`);

    // First, check if ANY brand hubs exist
    const { data: allBrandHubs, error: allBrandHubsError } = await supabaseClient
      .from('brand_hub')
      .select('id, user_id, business_name');

    console.log('[orchestrate-campaign] ALL brand hubs in database:', {
      count: allBrandHubs?.length || 0,
      brandHubs: allBrandHubs,
      error: allBrandHubsError
    });

    // Fetch brand hub separately
    const { data: brandHub, error: brandHubError } = await supabaseClient
      .from('brand_hub')
      .select('*')
      .eq('user_id', contentPlan.user_id)
      .single();

    console.log('[orchestrate-campaign] Brand hub query result:', {
      hasData: !!brandHub,
      hasError: !!brandHubError,
      error: brandHubError,
      errorCode: brandHubError?.code,
      errorDetails: brandHubError?.details,
      errorHint: brandHubError?.hint,
      brandHubId: brandHub?.id,
      businessName: brandHub?.business_name,
      fullBrandHub: brandHub
    });

    if (brandHubError) {
      console.error('[orchestrate-campaign] Brand hub query error:', brandHubError);
      throw new Error(`Brand hub query failed: ${brandHubError.message} (code: ${brandHubError.code})`);
    }

    if (!brandHub) {
      console.error('[orchestrate-campaign] Brand hub not found for user_id:', contentPlan.user_id);

      // Additional debugging: try to count brand hubs for this user
      const { count, error: countError } = await supabaseClient
        .from('brand_hub')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', contentPlan.user_id);

      console.log('[orchestrate-campaign] Brand hub count check:', {
        count,
        countError,
        userId: contentPlan.user_id
      });

      throw new Error('Brand Hub not found. Please set up your Brand Hub before creating a campaign.');
    }

    console.log(`[orchestrate-campaign] Data successfully fetched for ${brandHub.business_name}`);

    // ============================================
    // STEP 2: Context Builder (no AI call)
    // ============================================

    console.log('[orchestrate-campaign] Building context package...');

    const context = buildContext(brandHub, contentPlan);

    console.log('[orchestrate-campaign] Context package built');

    // ============================================
    // STEP 3: Strategy Agent (Sonnet 4.5 call #1)
    // ============================================

    console.log('[orchestrate-campaign] ===== STEP 3: Generating Strategy =====');
    const strategyStartTime = Date.now();

    const strategy = await generateStrategy(context, contentPlan);

    const strategyDuration = Date.now() - strategyStartTime;
    console.log(`[orchestrate-campaign] ✓ Strategy generated in ${strategyDuration}ms:`, {
      phases: strategy.weekly_phases.length,
      themes: strategy.content_themes.length,
      shot_requirements: strategy.shot_requirements.length
    });

    // ============================================
    // STEP 4: Shot List Agent (Sonnet 4.5 call #2)
    // ============================================

    console.log('[orchestrate-campaign] ===== STEP 4: Generating Shot List =====');
    const shotListStartTime = Date.now();

    const shotList = await generateShotList(context, strategy);

    const shotListDuration = Date.now() - shotListStartTime;
    console.log(`[orchestrate-campaign] ✓ Shot list generated in ${shotListDuration}ms:`, {
      total_shots: shotList.shots.length,
      themes: shotList.themes.length
    });

    // ============================================
    // STEP 5: Save strategy + shot list to database
    // ============================================

    if (!dry_run) {
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
    } else {
      console.log('[orchestrate-campaign] DRY RUN - Skipping strategy/shot list database save');
    }

    // ============================================
    // STEP 6: Generate posts in batches (rate limit mitigation)
    // ============================================

    // Calculate total posts and assign details
    const totalPosts = strategy.weekly_phases.reduce((sum, phase) => sum + phase.post_count, 0);

    console.log('[orchestrate-campaign] ===== STEP 6: Generating Posts =====');
    console.log(`[orchestrate-campaign] Total posts to generate: ${totalPosts}`);

    const allPostDetails = [];
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

        allPostDetails.push({
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
        });
      }
    }

    // Generate posts in batches to avoid rate limits
    const BATCH_SIZE = 4; // Process 4 posts at a time
    const BATCH_DELAY = 2000; // 2 second delay between batches
    
    const posts: any[] = [];
    const errors: Array<{ post_number: number; error: string }> = [];
    const batchCount = Math.ceil(allPostDetails.length / BATCH_SIZE);
    
    console.log(`[orchestrate-campaign] Processing ${batchCount} batches of ${BATCH_SIZE} posts`);
    
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, allPostDetails.length);
      const batch = allPostDetails.slice(batchStart, batchEnd);
      
      console.log(`[orchestrate-campaign] ----- Batch ${batchIndex + 1}/${batchCount}: Posts ${batchStart + 1}-${batchEnd} -----`);
      
      const batchStartTime = Date.now();
      
      // Generate this batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(postDetails => generatePost(context, strategy, shotList, postDetails))
      );
      
      const batchDuration = Date.now() - batchStartTime;
      
      // Process results
      let successCount = 0;
      let failureCount = 0;
      
      batchResults.forEach((result, index) => {
        const postNumber = batch[index].post_number;
        
        if (result.status === 'fulfilled') {
          posts.push(result.value);
          successCount++;
        } else {
          errors.push({
            post_number: postNumber,
            error: result.reason?.message || 'Unknown error'
          });
          failureCount++;
          console.error(`[orchestrate-campaign] ✗ Post ${postNumber} failed:`, result.reason?.message);
        }
      });
      
      console.log(`[orchestrate-campaign] Batch ${batchIndex + 1} completed in ${batchDuration}ms:`, {
        success: successCount,
        failed: failureCount,
        total: batch.length
      });
      
      // Add delay between batches (except after last batch)
      if (batchIndex < batchCount - 1) {
        console.log(`[orchestrate-campaign] Waiting ${BATCH_DELAY}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }

    console.log(`[orchestrate-campaign] ===== Post Generation Complete =====`);
    console.log(`[orchestrate-campaign] Results:`, {
      successful: posts.length,
      failed: errors.length,
      total: totalPosts
    });
    
    if (errors.length > 0) {
      console.error('[orchestrate-campaign] Failed posts:', errors);
    }

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
      strategy_type: post.strategy_type,
      tracking_focus: post.tracking_focus,
      cta: post.cta,
      status: post.status || 'draft',
      deleted: false
    }));

    let insertedPosts = null;

    if (!dry_run) {
      const { data, error: insertError } = await supabaseClient
        .from('posts')
        .insert(postsToInsert)
        .select();

      if (insertError) {
        console.error('[orchestrate-campaign] Error inserting posts:', insertError);
        throw insertError;
      }

      insertedPosts = data;
      console.log(`[orchestrate-campaign] ${insertedPosts?.length} posts inserted into database`);
    } else {
      console.log('[orchestrate-campaign] DRY RUN - Skipping post insertion (would insert ${postsToInsert.length} posts)');
      insertedPosts = postsToInsert; // Return what would have been inserted
    }

    // ============================================
    // STEP 8: Update user's posts counter
    // ============================================

    if (!dry_run) {
      const { error: counterError } = await supabaseClient
        .from('users')
        .update({
          posts_created_this_period: (user.posts_created_this_period || 0) + posts.length
        })
        .eq('id', contentPlan.user_id);

      if (counterError) {
        console.error('[orchestrate-campaign] Error updating user counter:', counterError);
      }
    } else {
      console.log('[orchestrate-campaign] DRY RUN - Skipping user counter update');
    }

    // ============================================
    // STEP 9: Return success response
    // ============================================

    console.log('[orchestrate-campaign] Campaign generation complete!');

    return new Response(
      JSON.stringify({
        success: true,
        dry_run,
        posts_created: insertedPosts?.length || 0,
        shots_created: shotList.shots.length,
        strategy: {
          phases: strategy.weekly_phases.length,
          themes: strategy.content_themes.length
        },
        // Include full details in dry-run mode for debugging
        ...(dry_run ? {
          preview: {
            strategy,
            shotList,
            posts: insertedPosts?.slice(0, 3) // First 3 posts as preview
          }
        } : {})
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

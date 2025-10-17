/**
 * Test Script for Content Plan Generator
 *
 * This script tests the content plan generation Edge Function by:
 * 1. Creating test campaigns in the database
 * 2. Invoking the generate-content-plan Edge Function
 * 3. Evaluating the generated blueprints against strategy criteria
 *
 * Usage: deno run --allow-net --allow-env test-content-plan-generator.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test campaign scenarios
const testCampaigns = [
  {
    name: "Holiday Gift Card Push",
    what_promoting: "Stack Creamery's annual holiday gift card promotion: customers who buy a $50 gift card receive an extra $5 bonus card for themselves.",
    goal: "Drive 50 gift card purchases before December 25 by creating urgency around the limited-time offer and positioning gift cards as a thoughtful gift idea.",
    platforms: ["Instagram", "Facebook", "TikTok"],
    start_date: "2025-11-01",
    end_date: "2025-12-25",
    important_date: "2025-12-25",
    important_date_label: "Christmas",
    sales_channel_type: "website",
    offers_promos: "Buy $50 gift card, get $5 bonus card free",
    post_limit: 20
  },
  {
    name: "New Flavors: Chai & Matcha Stories",
    what_promoting: "Two new artisanal ice cream sandwich flavors—Chai Tea and Matcha—crafted for the fall-winter season.",
    goal: "Increase in-store visits and online buzz by sharing the personal stories behind these flavors and positioning them as a reflection of Stack's creativity.",
    platforms: ["Instagram", "Facebook"],
    start_date: "2025-10-20",
    end_date: "2025-11-30",
    important_date: "2025-11-01",
    important_date_label: "Flavor Launch Day",
    sales_channel_type: "physical_store",
    offers_promos: null,  // No promotional offer, just storytelling
    post_limit: 15
  },
  {
    name: "Inside the Stack: Ingredient Deep-Dive",
    what_promoting: "An educational mini-series showing how Stack Creamery sources and crafts its ice cream sandwiches—from locally-baked cookies to premium ice cream.",
    goal: "Build trust, transparency, and brand credibility by educating followers about ingredient quality and preparation methods.",
    platforms: ["Instagram", "TikTok"],
    start_date: "2025-11-05",
    end_date: "2025-12-05",
    important_date: "2025-12-01",
    important_date_label: "Final Episode Drop",
    sales_channel_type: "website",
    offers_promos: null,  // Educational series, no promotions
    post_limit: 10
  }
];

// Evaluation criteria
interface EvaluationResult {
  campaign: string;
  totalPosts: number;
  strategyMix: {
    awareness: number;
    consideration: number;
    conversion: number;
    retention: number;
  };
  contentMix: {
    promotional: number;
    educational: number;
    engagement: number;
    testimonial: number;
    behindTheScenes: number;
  };
  triggerUsage: Record<string, number>;
  formatDistribution: Record<string, number>;
  timelineDistribution: string[];
  issues: string[];
  score: number;
}

async function createStackCreameryBrandHub(userId: string): Promise<string | null> {
  // Check if brand hub already exists
  const { data: existing } = await supabase
    .from('brand_hub')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    console.log('Using existing brand hub:', existing.id);
    return existing.id;
  }

  // Create Stack Creamery brand hub
  const { data, error } = await supabase
    .from('brand_hub')
    .insert({
      user_id: userId,
      business_name: 'Stack Creamery',
      what_you_sell: 'Artisan ice cream sandwiches with creative flavors',
      what_makes_unique: 'Small-batch ice cream with locally-baked cookies and unique flavor combinations',
      target_customer: 'Millennials and families looking for unique dessert experiences',
      brand_vibe_words: ['Playful', 'Creative', 'Authentic']
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating brand hub:', error);
    return null;
  }

  return data.id;
}

async function createContentPlan(userId: string, campaign: typeof testCampaigns[0]): Promise<string | null> {
  const { data, error } = await supabase
    .from('content_plans')
    .insert({
      user_id: userId,
      name: campaign.name,
      what_promoting: campaign.what_promoting,
      goal: campaign.goal,
      platforms: campaign.platforms,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      important_date: campaign.important_date,
      important_date_label: campaign.important_date_label,
      sales_channel_type: campaign.sales_channel_type,
      offers_promos: campaign.offers_promos
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating content plan:', error);
    return null;
  }

  return data.id;
}

async function generateContentPlan(brandHubId: string, contentPlanId: string): Promise<boolean> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-content-plan`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      brandHubId,
      contentPlanId
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error generating content plan:', error);
    return false;
  }

  const result = await response.json();
  console.log(`Generated ${result.postsGenerated} posts`);
  return true;
}

function evaluateContentPlan(posts: any[]): Omit<EvaluationResult, 'campaign'> {
  const issues: string[] = [];
  let score = 100;

  // Count strategy mix (based on tracking_focus alignment)
  const strategyMix = {
    awareness: 0,
    consideration: 0,
    conversion: 0,
    retention: 0
  };

  // Count content mix (based on post_type in blueprint)
  const contentMix = {
    promotional: 0,
    educational: 0,
    engagement: 0,
    testimonial: 0,
    behindTheScenes: 0
  };

  const triggerUsage: Record<string, number> = {};
  const formatDistribution: Record<string, number> = {};
  const timelineDistribution: string[] = [];

  posts.forEach(post => {
    // Map tracking_focus to funnel stage
    if (['views', 'reach'].includes(post.tracking_focus)) {
      strategyMix.awareness++;
    } else if (['shares', 'saves', 'clicks'].includes(post.tracking_focus)) {
      strategyMix.consideration++;
    } else if (['DMs', 'sign-ups', 'redemptions'].includes(post.tracking_focus)) {
      strategyMix.conversion++;
    } else if (['comments', 'attendance'].includes(post.tracking_focus)) {
      strategyMix.retention++;
    }

    // Count content types
    const strategyType = post.strategy_type?.replace(/-/g, '') || '';
    if (strategyType in contentMix) {
      contentMix[strategyType as keyof typeof contentMix]++;
    }

    // Count triggers
    if (post.behavioral_trigger) {
      triggerUsage[post.behavioral_trigger] = (triggerUsage[post.behavioral_trigger] || 0) + 1;
    }

    // Count formats
    if (post.format) {
      formatDistribution[post.format] = (formatDistribution[post.format] || 0) + 1;
    }

    // Track dates
    timelineDistribution.push(post.scheduled_date);
  });

  const total = posts.length;

  // Check strategy mix (30/30/30/10)
  const awarenessPercent = (strategyMix.awareness / total) * 100;
  const considerationPercent = (strategyMix.consideration / total) * 100;
  const conversionPercent = (strategyMix.conversion / total) * 100;
  const retentionPercent = (strategyMix.retention / total) * 100;

  if (Math.abs(awarenessPercent - 30) > 10) {
    issues.push(`Awareness posts: ${awarenessPercent.toFixed(1)}% (target: 30%)`);
    score -= 10;
  }
  if (Math.abs(considerationPercent - 30) > 10) {
    issues.push(`Consideration posts: ${considerationPercent.toFixed(1)}% (target: 30%)`);
    score -= 10;
  }
  if (Math.abs(conversionPercent - 30) > 10) {
    issues.push(`Conversion posts: ${conversionPercent.toFixed(1)}% (target: 30%)`);
    score -= 10;
  }
  if (Math.abs(retentionPercent - 10) > 10) {
    issues.push(`Retention posts: ${retentionPercent.toFixed(1)}% (target: 10%)`);
    score -= 10;
  }

  // Check content mix (40/30/30)
  const promotionalPercent = (contentMix.promotional / total) * 100;
  const educationalPercent = (contentMix.educational / total) * 100;
  const engagementPercent = (contentMix.engagement / total) * 100;

  if (Math.abs(promotionalPercent - 40) > 15) {
    issues.push(`Promotional posts: ${promotionalPercent.toFixed(1)}% (target: 40%)`);
    score -= 10;
  }
  if (Math.abs(educationalPercent - 30) > 15) {
    issues.push(`Educational posts: ${educationalPercent.toFixed(1)}% (target: 30%)`);
    score -= 10;
  }
  if (Math.abs(engagementPercent - 30) > 15) {
    issues.push(`Engagement posts: ${engagementPercent.toFixed(1)}% (target: 30%)`);
    score -= 10;
  }

  // Check for even timeline distribution
  const uniqueDates = new Set(timelineDistribution).size;
  if (uniqueDates < total * 0.5) {
    issues.push(`Posts concentrated on ${uniqueDates} dates (should spread across more dates)`);
    score -= 10;
  }

  return {
    totalPosts: total,
    strategyMix,
    contentMix,
    triggerUsage,
    formatDistribution,
    timelineDistribution: Array.from(new Set(timelineDistribution)).sort(),
    issues,
    score: Math.max(0, score)
  };
}

async function runTest(campaign: typeof testCampaigns[0], userId: string, brandHubId: string): Promise<EvaluationResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${campaign.name}`);
  console.log(`${'='.repeat(80)}\n`);

  // Create content plan
  console.log('Creating content plan...');
  const contentPlanId = await createContentPlan(userId, campaign);
  if (!contentPlanId) {
    throw new Error('Failed to create content plan');
  }

  // Generate posts
  console.log('Generating posts...');
  const success = await generateContentPlan(brandHubId, contentPlanId);
  if (!success) {
    throw new Error('Failed to generate posts');
  }

  // Fetch generated posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('content_plan_id', contentPlanId)
    .order('post_number');

  if (error || !posts) {
    throw new Error('Failed to fetch posts');
  }

  // Evaluate
  const evaluation = evaluateContentPlan(posts);

  return {
    campaign: campaign.name,
    ...evaluation
  };
}

function printResults(results: EvaluationResult[]) {
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('CONTENT PLAN GENERATOR TEST RESULTS');
  console.log('═'.repeat(80));

  results.forEach(result => {
    console.log(`\n${result.campaign}`);
    console.log('─'.repeat(80));
    console.log(`Score: ${result.score}/100`);
    console.log(`Total Posts: ${result.totalPosts}`);

    console.log(`\nStrategy Mix (Funnel Stages):`);
    console.log(`  Awareness:      ${result.strategyMix.awareness} posts (${((result.strategyMix.awareness / result.totalPosts) * 100).toFixed(1)}%) [target: 30%]`);
    console.log(`  Consideration:  ${result.strategyMix.consideration} posts (${((result.strategyMix.consideration / result.totalPosts) * 100).toFixed(1)}%) [target: 30%]`);
    console.log(`  Conversion:     ${result.strategyMix.conversion} posts (${((result.strategyMix.conversion / result.totalPosts) * 100).toFixed(1)}%) [target: 30%]`);
    console.log(`  Retention:      ${result.strategyMix.retention} posts (${((result.strategyMix.retention / result.totalPosts) * 100).toFixed(1)}%) [target: 10%]`);

    console.log(`\nContent Mix:`);
    console.log(`  Promotional:    ${result.contentMix.promotional} posts (${((result.contentMix.promotional / result.totalPosts) * 100).toFixed(1)}%) [target: 40%]`);
    console.log(`  Educational:    ${result.contentMix.educational} posts (${((result.contentMix.educational / result.totalPosts) * 100).toFixed(1)}%) [target: 30%]`);
    console.log(`  Engagement:     ${result.contentMix.engagement} posts (${((result.contentMix.engagement / result.totalPosts) * 100).toFixed(1)}%) [target: 30%]`);
    console.log(`  Testimonial:    ${result.contentMix.testimonial} posts`);
    console.log(`  Behind-the-Scenes: ${result.contentMix.behindTheScenes} posts`);

    console.log(`\nBehavioral Triggers:`);
    Object.entries(result.triggerUsage).forEach(([trigger, count]) => {
      console.log(`  ${trigger}: ${count} posts`);
    });

    console.log(`\nFormat Distribution:`);
    Object.entries(result.formatDistribution).forEach(([format, count]) => {
      console.log(`  ${format}: ${count} posts`);
    });

    console.log(`\nTimeline:`);
    console.log(`  ${result.timelineDistribution.length} unique dates: ${result.timelineDistribution.join(', ')}`);

    if (result.issues.length > 0) {
      console.log(`\n⚠️  Issues:`);
      result.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    } else {
      console.log(`\n✅ All criteria met!`);
    }
  });

  // Overall summary
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  console.log('\n' + '═'.repeat(80));
  console.log(`OVERALL AVERAGE SCORE: ${avgScore.toFixed(1)}/100`);
  console.log('═'.repeat(80) + '\n');
}

// Main execution
async function main() {
  try {
    // Use Sweet Scoop Ice Cream user (user 2)
    const userId = '550e8400-e29b-41d4-a716-446655440002';

    // Create/get Stack Creamery brand hub
    console.log('Setting up Stack Creamery brand hub...');
    const brandHubId = await createStackCreameryBrandHub(userId);
    if (!brandHubId) {
      throw new Error('Failed to create brand hub');
    }

    const results: EvaluationResult[] = [];

    // Run tests for each campaign
    for (const campaign of testCampaigns) {
      const result = await runTest(campaign, userId, brandHubId);
      results.push(result);

      // Wait a bit between tests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print results
    printResults(results);

  } catch (error) {
    console.error('Test failed:', error);
    Deno.exit(1);
  }
}

main();

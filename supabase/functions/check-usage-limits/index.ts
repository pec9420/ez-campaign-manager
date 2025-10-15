import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier limits configuration
const TIER_LIMITS = {
  starter: {
    posts_per_plan: 10,
    regenerations_per_month: 5,
    active_content_plans: 1,
    brand_hubs: 1,
  },
  pro: {
    posts_per_plan: 50,
    regenerations_per_month: 25,
    active_content_plans: 5,
    brand_hubs: 1,
  },
  enterprise: {
    posts_per_plan: null, // unlimited
    regenerations_per_month: null, // unlimited
    active_content_plans: null, // unlimited
    brand_hubs: 5,
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, action } = await req.json();
    
    if (!userId || !action) {
      throw new Error('Missing required parameters: userId and action');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
    );

    // Fetch user data
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const tier = user.subscription_tier || 'starter';
    const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

    let allowed = false;
    let currentUsage = 0;
    let limit: number | null = null;
    let upgradeRequired = false;
    let message = '';

    switch (action) {
      case 'create_posts': {
        currentUsage = user.posts_created_this_period || 0;
        limit = limits.posts_per_plan;
        
        if (limit === null) {
          // Enterprise: unlimited
          allowed = true;
          message = 'Unlimited posts available';
        } else {
          allowed = currentUsage < limit;
          if (!allowed) {
            upgradeRequired = true;
            message = tier === 'starter' 
              ? 'Upgrade to Pro to generate up to 50 posts per plan'
              : 'Upgrade to Enterprise for unlimited posts';
          }
        }
        break;
      }

      case 'regenerate': {
        currentUsage = user.ai_regenerations_used_this_period || 0;
        limit = limits.regenerations_per_month;
        
        if (limit === null) {
          // Enterprise: unlimited
          allowed = true;
          message = 'Unlimited regenerations available';
        } else {
          allowed = currentUsage < limit;
          if (!allowed) {
            upgradeRequired = true;
            const resetDate = new Date(user.billing_period_end).toLocaleDateString();
            message = tier === 'starter'
              ? `You've used all ${limit} regenerations this month. Upgrade to Pro for 25 regenerations/month, or wait until your limit resets on ${resetDate}.`
              : `You've used all ${limit} regenerations this month. Upgrade to Enterprise for unlimited regenerations, or wait until ${resetDate}.`;
          }
        }
        break;
      }

      case 'create_content_plan': {
        // Count active content plans
        const { count, error: countError } = await supabaseClient
          .from('content_plans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (countError) throw countError;

        currentUsage = count || 0;
        limit = limits.active_content_plans;
        
        if (limit === null) {
          // Enterprise: unlimited
          allowed = true;
          message = 'Unlimited content plans available';
        } else {
          allowed = currentUsage < limit;
          if (!allowed) {
            upgradeRequired = true;
            message = tier === 'starter'
              ? 'You can only have 1 active content plan on the Starter tier. Upgrade to Pro to manage up to 5 plans at once, or archive your current plan first.'
              : 'Upgrade to Enterprise to manage unlimited content plans simultaneously.';
          }
        }
        break;
      }

      case 'create_brand_hub': {
        // Count brand hubs
        const { count, error: countError } = await supabaseClient
          .from('brand_hub')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (countError) throw countError;

        currentUsage = count || 0;
        limit = limits.brand_hubs;
        
        allowed = currentUsage < limit;
        if (!allowed) {
          upgradeRequired = true;
          message = 'Upgrade to Enterprise to manage up to 5 brand hubs—perfect for agencies and multi-brand businesses.';
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[check-usage-limits] User: ${userId}, Tier: ${tier}, Action: ${action}, Allowed: ${allowed}, Usage: ${currentUsage}/${limit || 'unlimited'}`);

    return new Response(
      JSON.stringify({
        allowed,
        currentUsage,
        limit,
        upgradeRequired,
        message,
        tier,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in check-usage-limits:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

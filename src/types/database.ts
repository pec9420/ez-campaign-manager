export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: 'starter' | 'growth';
  subscription_status: 'active' | 'canceled' | 'past_due';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  billing_period_start?: string;
  billing_period_end?: string;
  posts_created_this_period: number;
  ai_regenerations_used_this_period: number;
}

export interface BrandHub {
  id: string;
  user_id: string;
  business_name: string;
  what_you_sell: string;
  what_makes_unique: string;
  target_customer: string;
  brand_vibe_words: string[];
  other_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPlan {
  id: string;
  user_id: string;
  name: string;
  what_promoting: string;
  goal?: string;
  start_date: string;
  end_date: string;
  important_date?: string;
  important_date_label?: string;
  sales_channel_type: 'website' | 'etsy' | 'amazon' | 'shopify' | 'instagram_shop' | 'local_market' | 'physical_store' | 'email_list' | 'other';
  platforms: string[];
  shot_list?: any;
  offers_promos?: string | null;
  num_posts: number;
  context_package?: any;
  strategy_framework?: any;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  content_plan_id: string;
  user_id: string;
  post_number: number;
  post_name: string;
  scheduled_date: string;
  post_type: 'image' | 'carousel' | 'reel' | 'story';
  platforms: string[];
  visual_concept: any;
  hook?: string | null;
  caption: string | null;
  status: 'draft' | 'approved';
  deleted: boolean;
  // Content strategy fields
  purpose?: string | null;
  core_message?: string | null;
  behavioral_trigger?: string | null;
  strategy_type?: string | null;
  tracking_focus?: string | null;
  cta?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  user_id?: string;
  user_email?: string;
  feedback_text: string;
  page_url?: string;
  user_plan?: string;
  days_since_signup?: number;
  campaigns_count?: number;
  posts_count?: number;
  available_for_interview: boolean;
  created_at: string;
}

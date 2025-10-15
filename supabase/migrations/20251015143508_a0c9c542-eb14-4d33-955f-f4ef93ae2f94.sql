-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'starter' 
    CHECK (subscription_tier IN ('starter', 'growth')),
  subscription_status TEXT DEFAULT 'active' 
    CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  
  -- Usage tracking
  posts_created_this_period INTEGER DEFAULT 0 
    CHECK (posts_created_this_period >= 0),
  ai_regenerations_used_this_period INTEGER DEFAULT 0 
    CHECK (ai_regenerations_used_this_period >= 0)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- Create brand_hub table
CREATE TABLE brand_hub (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  business_name TEXT NOT NULL 
    CHECK (char_length(business_name) BETWEEN 1 AND 100),
  what_you_sell TEXT NOT NULL 
    CHECK (char_length(what_you_sell) BETWEEN 10 AND 100),
  what_makes_unique TEXT NOT NULL 
    CHECK (char_length(what_makes_unique) BETWEEN 10 AND 100),
  target_customer TEXT NOT NULL 
    CHECK (char_length(target_customer) BETWEEN 10 AND 100),
  brand_vibe_words TEXT[] NOT NULL 
    CHECK (array_length(brand_vibe_words, 1) BETWEEN 3 AND 5),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT one_brand_hub_per_user UNIQUE (user_id)
);

CREATE INDEX idx_brand_hub_user ON brand_hub(user_id);

-- Create content_plans table
CREATE TABLE content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL 
    CHECK (char_length(name) BETWEEN 1 AND 100),
  what_promoting TEXT NOT NULL 
    CHECK (char_length(what_promoting) BETWEEN 10 AND 150),
  goal TEXT CHECK (goal IS NULL OR char_length(goal) <= 300),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  important_date DATE,
  important_date_label TEXT CHECK (
    important_date_label IS NULL OR 
    char_length(important_date_label) <= 50
  ),
  
  sales_channel_type TEXT NOT NULL CHECK (sales_channel_type IN (
    'website', 'etsy', 'amazon', 'shopify', 
    'instagram_shop', 'local_market', 'physical_store', 
    'email_list', 'other'
  )),
  
  platforms TEXT[] NOT NULL CHECK (
    array_length(platforms, 1) BETWEEN 1 AND 3
  ),
  
  shot_list JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_duration CHECK (end_date - start_date BETWEEN 2 AND 90),
  CONSTRAINT valid_important_date CHECK (
    important_date IS NULL OR 
    (important_date BETWEEN start_date AND end_date)
  )
);

CREATE INDEX idx_content_plans_user ON content_plans(user_id);
CREATE INDEX idx_content_plans_dates ON content_plans(start_date, end_date);

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_plan_id UUID NOT NULL 
    REFERENCES content_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  post_number INTEGER NOT NULL CHECK (post_number > 0),
  post_name TEXT NOT NULL 
    CHECK (char_length(post_name) BETWEEN 3 AND 50),
  
  scheduled_date DATE NOT NULL,
  
  post_type TEXT NOT NULL CHECK (post_type IN (
    'image', 'carousel', 'reel', 'story'
  )),
  platforms TEXT[] NOT NULL CHECK (
    array_length(platforms, 1) BETWEEN 1 AND 3
  ),
  
  visual_concept JSONB NOT NULL,
  
  hook TEXT CHECK (hook IS NULL OR char_length(hook) <= 100),
  caption TEXT NOT NULL CHECK (
    char_length(caption) BETWEEN 10 AND 500
  ),
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT post_number_unique_per_plan UNIQUE (
    content_plan_id, post_number
  ),
  CONSTRAINT hook_required_for_reels CHECK (
    post_type NOT IN ('reel', 'story') OR hook IS NOT NULL
  )
);

CREATE INDEX idx_posts_plan ON posts(content_plan_id);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_date ON posts(scheduled_date);
CREATE INDEX idx_posts_status ON posts(status) WHERE NOT deleted;
CREATE INDEX idx_posts_deleted ON posts(deleted) WHERE NOT deleted;

-- Create feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  
  feedback_text TEXT NOT NULL 
    CHECK (char_length(feedback_text) BETWEEN 10 AND 500),
  
  page_url TEXT,
  user_plan TEXT,
  days_since_signup INTEGER,
  campaigns_count INTEGER,
  posts_count INTEGER,
  
  available_for_interview BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX idx_feedback_interview ON feedback(available_for_interview) 
  WHERE available_for_interview = true;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_hub ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY users_policy ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY brand_hub_policy ON brand_hub
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY content_plans_policy ON content_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY posts_policy ON posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY feedback_policy ON feedback
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER brand_hub_updated_at BEFORE UPDATE ON brand_hub
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER content_plans_updated_at BEFORE UPDATE ON content_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed User 1: Sarah Chen (Candle Maker)
INSERT INTO users (id, email, subscription_tier, subscription_status, posts_created_this_period, ai_regenerations_used_this_period, billing_period_start, billing_period_end)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'sarah@emberandoak.com',
  'starter',
  'active',
  0,
  0,
  NOW(),
  NOW() + INTERVAL '30 days'
);

INSERT INTO brand_hub (user_id, business_name, what_you_sell, what_makes_unique, target_customer, brand_vibe_words)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Ember & Oak Candle Co.',
  'Hand-poured soy candles with unique scents',
  'Small-batch candles inspired by cozy moments and seasonal vibes',
  'Women 25-40 who love self-care rituals and creating cozy home spaces',
  ARRAY['Warm', 'Cozy', 'Authentic']
);

-- Seed User 2: Cynthia Martinez (Ice Cream Store)
INSERT INTO users (id, email, subscription_tier, subscription_status, posts_created_this_period, ai_regenerations_used_this_period, billing_period_start, billing_period_end)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'cynthia@sweetscoop.com',
  'growth',
  'active',
  45,
  12,
  NOW(),
  NOW() + INTERVAL '30 days'
);

INSERT INTO brand_hub (user_id, business_name, what_you_sell, what_makes_unique, target_customer, brand_vibe_words)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'Sweet Scoop Ice Cream',
  'Artisan ice cream with rotating seasonal flavors',
  'Local ingredients, creative flavor combinations, nostalgic vibes',
  'Families and millennials looking for unique dessert experiences',
  ARRAY['Playful', 'Fun', 'Creative', 'Friendly']
);

-- Seed User 3: Marcus Johnson (Coffee Shop)
INSERT INTO users (id, email, subscription_tier, subscription_status, posts_created_this_period, ai_regenerations_used_this_period, billing_period_start, billing_period_end)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'marcus@brewhaven.com',
  'starter',
  'active',
  30,
  8,
  NOW(),
  NOW() + INTERVAL '30 days'
);

INSERT INTO brand_hub (user_id, business_name, what_you_sell, what_makes_unique, target_customer, brand_vibe_words)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'Brew Haven Coffee',
  'Specialty coffee and fresh-baked pastries',
  'Third-wave coffee with a neighborhood feel, community gathering space',
  'Remote workers and coffee enthusiasts who value quality and community',
  ARRAY['Warm', 'Professional', 'Authentic']
);

-- Seed User 4: Lisa Park (Jewelry Designer)
INSERT INTO users (id, email, subscription_tier, subscription_status, posts_created_this_period, ai_regenerations_used_this_period, billing_period_start, billing_period_end)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'lisa@goldleafdesigns.com',
  'growth',
  'active',
  120,
  35,
  NOW(),
  NOW() + INTERVAL '30 days'
);

INSERT INTO brand_hub (user_id, business_name, what_you_sell, what_makes_unique, target_customer, brand_vibe_words)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'Gold Leaf Designs',
  'Handcrafted minimalist jewelry',
  'Sustainable materials, timeless designs, each piece tells a story',
  'Professional women 28-45 who appreciate quality craftsmanship',
  ARRAY['Elegant', 'Minimal', 'Sophisticated', 'Timeless']
);
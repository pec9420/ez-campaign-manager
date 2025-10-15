# Product Requirements Document
# Plannit AI - Social Media Content Planning Platform

## Product Overview

Plannit AI is an AI-powered content planning tool designed specifically for small business owners who struggle with consistent social media marketing. The platform generates complete content plans (10-50 posts) based on brand voice, campaign goals, and upcoming important dates.

## Target User

**Primary User: Solo Small Business Owner**
- Running a business with <10 employees
- Wearing multiple hats (not a full-time marketer)
- Struggles with social media consistency
- Knows they need content but doesn't have time/expertise to create strategies
- Budget-conscious (can't afford a full-service agency)
- Needs content that drives actual business results, not just "looks pretty"

**Pain Points:**
- Don't know what to post or when
- Inconsistent posting schedule
- Content feels random, not strategic
- Overwhelmed by the idea of "planning a month of content"
- Unsure how to tie content to business goals
- Don't have time to learn content strategy

## Core Value Proposition

**"You tell us about your business and what you're promoting. We give you a month of strategic content—captions, visuals, and a shot list—ready to create."**

Instead of posting randomly or struggling with blank page syndrome, business owners get a complete content plan that:
- Builds anticipation toward key dates (launches, sales, events)
- Balances promotional, educational, and engagement content
- Maintains their unique brand voice
- Includes practical visual concepts they can execute themselves

## Key Features

### 1. Brand Hub (One-Time Setup)
**Purpose:** Capture the brand's voice, audience, and positioning to inform all content generation.

**Inputs:**
- Business name
- What you sell (products/services)
- 3-5 brand vibe words (e.g., modern, playful, empowering)
- Target customer description
- What makes you unique (value proposition)

**User Experience:**
- Simple step-by-step form
- Guidance/examples for each field
- Optional: Brand color and logo upload (future enhancement)
- Editable at any time

**Output:**
- Saved brand profile used as context for all AI generation

---

### 2. Content Plan Creation
**Purpose:** Define a specific campaign or time period to generate content around.

**Inputs:**
- Campaign name (e.g., "Spring Product Launch")
- What are you promoting? (specific product/service/event)
- Campaign goal (optional but recommended)
- Platforms (Instagram, Facebook, TikTok, LinkedIn)
- Start date → End date (typically 2-4 weeks)
- Important date (e.g., launch date, sale date, event date)
- Sales channel type (Online, In-person, Both)

**User Experience:**
- Wizard-style flow (step by step)
- Clear explanations for each field
- Example campaigns shown for inspiration
- Can create multiple content plans for different campaigns

**Output:**
- Content plan record saved to database
- Triggers AI generation of posts

---

### 3. AI-Powered Post Generation
**Purpose:** Generate 10-50 complete social media posts based on brand + campaign context.

**AI Strategy:**
- **Provider:** OpenAI GPT-5 (strong at structured output, multi-post planning)
- **Post Distribution:**
  - 30% Educational (thought leadership, tips, how-tos)
  - 40% Promotional (product/service selling, offers, CTAs)
  - 30% Engagement (community building, questions, user-generated content prompts)
- **Timeline Strategy:**
  - Early posts: Awareness & education (tease what's coming)
  - Mid-campaign: Build excitement & anticipation
  - Around important date: Launch/conversion focus
  - Post-launch: Testimonials, results, last chance messaging

**Post Structure:**
Each generated post includes:
- **Post Name:** Descriptive title (e.g., "Pre-launch Teaser Day 3")
- **Post Type:** educational, promotional, engagement, testimonial, behind-the-scenes
- **Platforms:** Which platforms it's optimized for
- **Scheduled Date:** Specific date within campaign timeline
- **Hook:** 1-2 sentence attention-grabbing opening
- **Caption:** Full post copy (150-300 words depending on platform)
- **Visual Concept:** Detailed description of photo/video concept
  - Type: Photo or video
  - Description: Angle, framing, focus, composition
  - Props needed
  - Setting/location
  - Style notes (lighting, mood, editing)

**Output:**
- 10-50 posts stored in database
- Displayed in calendar and list views
- Each post is editable

---

### 4. Post Viewing & Editing
**Purpose:** Allow users to review, edit, and customize generated posts.

**Views:**
- **List View:** All posts with key info (name, date, platforms, type)
- **Calendar View:** Posts displayed on calendar by scheduled date
- **Detail View:** Full post with all fields visible

**Editing Capabilities:**
- Edit any field manually (hook, caption, visual concept, date, platforms)
- Regenerate individual fields (caption only, hook only, visual only)
- Regenerate entire post with feedback (e.g., "make this more casual")
- Delete posts
- Add new posts manually

**User Experience:**
- Inline editing where possible
- Clear visual indicators of platform (Instagram icon, etc.)
- Copy-to-clipboard functionality for easy posting
- Export options (CSV, PDF - future enhancement)

---

### 5. AI Regeneration
**Purpose:** Refine posts based on user feedback without starting from scratch.

**Regeneration Types:**
- **Caption regeneration:** Rewrite caption based on feedback
- **Hook regeneration:** New opening line only
- **Visual concept regeneration:** New photo/video concept
- **Full post regeneration:** Completely reimagine post

**AI Strategy:**
- **Provider:** OpenAI GPT-5 (fast, good at iterative refinement)
- **Context:** Original post + brand hub + user feedback
- **Prompt:** Incorporates specific user request (e.g., "make it less salesy", "add emojis")

**Usage Limits by Tier:**
- **Starter:** 5 regenerations/month
- **Pro:** 25 regenerations/month
- **Enterprise:** Unlimited regenerations

**User Experience:**
- "Regenerate" button on each post
- Modal asks: What to regenerate (caption, hook, visual, all) + Feedback text
- Loading state while AI processes
- Shows updated post instantly
- Can undo regeneration

---

### 6. Shot List Generation
**Purpose:** Create a practical filming/photography guide so users can batch-create content efficiently.

**AI Strategy:**
- **Provider:** Anthropic Claude Sonnet 4.5 (superior at creative, detailed descriptions)
- **Inputs:** All posts in content plan + brand context
- **Logic:**
  - Group posts by visual theme, props, and location
  - Prioritize by urgency (posts scheduled sooner = shoot first)
  - Provide DIY-friendly instructions (smartphone, natural lighting)
  - Suggest batch filming sessions (e.g., "Shoot posts 1-5 in one 2-hour session")

**Output Structure:**
- **Visual Themes:** Groupings of similar aesthetic/style
- **Props Needed:** Complete list organized by theme
- **Locations/Settings:** Where to shoot, best time of day
- **Priority Schedule:** What to shoot first based on scheduled dates
- **Batch Sessions:** Recommended filming days with grouped shots
- **DIY Tips:** Smartphone settings, lighting, composition advice

**User Experience:**
- View shot list from content plan page
- Print-friendly format
- Checklist functionality (check off completed shots)

---

### 7. Usage Limits & Subscription Tiers
**Purpose:** Monetization and feature gating based on user's subscription level.

**Subscription Tiers:**

| Feature | Starter | Pro | Enterprise |
|---------|---------|-----|------------|
| **Price** | Free | $29/mo | $79/mo |
| **Posts per plan** | 10 | 50 | Unlimited |
| **Regenerations/month** | 5 | 25 | Unlimited |
| **Content plans** | 1 active | 5 active | Unlimited |
| **Shot list generation** | ✓ | ✓ | ✓ |
| **Export (CSV/PDF)** | ✗ | ✓ | ✓ |
| **Brand Hub** | 1 | 1 | 5+ |
| **Support** | Email | Priority | Dedicated |

**Database Tracking:**
- `users.subscription_tier`: starter, pro, enterprise
- `users.posts_created_this_period`: Counter for post limit enforcement
- `users.ai_regenerations_used_this_period`: Counter for regeneration limit
- `users.billing_period_start` / `billing_period_end`: When counters reset

**Upgrade Prompts:**
- When user hits limit (posts or regenerations), show modal: "Upgrade to Pro to generate 50 posts per plan"
- Freemium approach: Let Starter users experience value before asking for payment

---

## User Flows

### First-Time User Flow
1. **Sign up** (email/password)
2. **Welcome screen** explains the process
3. **Complete Brand Hub** (step-by-step form)
4. **Create first content plan** (wizard)
5. **AI generates posts** (loading state)
6. **View posts** (list or calendar)
7. **Generate shot list**
8. **Edit/regenerate as needed**
9. **Export or start creating content**

### Returning User Flow
1. **Log in**
2. **Dashboard** shows:
   - Active content plans
   - Upcoming scheduled posts
   - Usage stats (posts created, regenerations left)
3. **Click into content plan** to view posts
4. **Regenerate posts** as needed
5. **Create new content plan** when ready

### Regeneration Flow
1. **Click "Regenerate" on a post**
2. **Modal appears:**
   - "What do you want to regenerate?" (Caption, Hook, Visual, All)
   - "What should we change?" (Text input for feedback)
3. **Submit**
4. **AI processes** (5-10 seconds)
5. **Post updates** with new content
6. **Usage counter increments**

---

## Technical Architecture

### Frontend
- **Framework:** React + Vite
- **Routing:** React Router
- **State Management:** React Query (for server state), React Context (for auth)
- **UI Library:** shadcn/ui + Tailwind CSS
- **Form Handling:** React Hook Form + Zod validation

### Backend (Supabase)
- **Database:** PostgreSQL with RLS policies
- **Authentication:** Supabase Auth (email/password, social logins)
- **Edge Functions:** Deno-based serverless functions
  - `generate-content-plan`: Calls OpenAI to generate posts
  - `generate-shot-list`: Calls Claude to generate shot list
  - `regenerate-post`: Calls OpenAI to regenerate specific post fields
  - `check-usage-limits`: Validates user can perform action
- **Storage:** Supabase Storage for brand logos (future enhancement)

### AI Integration
- **OpenAI GPT-5:** Content plan generation, post regeneration
- **Anthropic Claude Sonnet 4.5:** Shot list generation
- **API Keys:** Stored as Supabase secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)

---

## Database Schema

### `brand_hub`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `business_name` (text)
- `what_you_sell` (text)
- `brand_vibe_words` (text[], array of 3-5 words)
- `target_customer` (text)
- `what_makes_unique` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `content_plans`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `name` (text)
- `what_promoting` (text)
- `goal` (text, optional)
- `platforms` (text[], array: ["Instagram", "Facebook", etc.])
- `start_date` (date)
- `end_date` (date)
- `important_date` (date)
- `important_date_label` (text, e.g., "Launch Day")
- `sales_channel_type` (text: online, in-person, both)
- `shot_list` (jsonb, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `posts`
- `id` (uuid, primary key)
- `content_plan_id` (uuid, foreign key → content_plans)
- `user_id` (uuid, foreign key → auth.users)
- `post_number` (integer)
- `post_name` (text)
- `post_type` (text: educational, promotional, engagement, etc.)
- `platforms` (text[], array)
- `scheduled_date` (date)
- `hook` (text, nullable)
- `caption` (text)
- `visual_concept` (jsonb: {type, description, props, setting, style_notes})
- `status` (text: draft, scheduled, posted)
- `deleted` (boolean, default false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `users`
- `id` (uuid, primary key, references auth.users)
- `email` (text)
- `subscription_tier` (text: starter, pro, enterprise)
- `subscription_status` (text: active, cancelled, past_due)
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `posts_created_this_period` (integer, default 0)
- `ai_regenerations_used_this_period` (integer, default 0)
- `billing_period_start` (timestamp)
- `billing_period_end` (timestamp)
- `created_at` (timestamp)

---

## Success Metrics

### User Engagement
- % of users who complete Brand Hub
- % of users who generate at least 1 content plan
- Average posts generated per user per month
- % of users who regenerate posts (indicates engagement)

### Product Performance
- AI generation success rate (posts generated without errors)
- Average time to generate content plan (target: <30 seconds)
- User satisfaction with generated content (survey/feedback)

### Business Metrics
- Conversion rate: Free → Pro
- Churn rate by tier
- Average revenue per user (ARPU)
- Lifetime value (LTV) by cohort

---

## Future Enhancements

### V1.5 (Next Quarter)
- **Platform integrations:** Auto-schedule to Instagram, Facebook via APIs
- **Content calendar export:** CSV, PDF, Google Calendar
- **Post analytics:** Track what content performs best
- **Template library:** Pre-made content plans for common scenarios

### V2.0 (6-12 Months)
- **Visual generation:** Use AI to generate actual images/graphics (DALL-E, Midjourney)
- **Multi-brand support:** Manage multiple businesses from one account
- **Team collaboration:** Share content plans with team/clients
- **Content recycling:** Repurpose top-performing posts for new campaigns

---

## Assumptions & Risks

### Assumptions
- Users understand basic social media concepts (posts, captions, hashtags)
- Users have capability to create visual content (smartphone + basic editing)
- AI-generated content quality is acceptable 80%+ of the time
- Users prefer AI-assisted workflow over starting from scratch

### Risks
- **AI output quality:** Content may be too generic or miss brand voice
- **User overwhelm:** Generating 50 posts might still feel like too much to review/edit
- **Platform changes:** Instagram/Facebook algorithm or formatting changes may break strategy
- **Competition:** Many AI content tools exist; differentiation is key

### Mitigation
- Extensive prompt engineering and testing across diverse brands
- Allow regeneration and manual editing for every post
- Monitor platform changes; update prompts as needed
- Focus on end-to-end workflow (planning → generation → shot list) as differentiator

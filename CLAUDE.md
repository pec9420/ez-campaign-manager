# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Overview

**What This App Does**: A social media content planning tool that helps small business owners generate 30 days of strategic social content in one afternoon using AI. Users describe their brand once, create campaigns, and get AI-generated posts with captions, shot lists, and scheduling—all optimized for batch content creation.

**Target User**: Product-based small business owners (1-5 employees) who struggle with social media consistency. They know they should post regularly but have no system and spend 1-2 hours per post scrambling for ideas.

**Core Value Proposition**: Turn one focused afternoon into 30 days of content—the app generates the strategy, captions, and shot list so users can batch-create everything and stop posting randomly.

## Current Implementation Status

### ✅ FULLY IMPLEMENTED (Backend)

1. **Database Schema** (PostgreSQL via Supabase)
   - `users` table with subscription management and usage tracking
   - `brand_hub` table (one-to-one with users)
   - `content_plans` table (campaigns with shot list JSONB)
   - `posts` table (individual social posts with soft delete)
   - `feedback` table for user feedback collection
   - Row-Level Security (RLS) policies enabled
   - Auto-updating timestamps via triggers
   - Test data seeded (4 sample users with brand hubs)

2. **Authentication** (Supabase Auth)
   - Email/password sign-up and sign-in
   - JWT tokens with 7-day sessions
   - Auto-refresh on page load
   - Auth state management via `useAuth` hook
   - Session persistence in localStorage

3. **Supabase Edge Functions** (AI Backend)
   - `generate-content-plan`: OpenAI GPT-5 generates 10-50 posts based on brand context
   - `regenerate-post`: OpenAI GPT-5 regenerates caption, hook, or visual concept with user feedback
   - `generate-shot-list`: Claude Sonnet 4.5 creates comprehensive shot list from posts
   - `check-usage-limits`: Validates tier limits before actions

4. **Landing Page & Auth Pages**
   - Marketing landing page with hero, features, and CTA
   - Sign up / Sign in pages with email/password authentication
   - 404 error page

5. **UI Component Library**
   - 50+ shadcn/ui components (Radix UI + Tailwind)
   - Custom design system with CSS variables
   - Dark mode support
   - Responsive layouts

### ⚠️ PARTIALLY IMPLEMENTED

1. **Dashboard Page**
   - Basic layout with header and sign-out button
   - Placeholder stats (hardcoded to "0")
   - "Getting Started" UI with setup steps
   - **Missing**: No actual data fetching, no navigation to other pages

### ❌ NOT YET IMPLEMENTED (Frontend)

The following features are documented but have NO UI implementation:

1. **Brand Hub Setup Page** - No form to create/edit brand profile
2. **Campaign Creation Workflow** - No UI to create campaigns or trigger AI generation
3. **Calendar View** - No month grid or post visualization
4. **Post Detail View** - No post editing, regeneration, or approval interface
5. **Shot List View** - No display of generated shot list, checkboxes, or export
6. **Campaign List Page** - No list of user's campaigns
7. **Feedback Widget** - No floating feedback button or modal
8. **Settings/Account Page** - No subscription management UI
9. **Stripe Integration** - No checkout, webhooks, or customer portal

## User Journey Flow (Planned)

1. **Sign Up & Pay** → Stripe Checkout ($15 Starter or $29 Growth/month) ❌ Not implemented
2. **Brand Hub Setup** → One-time brand voice profile ❌ No UI
3. **Create Campaign** → Describe promotion, dates, platforms ❌ No UI
4. **AI Generates Content** → 10-50 posts with captions + shot list ✅ Backend ready, no UI
5. **Review & Edit Posts** → Calendar view to review and customize ❌ No UI
6. **Export Shot List** → Download actionable shooting checklist ❌ No UI
7. **Batch Shoot Content** → One afternoon shooting session covers entire month

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite (runs on http://localhost:8080)
- **Backend/Auth**: Supabase (PostgreSQL + Authentication + Edge Functions)
- **UI Framework**: shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with custom theme variables
- **AI**:
  - OpenAI GPT-5 (`gpt-5-2025-08-07`) for content generation
  - Anthropic Claude Sonnet 4.5 (`claude-sonnet-4-5`) for shot list generation
- **Payments**: Stripe (NOT YET IMPLEMENTED)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/ui/        # shadcn/ui components (DO NOT manually edit)
├── hooks/               # Custom React hooks
│   ├── useAuth.ts      # Authentication state management
│   ├── use-toast.ts    # Toast notifications
│   └── use-mobile.tsx  # Mobile device detection
├── integrations/
│   └── supabase/       # Supabase client and types
│       ├── client.ts   # Auto-generated Supabase client
│       └── types.ts    # Auto-generated database types
├── lib/
│   └── utils.ts        # Utility functions (cn, etc.)
├── pages/              # Route components
│   ├── Index.tsx       # Landing page (complete)
│   ├── Auth.tsx        # Authentication page (complete)
│   ├── Dashboard.tsx   # Main dashboard (skeleton only)
│   └── NotFound.tsx    # 404 page (complete)
├── types/              # TypeScript type definitions
├── App.tsx             # Root app component with routing
└── main.tsx            # Application entry point

supabase/
├── migrations/         # Database schema
│   └── 20251015143508_[...].sql  # Complete schema + seed data
└── functions/          # Deno Edge Functions
    ├── generate-content-plan/    # OpenAI GPT-5 content generation
    ├── regenerate-post/          # OpenAI post regeneration
    ├── generate-shot-list/       # Claude Sonnet 4.5 shot list
    └── check-usage-limits/       # Usage tracking & validation
```

## Database Schema & Business Logic

### users
- **Purpose**: User profiles with subscription management and usage tracking
- **Subscription fields**:
  - `subscription_tier`: "starter" or "growth" (enforced by CHECK constraint)
  - `subscription_status`: "active", "canceled", or "past_due"
  - Stripe IDs, billing period dates
- **Usage tracking**:
  - `posts_created_this_period`: Increments on post creation, decrements on deletion
  - `ai_regenerations_used_this_period`: Increments on regeneration
- **Counter logic**: Resets monthly on `billing_period_start`

### brand_hub
- **Relationship**: One-to-one with users (UNIQUE constraint on user_id)
- **Purpose**: Stores brand voice context that drives all AI generation
- **Fields**:
  - `business_name` (1-100 chars)
  - `what_you_sell` (10-100 chars)
  - `what_makes_unique` (10-100 chars)
  - `target_customer` (10-100 chars)
  - `brand_vibe_words` (array, 3-5 words required)
- **Behavior**: Editable anytime, automatically applied to all campaigns

### content_plans
- **Relationship**: One-to-many with users, one-to-many with posts
- **Purpose**: Campaign container with date ranges and shot list
- **Key fields**:
  - `name` (1-100 chars)
  - `what_promoting` (10-150 chars)
  - `goal` (≤300 chars, optional)
  - `start_date`, `end_date`, `important_date`, `important_date_label`
  - `sales_channel_type`: website, etsy, amazon, shopify, instagram_shop, local_market, physical_store, email_list, other
  - `platforms`: array (1-3 platforms)
  - `shot_list`: JSONB structure with themes, props, locations, priority groups, batch sessions, DIY tips
- **Validation**:
  - Duration: 2-90 days
  - important_date must be within range

### posts
- **Relationship**: Belongs to content_plans and users (both foreign keys)
- **Purpose**: Individual social media posts with AI-generated content
- **Key fields**:
  - `post_number`: Unique per campaign (auto-incremented)
  - `post_name` (3-50 chars)
  - `scheduled_date`: Date within campaign range
  - `post_type`: "image", "carousel", "reel", or "story" (content format)
  - `platforms`: array (1-3 platforms, must match campaign platforms)
  - `visual_concept`: JSONB with type, description, props, setting, style_notes
  - `hook`: Required for reels/stories, ≤100 chars
  - `caption`: 10-500 chars
  - `status`: "draft" or "approved"
  - `deleted`: Soft delete flag (boolean, default false)
- **Soft delete**: Sets `deleted = true` instead of hard delete, decrements user's posts counter
- **Hook requirement**: post_type IN ('reel', 'story') requires non-null hook

### feedback
- **Purpose**: User feedback collection for product iteration
- **Fields**:
  - `user_id`, `user_email`
  - `feedback_text` (10-500 chars)
  - `page_url`, `user_plan`, `days_since_signup`, `campaigns_count`, `posts_count`
  - `available_for_interview` (boolean)
- **Usage**: Review weekly to prioritize MVP 2 features

## Subscription Tiers & Usage Limits

⚠️ **IMPORTANT**: There is a mismatch between database schema and Edge Function implementation.

### Database Schema (users table)
- Tier field: `subscription_tier` with CHECK constraint: "starter" or "growth"
- No "pro" or "enterprise" tier exists in database

### Edge Function Implementation (generate-content-plan)
```typescript
const postLimits: Record<string, number> = {
  starter: 10,    // 10 posts per campaign
  pro: 50,        // 50 posts per campaign
  enterprise: 100 // 100 posts per campaign
};
```

### ⚠️ TODO: Align Tier Naming & Limits
**Option 1**: Update database to match Edge Function tiers (starter/pro/enterprise)
**Option 2**: Update Edge Function to match database tiers (starter/growth)

**Recommended Option 2 Limits**:
- **Starter Tier**: 10-15 posts per campaign, 5 regenerations per month
- **Growth Tier**: 30-50 posts per campaign, 25 regenerations per month

Currently undefined:
- Monthly post limits (posts_created_this_period counter exists but no enforcement in UI)
- AI regeneration limits (ai_regenerations_used_this_period counter exists but no enforcement)

## AI Integration Strategy

### Campaign Generation (generate-content-plan)

**Edge Function**: `/supabase/functions/generate-content-plan/index.ts`

- **Trigger**: User submits campaign creation form (NO UI YET)
- **AI Model**: OpenAI GPT-5 (`gpt-5-2025-08-07`)
- **Method**: Tool calling with structured output for guaranteed JSON schema
- **Input Context**: Brand Hub data + campaign form data
- **Process**:
  1. Fetches brand hub and content plan from database
  2. Determines post limit based on subscription tier (starter=10, pro=50, enterprise=100)
  3. Builds system prompt with content strategy principles
  4. Builds user prompt with brand context and campaign details
  5. Calls OpenAI with `create_content_posts` tool definition
  6. Parses structured JSON output
  7. Inserts posts into database
  8. Updates user's `posts_created_this_period` counter
- **Output**: 10-50 posts (depending on tier) with:
  - Post name, type (educational/promotional/engagement/testimonial/behind-the-scenes)
  - Scheduled date, platforms
  - Hook (for reels/stories), caption
  - Visual concept (type, description, props, setting, style_notes)
- **Prompt Strategy**:
  - Uses brand vibe words for tone
  - Strategic content arc: awareness → consideration → conversion
  - Distributes posts across date range (not every day)
  - Ramps up frequency near important_date
  - Creates actionable visual concepts achievable with smartphone
- **Timing**: 30-45 seconds (no loading UI yet)
- **Error Handling**: Try/catch with error response (no retry logic implemented)

### Shot List Generation (generate-shot-list)

**Edge Function**: `/supabase/functions/generate-shot-list/index.ts`

- **Trigger**: After campaign posts are generated (no automated trigger or UI yet)
- **AI Model**: Anthropic Claude Sonnet 4.5 (`claude-sonnet-4-5`)
- **Input Context**: Brand Hub + all posts in campaign
- **Process**:
  1. Fetches content plan, brand hub, and all posts
  2. Builds system prompt with visual strategy principles
  3. Formats posts for AI consumption (name, type, date, platforms, visual concept)
  4. Builds user prompt requesting structured JSON shot list
  5. Calls Anthropic Messages API
  6. Parses JSON response
  7. Updates content_plans.shot_list JSONB field
- **Output Structure**:
  ```json
  {
    "themes": [...],           // Visual themes with mood descriptions
    "props": [...],            // Props needed, organized by theme
    "locations": [...],        // Shooting locations with setup notes
    "priority": {              // Shots grouped by urgency
      "urgent": {...},
      "medium": {...},
      "flexible": {...}
    },
    "batch_sessions": [...],   // Grouped shooting sessions for efficiency
    "diy_tips": [...]          // Practical photography tips
  }
  ```
- **Timing**: 30-45 seconds (no loading UI yet)
- **Error Handling**: Try/catch with error response

### Caption/Hook Regeneration (regenerate-post)

**Edge Function**: `/supabase/functions/regenerate-post/index.ts`

- **Trigger**: User clicks [Regenerate with AI] in post detail view (NO UI YET)
- **AI Model**: OpenAI GPT-5 (`gpt-5-2025-08-07`)
- **Input Context**: Brand Hub + campaign context + current post content + user feedback
- **Process**:
  1. Fetches post, content plan, and brand hub
  2. Determines what to regenerate (caption/hook/visual_concept/all)
  3. Builds targeted prompt based on regeneration type
  4. Calls OpenAI (likely with tool calling, needs verification)
  5. Updates post in database
  6. Increments user's `ai_regenerations_used_this_period` counter
- **Credit Usage**: Consumes 1 AI credit per regeneration (no enforcement yet)
- **Enforcement**: Button disabled if user at credit limit (no UI yet)
- **Auto-save**: Immediately saves regenerated content

### Brand Context Usage
All AI generation uses brand hub data:
- `business_name`: Personalization and brand voice
- `what_you_sell`: Product/service context for relevance
- `what_makes_unique`: Differentiation and positioning
- `target_customer`: Audience targeting and tone
- `brand_vibe_words`: Tone and style guidance (warm, authentic, playful, etc.)

## Key Architecture Patterns

### Authentication Flow

- Authentication is handled via the `useAuth` hook (src/hooks/useAuth.ts)
- The hook manages session state and provides user, session, and loading states
- Auth state changes are tracked via Supabase's `onAuthStateChange` listener
- Protected routes should check authentication state and redirect to `/auth` if needed
- Currently supports: Email/password only
- Documented but not implemented: Magic links, Google OAuth

### Routing

Routes are defined in `src/App.tsx`:
- `/` - Landing page (complete)
- `/auth` - Authentication/sign-in page (complete)
- `/dashboard` - Main dashboard (skeleton only)
- `*` - 404 error page (complete)

Add custom routes ABOVE the catch-all `*` route.

### State Management

- Server state: TanStack Query (React Query) for data fetching and caching
- UI state: React useState/useReducer
- Form state: React Hook Form + Zod validation
- Toast notifications: Sonner (via `toast()` from 'sonner')

### Supabase Integration

- Client is initialized in `src/integrations/supabase/client.ts`
- Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Import the client: `import { supabase } from "@/integrations/supabase/client"`
- Database types are auto-generated and should not be manually edited
- Row-Level Security (RLS) policies ensure users only access their own data
- Edge Functions require: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Stripe Integration (NOT YET IMPLEMENTED)

- **Checkout**: Hosted by Stripe (no custom payment UI)
- **Customer Portal**: Hosted by Stripe for subscription management
- **Webhooks Required**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- **Webhook Handler**: Supabase Edge Function updates subscription status and counters (NOT CREATED YET)
- **Upgrade Flow**: Stripe API handles proration automatically

### Styling Conventions

- Uses Tailwind CSS with custom CSS variables for theming
- Custom gradients: `bg-gradient-primary`, `bg-gradient-hero`, `bg-gradient-subtle`
- Custom shadows: `shadow-glow`, etc.
- Dark mode supported via `class` strategy
- Path alias: `@/` maps to `./src/`
- Design system colors:
  - Primary: Purple (265, 65%, 58%)
  - Accent: Coral (15, 90%, 68%)
  - Success: Green (145, 65%, 55%)

## Key Constraints & Validations

### Character Limits
- Brand Hub fields: 100 characters (except vibe words array: 3-5 words)
- Campaign name: 100 characters
- What promoting: 150 characters
- Goal: 300 characters (optional)
- Post name: 50 characters
- Hook: 100 characters (reels/stories only)
- Caption: 500 characters
- Feedback text: 500 characters

### Date Range Validations
- Campaign duration: 2-90 days
- end_date must be >= start_date
- important_date must be within campaign date range

### Array Constraints
- Brand vibe words: 3-5 words required
- Platforms: 1-3 platforms per campaign
- Posts must have matching platforms from parent campaign

### Post Type Rules
- Hook is required for reels and stories
- Hook must be null for images and carousels
- Visual concept must reference valid shots from campaign shot_list
- **Note**: There are two "post type" concepts in the system:
  1. **Content Format Type** (database field): image, carousel, reel, story
  2. **Content Strategy Type** (AI generation): educational, promotional, engagement, testimonial, behind-the-scenes
  - These are stored separately and serve different purposes

## MVP 1 Development Priorities

### Phase 1: Core Content Creation Flow (CURRENT)
✅ Database schema
✅ Authentication
✅ AI Edge Functions (backend)
❌ Brand Hub UI (create/edit form)
❌ Campaign Creation UI (form + AI generation trigger)
❌ Calendar View (month grid with post cards)
❌ Post Detail View (edit, regenerate, approve, delete)
❌ Shot List View (display, checkboxes, export to TXT)
❌ Campaign List View (list all campaigns, delete)

### Phase 2: Subscription & Payments
❌ Stripe Checkout integration
❌ Webhook handler Edge Function
❌ Subscription status enforcement
❌ Usage limits UI (upgrade modals when limits hit)
❌ Customer Portal link

### Phase 3: Polish & Feedback
❌ Feedback widget (floating button, modal form)
❌ Dashboard with real stats
❌ Loading states for AI generation (30-45 second wait)
❌ Error recovery flows
❌ Email verification enforcement
❌ Settings/account page

### Intentionally Excluded (Add Based on User Feedback)
❌ Add individual posts (outside of campaigns)
❌ Advanced analytics/performance tracking
❌ Drag-and-drop calendar
❌ Bulk actions (delete multiple posts)
❌ Campaign templates or duplication
❌ Post scheduling/auto-posting to platforms
❌ Team collaboration features
❌ Content library
❌ Hashtag generator

**Decision Rule**: Only build excluded features if 5+ users explicitly request them. Focus on core value: helping users plan 30 days of content in one afternoon.

## TypeScript Configuration

- `noImplicitAny: false` - implicit any is allowed
- `strictNullChecks: false` - null checking is relaxed
- `noUnusedLocals: false` and `noUnusedParameters: false` - unused code warnings disabled
- These relaxed settings are intentional for rapid MVP development

## Environment Setup

1. Copy `.env` and configure Supabase credentials:
   ```
   VITE_SUPABASE_PROJECT_ID=your_project_id
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   ```

2. Configure Edge Function secrets in Supabase dashboard:
   ```
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Ensure Supabase project is set up with the migrations in `supabase/migrations/`

4. ⚠️ Stripe configuration not yet implemented

## Important Development Notes

- All UI components in `src/components/ui/` are from shadcn/ui and follow their patterns
- When adding new routes, always add them BEFORE the catch-all `*` route in App.tsx
- Supabase client uses localStorage for session persistence with auto-refresh enabled
- The app runs on port 8080 by default (configured in vite.config.ts)
- Always use soft delete for posts (set `deleted = true`) to maintain counter accuracy
- Usage counters must be updated atomically with post creation/deletion
- Brand Hub is one-to-one with users—enforce this in UI logic
- Shot list is stored as JSONB in content_plans, visual concepts reference these shots
- AI generation should take 30-45 seconds—show loading states (not implemented)
- All AI prompts should use brand context from brand_hub table
- RLS policies enforce data isolation—users can only access their own data
- Test subscription webhooks thoroughly in Stripe test mode before production (when implemented)

## Testing Notes

**Stripe Test Cards** (when implemented):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

**Key Flows to Test** (when UI is built):
1. Sign up → Brand Hub setup → Campaign creation → Review posts → Export shot list
2. Create campaign → Usage counter increments
3. Delete post → Usage counter decrements
4. Reach post limit → Block campaign creation → Show upgrade modal
5. Regenerate post → AI credit counter increments
6. Reach AI limit → Disable regenerate button → Show upgrade modal

## Known Issues & TODOs

1. **Tier Naming Inconsistency**: Database has "starter/growth", Edge Function has "starter/pro/enterprise"
2. **Usage Limit Enforcement**: Counters exist in database but no UI enforcement
3. **Post Type Ambiguity**: "post_type" field stores content format (image/reel), but AI generates strategy type (educational/promotional). Need to clarify data model.
4. **No UI Implementation**: All core MVP features are backend-only
5. **No Stripe Integration**: Payment processing not implemented
6. **No Error Recovery**: Edge Functions have basic try/catch but no retry logic or user-facing error handling
7. **No Loading States**: AI generation takes 30-45 seconds with no user feedback
8. **Shot List Not Auto-Generated**: No trigger to automatically call generate-shot-list after campaign creation
9. **Test Data**: 4 seeded users exist in database, may want to clean up before production

## Next Immediate Steps

To continue building this MVP, prioritize in this order:

1. **Resolve Tier Naming** - Align database schema with Edge Function implementation
2. **Brand Hub Page** (`/brand-hub`) - Form with validation, display existing hub
3. **Campaign Creation Page** (`/campaign/create`) - Form + AI generation trigger + loading state
4. **Campaign List** (`/campaigns`) - Query user's content plans, show post count
5. **Calendar View** (`/campaign/:id/calendar`) - Month grid with posts
6. **Post Detail** (`/campaign/:id/post/:postId`) - Display + edit + regenerate + approve
7. **Shot List** (`/campaign/:id/shot-list`) - Display JSONB + checkboxes + export TXT
8. **Stripe Integration** - Checkout + webhooks + subscription management

---

**Last Updated**: Based on codebase analysis as of current commit
**Database Migration**: `20251015143508_a0c9c542-eb14-4d33-955f-f4ef93ae2f94.sql`
**Backend Status**: Complete (database + auth + Edge Functions)
**Frontend Status**: Minimal (landing + auth pages only, dashboard is skeleton)

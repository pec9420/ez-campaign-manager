# Content Plan Generator: Testing & Deployment Guide

## Overview

The content plan generator has been redesigned to use a **strategic blueprint approach** with proper database columns instead of JSON blobs. This creates a clean separation between strategy planning and tactical execution.

---

## What Changed

### 1. Architecture Shift

**OLD**: Single-agent generates complete posts (strategy + copy + visuals all at once)
**NEW**: Multi-agent pipeline with clear separation:

```
Content Plan Agent → Strategic Blueprints (this PR)
    ↓
User reviews strategy
    ↓
Copywriting Agent → Captions & Hooks (future)
    ↓
Shot List Agent → Visual Details (future)
```

### 2. Database Schema

**content_plans table - NEW COLUMN:**
- `offers_promos` TEXT (≤300 chars, nullable) - Promotional offers to strategically integrate

**posts table - NEW COLUMNS:**
- `strategy_type` - Educational, promotional, engagement, testimonial, behind-the-scenes
- `purpose` - One-sentence objective (≤150 chars)
- `core_message` - Main takeaway (≤150 chars)
- `behavioral_trigger` - FOMO, scarcity, curiosity, trust, nostalgia, belonging, reciprocity, urgency
- `format` - reel, carousel, photo, story, video, update, offer, event, product
- `tracking_focus` - views, saves, shares, comments, clicks, DMs, redemptions, attendance
- `cta` - Call-to-action text (≤100 chars)

**posts table - NOW NULLABLE:**
- `caption` - Filled by copywriting agent (future)
- `visual_concept` - Filled by shot list agent (future)
- `hook` - Already nullable

### 3. Prompt Engineering

**System Prompt:**
- Focuses on strategic planning, NOT copywriting
- Emphasizes behavioral psychology triggers
- Aligns metrics with funnel stages

**User Prompt Additions:**
- Includes `offers_promos` context
- **CRITICAL constraint**: If offers_promos = "None", AI must NOT invent promotions
- Strategic distribution rules (30/30/30/10 funnel mix, 40/30/30 content mix)
- Platform-specific format logic

### 4. Test Script

Tests 3 campaign scenarios:
1. **Holiday Gift Card Push** - HAS promotional offer
2. **New Flavors: Chai & Matcha** - NO promotional offer (storytelling)
3. **Ingredient Deep-Dive** - NO promotional offer (educational)

Evaluates:
- Strategy mix (awareness/consideration/conversion/retention %)
- Content mix (promotional/educational/engagement %)
- Behavioral trigger usage
- Format distribution
- Timeline distribution
- Score /100

---

## Files Modified

### Database Migration
- ✅ `supabase/migrations/20251016_add_content_strategy_fields.sql` - NEW

### Edge Function
- ✅ `supabase/functions/generate-content-plan/index.ts`:
  - Updated system prompt (strategic planner, not copywriter)
  - Updated user prompt (includes offers_promos, strategic rules)
  - Updated OpenAI tool schema (new fields)
  - Updated database insertion logic (columns instead of JSONB)

### Test Script
- ✅ `scripts/test-content-plan-generator.ts`:
  - Added offers_promos to test campaigns
  - Updated evaluation to read from columns
  - Comprehensive scoring system

### Documentation
- ✅ `docs/prompts/content-plan-generation.md` - Already referenced `{offer_promotion}` variable
- ✅ `docs/CONTENT_PLAN_TESTING.md` - This file!

---

## Manual Steps Required

### Step 1: Apply Database Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to: https://supabase.com/dashboard/project/sukyrypnsoyvlxrezlgv/sql-editor
2. Open: `supabase/migrations/20251016_add_content_strategy_fields.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"

**Option B: Via Supabase CLI**
```bash
supabase db push --project-ref sukyrypnsoyvlxrezlgv
```

### Step 2: Deploy Updated Edge Function

```bash
supabase functions deploy generate-content-plan --project-ref sukyrypnsoyvlxrezlgv
```

### Step 3: Set Environment Variables for Test Script

```bash
export SUPABASE_URL="https://sukyrypnsoyvlxrezlgv.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

⚠️ **Where to find service role key:**
Dashboard → Settings → API → `service_role` secret (not `anon` public key)

### Step 4: Run Test Script

```bash
deno run --allow-net --allow-env scripts/test-content-plan-generator.ts
```

**Expected output:**
```
═══════════════════════════════════════════════════════════════════════════════
CONTENT PLAN GENERATOR TEST RESULTS
═══════════════════════════════════════════════════════════════════════════════

Holiday Gift Card Push
───────────────────────────────────────────────────────────────────────────────
Score: 90/100
Total Posts: 20

Strategy Mix (Funnel Stages):
  Awareness:      6 posts (30.0%) [target: 30%]
  Consideration:  6 posts (30.0%) [target: 30%]
  Conversion:     6 posts (30.0%) [target: 30%]
  Retention:      2 posts (10.0%) [target: 10%]

Content Mix:
  Promotional:    8 posts (40.0%) [target: 40%]
  Educational:    6 posts (30.0%) [target: 30%]
  Engagement:     6 posts (30.0%) [target: 30%]
  ...

✅ All criteria met!
```

---

## Evaluation Criteria

The test script scores each campaign on:

### Strategy Mix (30/30/30/10)
- **Awareness** (30%): Tracking focus = views/reach
- **Consideration** (30%): Tracking focus = shares/saves/clicks
- **Conversion** (30%): Tracking focus = DMs/sign-ups/redemptions
- **Retention** (10%): Tracking focus = comments/attendance

**Penalty**: -10 points if any stage deviates >10% from target

### Content Mix (40/30/30)
- **Promotional** (40%): strategy_type = promotional
- **Educational** (30%): strategy_type = educational
- **Engagement** (30%): strategy_type = engagement

**Penalty**: -10 points if any type deviates >15% from target

### Timeline Distribution
- Posts should spread across multiple dates (not all on same day)
- Should ramp up near important_date

**Penalty**: -10 points if concentrated on <50% of available dates

### Behavioral Triggers
- Should use variety of triggers (FOMO, curiosity, trust, etc.)
- Should align with funnel stage (FOMO for conversion, trust for consideration)

### Format Distribution
- Should match platform logic (Instagram Reels for reach, Carousels for education)
- Should vary across campaign (not all reels)

---

## Debugging Common Issues

### Migration Fails: "column already exists"
**Solution**: Migration was already applied. Skip to Step 2 (deploy function).

### Edge Function Error: "offers_promos not found"
**Cause**: Migration not applied yet
**Solution**: Complete Step 1 first

### Test Script Error: "blueprint is undefined"
**Cause**: Old test code expecting JSONB blueprint
**Solution**: Code is already updated to use columns. Re-pull latest.

### AI Invents Promotions When None Exist
**Symptom**: Campaign 2 or 3 includes fake sales/discounts
**Cause**: Prompt constraint not strong enough
**Solution**: This is a prompt iteration issue. Document in results and we'll refine.

### Posts Concentrated on Few Dates
**Symptom**: Timeline distribution score penalty
**Cause**: Prompt needs stronger "evenly distributed" guidance
**Solution**: Document and iterate on prompt.

---

## Next Steps After Testing

1. **Review Test Results**: Look for patterns in which campaigns score well vs. poorly
2. **Identify Prompt Weaknesses**:
   - Are strategy/content mixes off?
   - Are behavioral triggers poorly chosen?
   - Are formats mismatched to platforms?
3. **Iterate on Prompt**: Refine system/user prompts based on failures
4. **Re-test**: Run test script again with updated prompts
5. **Repeat**: Until average score >85/100 across all campaigns

---

## Questions to Answer After Testing

- [ ] Does the AI respect the "no invented promotions" constraint?
- [ ] Are behavioral triggers appropriately matched to funnel stages?
- [ ] Do posts distribute evenly across the timeline with ramp-up near important_date?
- [ ] Are strategy/content mixes hitting targets (30/30/30/10, 40/30/30)?
- [ ] Are formats appropriate for each platform?
- [ ] Do purpose/core_message fields provide clear strategic value?
- [ ] Are CTAs aligned with tracking_focus and funnel stage?

---

## Future Work (Not In Scope Yet)

- Copywriting agent to fill `caption` and `hook` fields
- Shot list agent to fill `visual_concept` field
- UI to display strategy fields and allow editing
- Analytics to track which behavioral triggers perform best
- A/B testing framework for prompt variations

---

## Success Metrics

**Minimum Viable Prompt:**
- Average score across 3 test campaigns: **≥85/100**
- No invented promotions when offers_promos = null: **100% compliance**
- Strategy mix within ±10% of target: **100% of campaigns**
- Content mix within ±15% of target: **100% of campaigns**

**Ready for Production:**
- Average score: **≥90/100**
- All criteria met with no issues flagged
- Manual review of 10+ generated posts confirms quality and strategy alignment

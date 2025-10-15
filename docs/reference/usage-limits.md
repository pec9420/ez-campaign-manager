# Usage Limits & Subscription Tiers

## Overview

Plannit AI uses a **freemium subscription model** with usage-based limits to balance free value with revenue generation. Users start on the **Starter** (free) tier and can upgrade to **Pro** or **Enterprise** for higher limits and additional features.

---

## Subscription Tiers

| Feature | Starter (Free) | Pro | Enterprise |
|---------|---------------|-----|------------|
| **Monthly Price** | $0 | $29/month | $79/month |
| **Posts per Content Plan** | 10 | 50 | Unlimited |
| **AI Regenerations per Month** | 5 | 25 | Unlimited |
| **Active Content Plans** | 1 | 5 | Unlimited |
| **Brand Hubs** | 1 | 1 | 5 |
| **Shot List Generation** | ✓ | ✓ | ✓ |
| **Export (CSV/PDF)** | ✗ | ✓ | ✓ |
| **Platform Scheduling Integration** | ✗ | ✗ | ✓ (Future) |
| **Priority Support** | Email (48hr) | Email (24hr) | Dedicated Slack |
| **Custom AI Training** | ✗ | ✗ | ✓ (Future) |

---

## Limit Definitions

### 1. Posts per Content Plan
**What it counts:** Number of individual posts generated when a content plan is created.

**How it works:**
- When a user creates a content plan and clicks "Generate Content," the AI generates X posts based on their tier.
- **Starter:** Generates exactly 10 posts
- **Pro:** Generates up to 50 posts
- **Enterprise:** Generates as many posts as needed to cover the campaign timeline (no hard limit)

**Tracking:**
- Stored in `users.posts_created_this_period`
- Incremented each time `generate-content-plan` edge function runs
- Resets at the start of each billing period

**Upgrade Trigger:**
- When a Starter user completes Brand Hub and tries to generate a second content plan, show modal:
  > "You've used your 10 free posts this month. Upgrade to Pro to generate up to 50 posts per plan."

---

### 2. AI Regenerations per Month
**What it counts:** Number of times a user uses the "Regenerate" feature on individual posts.

**How it works:**
- Each time a user clicks "Regenerate" on a post (caption, hook, visual, or full post), it counts as 1 regeneration.
- **Starter:** 5 regenerations/month
- **Pro:** 25 regenerations/month
- **Enterprise:** Unlimited regenerations

**Tracking:**
- Stored in `users.ai_regenerations_used_this_period`
- Incremented each time `regenerate-post` edge function runs
- Resets at the start of each billing period

**Upgrade Trigger:**
- When a user hits their limit, show modal on regeneration attempt:
  > "You've used all 5 regenerations this month. Upgrade to Pro for 25 regenerations per month, or wait until your limit resets on [date]."

**Important:** Manual edits (typing into fields) do NOT count as regenerations. Only AI-powered regenerations count.

---

### 3. Active Content Plans
**What it counts:** Number of content plans a user can have "in progress" at once.

**How it works:**
- **Starter:** Can have 1 active content plan at a time (must archive or delete before creating a new one)
- **Pro:** Can have up to 5 active content plans simultaneously
- **Enterprise:** Unlimited active plans

**Tracking:**
- Queried from `content_plans` table (count where `user_id = current_user AND deleted = false`)
- Checked before allowing new content plan creation

**Upgrade Trigger:**
- When Starter user tries to create a second content plan while one is active:
  > "You can only have 1 active content plan on the Starter tier. Upgrade to Pro to manage up to 5 plans at once, or archive your current plan first."

**Note:** "Active" means not deleted. There's no "archive" status yet (future enhancement).

---

### 4. Brand Hubs
**What it counts:** Number of brand profiles a user can create and save.

**How it works:**
- **Starter & Pro:** 1 brand hub (for single-brand businesses)
- **Enterprise:** Up to 5 brand hubs (for agencies managing multiple clients)

**Tracking:**
- Queried from `brand_hub` table (count where `user_id = current_user`)
- Checked before allowing new brand hub creation

**Upgrade Trigger:**
- If a user tries to create a second brand hub:
  > "Upgrade to Enterprise to manage up to 5 brands (perfect for agencies and multi-brand businesses)."

**Use Case:** Agencies or entrepreneurs managing multiple brands need this feature.

---

## Billing Period & Counter Resets

### Billing Period Tracking
- `users.billing_period_start` (timestamp)
- `users.billing_period_end` (timestamp)

**How it works:**
- When a user signs up, `billing_period_start` = signup date, `billing_period_end` = 30 days later
- When a user upgrades to Pro/Enterprise, `billing_period_start` = upgrade date (pro-rated or new cycle starts)
- Every 30 days, billing period resets

### Automatic Counter Resets
A database trigger (`reset_usage_counters`) resets usage counters when the billing period rolls over:

```sql
CREATE OR REPLACE FUNCTION reset_usage_counters()
RETURNS trigger AS $$
BEGIN
  IF NEW.billing_period_start > OLD.billing_period_end THEN
    NEW.posts_created_this_period = 0;
    NEW.ai_regenerations_used_this_period = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**User Experience:**
- Users see their limits reset on the same day each month (e.g., if they signed up on Jan 15, limits reset on Feb 15, Mar 15, etc.)
- Dashboard displays: "Your limits reset in 12 days"

---

## Limit Enforcement Logic

### `check-usage-limits` Edge Function

This function is called before any usage-counted action:

**Input:**
```json
{
  "userId": "uuid",
  "action": "create_posts" | "regenerate" | "create_content_plan" | "create_brand_hub"
}
```

**Logic:**
1. Fetch user's subscription tier and current usage counters
2. Check if user has remaining capacity for the requested action
3. Return allowed/denied status

**Output:**
```json
{
  "allowed": true,
  "currentUsage": 3,
  "limit": 10,
  "upgradeRequired": false
}
```

**Frontend Usage:**
- Before calling `generate-content-plan` or `regenerate-post`, check limits
- If `allowed: false`, show upgrade modal instead of calling the AI function

---

## Upgrade Prompts & Modals

### Modal Content Examples

**When Starter user hits post limit:**
> **You've Hit Your Free Limit**  
> You've generated 10 posts this month. Upgrade to Pro to generate up to 50 posts per content plan.  
> [View Plans] [Maybe Later]

**When user hits regeneration limit:**
> **Out of Regenerations**  
> You've used all 5 AI regenerations this month. Upgrade to Pro for 25 regenerations/month.  
> **Your limits reset on [date].**  
> [Upgrade to Pro] [Cancel]

**When Starter user tries to create a second content plan:**
> **Need More Content Plans?**  
> Your Starter plan allows 1 active content plan. Upgrade to Pro to manage up to 5 campaigns at once.  
> [Upgrade to Pro] [Archive Current Plan]

**When user tries to create a second brand hub:**
> **Managing Multiple Brands?**  
> Enterprise users can manage up to 5 brand hubs—perfect for agencies and multi-brand businesses.  
> [Upgrade to Enterprise] [Cancel]

### Modal Design Guidelines
- **Clear value prop:** What do they get by upgrading?
- **Show current usage:** "You've used 5/5 regenerations"
- **Soft CTA:** "Maybe Later" option (not pushy)
- **Reset date visibility:** "Your limits reset on Feb 15" (reduces frustration)

---

## Pricing Strategy

### Starter (Free) Tier
**Purpose:** Let users experience value before asking for payment

**Target User:**
- Testing the tool
- Single campaign with 10 posts is enough for now
- Low editing needs (5 regenerations sufficient)

**Conversion Goal:** Get them to generate a content plan, see the value, then hit a limit and upgrade

---

### Pro Tier ($29/month)
**Purpose:** Core paid tier for serious small business owners

**Target User:**
- Runs multiple campaigns per month
- Needs more posts per plan (30-50 posts)
- Iterates on content (needs more regenerations)
- Managing 2-5 ongoing campaigns

**Value Prop:**
- 5x more posts per plan
- 5x more regenerations
- Multiple active campaigns
- Export functionality

**Conversion Goal:** Make this the obvious choice for anyone using the tool regularly

---

### Enterprise Tier ($79/month)
**Purpose:** For agencies, multi-brand businesses, or power users

**Target User:**
- Agencies managing multiple clients
- Businesses with multiple brands
- Power users needing unlimited regenerations

**Value Prop:**
- Unlimited posts per plan
- Unlimited regenerations
- 5 brand hubs (manage multiple clients/brands)
- Priority support
- Future: Custom AI training, scheduling integrations

**Conversion Goal:** Convert Pro users who hit limits OR attract agencies from the start

---

## Future Enhancements

### V1.5: Usage Analytics Dashboard
Show users:
- Posts generated this month vs. limit
- Regenerations used vs. limit
- When limits reset
- Upgrade prompts based on behavior

### V2.0: Pay-As-You-Go Option
For users who don't want a subscription:
- $5 for 10 posts
- $10 for 25 regenerations
- No monthly commitment

### V2.0: Team Plans
For agencies:
- $149/month for 3 users
- Shared brand hubs
- Collaborative editing

---

## Limit Tracking Best Practices

1. **Always check limits before calling AI functions** (don't waste API calls on denied requests)
2. **Show usage indicators in UI** ("You've used 3/5 regenerations this month")
3. **Provide upgrade CTA contextually** (when user hits limit, not randomly)
4. **Reset counters reliably** (database trigger ensures no manual reset needed)
5. **Log limit-hit events** (analytics to see where users are getting blocked)

---

## Database Queries for Limit Checking

### Check Posts Created This Period
```sql
SELECT posts_created_this_period, subscription_tier
FROM users
WHERE id = auth.uid();
```

### Check Regenerations Used This Period
```sql
SELECT ai_regenerations_used_this_period, subscription_tier
FROM users
WHERE id = auth.uid();
```

### Check Active Content Plans
```sql
SELECT COUNT(*)
FROM content_plans
WHERE user_id = auth.uid() AND deleted = false;
```

### Check Brand Hubs
```sql
SELECT COUNT(*)
FROM brand_hub
WHERE user_id = auth.uid();
```

---

## Subscription Status

### Possible Values for `users.subscription_status`
- **active:** Subscription is current and user has full access
- **past_due:** Payment failed, grace period (still has access but show warning)
- **cancelled:** Subscription cancelled but still within paid period (access until `billing_period_end`)
- **expired:** Subscription ended, downgrade to Starter limits

### Grace Period Handling
- If payment fails (Stripe webhook), set `subscription_status = 'past_due'`
- User retains access for 3 days (show banner: "Payment failed. Update card to keep access.")
- After 3 days, downgrade to Starter limits

---

## Final Takeaway

**Limits exist to drive upgrades, not frustrate users.**

The Starter tier should provide enough value to showcase the tool's power (10 posts = a real content plan).  
Pro tier removes frustration and enables serious use.  
Enterprise tier caters to agencies and power users.

The goal: Make users WANT to upgrade because they've experienced the value, not because they hit an arbitrary wall.

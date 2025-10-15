# Content Plan Generation Prompt

## Context Variables

The following variables are injected into the prompt from the database:

### Brand Hub Data
- `{business_name}` - Business name
- `{what_you_sell}` - Products/services description
- `{brand_vibe_words}` - Array of 3-5 brand personality words
- `{target_customer}` - Target audience description
- `{what_makes_unique}` - Unique value proposition

### Content Plan Data
- `{campaign_name}` - Name of the content plan
- `{what_promoting}` - Specific product/service being promoted
- `{goal}` - Campaign goal (optional)
- `{platforms}` - Array of platforms (Instagram, Facebook, TikTok, etc.)
- `{start_date}` - Campaign start date
- `{end_date}` - Campaign end date
- `{important_date}` - Key date (launch, sale, event) with label
- `{sales_channel_type}` - Online, In-person, Both

### User Subscription Data
- `{post_limit}` - Number of posts to generate (10, 50, or unlimited)

## Full Prompt Template

```
Generate a complete content plan for {business_name}.

BRAND CONTEXT:
- Business: {business_name}
- What they sell: {what_you_sell}
- Brand vibe: {brand_vibe_words}
- Target customer: {target_customer}
- What makes them unique: {what_makes_unique}

CAMPAIGN DETAILS:
- Campaign name: {campaign_name}
- What we're promoting: {what_promoting}
- Goal: {goal}
- Platforms: {platforms}
- Timeline: {start_date} to {end_date}
- Important date: {important_date} ({important_date_label})
- Sales channel: {sales_channel_type}

TASK:
Create {post_limit} social media posts that:
1. Build anticipation leading up to {important_date}
2. Mix promotional content (40%) with educational (30%) and engagement (30%) posts
3. Maintain the brand voice ({brand_vibe_words})
4. Drive the campaign goal: {goal}
5. Are optimized for each platform in {platforms}

POST DISTRIBUTION STRATEGY:
- Week 1-2: Awareness & education (tease what's coming)
- Week 3: Build excitement & anticipation
- Week 4: Launch & conversion focus
- After launch: Testimonials, results, last chance messaging

For each post, provide:
1. **post_name**: Descriptive title (e.g., "Pre-launch Teaser", "Behind the Scenes Day 3")
2. **post_type**: educational, promotional, engagement, testimonial, or behind-the-scenes
3. **platforms**: Which platforms this post is optimized for
4. **scheduled_date**: Specific date within the campaign timeline
5. **hook**: 1-2 sentence attention-grabbing opening (varies by platform)
6. **caption**: Full post copy optimized for each platform
7. **visual_concept**: Detailed description of the visual (photo/video concept, props, setting, angles)

PLATFORM-SPECIFIC REQUIREMENTS:
- Instagram: Hooks should be visual-first, captions 150-200 words, 3-5 hashtags
- Facebook: Longer storytelling captions (200-300 words), question-based hooks
- TikTok: Video-first concepts, trend-aware, casual tone, 1-2 sentence captions

IMPORTANT:
- Ensure posts flow logically from awareness → consideration → conversion
- Reference the {important_date} strategically throughout the campaign
- Every post should tie back to {what_makes_unique}
- Use {brand_vibe_words} to guide tone and style
- Make visual concepts achievable for small business owners (smartphone-friendly)

Return the posts as a JSON array with the structure defined in the tool schema.
```

## User Refinement Prompt

When a user provides feedback to regenerate the entire content plan:

```
The user has requested changes to the content plan:
"{user_feedback}"

Using the original brand context and campaign details, regenerate the {post_limit} posts with these modifications. Maintain the same strategic distribution (educational, promotional, engagement mix) but adjust according to the user's feedback.

Keep the same JSON structure and ensure all posts remain cohesive as a campaign strategy.
```

## Example Output Structure

```json
{
  "posts": [
    {
      "post_name": "Pre-launch Teaser #1",
      "post_type": "engagement",
      "platforms": ["Instagram", "Facebook"],
      "scheduled_date": "2025-01-15",
      "hook": "Want to know the secret to [benefit]? 👀 Hint: It's coming January 30th...",
      "caption": "Full caption here with storytelling, value prop, and CTA...",
      "visual_concept": {
        "type": "photo",
        "description": "Close-up shot of [product detail] with soft natural lighting. Use shallow depth of field to create mystery. Props: [specific props]. Setting: [specific location]. Angle: Eye-level, slightly off-center.",
        "style_notes": "Keep it minimalist and clean to match brand vibe"
      }
    }
  ]
}
```

## Post Type Definitions

- **Educational**: Teaches target audience something valuable, positions brand as expert
- **Promotional**: Directly sells product/service, includes offer or CTA to purchase
- **Engagement**: Asks questions, encourages comments, builds community
- **Testimonial**: Features customer results, social proof, case studies
- **Behind-the-scenes**: Shows process, humanizes brand, builds connection

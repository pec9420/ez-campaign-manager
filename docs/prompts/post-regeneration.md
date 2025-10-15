# Post Regeneration Prompt

## Context Variables

### Brand Hub Data
- `{business_name}`
- `{brand_vibe_words}`
- `{target_customer}`
- `{what_makes_unique}`

### Current Post Data
- `{post_name}`
- `{post_type}`
- `{platforms}`
- `{scheduled_date}`
- `{current_hook}` (if regenerating hook)
- `{current_caption}` (if regenerating caption)
- `{current_visual_concept}` (if regenerating visual)

### User Feedback
- `{user_feedback}` - Specific request (e.g., "make it more casual", "add emojis", "focus on benefits not features")
- `{regeneration_type}` - What to regenerate: "caption", "hook", "visual_concept", or "all"

## Full Prompt Template

### For Caption Regeneration

```
Regenerate the caption for this post based on user feedback.

BRAND CONTEXT:
- Business: {business_name}
- Brand vibe: {brand_vibe_words}
- Target customer: {target_customer}
- Unique value: {what_makes_unique}

CURRENT POST:
- Name: {post_name}
- Type: {post_type}
- Platforms: {platforms}
- Scheduled for: {scheduled_date}

CURRENT CAPTION:
{current_caption}

USER FEEDBACK:
"{user_feedback}"

TASK:
Rewrite the caption incorporating the user's feedback while:
1. Maintaining the post's core purpose ({post_type})
2. Keeping the brand voice ({brand_vibe_words})
3. Optimizing for the specified {platforms}
4. Addressing the target customer: {target_customer}
5. Highlighting what makes this business unique: {what_makes_unique}

If the feedback is vague (e.g., "make it better"), interpret it as:
- More engaging and conversational
- Clearer call-to-action
- Better storytelling
- More benefit-focused

Return only the new caption text (150-300 words depending on platform).
```

### For Hook Regeneration

```
Regenerate the hook (opening line) for this post based on user feedback.

BRAND CONTEXT:
- Business: {business_name}
- Brand vibe: {brand_vibe_words}
- Target customer: {target_customer}

CURRENT POST:
- Name: {post_name}
- Type: {post_type}
- Platforms: {platforms}
- Caption: {current_caption}

CURRENT HOOK:
{current_hook}

USER FEEDBACK:
"{user_feedback}"

TASK:
Rewrite the hook (1-2 sentences) incorporating the user's feedback while:
1. Grabbing attention in the first 3 seconds
2. Being platform-appropriate for {platforms}
3. Matching the brand vibe: {brand_vibe_words}
4. Compelling the target customer ({target_customer}) to stop scrolling

PLATFORM-SPECIFIC HOOKS:
- Instagram: Visual-first, emoji use encouraged, intrigue-based
- Facebook: Question-based, relatable scenarios, community-focused
- TikTok: Trend-aware, conversational, immediate value promise

Return only the new hook text (1-2 sentences maximum).
```

### For Visual Concept Regeneration

```
Regenerate the visual concept for this post based on user feedback.

BRAND CONTEXT:
- Business: {business_name}
- Brand vibe: {brand_vibe_words}

CURRENT POST:
- Name: {post_name}
- Type: {post_type}
- Platforms: {platforms}
- Caption: {current_caption}

CURRENT VISUAL CONCEPT:
{current_visual_concept}

USER FEEDBACK:
"{user_feedback}"

TASK:
Create a new visual concept incorporating the user's feedback while:
1. Remaining achievable with smartphone and basic equipment
2. Matching the brand aesthetic: {brand_vibe_words}
3. Being optimized for {platforms}
4. Supporting the caption's message

Provide:
- Type: "photo" or "video"
- Description: Detailed shot description (angle, framing, focus point)
- Props: Specific items needed
- Setting: Where to shoot (be specific)
- Style notes: Lighting, mood, editing direction

Keep it practical and DIY-friendly. Small business owners should be able to execute this themselves.

Return as a JSON object with the structure: {type, description, props, setting, style_notes}
```

### For Full Post Regeneration

```
Regenerate this entire post based on user feedback.

BRAND CONTEXT:
- Business: {business_name}
- Brand vibe: {brand_vibe_words}
- Target customer: {target_customer}
- Unique value: {what_makes_unique}

CURRENT POST:
- Name: {post_name}
- Type: {post_type}
- Platforms: {platforms}
- Scheduled for: {scheduled_date}
- Hook: {current_hook}
- Caption: {current_caption}
- Visual concept: {current_visual_concept}

USER FEEDBACK:
"{user_feedback}"

TASK:
Completely reimagine this post incorporating the user's feedback while:
1. Maintaining the post's scheduled date and type
2. Keeping the brand voice ({brand_vibe_words})
3. Optimizing for {platforms}
4. Staying true to the business's unique value: {what_makes_unique}
5. Targeting the right audience: {target_customer}

If the feedback suggests a different post type or approach, implement it while ensuring the post still fits within the overall content strategy.

Return a JSON object with:
{
  "hook": "new hook text",
  "caption": "new caption text",
  "visual_concept": {
    "type": "photo or video",
    "description": "detailed shot description",
    "props": ["prop 1", "prop 2"],
    "setting": "location description",
    "style_notes": "lighting and mood notes"
  }
}
```

## Common User Feedback Interpretations

| User Says | What They Mean | How to Respond |
|-----------|---------------|----------------|
| "Make it more casual" | Less formal language, more conversational, maybe add emojis | Use contractions, shorter sentences, friendly tone, 2-3 emojis |
| "Too salesy" | Feels pushy, needs more value before the ask | Lead with education/value, softer CTA, storytelling approach |
| "Add emojis" | Make it more engaging and visual | Add 3-5 relevant emojis, but don't overdo it |
| "Make it better" | Not specific - improve overall quality | Enhance hook, clearer benefits, stronger CTA, better flow |
| "Too long" | Caption is overwhelming | Cut by 30-40%, focus on one main point, shorter paragraphs |
| "Not on brand" | Voice doesn't match brand vibe words | Adjust tone to align with {brand_vibe_words} |
| "More engaging" | Feels flat, not interactive | Add question, use storytelling, create curiosity gap |

## Regeneration Best Practices

1. **Always reference brand context** - Every regeneration should feel like it came from the same brand
2. **Maintain campaign cohesion** - Even when changing one post, keep it aligned with the overall content plan
3. **Respect platform constraints** - Instagram captions ≠ Facebook captions ≠ TikTok captions
4. **Keep it actionable** - Visual concepts must remain DIY-friendly
5. **Preserve what works** - If user only asked to change the hook, don't completely rewrite the caption too

## Error Handling

If user feedback is contradictory or impossible:
- "Make it shorter but add more details" → Prioritize brevity with more impactful details
- "Professional but super casual" → Find middle ground (conversational but polished)
- "No emojis but make it fun" → Use playful language, varied punctuation, energetic tone

Always default to: **Clear, benefit-focused, on-brand, and actionable.**

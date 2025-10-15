# Prompt Engineering Best Practices

## General Principles

### 1. Context is King
- **Always provide brand context** - Business name, what they sell, brand vibe, target customer
- **Include strategic context** - Campaign goals, timeline, important dates
- **Reference previous content** - When regenerating, show what currently exists
- **Use specific examples** - Not "make it engaging", but "ask a question that makes them reflect on their pain point"

### 2. Be Specific, Not Generic
```
❌ Bad: "Create engaging content"
✅ Good: "Create a 200-word Instagram caption that asks a question about [specific pain point], shares a relatable story about [specific struggle], and ends with a CTA to [specific action]"

❌ Bad: "Make the visual concept better"
✅ Good: "Revise the visual concept to use natural window light instead of artificial light, focus on the product label, and include props that suggest [specific lifestyle]"
```

### 3. Constrain the Output
- **Specify format** - JSON, markdown, plain text
- **Set word counts** - "150-200 words", not "keep it short"
- **Define structure** - "3 paragraphs: hook, value prop, CTA"
- **Limit options** - "Choose from these 5 post types" not "any type"

### 4. Use Role-Playing
Start prompts with role definition:
```
"You are a content marketing strategist for small business owners..."
"You are a creative director specializing in DIY content creation..."
```

This sets the tone, expertise level, and perspective for the AI's response.

## Platform-Specific Prompting

### Instagram
```
Key instructions:
- Lead with visual hook (first line must work as standalone)
- 150-200 words ideal
- 3-5 relevant hashtags (not excessive)
- Line breaks for readability
- Emoji use: 2-4, strategically placed
- CTA should be clear but not pushy
```

### Facebook
```
Key instructions:
- Longer-form storytelling (200-300 words)
- Community-building language ("Who else...", "Tag someone who...")
- Question-based hooks work well
- Less emoji-heavy than Instagram
- Encourage comments and shares explicitly
```

### TikTok
```
Key instructions:
- Video-first mindset (describe action, not static image)
- Trend-aware concepts
- Very short caption (1-2 sentences)
- Casual, conversational tone
- Fast-paced visual concepts
```

## Content Type Prompting

### Educational Posts
```
Structure prompt around:
- What pain point does this solve?
- What valuable insight are we sharing?
- How does this position us as experts?
- What action should they take with this info?
```

### Promotional Posts
```
Structure prompt around:
- What specific offer/product are we selling?
- What's the unique value (not just features)?
- Why should they buy NOW (urgency)?
- What's the clear next step (CTA)?
```

### Engagement Posts
```
Structure prompt around:
- What question invites meaningful responses?
- What's relatable to the target audience?
- How does this build community?
- Can they tag someone or share their experience?
```

## Visual Concept Prompting

### Good Visual Prompts Include
1. **Exact angle** - "45-degree angle from above", "eye-level straight-on"
2. **Lighting specifics** - "Soft natural window light from left side", "Golden hour outdoor lighting"
3. **Composition** - "Product centered, negative space on right for text overlay"
4. **Props and setting** - "White marble background, small succulent in corner, coffee mug out of focus in background"
5. **Mood** - "Clean and minimal", "Warm and cozy", "Energetic and vibrant"

### Bad Visual Prompts
- "Take a nice photo of the product" ❌
- "Make it look professional" ❌
- "Capture the brand essence" ❌

## AI Provider Selection

### Use OpenAI GPT-5 When:
- Generating structured output (JSON, specific formats)
- Creating multiple related pieces (10-50 posts in one go)
- Reasoning through campaign strategy
- Fast iteration/regeneration needed
- Tool calling for precise schema output

### Use Anthropic Claude When:
- Creative, descriptive writing (shot lists, visual concepts)
- Long-form content that needs nuance
- Complex instructions with many constraints
- Tasks requiring "taste" and aesthetic judgment

## Iterative Refinement Strategy

### First Generation
- Start broad with full context
- Don't over-constrain initially
- Let AI show its interpretation

### Second Generation (Refinement)
- Reference what was already created
- Be specific about what to change and what to keep
- Use user feedback verbatim in prompt
- Add constraints based on first output

### Third+ Generations
- Use few-shot examples (show good vs bad)
- Be very directive about style/tone
- Consider switching AI providers if hitting limits

## Common Pitfalls to Avoid

### 1. Vague Brand Voice Instructions
```
❌ "Sound professional"
✅ "Use the brand vibe words: modern, approachable, empowering. Write in second person, use contractions, keep sentences under 20 words"
```

### 2. Ignoring Platform Constraints
```
❌ Generating same caption for Instagram and Facebook
✅ Customizing caption length, hashtag usage, and CTA style per platform
```

### 3. No Examples or Comparisons
```
❌ "Make it more engaging"
✅ "Current hook: '[current hook]'. Make it more engaging by leading with a surprising statistic or a provocative question, like: 'Did you know 80% of...?' or 'What if I told you...?'"
```

### 4. Forgetting the Audience
```
❌ "Create a post about our product"
✅ "Create a post for busy moms in their 30s who struggle with [pain point] and value [benefit] over [alternative]"
```

### 5. No Strategic Context
```
❌ "Write 10 posts"
✅ "Write 10 posts building toward a product launch on [date], with increasing urgency and excitement as we get closer"
```

## Prompt Iteration Log Template

When refining prompts, keep a log:

```markdown
## Prompt Version 1
[Initial prompt]

### Output Quality: 6/10
- Issues: Too generic, didn't maintain brand voice
- What worked: Good structure

## Prompt Version 2
[Revised prompt with brand voice examples]

### Output Quality: 8/10
- Issues: Visual concepts too complex
- What worked: Better voice, good hooks

## Prompt Version 3 (WINNER)
[Final prompt with DIY visual constraints]

### Output Quality: 9/10
- Ship this version
```

## Testing New Prompts

Before deploying new prompt versions:

1. **Test with 3 different brands** - Ensure it generalizes
2. **Test all post types** - Educational, promotional, engagement
3. **Test all platforms** - Instagram, Facebook, TikTok
4. **Test edge cases** - Minimal brand info, complex campaigns, vague goals
5. **Compare providers** - Does OpenAI or Claude perform better for this use case?

## Maintenance & Updates

- **Review prompts quarterly** - Update with new platform trends, algorithm changes
- **A/B test variations** - Keep data on which prompt versions perform better
- **User feedback loop** - If users consistently ask for same changes, update base prompt
- **Platform changes** - When Instagram changes character limits or algorithm, update prompts immediately

# Shot List Generation Prompt

## Context Variables

The following variables are injected from the database:

### Brand Hub Data
- `{business_name}` - Business name
- `{brand_vibe_words}` - Brand personality descriptors
- `{target_customer}` - Target audience

### Content Plan + Posts Data
- `{campaign_name}` - Content plan name
- `{posts}` - Array of all generated posts with their visual concepts
- `{start_date}` - Campaign start date
- `{end_date}` - Campaign end date

## Full Prompt Template

```
Create a comprehensive shot list for {business_name}'s content campaign: {campaign_name}.

BRAND AESTHETIC:
- Brand vibe: {brand_vibe_words}
- Target audience: {target_customer}

POSTS TO COVER:
{posts}

TASK:
Analyze all {posts.length} posts and create an efficient, actionable shot list that:
1. Groups similar shots together by theme, location, props, and aesthetic
2. Maximizes batch filming efficiency (shoot multiple posts in one session)
3. Provides specific, practical instructions for non-professional photographers
4. Considers brand aesthetic ({brand_vibe_words}) in every visual recommendation
5. Prioritizes shots by urgency and importance

OUTPUT STRUCTURE:

## Visual Themes
Group posts into 3-5 overarching visual themes (e.g., "Product Close-ups", "Lifestyle in Use", "Behind the Scenes"). For each theme:
- Theme name
- Description of the aesthetic/mood
- Which posts belong to this theme
- Why this theme supports the brand vibe

## Props & Materials Needed
Create a complete shopping/gathering list organized by theme:
- Exact props needed
- Where to source them (e.g., "from home", "Dollar Store", "Amazon")
- Quantity needed
- Estimated cost (keep budget-friendly)

## Locations & Settings
List all filming locations needed:
- Specific location description (e.g., "Kitchen counter with natural window light", "Front porch during golden hour")
- What to shoot there (which themes/posts)
- Best time of day for lighting
- Setup requirements

## Priority Shooting Schedule
Organize shots into a recommended filming order:
1. **URGENT (Film first week)** - Posts scheduled for {early dates}
2. **MEDIUM (Film second week)** - Posts scheduled for {middle dates}
3. **FLEXIBLE (Film when convenient)** - Evergreen content, later scheduled posts

For each priority level, provide:
- Which posts/themes to shoot
- Estimated time needed (e.g., "2 hours")
- Props and location required
- Specific shot list with angles, framing, and composition notes

## Batch Filming Sessions
Create 2-4 suggested filming sessions that maximize efficiency:

**Session 1: [Theme Name]**
- Duration: X hours
- Location: [Specific location]
- Props needed: [List]
- Shots to capture:
  - Post #X: [Specific directions - angle, framing, what to emphasize]
  - Post #Y: [Specific directions]
- Pro tip: [Time-saving or quality-enhancing advice]

## DIY Photography Tips
Provide practical advice for getting professional results:
- Smartphone camera settings
- Natural lighting tips
- Composition rules for {brand_vibe_words} aesthetic
- Free editing apps that match the brand vibe
- Common mistakes to avoid

IMPORTANT GUIDELINES:
- Every recommendation must be achievable with a smartphone and natural lighting
- Group shots that use the same props/location together
- Be specific (not "take a photo of the product" but "45-degree angle, soft window light from left, focus on [specific detail]")
- Consider the busy schedule of a small business owner - prioritize efficiency
- Make it foolproof - assume zero photography experience

Return as a structured JSON object following the format above.
```

## Example Output Structure

```json
{
  "themes": [
    {
      "name": "Product Hero Shots",
      "description": "Clean, minimalist product photography with soft natural light",
      "posts": ["Post #1", "Post #3", "Post #7"],
      "mood": "Professional yet approachable, matches 'modern' and 'clean' brand vibe"
    }
  ],
  "props": [
    {
      "theme": "Product Hero Shots",
      "items": [
        {
          "item": "White marble contact paper",
          "source": "Amazon ($12)",
          "quantity": "1 roll",
          "purpose": "Clean background for product shots"
        }
      ]
    }
  ],
  "locations": [
    {
      "location": "Kitchen counter near window",
      "themes": ["Product Hero Shots", "Lifestyle in Use"],
      "best_time": "9-11am for soft morning light",
      "setup": "Clear counter, place marble contact paper, position product 2 feet from window"
    }
  ],
  "priority": {
    "urgent": {
      "deadline": "Film by [date]",
      "posts": ["Post #1", "Post #2"],
      "time_needed": "1.5 hours",
      "shots": [
        {
          "post": "Post #1",
          "description": "Product flat lay with props",
          "specific_directions": "Place product center frame, arrange props in triangle composition, shoot from directly above, focus on product label",
          "props": ["Product", "Marble background", "Small plant"],
          "location": "Kitchen counter"
        }
      ]
    }
  },
  "batch_sessions": [
    {
      "session_name": "Product Photography Day",
      "duration": "2 hours",
      "location": "Kitchen counter",
      "props": ["All products", "Marble contact paper", "Props list..."],
      "shots": ["Detailed shot list..."],
      "pro_tip": "Set up once and shoot all product angles in one session to maintain consistent lighting"
    }
  ],
  "diy_tips": [
    "Use portrait mode on iPhone for beautiful depth of field",
    "Golden hour (1 hour before sunset) gives warmest, most flattering light",
    "Edit all photos with same filter preset for cohesive Instagram feed"
  ]
}
```

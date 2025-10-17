# PostCard UI Simplification - COMPLETED ✅

## Goal
Transform PostCard from overwhelming two-column layout into simplified tabbed interface with plain language.

## Design: Option 1 - Single Card with Visual Grouping + Tabs
- **Tab 1: Strategy** - Single card with 3 sections (Basics, Messaging, Goals)
- **Tab 2: Content** - Hook, Caption
- **Tab 3: Visual** - Visual Concept

## Plain Language Mapping
- "Core Message" → "What's the big idea?"
- "Call-to-Action" → "What should they do next?"
- "Tracking Focus" → "Success metric"
- "Post Basics" section header (with emoji 📋)
- "Messaging" section header (with emoji 💬)
- "Goals" section header (with emoji 🎯)

## Advanced Options (Collapsible)
- Purpose
- Strategy Type
- Behavioral Trigger

Hidden by default (collapsed for all posts), shown when user clicks "Show advanced options"

## Implementation Details

### Strategy Tab
- Single-column layout with 3 visual sections
- POST BASICS: Post Name, Type, Platforms (2-col grid), Scheduled Date
- MESSAGING: "What's the big idea?" (Core Message), "What should they do next?" (CTA)
- GOALS: Success metric, with collapsible advanced options toggle
- Character counters always visible
- All fields disabled when strategy is approved

### Content Tab
- Locked state: Shows lock icon with "Back to Strategy Tab" button
- Unlocked state: Hook field (hidden for image/carousel), Caption field, Regenerate button
- Character counters always visible
- Hook only shown for reels/stories as specified

### Visual Tab
- Locked state: Shows lock icon with "Back to Strategy Tab" button
- Unlocked state: Read-only display of visual concept fields
  - Shot Type
  - Description
  - Props Needed (as bulleted list)
  - Setting
  - Style Notes
  - Regenerate button (placeholder)

## Status
- ✅ Added Tabs component import
- ✅ Added showAdvanced state
- ✅ Rewritten form layout to single-column with visual grouping
- ✅ Plain language labels implemented
- ✅ Advanced options toggle implemented (collapsed by default)
- ✅ Content tab with lock/unlock states
- ✅ Visual tab with lock/unlock states
- ✅ Hook field hidden for image/carousel posts
- ✅ Character counters always visible
- ⏳ Browser testing (next step)

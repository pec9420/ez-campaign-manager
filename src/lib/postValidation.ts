import * as z from "zod";

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================
// These constants mirror the CHECK constraints from the database schema
// Source: supabase/migrations/20251017030524_31b0cbd5-e50b-4aef-8552-a2aa157b1b1a.sql

/**
 * Content strategy classification types
 * Maps to posts.strategy_type CHECK constraint
 */
export const STRATEGY_TYPES = [
  'educational',
  'promotional',
  'engagement',
  'testimonial',
  'behind-the-scenes',
] as const;

export const STRATEGY_TYPE_LABELS: Record<typeof STRATEGY_TYPES[number], string> = {
  educational: 'Educational',
  promotional: 'Promotional',
  engagement: 'Engagement',
  testimonial: 'Testimonial',
  'behind-the-scenes': 'Behind the Scenes',
};

/**
 * Psychological triggers for engagement
 * Maps to posts.behavioral_trigger CHECK constraint
 */
export const BEHAVIORAL_TRIGGERS = [
  'reciprocity',
  'FOMO',
  'scarcity',
  'trust',
  'nostalgia',
  'belonging',
  'curiosity',
  'urgency',
] as const;

export const BEHAVIORAL_TRIGGER_LABELS: Record<typeof BEHAVIORAL_TRIGGERS[number], string> = {
  reciprocity: 'Reciprocity',
  FOMO: 'FOMO (Fear of Missing Out)',
  scarcity: 'Scarcity',
  trust: 'Trust',
  nostalgia: 'Nostalgia',
  belonging: 'Belonging',
  curiosity: 'Curiosity',
  urgency: 'Urgency',
};

/**
 * Primary KPIs to track for each post
 * Maps to posts.tracking_focus CHECK constraint
 */
export const TRACKING_FOCUS_OPTIONS = [
  'views',
  'saves',
  'shares',
  'comments',
  'clicks',
  'DMs',
  'redemptions',
  'attendance',
] as const;

export const TRACKING_FOCUS_LABELS: Record<typeof TRACKING_FOCUS_OPTIONS[number], string> = {
  views: 'Views',
  saves: 'Saves',
  shares: 'Shares',
  comments: 'Comments',
  clicks: 'Clicks',
  DMs: 'DMs',
  redemptions: 'Redemptions',
  attendance: 'Attendance',
};

/**
 * Social media platforms
 * Reused from CreateCampaign.tsx PLATFORMS array
 */
export const PLATFORMS = [
  'instagram',
  'tiktok',
  'facebook',
  'google_business',
] as const;

export const PLATFORM_LABELS: Record<typeof PLATFORMS[number], string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  google_business: 'Google Business',
};

/**
 * Post content format types
 * Maps to posts.post_type column (normalized Instagram format types)
 */
export const POST_TYPES = [
  'image',
  'carousel',
  'reel',
  'story',
] as const;

export const POST_TYPE_LABELS: Record<typeof POST_TYPES[number], string> = {
  image: 'Image',
  carousel: 'Carousel',
  reel: 'Reel',
  story: 'Story',
};

/**
 * Post approval status
 * Maps to posts.status column
 * NOTE: Display only, NOT editable in UI (system field)
 */
export const POST_STATUSES = [
  'draft',
  'approved',
] as const;

export const POST_STATUS_LABELS: Record<typeof POST_STATUSES[number], string> = {
  draft: 'Draft',
  approved: 'Approved',
};

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

/**
 * Validation schema for post editing
 * Matches database constraints from migrations
 */
export const postEditSchema = z.object({
  // --- ALWAYS EDITABLE (Pre-Generation Metadata) ---
  post_name: z
    .string()
    .min(3, "Post name must be at least 3 characters")
    .max(50, "Post name must be 50 characters or less"),

  post_type: z.enum(POST_TYPES, {
    errorMap: () => ({ message: "Select a valid post type" }),
  }),

  platforms: z
    .array(z.enum(PLATFORMS))
    .min(1, "Select at least 1 platform")
    .max(3, "Select up to 3 platforms"),

  scheduled_date: z
    .string()
    .min(1, "Scheduled date is required"),

  strategy_type: z
    .enum(STRATEGY_TYPES, {
      errorMap: () => ({ message: "Select a valid strategy type" }),
    })
    .nullable()
    .optional(),

  behavioral_trigger: z
    .enum(BEHAVIORAL_TRIGGERS, {
      errorMap: () => ({ message: "Select a valid behavioral trigger" }),
    })
    .nullable()
    .optional(),

  tracking_focus: z
    .enum(TRACKING_FOCUS_OPTIONS, {
      errorMap: () => ({ message: "Select a valid tracking focus" }),
    })
    .nullable()
    .optional(),

  cta: z
    .string()
    .max(100, "CTA must be 100 characters or less")
    .nullable()
    .optional(),

  purpose: z
    .string()
    .max(150, "Purpose must be 150 characters or less")
    .nullable()
    .optional(),

  core_message: z
    .string()
    .max(150, "Core message must be 150 characters or less")
    .nullable()
    .optional(),

  // --- REEL-SPECIFIC FIELDS (Always Editable) ---
  reelDurationSeconds: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 second")
    .nullable()
    .optional(),

  reelScript: z
    .string()
    .max(2500, "Reel script must be 2500 characters or less")
    .nullable()
    .optional(),

  // --- LOCKED UNTIL GENERATED (Content Fields) ---
  // These are only editable when post.status !== 'draft'
  hook: z
    .string()
    .max(100, "Hook must be 100 characters or less")
    .nullable()
    .optional(),

  caption: z
    .string()
    .min(10, "Caption must be at least 10 characters")
    .max(500, "Caption must be 500 characters or less")
    .nullable()
    .optional(),

  visual_concept: z.any().nullable().optional(), // JSONB field, complex validation handled elsewhere
});

export type PostEditFormData = z.infer<typeof postEditSchema>;

/**
 * Helper function to determine if content fields should be locked
 * Content fields are locked when post status is 'draft'
 *
 * @param postStatus - Current post status ('draft' | 'approved')
 * @returns true if content fields should be locked
 */
export function isContentLocked(postStatus: string): boolean {
  return postStatus === 'draft';
}

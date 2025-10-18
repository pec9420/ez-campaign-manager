import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Post } from "@/types/database";
import { 
  postEditSchema, 
  PostEditFormData, 
  isContentLocked,
  PLATFORMS,
  STRATEGY_TYPES,
  BEHAVIORAL_TRIGGERS,
  TRACKING_FOCUS_OPTIONS
} from "@/lib/postValidation";

export interface PostCardLogicProps {
  post: Post | null;
  onPostUpdate?: (updatedPost: Post) => void;
}

export function usePostCardLogic({ post, onPostUpdate }: PostCardLogicProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Content is never locked - all fields editable immediately
  const contentLocked = false;

  // Initialize form with post data
  const form = useForm<PostEditFormData>({
    resolver: zodResolver(postEditSchema),
    defaultValues: post
      ? {
          post_name: post.post_name || "",
          post_type: post.post_type || "image",
          platforms: (post.platforms || []) as typeof PLATFORMS[number][],
          scheduled_date: post.scheduled_date || "",
          strategy_type: (post.strategy_type || null) as typeof STRATEGY_TYPES[number] | null,
          behavioral_trigger: (post.behavioral_trigger || null) as typeof BEHAVIORAL_TRIGGERS[number] | null,
          tracking_focus: (post.tracking_focus || null) as typeof TRACKING_FOCUS_OPTIONS[number] | null,
          cta: post.cta || null,
          purpose: post.purpose || null,
          core_message: post.core_message || null,
          reelDurationSeconds: null, // TODO: Add to database schema
          reelScript: null, // TODO: Add to database schema
          hook: post.hook || null,
          caption: post.caption || null,
          visual_concept: post.visual_concept || null,
        }
      : undefined,
  });

  // Reset form and exit edit mode when post changes
  useEffect(() => {
    if (post) {
      form.reset({
        post_name: post.post_name || "",
        post_type: post.post_type || "image",
        platforms: (post.platforms || []) as typeof PLATFORMS[number][],
        scheduled_date: post.scheduled_date || "",
        strategy_type: (post.strategy_type || null) as typeof STRATEGY_TYPES[number] | null,
        behavioral_trigger: (post.behavioral_trigger || null) as typeof BEHAVIORAL_TRIGGERS[number] | null,
        tracking_focus: (post.tracking_focus || null) as typeof TRACKING_FOCUS_OPTIONS[number] | null,
        cta: post.cta || null,
        purpose: post.purpose || null,
        core_message: post.core_message || null,
        reelDurationSeconds: null,
        reelScript: null,
        hook: post.hook || null,
        caption: post.caption || null,
        visual_concept: post.visual_concept || null,
      });
      setIsDirty(false);
      setLastSavedAt(null);
      setIsEditMode(false); // Exit edit mode when switching posts
    }
  }, [post, form]);

  // Track dirty state
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDirty(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  /**
   * Save post edits to database
   * Implements optimistic UI updates with rollback on error
   */
  const savePostEdits = useCallback(
    async (data: PostEditFormData) => {
      if (!post) {
        toast.error("No post selected");
        return;
      }

      setIsSaving(true);

      // Create optimistic update
      const optimisticPost: Post = {
        ...post,
        post_name: data.post_name,
        post_type: data.post_type,
        platforms: data.platforms,
        scheduled_date: data.scheduled_date,
        strategy_type: data.strategy_type || null,
        behavioral_trigger: data.behavioral_trigger || null,
        tracking_focus: data.tracking_focus || null,
        cta: data.cta || null,
        purpose: data.purpose || null,
        core_message: data.core_message || null,
        // Content fields (only if unlocked)
        ...((!contentLocked && {
          hook: data.hook || null,
          caption: data.caption || null,
          visual_concept: data.visual_concept || null,
        }) ||
          {}),
      };

      // Apply optimistic update
      if (onPostUpdate) {
        onPostUpdate(optimisticPost);
      }

      try {
        // Prepare update payload
        const updatePayload: Partial<Post> = {
          post_name: data.post_name,
          post_type: data.post_type,
          platforms: data.platforms,
          scheduled_date: data.scheduled_date,
          strategy_type: data.strategy_type || null,
          behavioral_trigger: data.behavioral_trigger || null,
          tracking_focus: data.tracking_focus || null,
          cta: data.cta || null,
          purpose: data.purpose || null,
          core_message: data.core_message || null,
        };

        // Add reel-specific fields if post type is reel
        // TODO: These fields need to be added to database schema
        // if (data.post_type === 'reel') {
        //   updatePayload.reel_duration_seconds = data.reelDurationSeconds || null;
        //   updatePayload.reel_script = data.reelScript || null;
        // }

        // Add content fields if unlocked
        if (!contentLocked) {
          updatePayload.hook = data.hook || null;
          updatePayload.caption = data.caption || null;
          updatePayload.visual_concept = data.visual_concept || null;
        }

        // Execute Supabase update
        const { error } = await supabase
          .from("posts")
          .update(updatePayload)
          .eq("id", post.id);

        if (error) throw error;

        // Success
        toast.success("Saved");
        setLastSavedAt(new Date());
        form.reset(data); // Reset dirty state
        setIsDirty(false);
      } catch (error: any) {
        console.error("Error saving post edits:", error);

        // Rollback optimistic update
        if (onPostUpdate) {
          onPostUpdate(post);
        }

        // Show error toast
        toast.error("Save failed", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [post, contentLocked, onPostUpdate, form]
  );

  /**
   * Toggle edit mode
   */
  const toggleEditMode = () => {
    if (isEditMode && isDirty) {
      // If exiting edit mode with unsaved changes, reset form
      if (post) {
        form.reset({
          post_name: post.post_name || "",
          post_type: post.post_type || "image",
          platforms: (post.platforms || []) as typeof PLATFORMS[number][],
          scheduled_date: post.scheduled_date || "",
          strategy_type: (post.strategy_type || null) as typeof STRATEGY_TYPES[number] | null,
          behavioral_trigger: (post.behavioral_trigger || null) as typeof BEHAVIORAL_TRIGGERS[number] | null,
          tracking_focus: (post.tracking_focus || null) as typeof TRACKING_FOCUS_OPTIONS[number] | null,
          cta: post.cta || null,
          purpose: post.purpose || null,
          core_message: post.core_message || null,
          reelDurationSeconds: null,
          reelScript: null,
          hook: post.hook || null,
          caption: post.caption || null,
          visual_concept: post.visual_concept || null,
        });
        setIsDirty(false);
      }
    }
    setIsEditMode(!isEditMode);
  };

  /**
   * Handle form submission (save and exit edit mode)
   */
  const onSubmit = form.handleSubmit(async (data) => {
    await savePostEdits(data);
    setIsEditMode(false); // Exit edit mode after saving
  });


  /**
   * Check if save button should be disabled
   */
  const isSaveDisabled =
    !isDirty || // No changes
    isSaving || // Save in progress
    !form.formState.isValid; // Validation errors

  return {
    form,
    isEditMode,
    isDirty,
    isSaving,
    lastSavedAt,
    contentLocked,
    isGenerating,
    toggleEditMode,
    onSubmit,
    isSaveDisabled,
  };
}

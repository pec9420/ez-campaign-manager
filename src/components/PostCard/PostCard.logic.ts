import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Post } from "@/types/database";
import { postEditSchema, PostEditFormData, isContentLocked } from "@/lib/postValidation";

export interface PostCardLogicProps {
  post: Post | null;
  onPostUpdate?: (updatedPost: Post) => void;
}

export function usePostCardLogic({ post, onPostUpdate }: PostCardLogicProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Strategy-first workflow states
  const [strategyApproved, setStrategyApproved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Determine if content fields should be locked (locked until strategy approved)
  const contentLocked = !strategyApproved;

  // Initialize form with post data
  const form = useForm<PostEditFormData>({
    resolver: zodResolver(postEditSchema),
    defaultValues: post
      ? {
          post_name: post.post_name || "",
          post_type: post.post_type || "image",
          platforms: post.platforms || [],
          scheduled_date: post.scheduled_date || "",
          strategy_type: post.strategy_type || null,
          behavioral_trigger: post.behavioral_trigger || null,
          tracking_focus: post.tracking_focus || null,
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
        platforms: post.platforms || [],
        scheduled_date: post.scheduled_date || "",
        strategy_type: post.strategy_type || null,
        behavioral_trigger: post.behavioral_trigger || null,
        tracking_focus: post.tracking_focus || null,
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
          platforms: post.platforms || [],
          scheduled_date: post.scheduled_date || "",
          strategy_type: post.strategy_type || null,
          behavioral_trigger: post.behavioral_trigger || null,
          tracking_focus: post.tracking_focus || null,
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
   * Validate required strategy fields
   */
  const validateStrategyFields = useCallback(() => {
    const formData = form.getValues();
    const errors: string[] = [];

    if (!formData.core_message?.trim()) errors.push("Core Message");
    if (!formData.cta?.trim()) errors.push("Call-to-Action");
    if (!formData.strategy_type) errors.push("Strategy Type");
    if (!formData.tracking_focus) errors.push("Metrics to Track");
    if (!formData.behavioral_trigger) errors.push("Behavioral Trigger");
    if (!formData.purpose?.trim()) errors.push("Purpose");
    if (!formData.platforms || formData.platforms.length === 0) errors.push("Platforms");
    if (!formData.scheduled_date) errors.push("Scheduled Date");

    return errors;
  }, [form]);

  /**
   * Handle strategy approval and save to database
   */
  const handleApproveStrategy = useCallback(async () => {
    if (!post) {
      toast.error("No post selected");
      return;
    }

    // Validate required fields
    const errors = validateStrategyFields();
    if (errors.length > 0) {
      toast.error("Missing required fields", {
        description: `Please fill in: ${errors.join(", ")}`,
      });
      return;
    }

    setIsSaving(true);

    try {
      const formData = form.getValues();

      // Save only strategy fields to database
      const { error } = await supabase
        .from("posts")
        .update({
          post_name: formData.post_name,
          post_type: formData.post_type,
          platforms: formData.platforms,
          scheduled_date: formData.scheduled_date,
          strategy_type: formData.strategy_type,
          behavioral_trigger: formData.behavioral_trigger,
          tracking_focus: formData.tracking_focus,
          cta: formData.cta,
          purpose: formData.purpose,
          core_message: formData.core_message,
        })
        .eq("id", post.id);

      if (error) throw error;

      // Lock strategy, unlock content
      setStrategyApproved(true);
      setLastSavedAt(new Date());
      form.reset(formData); // Reset dirty state
      setIsDirty(false);

      toast.success("Strategy approved", {
        description: "Content fields unlocked. Ready for generation.",
      });
    } catch (error: any) {
      console.error("Error saving strategy:", error);
      toast.error("Save failed", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [post, form, validateStrategyFields]);

  /**
   * Handle editing strategy (unlock strategy, re-lock content)
   */
  const handleEditStrategy = useCallback(() => {
    setStrategyApproved(false);
    toast.info("Strategy unlocked", {
      description: "Content fields locked until you approve again.",
    });
  }, []);

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
    strategyApproved,
    isGenerating,
    toggleEditMode,
    onSubmit,
    isSaveDisabled,
    handleApproveStrategy,
    handleEditStrategy,
    validateStrategyFields,
  };
}

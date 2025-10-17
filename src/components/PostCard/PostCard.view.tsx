import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Post } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Image,
  Video,
  LayoutGrid,
  Camera,
  Target,
  Zap,
  MessageSquare,
  TrendingUp,
  Save,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  PostEditFormData,
  STRATEGY_TYPES,
  STRATEGY_TYPE_LABELS,
  BEHAVIORAL_TRIGGERS,
  BEHAVIORAL_TRIGGER_LABELS,
  TRACKING_FOCUS_OPTIONS,
  TRACKING_FOCUS_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
  POST_TYPES,
  POST_TYPE_LABELS,
} from "@/lib/postValidation";

interface PostCardViewProps {
  post: Post | null;
  allPosts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  form: UseFormReturn<PostEditFormData>;
  isEditMode: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  contentLocked: boolean;
  strategyApproved: boolean;
  isGenerating: boolean;
  toggleEditMode: () => void;
  onSubmit: () => Promise<void>;
  isSaveDisabled: boolean;
  handleApproveStrategy: () => Promise<void>;
  handleEditStrategy: () => void;
}

const getPostTypeIcon = (postType: string) => {
  switch (postType) {
    case "image":
      return <Image className="w-5 h-5" />;
    case "reel":
      return <Video className="w-5 h-5" />;
    case "carousel":
      return <LayoutGrid className="w-5 h-5" />;
    case "story":
      return <Camera className="w-5 h-5" />;
    default:
      return null;
  }
};

const getTrackingFocusBadgeColor = (focus: string | null | undefined) => {
  if (!focus) return "";

  const lowerFocus = focus.toLowerCase();

  // Awareness stage - Blue
  if (["views", "reach"].includes(lowerFocus)) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  }

  // Consideration stage - Purple
  if (["saves", "shares", "clicks"].includes(lowerFocus)) {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
  }

  // Conversion stage - Green
  if (["dms", "sign-ups", "redemptions"].includes(lowerFocus)) {
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  }

  // Engagement stage - Orange
  if (["comments", "attendance"].includes(lowerFocus)) {
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  }

  return "";
};

export default function PostCardView({
  post,
  allPosts,
  isOpen,
  onClose,
  onNavigate,
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
}: PostCardViewProps) {
  if (!post) return null;

  // Local state for advanced options toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentIndex = allPosts.findIndex((p) => p.id === post.id);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === allPosts.length - 1;
  const position = `${currentIndex + 1} of ${allPosts.length}`;

  const goToPrevPost = () => {
    if (!isFirst) {
      onNavigate("prev");
    }
  };

  const goToNextPost = () => {
    if (!isLast) {
      onNavigate("next");
    }
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Only handle navigation if not focused inside a form input
      const target = event.target as HTMLElement;
      const isFormElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (!isFormElement) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goToPrevPost();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          goToNextPost();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFirst, isLast, onNavigate]);

  // Watch form values
  const postType = form.watch("post_type");
  const selectedPlatforms = form.watch("platforms") || [];
  const hookValue = form.watch("hook");
  const captionValue = form.watch("caption");
  const visualConceptValue = form.watch("visual_concept");
  const reelScriptValue = form.watch("reelScript");

  // Handle platform toggle
  const handlePlatformToggle = (platform: string) => {
    const newPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : selectedPlatforms.length < 3
      ? [...selectedPlatforms, platform]
      : selectedPlatforms;

    form.setValue("platforms", newPlatforms, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          {/* Sticky Toolbar */}
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 flex items-center justify-between">
            {/* Left: Post Status */}
            <Badge
              variant={post.status === "approved" ? "default" : "outline"}
              className={post.status === "approved" ? "bg-green-600" : ""}
            >
              {post.status === "approved" ? "Approved" : "Draft"}
            </Badge>

            {/* Center: Status Indicator */}
            <div className="flex-1 text-center">
              {isDirty && !strategyApproved && (
                <span className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Unsaved changes
                </span>
              )}
              {!isDirty && lastSavedAt && (
                <span className="text-sm text-success flex items-center justify-center gap-1">
                  Saved at {format(lastSavedAt, "HH:mm")}
                </span>
              )}
              {isGenerating && (
                <span className="text-sm text-primary flex items-center justify-center gap-1">
                  Generating content...
                </span>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              {!strategyApproved ? (
                <Button
                  type="button"
                  onClick={handleApproveStrategy}
                  disabled={isSaving}
                  size="sm"
                  className="bg-gradient-primary"
                  aria-label="Approve strategy and generate content"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      Approve Strategy & Generate Content ▶︎
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    // Placeholder for future AI generation
                    toast.info("Content generation coming soon!");
                  }}
                  disabled={isGenerating}
                  size="sm"
                  variant="outline"
                  aria-label="Regenerate content"
                >
                  {isGenerating ? (
                    <>Generating...</>
                  ) : (
                    <>
                      Regenerate Content (1 credit)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-6 pt-4">
            <DialogHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[14px] font-medium text-muted-foreground">
                      Post #{post.post_number}
                    </span>
                  </div>
                  <DialogTitle className="text-xl leading-tight">{post.post_name}</DialogTitle>
                  <DialogDescription className="mt-1 text-[14px]">
                    Review and edit your post strategy and content
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="strategy" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="strategy" className="text-base">Strategy</TabsTrigger>
                <TabsTrigger value="content" className="text-base">Content</TabsTrigger>
                <TabsTrigger value="visual" className="text-base">Visual</TabsTrigger>
              </TabsList>

              {/* STRATEGY TAB */}
              <TabsContent value="strategy" className="mt-4">
                <form className="space-y-4">
                  {/* POST BASICS Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[15px] font-semibold uppercase tracking-wide text-muted-foreground">
                        📋 Post Basics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-3">
                      {/* Post Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="post_name" className="text-[15px]">Post Name *</Label>
                        <Input
                          id="post_name"
                          {...form.register("post_name")}
                          maxLength={50}
                          placeholder="e.g., Summer Launch Teaser"
                          disabled={strategyApproved}
                          className="text-[15px] h-9"
                        />
                        <p className="text-[13px] text-muted-foreground">
                          {form.watch("post_name")?.length || 0}/50 characters
                        </p>
                        {form.formState.errors.post_name && (
                          <p className="text-[13px] text-destructive">
                            {form.formState.errors.post_name.message}
                          </p>
                        )}
                      </div>

                      {/* Post Type & Platforms (side by side on desktop) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Post Type */}
                        <div className="space-y-1.5">
                          <Label htmlFor="post_type" className="text-[15px]">Post Type *</Label>
                          <Select
                            value={postType}
                            onValueChange={(value) =>
                              form.setValue("post_type", value as any, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                            disabled={strategyApproved}
                          >
                            <SelectTrigger id="post_type" disabled={strategyApproved}>
                              <SelectValue placeholder="Select post type" />
                            </SelectTrigger>
                            <SelectContent>
                              {POST_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  <div className="flex items-center gap-2">
                                    {getPostTypeIcon(type)}
                                    {POST_TYPE_LABELS[type]}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.post_type && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.post_type.message}
                            </p>
                          )}
                        </div>

                        {/* Platforms */}
                        <div className="space-y-1.5">
                          <Label className="text-[15px]">Platforms *</Label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {PLATFORMS.map((platform) => (
                              <div key={platform} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`platform-${platform}`}
                                  checked={selectedPlatforms.includes(platform)}
                                  onCheckedChange={() => handlePlatformToggle(platform)}
                                  disabled={
                                    strategyApproved ||
                                    (!selectedPlatforms.includes(platform) &&
                                      selectedPlatforms.length >= 3)
                                  }
                                  className="h-4 w-4"
                                />
                                <Label
                                  htmlFor={`platform-${platform}`}
                                  className={`text-[15px] ${strategyApproved ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                >
                                  {PLATFORM_LABELS[platform]}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {form.formState.errors.platforms && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.platforms.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Scheduled Date */}
                      <div className="space-y-1.5">
                        <Label htmlFor="scheduled_date" className="text-[15px]">Scheduled Date *</Label>
                        <Input
                          id="scheduled_date"
                          type="date"
                          {...form.register("scheduled_date")}
                          disabled={strategyApproved}
                          className="text-[15px] h-9"
                        />
                        {form.formState.errors.scheduled_date && (
                          <p className="text-[13px] text-destructive">
                            {form.formState.errors.scheduled_date.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* MESSAGING Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[15px] font-semibold uppercase tracking-wide text-muted-foreground">
                        💬 Messaging
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-3">
                      {/* Core Message (Plain Language: What's the big idea?) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="core_message" className="text-[15px]">What's the big idea? *</Label>
                        <Textarea
                          id="core_message"
                          {...form.register("core_message")}
                          placeholder="Main takeaway your audience should remember"
                          maxLength={150}
                          rows={2}
                          disabled={strategyApproved}
                          className="text-[15px] resize-none"
                        />
                        <p className="text-[13px] text-muted-foreground">
                          {form.watch("core_message")?.length || 0}/150 characters
                        </p>
                        {form.formState.errors.core_message && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.core_message.message}
                          </p>
                        )}
                      </div>

                      {/* CTA (Plain Language: What should they do next?) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="cta" className="text-[15px]">What should they do next? *</Label>
                        <Input
                          id="cta"
                          {...form.register("cta")}
                          placeholder="e.g., Shop now, Learn more, Sign up"
                          maxLength={100}
                          disabled={strategyApproved}
                          className="text-[15px] h-9"
                        />
                        <p className="text-[13px] text-muted-foreground">
                          {form.watch("cta")?.length || 0}/100 characters
                        </p>
                        {form.formState.errors.cta && (
                          <p className="text-[13px] text-destructive">
                            {form.formState.errors.cta.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* GOALS Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[15px] font-semibold uppercase tracking-wide text-muted-foreground">
                        🎯 Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-3">
                      {/* Success Metric (Plain Language: Success metric) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="tracking_focus" className="text-[15px]">Success metric *</Label>
                        <Select
                          value={form.watch("tracking_focus") || ""}
                          onValueChange={(value) =>
                            form.setValue("tracking_focus", value as any, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          disabled={strategyApproved}
                        >
                          <SelectTrigger id="tracking_focus" disabled={strategyApproved}>
                            <SelectValue placeholder="What will you track?" />
                          </SelectTrigger>
                          <SelectContent>
                            {TRACKING_FOCUS_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {TRACKING_FOCUS_LABELS[option]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.tracking_focus && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.tracking_focus.message}
                          </p>
                        )}
                      </div>

                      {/* Advanced Options Toggle */}
                      <div className="pt-1 border-t">
                        <button
                          type="button"
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="flex items-center gap-2 text-[14px] text-muted-foreground hover:text-foreground transition-colors py-1"
                          disabled={strategyApproved}
                        >
                          {showAdvanced ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide advanced options
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show advanced options
                            </>
                          )}
                        </button>
                      </div>

                      {/* Advanced Options - Collapsible */}
                      {showAdvanced && (
                        <div className="space-y-3 pt-2 border-t bg-muted/30 p-3 rounded-md">
                          {/* Strategy Type */}
                          <div className="space-y-1.5">
                            <Label htmlFor="strategy_type" className="text-[15px]">Strategy Type *</Label>
                            <Select
                              value={form.watch("strategy_type") || ""}
                              onValueChange={(value) =>
                                form.setValue("strategy_type", value as any, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }
                              disabled={strategyApproved}
                            >
                              <SelectTrigger id="strategy_type" disabled={strategyApproved}>
                                <SelectValue placeholder="Select strategy type" />
                              </SelectTrigger>
                              <SelectContent>
                                {STRATEGY_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {STRATEGY_TYPE_LABELS[type]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.strategy_type && (
                              <p className="text-sm text-destructive">
                                {form.formState.errors.strategy_type.message}
                              </p>
                            )}
                          </div>

                          {/* Purpose */}
                          <div className="space-y-1.5">
                            <Label htmlFor="purpose" className="text-[15px]">Purpose *</Label>
                            <Textarea
                              id="purpose"
                              {...form.register("purpose")}
                              placeholder="One-sentence objective for this post"
                              maxLength={300}
                              rows={2}
                              disabled={strategyApproved}
                              className="text-[15px] resize-none"
                            />
                            <p className="text-[13px] text-muted-foreground">
                              {form.watch("purpose")?.length || 0}/300 characters
                            </p>
                            {form.formState.errors.purpose && (
                              <p className="text-[13px] text-destructive">
                                {form.formState.errors.purpose.message}
                              </p>
                            )}
                          </div>

                          {/* Behavioral Trigger */}
                          <div className="space-y-1.5">
                            <Label htmlFor="behavioral_trigger" className="text-[15px]">Behavioral Trigger *</Label>
                            <Select
                              value={form.watch("behavioral_trigger") || ""}
                              onValueChange={(value) =>
                                form.setValue("behavioral_trigger", value as any, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }
                              disabled={strategyApproved}
                            >
                              <SelectTrigger id="behavioral_trigger" disabled={strategyApproved}>
                                <SelectValue placeholder="Select trigger" />
                              </SelectTrigger>
                              <SelectContent>
                                {BEHAVIORAL_TRIGGERS.map((trigger) => (
                                  <SelectItem key={trigger} value={trigger}>
                                    {BEHAVIORAL_TRIGGER_LABELS[trigger]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.behavioral_trigger && (
                              <p className="text-sm text-destructive">
                                {form.formState.errors.behavioral_trigger.message}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </form>
              </TabsContent>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="mt-4">
                {contentLocked ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-[16px] font-semibold mb-2">Content Locked</h3>
                      <p className="text-[14px] text-muted-foreground mb-4">
                        Approve your strategy first to unlock the caption and hook fields.
                      </p>
                      <Button
                        type="button"
                        onClick={handleApproveStrategy}
                        disabled={isSaving}
                        className="bg-gradient-primary text-[15px]"
                        size="sm"
                      >
                        {isSaving ? "Saving..." : "← Back to Strategy Tab"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[15px] font-semibold uppercase tracking-wide text-muted-foreground">
                        📝 Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-3">
                      {/* Hook (only for reels/stories) */}
                      {(postType === "reel" || postType === "story") && (
                        <div className="space-y-1.5">
                          <Label htmlFor="hook" className="text-[15px]">Hook (reels & stories only)</Label>
                          <Textarea
                            id="hook"
                            {...form.register("hook")}
                            placeholder="Opening line to grab attention..."
                            maxLength={100}
                            rows={2}
                            disabled={contentLocked}
                            className="text-[15px] resize-none"
                          />
                          <p className="text-[13px] text-muted-foreground">
                            {hookValue?.length || 0}/100 characters
                          </p>
                          {form.formState.errors.hook && (
                            <p className="text-[13px] text-destructive">
                              {form.formState.errors.hook.message}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Caption */}
                      <div className="space-y-1.5">
                        <Label htmlFor="caption" className="text-[15px]">Caption *</Label>
                        <Textarea
                          id="caption"
                          {...form.register("caption")}
                          placeholder="Write your post caption here..."
                          maxLength={500}
                          rows={6}
                          disabled={contentLocked}
                          className="text-[15px]"
                        />
                        <p className="text-[13px] text-muted-foreground">
                          {captionValue?.length || 0}/500 characters
                        </p>
                        {form.formState.errors.caption && (
                          <p className="text-[13px] text-destructive">
                            {form.formState.errors.caption.message}
                          </p>
                        )}
                      </div>

                      {/* Regenerate Button */}
                      <div className="pt-2 border-t">
                        <Button
                          type="button"
                          onClick={() => {
                            toast.info("Content regeneration coming soon!");
                          }}
                          disabled={isGenerating}
                          variant="outline"
                          className="w-full text-[15px] h-9"
                        >
                          ✨ Regenerate with AI (1 credit)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* VISUAL TAB */}
              <TabsContent value="visual" className="mt-4">
                {contentLocked ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-[16px] font-semibold mb-2">Content Locked</h3>
                      <p className="text-[14px] text-muted-foreground mb-4">
                        Approve your strategy first to unlock the visual concept.
                      </p>
                      <Button
                        type="button"
                        onClick={handleApproveStrategy}
                        disabled={isSaving}
                        className="bg-gradient-primary text-[15px]"
                        size="sm"
                      >
                        {isSaving ? "Saving..." : "← Back to Strategy Tab"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[15px] font-semibold uppercase tracking-wide text-muted-foreground">
                        🎨 Visual Concept
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-3">
                      {visualConceptValue && typeof visualConceptValue === "object" ? (
                        <div className="space-y-3">
                          {/* Shot Type */}
                          {visualConceptValue.type && (
                            <div className="space-y-1.5">
                              <Label className="text-[15px] font-medium">Shot Type</Label>
                              <div className="text-[15px] bg-muted p-2.5 rounded-md">
                                {visualConceptValue.type}
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          {visualConceptValue.description && (
                            <div className="space-y-1.5">
                              <Label className="text-[15px] font-medium">Description</Label>
                              <div className="text-[15px] bg-muted p-2.5 rounded-md whitespace-pre-wrap">
                                {visualConceptValue.description}
                              </div>
                            </div>
                          )}

                          {/* Props */}
                          {visualConceptValue.props && (
                            <div className="space-y-1.5">
                              <Label className="text-[15px] font-medium">Props Needed</Label>
                              <div className="text-[15px] bg-muted p-2.5 rounded-md">
                                {Array.isArray(visualConceptValue.props) ? (
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {visualConceptValue.props.map((prop: string, idx: number) => (
                                      <li key={idx}>{prop}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  visualConceptValue.props
                                )}
                              </div>
                            </div>
                          )}

                          {/* Setting */}
                          {visualConceptValue.setting && (
                            <div className="space-y-1.5">
                              <Label className="text-[15px] font-medium">Setting</Label>
                              <div className="text-[15px] bg-muted p-2.5 rounded-md">
                                {visualConceptValue.setting}
                              </div>
                            </div>
                          )}

                          {/* Style Notes */}
                          {visualConceptValue.style_notes && (
                            <div className="space-y-1.5">
                              <Label className="text-[15px] font-medium">Style Notes</Label>
                              <div className="text-[15px] bg-muted p-2.5 rounded-md">
                                {visualConceptValue.style_notes}
                              </div>
                            </div>
                          )}

                          {/* Regenerate Button */}
                          <div className="pt-2 border-t">
                            <Button
                              type="button"
                              onClick={() => {
                                toast.info("Visual regeneration coming soon!");
                              }}
                              disabled={isGenerating}
                              variant="outline"
                              className="w-full text-[15px] h-9"
                            >
                              ✨ Regenerate with AI (1 credit)
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-muted-foreground">
                          <Image className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-[15px]">No visual concept generated yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Post Position Indicator */}
            <div className="text-[14px] text-muted-foreground text-center pt-3 border-t mt-4 pb-3">
              Post {position}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation Buttons - Outside modal, centered on viewport */}
      {isOpen && (
        <>
          <Button
            variant="outline"
            onClick={goToPrevPost}
            disabled={isFirst}
            aria-label="Previous post"
            className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-2 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-full w-12 h-12 p-0 justify-center sm:w-auto sm:px-4 sm:rounded-md"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <Button
            variant="outline"
            onClick={goToNextPost}
            disabled={isLast}
            aria-label="Next post"
            className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-2 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-full w-12 h-12 p-0 justify-center sm:w-auto sm:px-4 sm:rounded-md"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}
    </>
  );
}

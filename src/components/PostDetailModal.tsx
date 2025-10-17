import { useEffect } from "react";
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
import { Post } from "@/types/database";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Image,
  Video,
  LayoutGrid,
  Camera,
  Target,
  Zap,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

interface PostDetailModalProps {
  post: Post | null;
  allPosts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
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

export default function PostDetailModal({
  post,
  allPosts,
  isOpen,
  onClose,
  onNavigate,
}: PostDetailModalProps) {
  if (!post) return null;

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

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevPost();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextPost();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFirst, isLast, onNavigate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto relative">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Post #{post.post_number}
                </span>
                <Badge
                  variant={post.status === "approved" ? "default" : "outline"}
                  className={post.status === "approved" ? "bg-green-600" : ""}
                >
                  {post.status === "approved" ? "Approved" : "Draft"}
                </Badge>
              </div>
              <DialogTitle className="text-2xl">{post.post_name}</DialogTitle>
              <DialogDescription className="mt-2">
                View and edit post details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column: Metadata & Strategy */}
          <div className="space-y-4">
            {/* Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Post Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-primary">
                    {getPostTypeIcon(post.post_type)}
                    <span className="font-medium capitalize">{post.post_type}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Platforms</div>
                  <div className="flex gap-2 flex-wrap">
                    {post.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className="capitalize">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Scheduled Date</div>
                  <div className="text-sm font-medium">
                    {format(new Date(post.scheduled_date), "MMMM d, yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strategy Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Content Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {post.purpose && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Purpose</div>
                    <div className="text-sm">{post.purpose}</div>
                  </div>
                )}

                {post.core_message && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Core Message</div>
                    <div className="text-sm font-medium">{post.core_message}</div>
                  </div>
                )}

                {post.behavioral_trigger && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Behavioral Trigger
                    </div>
                    <div className="text-sm">{post.behavioral_trigger}</div>
                  </div>
                )}

                {post.strategy_type && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Strategy Type</div>
                    <Badge variant="outline" className="capitalize">
                      {post.strategy_type}
                    </Badge>
                  </div>
                )}

                {!post.purpose &&
                  !post.core_message &&
                  !post.behavioral_trigger &&
                  !post.strategy_type && (
                    <div className="text-sm text-muted-foreground italic py-2">
                      No strategy information available
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Metrics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Metrics & CTA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Metrics to Track</div>
                  {post.tracking_focus ? (
                    <Badge
                      variant="secondary"
                      className={`capitalize ${getTrackingFocusBadgeColor(
                        post.tracking_focus
                      )}`}
                    >
                      {post.tracking_focus}
                    </Badge>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Not set</div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Call-to-Action</div>
                  {post.cta ? (
                    <div className="text-sm font-medium">{post.cta}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Not set</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-4">
            {/* Hook (for reels/stories) */}
            {(post.post_type === "reel" || post.post_type === "story") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Hook
                  </CardTitle>
                  <CardDescription>Opening line to grab attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {post.hook ? (
                    <div className="text-sm bg-muted p-3 rounded-md">{post.hook}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No hook generated yet
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Caption */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Caption
                </CardTitle>
                <CardDescription>Post caption or description</CardDescription>
              </CardHeader>
              <CardContent>
                {post.caption ? (
                  <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {post.caption}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No caption generated yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visual Concept */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Visual Concept
                </CardTitle>
                <CardDescription>Shot description and styling</CardDescription>
              </CardHeader>
              <CardContent>
                {post.visual_concept ? (
                  <div className="text-sm space-y-2">
                    {typeof post.visual_concept === "object" ? (
                      <>
                        {post.visual_concept.type && (
                          <div>
                            <span className="font-medium">Type: </span>
                            {post.visual_concept.type}
                          </div>
                        )}
                        {post.visual_concept.description && (
                          <div className="bg-muted p-3 rounded-md">
                            {post.visual_concept.description}
                          </div>
                        )}
                        {post.visual_concept.props && (
                          <div>
                            <span className="font-medium">Props: </span>
                            {Array.isArray(post.visual_concept.props)
                              ? post.visual_concept.props.join(", ")
                              : post.visual_concept.props}
                          </div>
                        )}
                        {post.visual_concept.setting && (
                          <div>
                            <span className="font-medium">Setting: </span>
                            {post.visual_concept.setting}
                          </div>
                        )}
                        {post.visual_concept.style_notes && (
                          <div>
                            <span className="font-medium">Style: </span>
                            {post.visual_concept.style_notes}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-muted p-3 rounded-md">
                        {JSON.stringify(post.visual_concept, null, 2)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No visual concept generated yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Buttons - Vertically Centered on Edges */}
        <Button
          variant="outline"
          onClick={goToPrevPost}
          disabled={isFirst}
          aria-label="Previous post"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <Button
          variant="outline"
          onClick={goToNextPost}
          disabled={isLast}
          aria-label="Next post"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Post Position Indicator */}
        <div className="text-sm text-muted-foreground text-center pt-6 border-t mt-6">
          Post {position}
        </div>
      </DialogContent>
    </Dialog>
  );
}

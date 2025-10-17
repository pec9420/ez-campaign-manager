import { Post } from "@/types/database";
import { usePostCardLogic } from "./PostCard.logic";
import PostCardView from "./PostCard.view";

export interface PostCardProps {
  post: Post | null;
  allPosts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onPostUpdate?: (updatedPost: Post) => void;
}

/**
 * PostCard - Editable post detail modal with in-place editing
 *
 * Features:
 * - Sticky toolbar with save button and dirty state indicator
 * - Editable metadata fields (name, type, platforms, date, strategy)
 * - Locked content fields until post status moves beyond 'draft'
 * - Reel-specific fields (duration, script) when post type is 'reel'
 * - Optimistic UI updates with rollback on error
 * - Keyboard navigation (Left/Right arrows) between posts
 *
 * @param post - The post to display and edit
 * @param allPosts - All posts in the campaign (for navigation)
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback when modal closes
 * @param onNavigate - Callback for prev/next navigation
 * @param onPostUpdate - Optional callback for optimistic updates
 */
export default function PostCard({
  post,
  allPosts,
  isOpen,
  onClose,
  onNavigate,
  onPostUpdate,
}: PostCardProps) {
  // Initialize logic hook
  const logic = usePostCardLogic({
    post,
    onPostUpdate,
  });

  // Render view component
  return (
    <PostCardView
      post={post}
      allPosts={allPosts}
      isOpen={isOpen}
      onClose={onClose}
      onNavigate={onNavigate}
      {...logic}
    />
  );
}

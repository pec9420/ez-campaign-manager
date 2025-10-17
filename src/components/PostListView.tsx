import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Post } from "@/types/database";
import { format } from "date-fns";
import { Image, Video, LayoutGrid, Camera } from "lucide-react";

interface PostListViewProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

const getPostTypeIcon = (postType: string) => {
  switch (postType) {
    case "image":
      return <Image className="w-4 h-4" />;
    case "reel":
      return <Video className="w-4 h-4" />;
    case "carousel":
      return <LayoutGrid className="w-4 h-4" />;
    case "story":
      return <Camera className="w-4 h-4" />;
    default:
      return null;
  }
};

const getPostTypeLabel = (postType: string) => {
  return postType.charAt(0).toUpperCase() + postType.slice(1);
};

export default function PostListView({ posts, onPostClick }: PostListViewProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts found in this campaign.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Post Name</TableHead>
            <TableHead>Core Message</TableHead>
            <TableHead>Metrics to Track</TableHead>
            <TableHead>CTA</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow
              key={post.id}
              onClick={() => onPostClick(post)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">
                {post.post_number}
              </TableCell>
              <TableCell className="min-w-[200px]">
                <div className="font-medium">{post.post_name}</div>
                {post.hook && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {post.hook}
                  </div>
                )}
              </TableCell>
              <TableCell className="max-w-[250px]">
                {post.core_message ? (
                  <div className="text-sm truncate" title={post.core_message}>
                    {post.core_message}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Not set</span>
                )}
              </TableCell>
              <TableCell>
                {post.tracking_focus ? (
                  <Badge variant="outline" className="capitalize">
                    {post.tracking_focus}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Not set</span>
                )}
              </TableCell>
              <TableCell className="max-w-[150px]">
                {post.cta ? (
                  <div className="text-sm truncate" title={post.cta}>
                    {post.cta}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Not set</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  {getPostTypeIcon(post.post_type)}
                  <span className="capitalize">{getPostTypeLabel(post.post_type)}</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {format(new Date(post.scheduled_date), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <Badge
                  variant={post.status === "approved" ? "default" : "outline"}
                  className={post.status === "approved" ? "bg-green-600" : ""}
                >
                  {post.status === "approved" ? "Approved" : "Draft"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

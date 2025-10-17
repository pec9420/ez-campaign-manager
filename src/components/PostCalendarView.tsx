import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Post, ContentPlan } from "@/types/database";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Image, Video, LayoutGrid, Camera, Rocket } from "lucide-react";

interface PostCalendarViewProps {
  posts: Post[];
  campaign: ContentPlan;
  onPostClick: (post: Post) => void;
}

const getPostTypeIcon = (postType: string) => {
  switch (postType) {
    case "image":
      return "📷";
    case "reel":
      return "🎬";
    case "carousel":
      return "📋";
    case "story":
      return "📸";
    default:
      return "📄";
  }
};

export default function PostCalendarView({ posts, campaign, onPostClick }: PostCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(campaign.start_date));

  // Group posts by date
  const postsByDate = posts.reduce((acc, post) => {
    const dateKey = format(new Date(post.scheduled_date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isImportantDate = (date: Date) => {
    if (!campaign.important_date) return false;
    return isSameDay(date, new Date(campaign.important_date));
  };

  const getPostsForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return postsByDate[dateKey] || [];
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleMonthChange("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleMonthChange("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {(() => {
          const monthStart = startOfMonth(currentMonth);
          const monthEnd = endOfMonth(currentMonth);
          const startDate = new Date(monthStart);
          startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

          const days = [];
          const currentDate = new Date(startDate);

          for (let i = 0; i < 42; i++) {
            // 6 weeks
            const date = new Date(currentDate);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const postsForDay = getPostsForDate(date);
            const isImportant = isImportantDate(date);

            days.push(
              <div
                key={date.toISOString()}
                className={`min-h-[120px] border rounded-lg p-2 ${
                  isCurrentMonth ? "bg-card" : "bg-muted/30"
                } ${isImportant ? "border-accent border-2" : "border-border"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm ${
                      isCurrentMonth ? "font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {isImportant && (
                    <Rocket className="w-3 h-3 text-accent" />
                  )}
                </div>

                {/* Posts for this day */}
                <div className="space-y-1">
                  {postsForDay.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => onPostClick(post)}
                      className={`text-xs p-1.5 rounded cursor-pointer hover:shadow-md transition-shadow ${
                        post.status === "approved"
                          ? "bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700"
                          : "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span>{getPostTypeIcon(post.post_type)}</span>
                        <span className="font-medium truncate">#{post.post_number}</span>
                      </div>
                      <div className="truncate text-[10px]">{post.post_name}</div>
                    </div>
                  ))}
                </div>

                {isImportant && campaign.important_date_label && (
                  <div className="mt-1 text-[10px] font-medium text-accent truncate">
                    {campaign.important_date_label}
                  </div>
                )}
              </div>
            );

            currentDate.setDate(currentDate.getDate() + 1);
          }

          return days;
        })()}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700" />
              <span>Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
              <span>Draft</span>
            </div>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-accent" />
              <span>Important Date</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span>📷</span> <span>Image</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🎬</span> <span>Reel</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📋</span> <span>Carousel</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📸</span> <span>Story</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

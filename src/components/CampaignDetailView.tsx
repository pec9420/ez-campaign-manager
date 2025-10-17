import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Target, Rocket, ShoppingBag } from "lucide-react";
import { ContentPlan, Post } from "@/types/database";
import { format } from "date-fns";
import PostListView from "./PostListView";
import PostCalendarView from "./PostCalendarView";

interface CampaignDetailViewProps {
  campaign: ContentPlan;
  posts: Post[];
  onBack: () => void;
  onPostClick: (post: Post) => void;
}

export default function CampaignDetailView({
  campaign,
  posts,
  onBack,
  onPostClick,
}: CampaignDetailViewProps) {
  const approvedCount = posts.filter((p) => p.status === "approved").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Button>
        <h1 className="text-4xl font-bold mb-2">{campaign.name}</h1>
        <p className="text-muted-foreground text-lg">
          Manage and review your campaign posts
        </p>
      </div>

      {/* Campaign Metadata Card */}
      <Card className="border-border shadow-lg">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Overview of your campaign settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Date Range */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Campaign Period</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(campaign.start_date), "MMM d, yyyy")} -{" "}
                    {format(new Date(campaign.end_date), "MMM d, yyyy")}
                  </div>
                </div>
              </div>

              {/* What Promoting */}
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Promoting</div>
                  <div className="text-sm text-muted-foreground">
                    {campaign.what_promoting}
                  </div>
                </div>
              </div>

              {/* Goal */}
              {campaign.goal && (
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">Campaign Goal</div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.goal}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Important Date */}
              {campaign.important_date && campaign.important_date_label && (
                <div className="flex items-start gap-3">
                  <Rocket className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">{campaign.important_date_label}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(campaign.important_date), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Channel */}
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Sales Channel</div>
                  <Badge variant="outline" className="capitalize">
                    {campaign.sales_channel_type.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Platforms */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-primary mt-0.5 flex items-center justify-center text-xl">
                  📱
                </div>
                <div>
                  <div className="font-medium mb-1">Platforms</div>
                  <div className="flex gap-2 flex-wrap">
                    {campaign.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className="capitalize">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Post Stats */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-primary mt-0.5 flex items-center justify-center text-xl">
                  📊
                </div>
                <div>
                  <div className="font-medium mb-1">Post Status</div>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-600">
                      {approvedCount} Approved
                    </Badge>
                    <Badge variant="outline">
                      {draftCount} Draft
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Section with Tabs */}
      <Card className="border-border shadow-lg">
        <CardHeader>
          <CardTitle>Campaign Posts ({posts.length})</CardTitle>
          <CardDescription>
            View your posts in list or calendar format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <PostListView posts={posts} onPostClick={onPostClick} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <PostCalendarView
                posts={posts}
                campaign={campaign}
                onPostClick={onPostClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

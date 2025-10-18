import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Target, Rocket, ShoppingBag, Edit2, Save, X, RefreshCw } from "lucide-react";
import { ContentPlan, Post } from "@/types/database";
import { format } from "date-fns";
import PostListView from "./PostListView";
import PostCalendarView from "./PostCalendarView";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CampaignDetailViewProps {
  campaign: ContentPlan;
  posts: Post[];
  onBack: () => void;
  onPostClick: (post: Post) => void;
  onCampaignUpdate?: () => void; // Callback to refresh campaign data
}

export default function CampaignDetailView({
  campaign,
  posts,
  onBack,
  onPostClick,
  onCampaignUpdate,
}: CampaignDetailViewProps) {
  const approvedCount = posts.filter((p) => p.status === "approved").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  // State for editing num_posts
  const [isEditingNumPosts, setIsEditingNumPosts] = useState(false);
  const [numPostsValue, setNumPostsValue] = useState(campaign.num_posts || posts.length);
  const [isSavingNumPosts, setIsSavingNumPosts] = useState(false);

  // State for regenerate confirmation
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Handle save num_posts
  const handleSaveNumPosts = async () => {
    setIsSavingNumPosts(true);
    try {
      const { error } = await supabase
        .from('content_plans')
        .update({ num_posts: numPostsValue })
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success('Number of posts updated');
      setIsEditingNumPosts(false);
      onCampaignUpdate?.();
    } catch (error) {
      console.error('Error updating num_posts:', error);
      toast.error('Failed to update number of posts');
    } finally {
      setIsSavingNumPosts(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setNumPostsValue(campaign.num_posts || posts.length);
    setIsEditingNumPosts(false);
  };

  // Handle regenerate campaign
  const handleRegenerateCampaign = async () => {
    setIsRegenerating(true);
    setShowRegenerateDialog(false);

    try {
      // Step 1: Get current user to update counter
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Step 2: Get current user data
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('posts_created_this_period')
        .eq('id', user.id)
        .single();

      if (userFetchError) throw userFetchError;

      // Step 3: Delete all existing posts for this campaign
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('content_plan_id', campaign.id);

      if (deleteError) throw deleteError;

      // Step 4: Decrement counter by the number of posts we just deleted
      const newCounter = Math.max(0, (userData.posts_created_this_period || 0) - posts.length);
      const { error: counterError } = await supabase
        .from('users')
        .update({ posts_created_this_period: newCounter })
        .eq('id', user.id);

      if (counterError) throw counterError;

      // Step 5: Call orchestrate-campaign Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/orchestrate-campaign`;

      console.log('Calling Edge Function:', {
        url: functionUrl,
        campaignId: campaign.id,
        hasAuth: !!session.access_token
      });

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_plan_id: campaign.id,
        }),
      });

      console.log('Edge Function response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.message || 'Failed to regenerate campaign');
        } catch (parseError) {
          throw new Error(`Failed to regenerate campaign (${response.status}): ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('Campaign regenerated:', result);

      if (result.success && result.posts_created > 0) {
        toast.success(`Campaign regenerated! ${result.posts_created} posts created.`);
      } else {
        console.warn('Unexpected result:', result);
        toast.warning('Campaign generation completed but no posts were created. Check console for details.');
      }

      // Refresh campaign data
      onCampaignUpdate?.();
    } catch (error) {
      console.error('Error regenerating campaign:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate campaign');
    } finally {
      setIsRegenerating(false);
    }
  };

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

              {/* Number of Posts (Editable) */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-primary mt-0.5 flex items-center justify-center text-xl">
                  #️⃣
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-1">Target Number of Posts</div>
                  {isEditingNumPosts ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={numPostsValue}
                        onChange={(e) => setNumPostsValue(parseInt(e.target.value) || 1)}
                        className="w-24"
                        disabled={isSavingNumPosts}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveNumPosts}
                        disabled={isSavingNumPosts}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        disabled={isSavingNumPosts}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {numPostsValue} posts
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingNumPosts(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Regenerate Campaign Button */}
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={() => setShowRegenerateDialog(true)}
              disabled={isRegenerating}
              variant="secondary"
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating Campaign...' : 'Regenerate Campaign Posts'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This will delete all {posts.length} existing posts and generate {numPostsValue} new posts based on current campaign settings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Campaign Posts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all {posts.length} existing posts (including {approvedCount} approved posts) and generate {numPostsValue} completely new posts.
              <br /><br />
              <strong>This action cannot be undone.</strong> Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateCampaign}>
              Yes, Regenerate Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

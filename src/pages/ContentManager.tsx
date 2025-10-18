import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ContentPlan, Post } from "@/types/database";
import { toast } from "sonner";
import CampaignCard from "@/components/CampaignCard";
import CampaignDetailView from "@/components/CampaignDetailView";
import PostCard from "@/components/PostCard";

interface CampaignWithStats extends ContentPlan {
  postCount: number;
  approvedCount: number;
}

export default function ContentManager() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<ContentPlan | null>(null);
  const [selectedCampaignPosts, setSelectedCampaignPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch campaigns
  useEffect(() => {
    if (!user) return;

    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        // Fetch all campaigns for user
        const { data: campaignsData, error: campaignsError } = await supabase
          .from("content_plans")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (campaignsError) throw campaignsError;

        if (!campaignsData || campaignsData.length === 0) {
          setCampaigns([]);
          setLoading(false);
          return;
        }

        // Fetch post counts for each campaign
        const campaignsWithStats = await Promise.all(
          campaignsData.map(async (campaign) => {
            const { data: posts, error: postsError } = await supabase
              .from("posts")
              .select("id, status")
              .eq("content_plan_id", campaign.id)
              .eq("deleted", false);

            if (postsError) {
              console.error("Error fetching posts for campaign:", postsError);
              return {
                ...campaign,
                postCount: 0,
                approvedCount: 0,
              };
            }

            const postCount = posts?.length || 0;
            const approvedCount = posts?.filter((p) => p.status === "approved").length || 0;

            return {
              ...campaign,
              postCount,
              approvedCount,
            };
          })
        );

        setCampaigns(campaignsWithStats as any);
      } catch (error: any) {
        console.error("Error fetching campaigns:", error);
        toast.error("Failed to load campaigns", {
          description: error.message || "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  // Fetch posts for selected campaign
  const handleCampaignClick = async (campaign: ContentPlan) => {
    setSelectedCampaign(campaign);

    try {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("content_plan_id", campaign.id)
        .eq("deleted", false)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      setSelectedCampaignPosts((posts || []) as any);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts", {
        description: error.message || "Please try again.",
      });
      setSelectedCampaignPosts([]);
    }
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setSelectedCampaignPosts([]);
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleNavigatePost = (direction: "prev" | "next") => {
    if (!selectedPost) return;

    const currentIndex = selectedCampaignPosts.findIndex((p) => p.id === selectedPost.id);

    if (direction === "prev" && currentIndex > 0) {
      setSelectedPost(selectedCampaignPosts[currentIndex - 1]);
    } else if (direction === "next" && currentIndex < selectedCampaignPosts.length - 1) {
      setSelectedPost(selectedCampaignPosts[currentIndex + 1]);
    }
  };

  // Show loading state only on initial load (when we have no data yet)
  if (authLoading || (loading && campaigns.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Show campaign detail view if campaign is selected
  if (selectedCampaign) {
    return (
      <>
        <div className="min-h-screen bg-gradient-subtle py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <CampaignDetailView
              campaign={selectedCampaign}
              posts={selectedCampaignPosts}
              onBack={handleBackToCampaigns}
              onPostClick={handlePostClick}
            />
          </div>
        </div>

        {/* Post Detail Modal */}
        <PostCard
          post={selectedPost}
          allPosts={selectedCampaignPosts}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onNavigate={handleNavigatePost}
          onPostUpdate={(updatedPost) => {
            // Optimistic update: Replace the post in the local state
            setSelectedCampaignPosts((prev) =>
              prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
            );
            setSelectedPost(updatedPost);
          }}
        />
      </>
    );
  }

  // Show campaign list or empty state
  return (
    <div className="min-h-screen bg-gradient-subtle py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Content Manager</h1>
            <p className="text-muted-foreground text-lg">
              View and manage your campaigns and social media posts
            </p>
          </div>
          <Button
            onClick={() => navigate("/create-campaign")}
            className="bg-gradient-primary hover:opacity-90 shadow-lg"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Campaigns Grid or Empty State */}
        {campaigns.length === 0 ? (
          <>
            {/* Empty State Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow">
                      <FileText className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl mb-3">No Campaigns Yet</CardTitle>
                    <CardDescription className="text-base mb-6">
                      Create your first content plan to generate posts with AI-powered captions
                      and visual concepts. You'll be able to manage and edit them here.
                    </CardDescription>
                    <Button
                      onClick={() => navigate("/create-campaign")}
                      className="bg-gradient-primary hover:opacity-90 shadow-lg"
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Info Section */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">What You'll See Here</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>All campaigns with post counts and approval status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Campaign details including dates and platforms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Posts displayed in list or calendar view</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Quick access to edit and approve posts</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Coming Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      <span>Post detail editing and AI regeneration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      <span>Bulk actions (approve, delete multiple posts)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      <span>Advanced filtering and search</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      <span>Export posts to CSV or PDF</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                postCount={campaign.postCount}
                approvedCount={campaign.approvedCount}
                onClick={() => handleCampaignClick(campaign)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

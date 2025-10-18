import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";

// Validation schema
const campaignSchema = z.object({
  name: z.string()
    .min(1, "Campaign name is required")
    .max(100, "Campaign name must be 100 characters or less"),
  what_promoting: z.string()
    .min(10, "Please provide at least 10 characters")
    .max(100, "Description must be 100 characters or less"),
  goal: z.string()
    .max(300, "Goal must be 300 characters or less")
    .optional(),
  num_posts: z.number()
    .int("Number of posts must be a whole number")
    .min(0, "Minimum 0 posts")
    .max(30, "Maximum 30 posts")
    .default(10),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  important_date_label: z.string().optional(),
  important_date: z.string().optional(),
  platforms: z.array(z.string())
    .min(1, "Select at least 1 platform")
    .max(3, "Select up to 3 platforms"),
  sales_channel_type: z.string().min(1, "Sales channel is required"),
  offers_promos: z.string()
    .max(300, "Offers/promotions must be 300 characters or less")
    .optional(),
}).refine((data) => {
  // Validate end_date >= start_date
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
}).refine((data) => {
  // Validate duration is 2-90 days
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 2 && diffDays <= 90;
  }
  return true;
}, {
  message: "Campaign duration must be between 2 and 90 days",
  path: ["end_date"],
}).refine((data) => {
  // Validate important_date is within campaign range
  if (data.important_date && data.start_date && data.end_date) {
    const importantDate = new Date(data.important_date);
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return importantDate >= start && importantDate <= end;
  }
  return true;
}, {
  message: "Important date must be within campaign date range",
  path: ["important_date"],
}).refine((data) => {
  // If important_date is set, important_date_label is required
  if (data.important_date && !data.important_date_label) {
    return false;
  }
  return true;
}, {
  message: "Label is required when important date is set",
  path: ["important_date_label"],
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "google_business", label: "Google Business" },
];

const SALES_CHANNELS = [
  { value: "website", label: "Website" },
  { value: "etsy", label: "Etsy" },
  { value: "amazon", label: "Amazon" },
  { value: "shopify", label: "Shopify" },
  { value: "instagram_shop", label: "Instagram Shop" },
  { value: "local_market", label: "Local Market" },
  { value: "physical_store", label: "Physical Store" },
  { value: "email_list", label: "Email List" },
  { value: "other", label: "Other" },
];

export default function CreateCampaign() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      platforms: [],
      goal: "",
      important_date_label: "",
      important_date: "",
      offers_promos: "",
      num_posts: 10,
    },
  });

  const salesChannelValue = watch("sales_channel_type");

  // Redirect to user selection if not logged in (but wait for loading to finish)
  useEffect(() => {
    if (!loading && !user) {
      navigate("/select-user");
    }
  }, [user, loading, navigate]);

  // Handle platform toggle
  const handlePlatformToggle = (platformId: string) => {
    const newPlatforms = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(p => p !== platformId)
      : selectedPlatforms.length < 3
      ? [...selectedPlatforms, platformId]
      : selectedPlatforms;

    setSelectedPlatforms(newPlatforms);
    setValue("platforms", newPlatforms, { shouldValidate: true });
  };

  const onSubmit = async (data: CampaignFormData) => {
    if (!user) {
      toast.error("You must be logged in to create a campaign");
      navigate("/select-user");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if user has a brand hub
      const { data: brandHub, error: brandHubError } = await supabase
        .from("brand_hub")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (brandHubError || !brandHub) {
        toast.error("Please set up your Brand Hub first", {
          description: "You need to create your brand profile before creating campaigns.",
        });
        navigate("/brand-hub");
        return;
      }

      // 2. Create campaign record in content_plans table
      const { data: campaign, error: campaignError } = await supabase
        .from("content_plans")
        .insert({
          user_id: user.id,
          name: data.name,
          what_promoting: data.what_promoting,
          goal: data.goal || null,
          start_date: data.start_date,
          end_date: data.end_date,
          important_date: data.important_date || null,
          important_date_label: data.important_date_label || null,
          platforms: data.platforms,
          sales_channel_type: data.sales_channel_type,
          offers_promos: data.offers_promos || null,
          num_posts: data.num_posts,
        })
        .select()
        .single();

      if (campaignError || !campaign) {
        console.error("Error creating campaign:", campaignError);
        toast.error("Failed to create campaign", {
          description: campaignError?.message || "Please try again.",
        });
        return;
      }

      // 3. Call edge function to generate content plan
      setIsGenerating(true);
      toast.info("Generating your content plan...", {
        description: "This may take 60-90 seconds. Please wait.",
        duration: 10000,
      });

      console.log('[CreateCampaign] Calling orchestrate-campaign edge function...', {
        content_plan_id: campaign.id,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate-campaign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            content_plan_id: campaign.id,
          }),
        }
      );

      console.log('[CreateCampaign] Edge function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CreateCampaign] Edge function error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Failed to generate content plan: ${errorText}`);
        }
        throw new Error(errorData.error || "Failed to generate content plan");
      }

      const result = await response.json();
      console.log('[CreateCampaign] Edge function result:', result);

      // 4. Success! Navigate to content manager
      toast.success("Campaign created successfully!", {
        description: `Generated ${result.posts_created} posts and ${result.shots_created} shots for your campaign.`,
      });
      navigate("/content-manager");
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to generate content plan", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/content-manager")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Content Manager
          </Button>
          <h1 className="text-4xl font-bold mb-2">Create New Campaign</h1>
          <p className="text-muted-foreground text-lg">
            Tell us about your campaign and we'll generate a strategic content plan with AI
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Campaign Details
            </CardTitle>
            <CardDescription>
              Fill in the information below to generate your content plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Campaign Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Summer Product Launch"
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* What Promoting */}
              <div className="space-y-2">
                <Label htmlFor="what_promoting">
                  What are you promoting? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="what_promoting"
                  {...register("what_promoting")}
                  placeholder="Describe what you're promoting in this campaign..."
                  maxLength={100}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {watch("what_promoting")?.length || 0}/100 characters
                </p>
                {errors.what_promoting && (
                  <p className="text-sm text-destructive">{errors.what_promoting.message}</p>
                )}
              </div>

              {/* Campaign Goal */}
              <div className="space-y-2">
                <Label htmlFor="goal">Campaign Goal (optional)</Label>
                <Textarea
                  id="goal"
                  {...register("goal")}
                  placeholder="e.g., Drive engagement and sales"
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {watch("goal")?.length || 0}/300 characters
                </p>
                {errors.goal && (
                  <p className="text-sm text-destructive">{errors.goal.message}</p>
                )}
              </div>

              {/* Number of Posts */}
              <div className="space-y-2">
                <Label htmlFor="num_posts">
                  Number of Posts to Generate <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="num_posts"
                  type="number"
                  {...register("num_posts", { valueAsNumber: true })}
                  min={0}
                  max={30}
                  defaultValue={10}
                />
                <p className="text-xs text-muted-foreground">
                  Choose between 0-30 posts. We'll generate approximately this number based on your campaign dates.
                </p>
                {errors.num_posts && (
                  <p className="text-sm text-destructive">{errors.num_posts.message}</p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register("start_date")}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-destructive">{errors.start_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">
                    End Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...register("end_date")}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-destructive">{errors.end_date.message}</p>
                  )}
                </div>
              </div>

              {/* Important Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="important_date_label">Important Date Label</Label>
                  <Input
                    id="important_date_label"
                    {...register("important_date_label")}
                    placeholder="e.g., Launch Day, Sale Ends"
                  />
                  {errors.important_date_label && (
                    <p className="text-sm text-destructive">{errors.important_date_label.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="important_date">Important Date</Label>
                  <Input
                    id="important_date"
                    type="date"
                    {...register("important_date")}
                  />
                  {errors.important_date && (
                    <p className="text-sm text-destructive">{errors.important_date.message}</p>
                  )}
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <Label>
                  Platforms <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select 1-3 platforms for this campaign
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {PLATFORMS.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                        disabled={
                          !selectedPlatforms.includes(platform.id) &&
                          selectedPlatforms.length >= 3
                        }
                      />
                      <Label
                        htmlFor={platform.id}
                        className="cursor-pointer font-normal"
                      >
                        {platform.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.platforms && (
                  <p className="text-sm text-destructive">{errors.platforms.message}</p>
                )}
              </div>

              {/* Sales Channel */}
              <div className="space-y-2">
                <Label htmlFor="sales_channel_type">
                  Sales Channel <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={salesChannelValue}
                  onValueChange={(value) => setValue("sales_channel_type", value, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your sales channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALES_CHANNELS.map((channel) => (
                      <SelectItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sales_channel_type && (
                  <p className="text-sm text-destructive">{errors.sales_channel_type.message}</p>
                )}
              </div>

              {/* Offers/Promotions */}
              <div className="space-y-2">
                <Label htmlFor="offers_promos">Offers/Promotions (optional)</Label>
                <Textarea
                  id="offers_promos"
                  {...register("offers_promos")}
                  placeholder="e.g., Buy $50 gift card, get $5 bonus. Leave blank if no special offers."
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank if you don't have any promotional offers. {watch("offers_promos")?.length || 0}/300 characters
                </p>
                {errors.offers_promos && (
                  <p className="text-sm text-destructive">{errors.offers_promos.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/content-manager")}
                  disabled={isLoading || isGenerating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isGenerating}
                  className="flex-1 bg-gradient-primary hover:opacity-90 shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate content plan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

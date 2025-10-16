import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Sparkles } from "lucide-react";

// Zod schema for brand hub validation
const brandHubSchema = z.object({
  business_name: z.string().min(1, "Business name is required").max(100, "Max 100 characters"),
  what_you_sell: z.string().min(10, "Min 10 characters").max(100, "Max 100 characters"),
  what_makes_unique: z.string().min(10, "Min 10 characters").max(100, "Max 100 characters"),
  target_customer: z.string().min(10, "Min 10 characters").max(100, "Max 100 characters"),
  brand_vibe_words: z.string()
    .min(1, "Brand vibe words are required")
    .refine((val) => {
      const words = val.split(',').map(w => w.trim()).filter(w => w.length > 0);
      return words.length >= 3 && words.length <= 5;
    }, "Enter 3-5 words, separated by commas")
});

type BrandHubFormData = z.infer<typeof brandHubSchema>;

export default function BrandHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingHub, setExistingHub] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<BrandHubFormData>({
    resolver: zodResolver(brandHubSchema)
  });

  // Watch brand vibe words for character count
  const brandVibeWords = watch("brand_vibe_words", "");
  const wordCount = brandVibeWords
    ? brandVibeWords.split(',').map(w => w.trim()).filter(w => w.length > 0).length
    : 0;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadBrandHub();
  }, [user, navigate]);

  const loadBrandHub = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("brand_hub")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingHub(data);
        // Populate form with existing data
        setValue("business_name", data.business_name);
        setValue("what_you_sell", data.what_you_sell);
        setValue("what_makes_unique", data.what_makes_unique);
        setValue("target_customer", data.target_customer);
        setValue("brand_vibe_words", data.brand_vibe_words.join(", "));
      }
    } catch (error: any) {
      console.error("Error loading brand hub:", error);
      toast.error("Failed to load brand profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BrandHubFormData) => {
    try {
      setSaving(true);

      // Convert comma-separated string to array
      const vibeWordsArray = data.brand_vibe_words
        .split(',')
        .map(w => w.trim())
        .filter(w => w.length > 0);

      const brandHubData = {
        user_id: user?.id,
        business_name: data.business_name,
        what_you_sell: data.what_you_sell,
        what_makes_unique: data.what_makes_unique,
        target_customer: data.target_customer,
        brand_vibe_words: vibeWordsArray
      };

      let error;

      if (existingHub) {
        // Update existing brand hub
        const result = await supabase
          .from("brand_hub")
          .update(brandHubData)
          .eq("user_id", user?.id);
        error = result.error;
      } else {
        // Create new brand hub
        const result = await supabase
          .from("brand_hub")
          .insert([brandHubData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(existingHub ? "Brand profile updated!" : "Brand profile created!");

      // Reload data
      await loadBrandHub();

      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error saving brand hub:", error);
      toast.error("Failed to save brand profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Brand Hub</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {existingHub
              ? "Update your brand profile to improve AI-generated content"
              : "Tell us about your brand so AI can create content in your voice"
            }
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {existingHub ? "Edit Brand Profile" : "Create Brand Profile"}
            </CardTitle>
            <CardDescription>
              This information will be used to generate all your social media content.
              You can update it anytime, and changes will apply to all future campaigns.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="business_name">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business_name"
                  placeholder="e.g., Sunny Side Ceramics"
                  {...register("business_name")}
                  maxLength={100}
                />
                {errors.business_name && (
                  <p className="text-sm text-destructive">{errors.business_name.message}</p>
                )}
              </div>

              {/* What You Sell */}
              <div className="space-y-2">
                <Label htmlFor="what_you_sell">
                  What You Sell <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="what_you_sell"
                  placeholder="e.g., Handmade ceramic mugs, bowls, and planters with modern minimalist designs"
                  {...register("what_you_sell")}
                  maxLength={100}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  10-100 characters
                </p>
                {errors.what_you_sell && (
                  <p className="text-sm text-destructive">{errors.what_you_sell.message}</p>
                )}
              </div>

              {/* What Makes You Unique */}
              <div className="space-y-2">
                <Label htmlFor="what_makes_unique">
                  What Makes You Unique <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="what_makes_unique"
                  placeholder="e.g., Each piece is hand-thrown using local clay and features custom glazes I developed myself"
                  {...register("what_makes_unique")}
                  maxLength={100}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  10-100 characters
                </p>
                {errors.what_makes_unique && (
                  <p className="text-sm text-destructive">{errors.what_makes_unique.message}</p>
                )}
              </div>

              {/* Target Customer */}
              <div className="space-y-2">
                <Label htmlFor="target_customer">
                  Target Customer <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="target_customer"
                  placeholder="e.g., Design-conscious millennials who appreciate handmade goods and sustainable living"
                  {...register("target_customer")}
                  maxLength={100}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  10-100 characters
                </p>
                {errors.target_customer && (
                  <p className="text-sm text-destructive">{errors.target_customer.message}</p>
                )}
              </div>

              {/* Brand Vibe Words */}
              <div className="space-y-2">
                <Label htmlFor="brand_vibe_words">
                  Brand Vibe Words <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand_vibe_words"
                  placeholder="e.g., warm, authentic, mindful, earthy"
                  {...register("brand_vibe_words")}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Enter 3-5 words, separated by commas</span>
                  <span className={wordCount >= 3 && wordCount <= 5 ? "text-success" : "text-muted-foreground"}>
                    {wordCount} word{wordCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {errors.brand_vibe_words && (
                  <p className="text-sm text-destructive">{errors.brand_vibe_words.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {existingHub ? "Update Brand Profile" : "Create Brand Profile"}
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

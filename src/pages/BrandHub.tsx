import { useEffect, useState } from "react";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Save, Lightbulb, AlertCircle, CheckCircle2 } from "lucide-react";

// Predefined brand vibe word options
const PREDEFINED_VIBE_WORDS = [
  "Warm",
  "Playful",
  "Professional",
  "Cozy",
  "Bold",
  "Minimal",
  "Authentic",
  "Luxe",
  "Earthy",
  "Fun",
  "Inspiring",
  "Casual",
  "Elegant",
  "Quirky",
  "Sophisticated",
  "Friendly",
  "Creative",
  "Natural",
  "Modern",
  "Timeless",
] as const;

// Zod schema for brand hub validation
const brandHubSchema = z.object({
  business_name: z
    .string()
    .min(1, "Business name is required")
    .max(100, "Max 100 characters"),
  what_you_sell: z
    .string()
    .min(10, "Please add more detail (minimum 10 characters)")
    .max(250, "Max 250 characters"),
  what_makes_unique: z
    .string()
    .min(10, "Tell us more (minimum 10 characters)")
    .max(250, "Max 250 characters"),
  target_customer: z
    .string()
    .min(10, "Add more detail about who you're selling to (minimum 10 characters)")
    .max(250, "Max 250 characters"),
  custom_vibe_words: z.string().max(90, "Max 90 characters"),
});

type BrandHubFormData = z.infer<typeof brandHubSchema>;

export default function BrandHub() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingHub, setExistingHub] = useState<any>(null);
  const [selectedVibeWords, setSelectedVibeWords] = useState<Set<string>>(new Set());
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<BrandHubFormData>({
    resolver: zodResolver(brandHubSchema),
    defaultValues: {
      business_name: "",
      what_you_sell: "",
      what_makes_unique: "",
      target_customer: "",
      custom_vibe_words: "",
    },
  });

  // Watch all fields for character counts
  const businessName = watch("business_name", "");
  const whatYouSell = watch("what_you_sell", "");
  const whatMakesUnique = watch("what_makes_unique", "");
  const targetCustomer = watch("target_customer", "");
  const customVibeWords = watch("custom_vibe_words", "");

  // Calculate custom words count
  const customWordsArray = customVibeWords
    .split(",")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  const customWordsCount = customWordsArray.length;

  // Calculate total vibe words
  const totalVibeWords = selectedVibeWords.size + customWordsCount;
  const vibeWordsValid = totalVibeWords >= 3 && totalVibeWords <= 5;

  // Warn about unsaved changes on page unload
  useBeforeUnload(
    (event) => {
      if (isDirty || selectedVibeWords.size > 0) {
        event.preventDefault();
      }
    },
    { capture: true }
  );

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return;
    }

    // If auth is done loading and there's no user, redirect
    if (!user) {
      console.log('[BrandHub] No user found, redirecting to auth');
      navigate("/auth");
      return;
    }

    // User is authenticated, load brand hub
    console.log('[BrandHub] User authenticated, loading brand hub');
    loadBrandHub();
  }, [user, authLoading, navigate]);

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

        // Split existing vibe words into predefined and custom
        const predefinedSet = new Set(PREDEFINED_VIBE_WORDS.map((w) => w.toLowerCase()));
        const existingWords = data.brand_vibe_words || [];
        const predefined = new Set<string>();
        const custom: string[] = [];

        existingWords.forEach((word: string) => {
          const lowerWord = word.toLowerCase();
          // Find matching predefined word (case-insensitive)
          const matchingPredefined = PREDEFINED_VIBE_WORDS.find(
            (pw) => pw.toLowerCase() === lowerWord
          );
          if (matchingPredefined) {
            predefined.add(matchingPredefined);
          } else {
            custom.push(word);
          }
        });

        setSelectedVibeWords(predefined);

        // Populate form with existing data
        reset({
          business_name: data.business_name,
          what_you_sell: data.what_you_sell,
          what_makes_unique: data.what_makes_unique,
          target_customer: data.target_customer,
          custom_vibe_words: custom.join(", "),
        });
      }
    } catch (error: any) {
      console.error("Error loading brand hub:", error);
      toast.error("Failed to load brand profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BrandHubFormData) => {
    // Validate vibe words count
    if (!vibeWordsValid) {
      toast.error("Please select 3-5 brand vibe words (predefined + custom)");
      return;
    }

    // Validate custom words count
    if (customWordsCount > 3) {
      toast.error("Maximum 3 custom vibe words allowed");
      return;
    }

    try {
      setSaving(true);

      // Combine predefined and custom vibe words
      const combinedVibeWords = [
        ...Array.from(selectedVibeWords),
        ...customWordsArray,
      ];

      const brandHubData = {
        user_id: user?.id,
        business_name: data.business_name,
        what_you_sell: data.what_you_sell,
        what_makes_unique: data.what_makes_unique,
        target_customer: data.target_customer,
        brand_vibe_words: combinedVibeWords,
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
        const result = await supabase.from("brand_hub").insert([brandHubData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(
        existingHub ? "Brand profile updated!" : "Brand profile created!"
      );

      // Reset form dirty state
      reset(data);
      setSelectedVibeWords(new Set(selectedVibeWords));

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

  const toggleVibeWord = (word: string) => {
    const newSet = new Set(selectedVibeWords);
    if (newSet.has(word)) {
      newSet.delete(word);
    } else {
      // Only allow adding if we haven't reached the limit
      if (totalVibeWords < 5) {
        newSet.add(word);
      } else {
        toast.error("Maximum 5 vibe words allowed (predefined + custom)");
      }
    }
    setSelectedVibeWords(newSet);
  };

  const handleNavigationAttempt = (path: string) => {
    if (isDirty || selectedVibeWords.size > 0) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleSaveAndContinue = async () => {
    setShowUnsavedDialog(false);
    await handleSubmit(onSubmit)();
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  // Character counter component
  const CharacterCounter = ({
    current,
    max,
    className = "",
  }: {
    current: number;
    max: number;
    className?: string;
  }) => {
    const percentage = (current / max) * 100;
    const isNearLimit = percentage >= 90;
    const isOverLimit = current > max;

    return (
      <span
        className={`text-xs ${
          isOverLimit
            ? "text-destructive font-medium"
            : isNearLimit
            ? "text-amber-600 font-medium"
            : "text-muted-foreground"
        } ${className}`}
      >
        {current}/{max} characters
        {isNearLimit && !isOverLimit && " ⚠️"}
        {isOverLimit && " ❌"}
      </span>
    );
  };

  // Field validation indicator
  const ValidationIndicator = ({ isValid }: { isValid: boolean }) => {
    return isValid ? (
      <CheckCircle2 className="w-4 h-4 text-success" />
    ) : null;
  };

  // Show loading spinner while auth is loading OR while fetching brand hub data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formValid =
    businessName.length >= 1 &&
    businessName.length <= 100 &&
    whatYouSell.length >= 10 &&
    whatYouSell.length <= 250 &&
    whatMakesUnique.length >= 10 &&
    whatMakesUnique.length <= 250 &&
    targetCustomer.length >= 10 &&
    targetCustomer.length <= 250 &&
    vibeWordsValid &&
    customWordsCount <= 3 &&
    customVibeWords.length <= 90;

  return (
    <div className="min-h-screen bg-gradient-subtle py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Brand Hub</h1>
          <p className="text-muted-foreground text-lg">
            {existingHub
              ? "Your brand profile is set up. Make any changes below and click Save."
              : "Tell us about your brand so AI can write in your voice. This takes about 3 minutes."}
          </p>
        </div>

        {/* Form-level error */}
        {!formValid && Object.keys(errors).length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the errors below before saving
            </AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {existingHub ? "Edit Brand Profile" : "Create Brand Profile"}
            </CardTitle>
            <CardDescription>
              This information will be used to generate all your social media
              content. You can update it anytime, and changes will apply to all
              future campaigns.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* BUSINESS DETAILS */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Business Details
                </h3>

                {/* Business Name */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="business_name" className="flex items-center gap-2">
                    Business Name <span className="text-destructive">*</span>
                    {businessName.length >= 1 && businessName.length <= 100 && (
                      <ValidationIndicator isValid={true} />
                    )}
                  </Label>
                  <Input
                    id="business_name"
                    placeholder="e.g., Ember & Oak Candle Co."
                    {...register("business_name")}
                    maxLength={100}
                    aria-required="true"
                    aria-invalid={!!errors.business_name}
                    aria-describedby="business_name_counter business_name_error"
                  />
                  <div className="flex justify-between items-center">
                    <CharacterCounter
                      current={businessName.length}
                      max={100}
                    />
                  </div>
                  {errors.business_name && (
                    <p
                      className="text-sm text-destructive flex items-center gap-1"
                      id="business_name_error"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.business_name.message}
                    </p>
                  )}
                </div>

                {/* What You Sell */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="what_you_sell" className="flex items-center gap-2">
                    What do you sell? <span className="text-destructive">*</span>
                    {whatYouSell.length >= 10 && whatYouSell.length <= 250 && (
                      <ValidationIndicator isValid={true} />
                    )}
                  </Label>
                  <Textarea
                    id="what_you_sell"
                    placeholder="e.g., Hand-poured soy candles with natural fragrances"
                    {...register("what_you_sell")}
                    maxLength={250}
                    rows={3}
                    aria-required="true"
                    aria-invalid={!!errors.what_you_sell}
                    aria-describedby="what_you_sell_helper what_you_sell_counter what_you_sell_error"
                  />
                  <div className="flex justify-between items-center">
                    <p
                      className="text-xs text-muted-foreground"
                      id="what_you_sell_helper"
                    >
                      Be specific - this helps AI understand your products
                    </p>
                    <CharacterCounter
                      current={whatYouSell.length}
                      max={250}
                    />
                  </div>
                  {errors.what_you_sell && (
                    <p
                      className="text-sm text-destructive flex items-center gap-1"
                      id="what_you_sell_error"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.what_you_sell.message}
                    </p>
                  )}
                </div>

                {/* What Makes Unique */}
                <div className="space-y-2 mb-6">
                  <Label
                    htmlFor="what_makes_unique"
                    className="flex items-center gap-2"
                  >
                    What makes you unique?{" "}
                    <span className="text-destructive">*</span>
                    {whatMakesUnique.length >= 10 &&
                      whatMakesUnique.length <= 250 && (
                        <ValidationIndicator isValid={true} />
                      )}
                  </Label>
                  <Textarea
                    id="what_makes_unique"
                    placeholder="e.g., Small-batch candles inspired by cozy moments and seasonal vibes"
                    {...register("what_makes_unique")}
                    maxLength={250}
                    rows={4}
                    aria-required="true"
                    aria-invalid={!!errors.what_makes_unique}
                    aria-describedby="what_makes_unique_helper what_makes_unique_counter what_makes_unique_error"
                  />
                  <div className="flex justify-between items-center">
                    <p
                      className="text-xs text-muted-foreground"
                      id="what_makes_unique_helper"
                    >
                      What would you tell a friend who asked why they should buy
                      from you?
                    </p>
                    <CharacterCounter
                      current={whatMakesUnique.length}
                      max={250}
                    />
                  </div>
                  {errors.what_makes_unique && (
                    <p
                      className="text-sm text-destructive flex items-center gap-1"
                      id="what_makes_unique_error"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.what_makes_unique.message}
                    </p>
                  )}
                </div>

                {/* Target Customer */}
                <div className="space-y-2 mb-6">
                  <Label
                    htmlFor="target_customer"
                    className="flex items-center gap-2"
                  >
                    Who's your target customer?{" "}
                    <span className="text-destructive">*</span>
                    {targetCustomer.length >= 10 &&
                      targetCustomer.length <= 250 && (
                        <ValidationIndicator isValid={true} />
                      )}
                  </Label>
                  <Textarea
                    id="target_customer"
                    placeholder="e.g., Women 25-40 who love self-care rituals and creating cozy home spaces"
                    {...register("target_customer")}
                    maxLength={250}
                    rows={3}
                    aria-required="true"
                    aria-invalid={!!errors.target_customer}
                    aria-describedby="target_customer_helper target_customer_counter target_customer_error"
                  />
                  <div className="flex justify-between items-center">
                    <p
                      className="text-xs text-muted-foreground"
                      id="target_customer_helper"
                    >
                      Think demographics (age, gender) and psychographics (values,
                      lifestyle)
                    </p>
                    <CharacterCounter
                      current={targetCustomer.length}
                      max={250}
                    />
                  </div>
                  {errors.target_customer && (
                    <p
                      className="text-sm text-destructive flex items-center gap-1"
                      id="target_customer_error"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.target_customer.message}
                    </p>
                  )}
                </div>
              </div>

              {/* BRAND VIBE */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Brand Vibe
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base mb-3 block">
                      Pick 3-5 words that describe your brand's tone
                    </Label>

                    {/* Checkbox Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {PREDEFINED_VIBE_WORDS.map((word) => {
                        const isSelected = selectedVibeWords.has(word);
                        const isDisabled =
                          !isSelected && totalVibeWords >= 5;

                        return (
                          <div
                            key={word}
                            className={`flex items-center space-x-2 p-2 rounded-md border ${
                              isDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:bg-muted/50"
                            } ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "border-border"
                            }`}
                          >
                            <Checkbox
                              id={`vibe-${word}`}
                              checked={isSelected}
                              onCheckedChange={() => !isDisabled && toggleVibeWord(word)}
                              disabled={isDisabled}
                            />
                            <label
                              htmlFor={`vibe-${word}`}
                              className={`flex-1 text-sm ${
                                isDisabled
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              {word}
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selection Counter */}
                    <div className="mb-4">
                      <p
                        className={`text-sm font-medium ${
                          vibeWordsValid
                            ? "text-success flex items-center gap-1"
                            : totalVibeWords < 3
                            ? "text-muted-foreground"
                            : "text-destructive"
                        }`}
                      >
                        {totalVibeWords} selected (need 3-5)
                        {vibeWordsValid && <CheckCircle2 className="w-4 h-4" />}
                      </p>
                    </div>
                  </div>

                  {/* Custom Vibe Words */}
                  <div className="space-y-2">
                    <Label htmlFor="custom_vibe_words">
                      Custom words: <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="custom_vibe_words"
                      placeholder="e.g., minimalist, vintage, handcrafted"
                      {...register("custom_vibe_words")}
                      maxLength={90}
                      aria-describedby="custom_vibe_words_helper custom_vibe_words_counter custom_vibe_words_error"
                    />
                    <div className="flex justify-between items-center">
                      <p
                        className="text-xs text-muted-foreground"
                        id="custom_vibe_words_helper"
                      >
                        Add up to 3 custom words if our list doesn't have the
                        right fit
                      </p>
                      <CharacterCounter
                        current={customVibeWords.length}
                        max={90}
                      />
                    </div>
                    {customWordsCount > 3 && (
                      <p
                        className="text-sm text-destructive flex items-center gap-1"
                        id="custom_vibe_words_error"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Maximum 3 custom words allowed
                      </p>
                    )}
                    {errors.custom_vibe_words && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.custom_vibe_words.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tip Callout */}
              <Alert className="bg-primary/5 border-primary/20">
                <Lightbulb className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>TIP:</strong> Your brand profile helps AI write
                  captions that sound like you, not a robot.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <div className="pt-4 flex gap-3">
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
                  disabled={saving || !formValid}
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
                      {existingHub ? "Save Brand Profile" : "Create Brand Profile"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes to your brand profile. What would you like
              to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDiscardChanges}
              className="w-full sm:w-auto"
            >
              Discard Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
              className="w-full sm:w-auto"
            >
              Keep Editing
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              className="w-full sm:w-auto"
            >
              Save & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PostManager() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Post Manager</h1>
          <p className="text-muted-foreground text-lg">
            View and manage all your social media posts
          </p>
        </div>

        {/* Empty State Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center py-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <FileText className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl mb-3">No Posts Yet</CardTitle>
                <CardDescription className="text-base mb-6">
                  Create your first content plan to generate posts with AI-powered captions
                  and visual concepts. You'll be able to manage and edit them here.
                </CardDescription>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-primary hover:opacity-90 shadow-lg"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Plan
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
                  <span>All posts from your active campaigns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Filter by status, platform, or date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Quick edit captions and visual concepts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Approve posts for your content calendar</span>
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
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Post performance analytics</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

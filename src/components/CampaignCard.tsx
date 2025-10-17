import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Instagram, Facebook, Rocket, ArrowRight } from "lucide-react";
import { ContentPlan } from "@/types/database";
import { format } from "date-fns";

interface CampaignCardProps {
  campaign: ContentPlan;
  postCount: number;
  approvedCount: number;
  onClick: () => void;
}

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "instagram":
      return <Instagram className="w-4 h-4" />;
    case "facebook":
      return <Facebook className="w-4 h-4" />;
    case "tiktok":
      return <div className="text-xs font-bold">TT</div>;
    case "google_business":
      return <div className="text-xs font-bold">GB</div>;
    default:
      return null;
  }
};

export default function CampaignCard({ campaign, postCount, approvedCount, onClick }: CampaignCardProps) {
  const approvalPercentage = postCount > 0 ? Math.round((approvedCount / postCount) * 100) : 0;
  const startDate = format(new Date(campaign.start_date), "MMM d");
  const endDate = format(new Date(campaign.end_date), "MMM d, yyyy");

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer border-border group"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
              {campaign.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Calendar className="w-3 h-3" />
              {startDate} - {endDate}
            </CardDescription>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Platforms */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Platforms:</span>
          <div className="flex gap-1">
            {campaign.platforms.map((platform) => (
              <Badge key={platform} variant="secondary" className="flex items-center gap-1">
                {getPlatformIcon(platform)}
                <span className="capitalize">{platform}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Sales Channel */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sales Channel:</span>
          <Badge variant="outline" className="capitalize">
            {campaign.sales_channel_type.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Important Date */}
        {campaign.important_date && campaign.important_date_label && (
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">{campaign.important_date_label}</span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(campaign.important_date), "MMM d, yyyy")}
            </span>
          </div>
        )}

        {/* Post Stats */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Posts: {approvedCount}/{postCount}
            </span>
            <span className="text-sm font-medium text-primary">
              {approvalPercentage}% Approved
            </span>
          </div>
          <Progress value={approvalPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

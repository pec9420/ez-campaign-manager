import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlayCircle, CheckCircle2, XCircle, Code2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  subscription_tier: string;
}

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  platforms: string[];
}

const Developer = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [jsonInput, setJsonInput] = useState<string>('{\n  "content_plan_id": "",\n  "dry_run": true\n}');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['developer-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, subscription_tier')
        .order('email');

      if (error) throw error;
      return data as User[];
    },
  });

  // Fetch campaigns for selected user
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['developer-campaigns', selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_plans')
        .select('id, name, start_date, end_date, platforms')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  // Update JSON when campaign is selected
  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setJsonInput(JSON.stringify({
      content_plan_id: campaignId,
      dry_run: true
    }, null, 2));
  };

  // Test the orchestrate-campaign function
  const handleTestFunction = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setExecutionTime(null);

    const startTime = Date.now();

    try {
      // Parse JSON input
      let payload;
      try {
        payload = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error('Invalid JSON input');
      }

      // Ensure dry_run is true
      payload.dry_run = true;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate-campaign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(payload),
        }
      );

      const endTime = Date.now();
      setExecutionTime((endTime - startTime) / 1000);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResponse(data);
      toast.success('Function executed successfully!');
    } catch (err: any) {
      console.error('Function test error:', err);
      setError(err.message);
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary shadow-glow">
          <Code2 className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Developer Tools</h1>
          <p className="text-muted-foreground">Test edge functions in dry-run mode</p>
        </div>
      </div>

      {/* Test Context Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Test Context</CardTitle>
          <CardDescription>Choose a user and campaign to test with</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select
                value={selectedUserId}
                onValueChange={(value) => {
                  setSelectedUserId(value);
                  setSelectedCampaignId('');
                }}
                disabled={usersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} ({user.subscription_tier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign</label>
              <Select
                value={selectedCampaignId}
                onValueChange={handleCampaignSelect}
                disabled={!selectedUserId || campaignsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name} ({campaign.start_date} → {campaign.end_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Function Tester */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orchestrate Campaign</CardTitle>
              <CardDescription>Test the multi-agent campaign generation workflow</CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              Dry Run Mode
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* JSON Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Request Payload (JSON)</label>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{\n  "content_plan_id": "...",\n  "dry_run": true\n}'
              className="font-mono text-sm min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              dry_run is automatically set to true for safety
            </p>
          </div>

          {/* Test Button */}
          <Button
            onClick={handleTestFunction}
            disabled={isLoading || !jsonInput.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running test...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Test Function (Dry Run)
              </>
            )}
          </Button>

          {/* Execution Stats */}
          {executionTime !== null && (
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {error ? (
                  <XCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium">
                  {error ? 'Failed' : 'Success'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Duration: <span className="font-mono font-medium">{executionTime.toFixed(2)}s</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader>
                <CardTitle className="text-sm text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-destructive font-mono whitespace-pre-wrap">
                  {error}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Response Display */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>

                {/* Quick Stats */}
                {response.success && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <div className="text-2xl font-bold">{response.posts_created}</div>
                      <div className="text-xs text-muted-foreground">Posts Generated</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <div className="text-2xl font-bold">{response.shots_created}</div>
                      <div className="text-xs text-muted-foreground">Shots Created</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <div className="text-2xl font-bold">{response.strategy?.phases || 0}</div>
                      <div className="text-xs text-muted-foreground">Weekly Phases</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Developer;

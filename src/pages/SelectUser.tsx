import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  subscription_tier: string;
  posts_created_this_period: number;
  ai_regenerations_used_this_period: number;
}

interface BrandHub {
  business_name: string;
  what_you_sell: string;
  brand_vibe_words: string[];
}

interface UserWithBrand extends User {
  brand_hub: BrandHub | null;
}

const SelectUser = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all users with their brand hubs
    const fetchUsers = async () => {
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            subscription_tier,
            posts_created_this_period,
            ai_regenerations_used_this_period
          `)
          .order('email');

        if (usersError) throw usersError;

        // Fetch brand hub for each user
        const usersWithBrands = await Promise.all(
          (usersData || []).map(async (user) => {
            const { data: brandHub } = await supabase
              .from('brand_hub')
              .select('business_name, what_you_sell, brand_vibe_words')
              .eq('user_id', user.id)
              .single();

            return {
              ...user,
              brand_hub: brandHub,
            };
          })
        );

        setUsers(usersWithBrands);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSelectUser = (userId: string, email: string) => {
    // Store selected user ID in localStorage
    localStorage.setItem('selectedUserId', userId);
    toast.success(`Logged in as ${email}`);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4 shadow-glow">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Select User
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose a user profile to continue (Development Mode)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card
              key={user.id}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
              onClick={() => handleSelectUser(user.id, user.email)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">
                    {user.email}
                  </CardTitle>
                  <Badge
                    variant={user.subscription_tier === 'growth' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {user.subscription_tier}
                  </Badge>
                </div>
                {user.brand_hub?.business_name && (
                  <CardDescription className="text-sm font-medium">
                    {user.brand_hub.business_name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.brand_hub ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">What they sell:</p>
                        <p className="text-sm font-medium line-clamp-2">
                          {user.brand_hub.what_you_sell}
                        </p>
                      </div>

                      {user.brand_hub.brand_vibe_words && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Brand Vibe:</p>
                          <div className="flex flex-wrap gap-1">
                            {user.brand_hub.brand_vibe_words.map((vibe) => (
                              <Badge key={vibe} variant="outline" className="text-xs">
                                {vibe}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-2">
                      <p className="text-sm text-muted-foreground italic">
                        No brand hub created yet
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Posts:</p>
                        <p className="font-medium">{user.posts_created_this_period}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">AI Credits:</p>
                        <p className="font-medium">{user.ai_regenerations_used_this_period}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectUser;

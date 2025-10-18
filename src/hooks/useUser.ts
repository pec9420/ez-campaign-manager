import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  subscription_tier: string;
  subscription_status: string;
  posts_created_this_period: number;
  ai_regenerations_used_this_period: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get selected user ID from localStorage
    const selectedUserId = localStorage.getItem('selectedUserId');

    if (!selectedUserId) {
      setLoading(false);
      return;
    }

    // Fetch user data from Supabase
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', selectedUserId)
          .single();

        if (error) {
          console.error('[useUser] Error fetching user:', error);
          // Clear invalid user ID
          localStorage.removeItem('selectedUserId');
          setUser(null);
        } else {
          setUser(data);
        }
      } catch (error) {
        console.error('[useUser] Unexpected error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('selectedUserId');
    setUser(null);
  };

  return { user, loading, logout };
};

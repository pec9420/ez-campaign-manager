import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, LayoutDashboard, FileText, Palette, Settings, ChevronDown, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  email: string;
  subscription_tier: string;
  posts_created_this_period: number;
  ai_regenerations_used_this_period: number;
}

interface AppLayoutProps {
  children: ReactNode;
}

const SUBSCRIPTION_LIMITS = {
  starter: {
    posts: 90,
    ai_credits: 200,
  },
  growth: {
    posts: 200,
    ai_credits: 500,
  },
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading: userLoading, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect to user selection if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/select-user");
    }
  }, [user, userLoading, navigate]);

  // Fetch user data
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("email, subscription_tier, posts_created_this_period, ai_regenerations_used_this_period")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setUserData(data);
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/select-user");
  };

  // Navigation items
  const navItems = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "Content Manager",
      icon: FileText,
      path: "/content-manager",
    },
    {
      title: "Brand Hub",
      icon: Palette,
      path: "/brand-hub",
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  // Get usage limits based on tier
  const limits = userData?.subscription_tier
    ? SUBSCRIPTION_LIMITS[userData.subscription_tier as keyof typeof SUBSCRIPTION_LIMITS]
    : SUBSCRIPTION_LIMITS.starter;

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData?.email) return "U";
    return userData.email
      .split("@")[0]
      .split(".")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                Content Planner
              </h1>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          {/* Usage Stats */}
          <div className="px-4 py-3 space-y-2">
            <div className="text-xs text-muted-foreground">Usage this period</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Posts:</span>
                <span className="font-medium">
                  {userData?.posts_created_this_period ?? 0}/{limits.posts}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">AI:</span>
                <span className="font-medium">
                  {userData?.ai_regenerations_used_this_period ?? 0}/{limits.ai_credits}
                </span>
              </div>
            </div>
          </div>

          <SidebarSeparator />

          {/* User Account Dropdown */}
          <div className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium truncate">{userData?.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {userData?.subscription_tier ?? "starter"} plan
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Mobile header with hamburger */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold">Content Planner</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

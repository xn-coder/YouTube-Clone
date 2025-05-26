
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Youtube, UserCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { getSubscribedChannelPreviews, type ChannelPreview } from '@/app/actions/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: Flame },
  { href: '/subscriptions', label: 'Subscriptions Overview', icon: Youtube },
];

interface AppSidebarNavProps {
  isMobile?: boolean;
  className?: string;
}

const SubscriptionItemSkeleton = () => (
  <div className="flex items-center gap-3 rounded-lg px-3 py-2 h-10">
    <Skeleton className="h-6 w-6 rounded-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

export function AppSidebarNav({ isMobile = false, className }: AppSidebarNavProps) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
  const [subscribedChannels, setSubscribedChannels] = useState<ChannelPreview[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);

  useEffect(() => {
    async function fetchSubscriptions() {
      if (authLoading) { // Don't fetch if auth state is still loading
        setIsLoadingSubscriptions(true); // Keep showing loading state
        return;
      }
      if (!user) { // If user is not logged in, clear subscriptions and stop loading
        setSubscribedChannels([]);
        setIsLoadingSubscriptions(false);
        return;
      }

      // User is logged in, proceed to fetch subscriptions
      setIsLoadingSubscriptions(true);
      try {
        const previews = await getSubscribedChannelPreviews();
        setSubscribedChannels(previews);
      } catch (error) {
        console.error("Failed to load subscriptions for sidebar:", error);
        setSubscribedChannels([]); // Clear on error
      }
      setIsLoadingSubscriptions(false);
    }
    fetchSubscriptions();
  }, [user, authLoading]); // Re-run when user or authLoading state changes

  const displayedSubscriptions = subscribedChannels.slice(0, 5);
  const hasMoreSubscriptions = subscribedChannels.length > 5;

  return (
    <nav className={cn("flex flex-col gap-1 px-2 py-4", className)}>
      {mainNavItems.map((item) => (
        <Button
          key={item.label}
          variant={pathname === item.href ? 'secondary' : 'ghost'}
          className="justify-start"
          asChild
        >
          <Link href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:text-primary">
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        </Button>
      ))}

      {/* Conditional rendering for the entire subscriptions section */}
      {!authLoading && user && (
        <>
          <Separator className="my-3" />
          {isLoadingSubscriptions && !isMobile && (
            <>
              <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider">SUBSCRIPTIONS</h3>
              {[...Array(3)].map((_, i) => <SubscriptionItemSkeleton key={i} />)}
            </>
          )}

          {!isLoadingSubscriptions && subscribedChannels.length > 0 && !isMobile && (
            <>
              <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider">SUBSCRIPTIONS</h3>
              {displayedSubscriptions.map((channel) => (
                <Button
                  key={channel.id}
                  variant={pathname === `/channel/${channel.id}` ? 'secondary' : 'ghost'}
                  className="justify-start h-auto"
                  asChild
                >
                  <Link href={`/channel/${channel.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:text-primary">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={channel.avatarUrl} alt={channel.name} data-ai-hint="channel avatar small" />
                      <AvatarFallback>
                        <UserCircle className="h-full w-full text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{channel.name}</span>
                  </Link>
                </Button>
              ))}
              {hasMoreSubscriptions && (
                <Button
                  variant={'ghost'}
                  className="justify-start"
                  asChild
                >
                  <Link href="/subscriptions" className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:text-primary">
                    <ChevronRight className="h-5 w-5" />
                    More channels
                  </Link>
                </Button>
              )}
            </>
          )}
          {!isLoadingSubscriptions && subscribedChannels.length === 0 && !isMobile && (
            <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground">Subscribe to channels to see them here.</p>
            </div>
          )}
        </>
      )}
      {/* For mobile sheet, we might still want the separator if they were to log in and it appears */}
      {isMobile && user && <Separator className="my-3" />} 
    </nav>
  );
}

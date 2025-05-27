
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Youtube, UserCircle, ChevronRight, History, ListVideo, PlayCircle } from 'lucide-react'; // Added PlayCircle
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { getSubscribedChannelPreviews, type ChannelPreview } from '@/app/actions/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: Flame },
  { href: '/subscriptions', label: 'Subscriptions', icon: Youtube },
  { href: '/shorts', label: 'Shorts', icon: PlayCircle }, // Added Shorts link
];

const userNavItems = [ 
  { href: '/history', label: 'History', icon: History },
  { href: '/saved', label: 'Saved Videos', icon: ListVideo },
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
  const { user, loading: authLoading } = useAuth();
  const [subscribedChannels, setSubscribedChannels] = useState<ChannelPreview[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);

  useEffect(() => {
    async function fetchSubscriptions() {
      if (authLoading) {
        setIsLoadingSubscriptions(true);
        return;
      }
      if (!user) {
        setSubscribedChannels([]);
        setIsLoadingSubscriptions(false);
        return;
      }

      setIsLoadingSubscriptions(true);
      try {
        const previews = await getSubscribedChannelPreviews(user.uid || '');
        setSubscribedChannels(previews);
      } catch (error) {
        console.error("Failed to load subscriptions for sidebar:", error);
        setSubscribedChannels([]);
      }
      setIsLoadingSubscriptions(false);
    }
    if (user) { 
      fetchSubscriptions();
    } else if (!authLoading && !user) { 
      setSubscribedChannels([]);
      setIsLoadingSubscriptions(false);
    }
  }, [user, authLoading]);

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

      {!authLoading && user && (
        <>
          <Separator className="my-3" />
          {userNavItems.map((item) => (
            <Button
              key={item.label}
              variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
              className="justify-start"
              asChild
            >
              <Link href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:text-primary">
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          ))}
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
                      <AvatarImage src={channel.avatarUrl} alt={channel.name} data-ai-hint="channel avatar" />
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
      {!isMobile && !authLoading && !user && (
        <>
          <Separator className="my-3" />
          <div className="px-3 py-2">
            <p className="text-sm text-muted-foreground mb-2">Log in to see your history, saved videos, and subscriptions.</p>
            <Button asChild className="w-full">
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </>
      )}
      {isMobile && user && <Separator className="my-3" />} 
    </nav>
  );
}

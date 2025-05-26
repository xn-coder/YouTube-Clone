
'use client';

import { useState, useEffect } from 'react';
import { getSubscribedVideos } from '@/lib/data';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import type { Video } from '@/types'; // Ensure Video type is imported for PaginatedVideosResponse

interface PaginatedVideosResponse {
  videos: Video[];
  nextPageToken?: string;
  totalResults?: number;
}

const SubscriptionPageSkeleton = () => (
  <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
    <h1 className="text-2xl font-bold mb-6 text-foreground">My Subscriptions</h1>
    <div className={`grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-grow space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);


export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [initialFeed, setInitialFeed] = useState<PaginatedVideosResponse | null>(null);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);

  // Define fetchUserSubscribedVideos which will be memoized or defined based on user
  const fetchUserSubscribedVideos = async (maxResults: number, pageToken?: string): Promise<PaginatedVideosResponse> => {
    if (!user) {
      return { videos: [], nextPageToken: undefined, totalResults: 0 };
    }
    return getSubscribedVideos(user.uid, maxResults, pageToken);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (authLoading) {
        setIsFetchingInitial(true);
        return;
      }
      if (!user) {
        setIsFetchingInitial(false);
        setInitialFeed({ videos: [], nextPageToken: undefined, totalResults: 0 });
        return;
      }

      setIsFetchingInitial(true);
      try {
        const feed = await getSubscribedVideos(user.uid, 20); // Fetch initial 20 videos
        setInitialFeed(feed);
      } catch (error) {
        console.error("Error fetching initial subscribed videos:", error);
        setInitialFeed({ videos: [], nextPageToken: undefined, totalResults: 0 });
      } finally {
        setIsFetchingInitial(false);
      }
    };
    loadInitialData();
  }, [user, authLoading]);

  if (authLoading || (user && isFetchingInitial)) {
    return <SubscriptionPageSkeleton />;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold mb-6 text-foreground">My Subscriptions</h1>
        <p className="text-muted-foreground mb-4">Please log in to see videos from your subscriptions.</p>
        <Button onClick={() => router.push('/login')}>Login</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">My Subscriptions</h1>
      {initialFeed && (
        <ClientVideoFeed
          key={user.uid} // Re-key if user changes, though unlikely on same page visit
          initialVideos={initialFeed.videos}
          initialNextPageToken={initialFeed.nextPageToken}
          fetchVideosFunction={fetchUserSubscribedVideos}
          maxResultsPerPage={20}
          emptyMessage="No videos from your subscriptions yet, or you haven't subscribed to any channels."
        />
      )}
    </div>
  );
}

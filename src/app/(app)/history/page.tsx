
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getWatchHistory } from '@/app/actions/user';
import type { WatchHistoryItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HistoryVideoCard } from '@/components/video/HistoryVideoCard';
import { Separator } from '@/components/ui/separator';

const HistoryPageSkeleton = () => (
  <div className="space-y-6">
    {[...Array(2)].map((_, groupIndex) => (
      <div key={groupIndex}>
        <Skeleton className="h-6 w-1/4 mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 py-3">
            <Skeleton className="w-40 h-[90px] sm:w-48 sm:h-[108px] rounded-lg" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
        {groupIndex < 1 && <Separator className="my-4" />}
      </div>
    ))}
  </div>
);

interface GroupedHistory {
  [dateKey: string]: WatchHistoryItem[];
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      // Optional: Redirect to login or show login prompt handled below
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userHistory = await getWatchHistory(user.uid);
        setHistory(userHistory);
      } catch (err) {
        console.error("Error fetching watch history:", err);
        setError(err instanceof Error ? err.message : "Failed to load history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user, authLoading]);

  const groupHistoryByDate = (items: WatchHistoryItem[]): GroupedHistory => {
    return items.reduce((acc, item) => {
      const date = new Date(item.watchedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as GroupedHistory);
  };
  
  // Sort date groups: Today, Yesterday, then by actual date descending
  const getSortedDateGroups = (grouped: GroupedHistory): string[] => {
    return Object.keys(grouped).sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      if (a === 'Yesterday') return -1;
      if (b === 'Yesterday') return 1;
      // For specific dates, sort them chronologically (most recent first)
      // We use the first item's watchedAt date in each group for comparison
      return new Date(grouped[b][0].watchedAt).getTime() - new Date(grouped[a][0].watchedAt).getTime();
    });
  };


  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Watch History</h1>
        <HistoryPageSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Watch History</h1>
        <p className="text-muted-foreground mb-4">Please log in to view your watch history.</p>
        <Button onClick={() => router.push('/login')}>Login</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Watch History</h1>
        <p className="text-destructive">Error loading history: {error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Watch History</h1>
        <p className="text-muted-foreground">Your watch history is empty. Start watching videos to see them here!</p>
      </div>
    );
  }

  const groupedHistory = groupHistoryByDate(history);
  const sortedDateGroups = getSortedDateGroups(groupedHistory);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Watch History</h1>
      <div className="space-y-8">
        {sortedDateGroups.map((dateKey) => (
          <section key={dateKey}>
            <h2 className="text-xl font-semibold text-foreground mb-3 sticky top-16 bg-background/80 backdrop-blur-sm py-2 z-10">
              {dateKey}
            </h2>
            <div className="divide-y divide-border">
              {groupedHistory[dateKey].map((item) => (
                <HistoryVideoCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

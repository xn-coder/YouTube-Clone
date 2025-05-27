
'use client';

import { useState, useEffect } from 'react';
import { searchVideos } from '@/lib/data';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';
import type { Video } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const SHORTS_SEARCH_QUERY = '#shorts';

interface PaginatedVideosResponse {
  videos: Video[];
  nextPageToken?: string;
  totalResults?: number;
}

const ShortsPageSkeleton = () => (
  <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
    <Skeleton className="h-8 w-1/4 mb-6" /> {/* Title skeleton */}
    <div className={`grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`}>
      {[...Array(10)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-[250px] w-full rounded-lg" /> {/* Taller for shorts-like appearance */}
          <div className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-grow space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);


export default function ShortsPage() {
  const [initialFeed, setInitialFeed] = useState<PaginatedVideosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Shorts - Youtube Clone';
    const fetchInitialShorts = async () => {
      setIsLoading(true);
      try {
        const feed = await searchVideos(SHORTS_SEARCH_QUERY, 20);
        setInitialFeed(feed);
      } catch (error) {
        console.error("Error fetching shorts:", error);
        setInitialFeed({ videos: [], nextPageToken: undefined, totalResults: 0 });
      }
      setIsLoading(false);
    };

    fetchInitialShorts();
  }, []);

  const fetchMoreShorts = (maxResults: number, pageToken?: string) => {
    return searchVideos(SHORTS_SEARCH_QUERY, maxResults, pageToken);
  };
  
  if (isLoading) {
    return <ShortsPageSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Shorts</h1>
      {initialFeed && (
        <ClientVideoFeed
          key={SHORTS_SEARCH_QUERY} 
          initialVideos={initialFeed.videos}
          initialNextPageToken={initialFeed.nextPageToken}
          fetchVideosFunction={fetchMoreShorts}
          maxResultsPerPage={20}
          emptyMessage={`No videos found for "${SHORTS_SEARCH_QUERY}".`}
          // Consider a different grid layout for shorts if desired, e.g., more columns or taller items
          // gridClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        />
      )}
    </div>
  );
}


'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchVideos } from '@/lib/data';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';
import type { Video } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface PaginatedVideosResponse {
  videos: Video[];
  nextPageToken?: string;
  totalResults?: number;
}

const ResultsPageSkeleton = () => (
  <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
    <Skeleton className="h-8 w-1/2 mb-6" /> {/* Title skeleton */}
    <div className={`grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-[200px] w-full rounded-lg" />
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

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('search_query') || '';

  const [initialFeed, setInitialFeed] = useState<PaginatedVideosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = query ? `Search results for "${query}" - Youtube Clone` : 'Search Results - Youtube Clone';
    
    const fetchInitialResults = async () => {
      setIsLoading(true);
      if (query) {
        try {
          const feed = await searchVideos(query, 20);
          setInitialFeed(feed);
        } catch (error) {
          console.error("Error fetching search results:", error);
          setInitialFeed({ videos: [], nextPageToken: undefined, totalResults: 0 });
        }
      } else {
        setInitialFeed({ videos: [], nextPageToken: undefined, totalResults: 0 });
      }
      setIsLoading(false);
    };

    fetchInitialResults();
  }, [query]);

  const fetchMoreVideos = (maxResults: number, pageToken?: string) => {
    if (!query) return Promise.resolve({ videos: [], nextPageToken: undefined, totalResults: 0 });
    return searchVideos(query, maxResults, pageToken);
  };

  if (isLoading) {
    return <ResultsPageSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        Search Results {query && `for "${query}"`}
      </h1>
      {initialFeed && (
        <ClientVideoFeed
          key={query} 
          initialVideos={initialFeed.videos}
          initialNextPageToken={initialFeed.nextPageToken}
          fetchVideosFunction={fetchMoreVideos}
          maxResultsPerPage={20}
          emptyMessage={query ? `No results found for "${query}".` : "Enter a search term to begin."}
        />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsPageSkeleton />}>
      <ResultsPageContent />
    </Suspense>
  );
}

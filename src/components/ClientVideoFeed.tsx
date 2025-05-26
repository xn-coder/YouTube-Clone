
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Video } from '@/types';
import { VideoGrid } from '@/components/VideoGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from './ui/button'; // For a manual load more button as fallback/option

interface ClientVideoFeedProps {
  initialVideos?: Video[];
  initialNextPageToken?: string;
  fetchVideosFunction: (
    maxResults: number,
    pageToken?: string
  ) => Promise<{ videos: Video[]; nextPageToken?: string; totalResults?: number }>;
  maxResultsPerPage?: number;
  gridClassName?: string;
  emptyMessage?: string;
  showLoadMoreButton?: boolean; // Option to use a button instead of IntersectionObserver
}

const VideoFeedSkeleton = ({ count = 8, className }: { count?: number, className?: string }) => (
  <div className={`grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${className}`}>
    {[...Array(count)].map((_, i) => (
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
);


export function ClientVideoFeed({
  initialVideos = [],
  initialNextPageToken,
  fetchVideosFunction,
  maxResultsPerPage = 20,
  gridClassName,
  emptyMessage = "No videos found.",
  showLoadMoreButton = false,
}: ClientVideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(initialNextPageToken);
  
  // isLoading is true if initialVideos are empty and we expect to fetch them.
  // If initialVideos are empty AND initialNextPageToken is undefined, it means the server already determined no data.
  const [isLoading, setIsLoading] = useState<boolean>(
    initialVideos.length === 0 && initialNextPageToken !== undefined
  );
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // hasMore is true if there's an initialNextPageToken, OR if initialVideos are empty AND initialNextPageToken is not explicitly undefined
  // (meaning we should try an initial client fetch).
  // If initialVideos are provided, hasMore is simply !!initialNextPageToken.
  // If initialVideos are empty, hasMore is true IF initialNextPageToken is a string (more pages) or initialNextPageToken is not set at all (we haven't tried).
  // hasMore is false if initialVideos are empty AND initialNextPageToken is explicitly undefined (server said no more).
  const [hasMore, setHasMore] = useState<boolean>(
    initialVideos.length > 0 ? !!initialNextPageToken : (initialNextPageToken !== undefined)
  );
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadVideos = useCallback(async (isInitialLoad: boolean, currentToken?: string) => {
    if (isInitialLoad) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const response = await fetchVideosFunction(
        maxResultsPerPage,
        currentToken,
      );
      
      setVideos(prevVideos => isInitialLoad ? response.videos : [...prevVideos, ...response.videos]);
      setNextPageToken(response.nextPageToken);
      setHasMore(!!response.nextPageToken && response.videos.length > 0);
      if (response.videos.length === 0 && !response.nextPageToken) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos.");
      setHasMore(false); // Stop trying if there's an error
    } finally {
      if (isInitialLoad) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  }, [fetchVideosFunction, maxResultsPerPage]);


  useEffect(() => {
    // If initialVideos are empty, AND we initially determined there might be more (hasMore is true),
    // AND we are not already in an error state, then perform the initial load.
    if (initialVideos.length === 0 && isLoading && hasMore && !error) {
       loadVideos(true, initialNextPageToken);
    } else if (initialVideos.length > 0) {
      // If initial videos were provided, we are not initially loading.
      setIsLoading(false); 
      // setHasMore is already correctly initialized based on initialNextPageToken if initialVideos are present.
    } else {
      // This case covers:
      // 1. initialVideos is empty, but hasMore was false (server said no data, no token).
      // 2. initialVideos is empty, but isLoading was false (shouldn't happen with new isLoading init).
      // 3. Or there's an error.
      // In any of these, ensure isLoading is false.
      setIsLoading(false);
    }
  }, []); // Ran once on mount, dependencies on initial state are implicitly handled by useState.

  useEffect(() => {
    if (showLoadMoreButton || !hasMore || isLoadingMore) return;

    const currentLoaderRef = loaderRef.current;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading && !error) {
          loadVideos(false, nextPageToken);
        }
      },
      { threshold: 0.8 } // Trigger when 80% of the loader is visible
    );

    if (currentLoaderRef) {
      observerRef.current.observe(currentLoaderRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, isLoading, nextPageToken, loadVideos, error, showLoadMoreButton]);

  if (isLoading && videos.length === 0) { // Show skeleton if loading initial videos and list is empty
    return <VideoFeedSkeleton count={maxResultsPerPage} className={gridClassName} />;
  }
  
  if (error && videos.length === 0) {
    return <p className="text-center text-destructive py-8">Error: {error}</p>;
  }

  if (videos.length === 0 && !isLoading && !hasMore) { // Show empty message if no videos, not loading, and no more to fetch
    return <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>;
  }

  return (
    <div>
      <VideoGrid videos={videos} className={gridClassName} />
      {!showLoadMoreButton && hasMore && !error && (
        <div ref={loaderRef} className="flex justify-center items-center py-6">
          <VideoFeedSkeleton count={1} className="opacity-50 w-1/4"/>
        </div>
      )}
      {showLoadMoreButton && hasMore && !isLoadingMore && !error && (
        <div className="flex justify-center py-6">
          <Button onClick={() => loadVideos(false, nextPageToken)} variant="outline">
            Load More
          </Button>
        </div>
      )}
      {isLoadingMore && !showLoadMoreButton && (
         <div className="flex justify-center items-center py-6">
          <VideoFeedSkeleton count={1} className="opacity-50 w-1/4"/>
        </div>
      )}
      {!hasMore && videos.length > 0 && !error && (
        <p className="text-center text-muted-foreground py-8">You've reached the end!</p>
      )}
    </div>
  );
}

    

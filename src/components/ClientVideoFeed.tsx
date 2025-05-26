
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
  const [isLoading, setIsLoading] = useState<boolean>(initialVideos.length === 0 && !!initialNextPageToken); // True if initial load needed
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(!!initialNextPageToken || initialVideos.length === 0);

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
    // If initialVideos are not provided, fetch them on mount.
    // This handles cases where the parent Server Component couldn't pre-fetch (e.g., search results).
    if (initialVideos.length === 0 && !isLoading && hasMore && !error) {
       loadVideos(true, initialNextPageToken);
    } else if (initialVideos.length > 0) {
        setIsLoading(false); // Already have initial videos
        setHasMore(!!initialNextPageToken);
    }
  }, []); // Ran once on mount

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

  if (isLoading && videos.length === 0) {
    return <VideoFeedSkeleton count={maxResultsPerPage} className={gridClassName} />;
  }
  
  if (error && videos.length === 0) {
    return <p className="text-center text-destructive py-8">Error: {error}</p>;
  }

  if (videos.length === 0 && !isLoading && !hasMore) {
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

    

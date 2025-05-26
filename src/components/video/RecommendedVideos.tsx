
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Video } from '@/types';
import { formatNumber } from '@/lib/utils';
import { getRecommendedVideos } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

interface RecommendedVideosProps {
  videoId: string;
  maxTotalItems?: number;
}

const RecommendedVideoItemSkeleton = ({ count = 5 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div key={i} className="flex gap-2.5">
        <Skeleton className="w-40 h-[90px] flex-shrink-0 rounded-md" />
        <div className="flex-grow min-w-0 space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </>
);

export function RecommendedVideos({ 
  videoId,
  maxTotalItems = 15 
}: RecommendedVideosProps) {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  
  const loadRecommended = useCallback(async (isInitialLoad: boolean, currentToken?: string) => {
    if (!user) { // Don't fetch if user is not logged in
      setIsLoadingInitial(false);
      setIsLoadingMore(false);
      setHasMore(false);
      setVideos([]);
      return;
    }
    
    if (videos.length >= maxTotalItems && !isInitialLoad) {
      setHasMore(false);
      return;
    }

    if (isInitialLoad) setIsLoadingInitial(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      // Fetch 5 for initial, 5 for subsequent loads, up to maxTotalItems
      const resultsToFetch = isInitialLoad ? Math.min(5, maxTotalItems) : Math.min(5, maxTotalItems - videos.length);
      if (resultsToFetch <= 0) {
          setHasMore(false);
          if (isInitialLoad) setIsLoadingInitial(false); else setIsLoadingMore(false);
          return;
      }

      const result = await getRecommendedVideos(videoId, resultsToFetch, currentToken);
      
      setVideos(prev => isInitialLoad ? result.videos : [...prev, ...result.videos]);
      setNextPageToken(result.nextPageToken);
      const newTotalVideos = isInitialLoad ? result.videos.length : videos.length + result.videos.length;
      setHasMore(!!result.nextPageToken && newTotalVideos < maxTotalItems && result.videos.length > 0);

    } catch (err) {
      console.error("Failed to load recommended videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos.");
      setHasMore(false);
    } finally {
      if (isInitialLoad) setIsLoadingInitial(false);
      else setIsLoadingMore(false);
    }
  }, [videoId, user, maxTotalItems, videos.length]); // Added videos.length to dependencies

  useEffect(() => {
    // Effect to trigger initial load when user status is known and they are logged in
    if (!authLoading && user) {
        if(videos.length === 0 && hasMore){ // only load if videos are empty and hasMore potentially
             loadRecommended(true, undefined);
        }
    } else if (!authLoading && !user) {
      // User is not logged in, clear videos and stop loading states
      setVideos([]);
      setNextPageToken(undefined);
      setHasMore(false);
      setIsLoadingInitial(false);
      setIsLoadingMore(false);
      setError(null);
    }
  }, [authLoading, user, loadRecommended, videos.length, hasMore]);


  useEffect(() => {
    // Intersection observer for loading more
    if (!hasMore || isLoadingMore || isLoadingInitial || !user) return;

    const currentLoaderRef = loaderRef.current;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadRecommended(false, nextPageToken);
        }
      },
      { threshold: 0.5 }
    );

    if (currentLoaderRef) {
      observerRef.current.observe(currentLoaderRef);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoadingMore, isLoadingInitial, nextPageToken, loadRecommended, user]);


  if (authLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground mb-3">Recommended</h3>
        <RecommendedVideoItemSkeleton count={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 py-4 text-center">
        <p className="text-sm text-muted-foreground">Please log in to see recommended videos.</p>
      </div>
    );
  }
  
  if (isLoadingInitial && videos.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground mb-3">Recommended</h3>
        <RecommendedVideoItemSkeleton count={5} />
      </div>
    );
  }
  
  if (error && videos.length === 0) {
     return <p className="text-muted-foreground text-sm">Could not load recommendations.</p>;
  }

  if (videos.length === 0 && !isLoadingInitial && !hasMore) {
    return <p className="text-muted-foreground text-sm">No recommendations available for this video.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground mb-3">Recommended</h3>
      {videos.map((video) => (
        <Link href={`/watch/${video.id}`} key={`${video.id}-${Math.random()}`} className="flex gap-2.5 group">
          <div className="w-40 flex-shrink-0 relative">
            <Image
              src={video.thumbnailUrl || 'https://placehold.co/160x90.png'}
              alt={video.title}
              width={160}
              height={90}
              className="rounded-md object-cover aspect-video group-hover:opacity-80 transition-opacity"
              data-ai-hint="video thumbnail small"
            />
            {video.duration && (
              <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1 py-0.5 rounded-sm">
                {video.duration}
              </span>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary leading-tight">{video.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground line-clamp-1" title={video.channel.name}>{video.channel.name}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(video.views)} views &bull; {video.uploadDate}</p>
          </div>
        </Link>
      ))}
      {isLoadingMore && <RecommendedVideoItemSkeleton count={2}/>}
      {hasMore && !isLoadingMore && user && (
        <div ref={loaderRef} className="h-10" /> 
      )}
      {!hasMore && videos.length > 0 && videos.length >= maxTotalItems && (
        <p className="text-center text-xs text-muted-foreground py-3">Showing top {maxTotalItems} recommendations.</p>
      )}
    </div>
  );
}

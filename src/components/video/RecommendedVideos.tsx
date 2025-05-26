
'use client'; // Making this client component to handle its own potential pagination if needed

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Video } from '@/types';
import { formatNumber } from '@/lib/utils';
import { getRecommendedVideos } from '@/lib/data'; // Assuming we might call it from here
import { Skeleton } from '@/components/ui/skeleton';

interface RecommendedVideosProps {
  initialVideos: Video[];
  initialNextPageToken?: string;
  videoId: string; // Needed if we want to fetch more related to this video
  maxTotalItems?: number; // Max items to show, to prevent excessive loading
}

const RecommendedVideoItemSkeleton = () => (
  <div className="flex gap-2.5">
    <Skeleton className="w-40 h-[90px] flex-shrink-0 rounded-md" />
    <div className="flex-grow min-w-0 space-y-1">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
);

export function RecommendedVideos({ 
  initialVideos, 
  initialNextPageToken, 
  videoId,
  maxTotalItems = 15 // Default max recommended videos to show
}: RecommendedVideosProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(initialNextPageToken);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(!!initialNextPageToken && initialVideos.length < maxTotalItems);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  
  const loadMoreRecommended = useCallback(async () => {
    if (!nextPageToken || videos.length >= maxTotalItems) {
      setHasMore(false);
      return;
    }
    setIsLoadingMore(true);
    try {
      const result = await getRecommendedVideos(videoId, 5, nextPageToken); // Fetch 5 more at a time
      setVideos(prev => [...prev, ...result.videos]);
      setNextPageToken(result.nextPageToken);
      setHasMore(!!result.nextPageToken && (videos.length + result.videos.length) < maxTotalItems);
    } catch (error) {
      console.error("Failed to load more recommended videos:", error);
      setHasMore(false); // Stop trying on error
    }
    setIsLoadingMore(false);
  }, [nextPageToken, videoId, videos.length, maxTotalItems]);

  useEffect(() => {
    setVideos(initialVideos);
    setNextPageToken(initialNextPageToken);
    setHasMore(!!initialNextPageToken && initialVideos.length < maxTotalItems);
  }, [initialVideos, initialNextPageToken, maxTotalItems]);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const currentLoaderRef = loaderRef.current;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreRecommended();
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
  }, [hasMore, isLoadingMore, loadMoreRecommended]);


  if (!videos || videos.length === 0 && !hasMore && !isLoadingMore) {
    return <p className="text-muted-foreground">No recommendations available.</p>;
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
      {isLoadingMore && <RecommendedVideoItemSkeleton />}
      {hasMore && !isLoadingMore && (
        <div ref={loaderRef} className="h-10" /> // Invisible loader trigger
      )}
    </div>
  );
}

    
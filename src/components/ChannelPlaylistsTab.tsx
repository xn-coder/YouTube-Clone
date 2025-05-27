
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Playlist } from '@/types';
import { getChannelPlaylists } from '@/lib/data';
import { PlaylistCard } from '@/components/video/PlaylistCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ChannelPlaylistsTabProps {
  channelId: string;
}

const PlaylistGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-[180px] w-full rounded-lg bg-muted" /> {/* Aspect ratio for thumbnail */}
        <Skeleton className="h-5 w-3/4 bg-muted" />
        <Skeleton className="h-4 w-1/2 bg-muted" />
      </div>
    ))}
  </div>
);

export function ChannelPlaylistsTab({ channelId }: ChannelPlaylistsTabProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const maxResultsPerPage = 12; // Number of playlists to fetch per page

  const loadPlaylists = useCallback(async (isInitialLoad: boolean, currentToken?: string) => {
    if (isInitialLoad) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const response = await getChannelPlaylists(channelId, maxResultsPerPage, currentToken);
      setPlaylists(prev => isInitialLoad ? response.playlists : [...prev, ...response.playlists]);
      setNextPageToken(response.nextPageToken);
      setHasMore(!!response.nextPageToken && response.playlists.length > 0);
      if (response.playlists.length === 0 && !response.nextPageToken) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading channel playlists:", err);
      setError(err instanceof Error ? err.message : "Failed to load playlists.");
      setHasMore(false);
    } finally {
      if (isInitialLoad) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  }, [channelId, maxResultsPerPage]);

  useEffect(() => {
    loadPlaylists(true, undefined);
  }, [loadPlaylists]);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading) return;

    const currentLoaderRef = loaderRef.current;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading && !error) {
          loadPlaylists(false, nextPageToken);
        }
      },
      { threshold: 0.5 }
    );

    if (currentLoaderRef) {
      observerRef.current.observe(currentLoaderRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, isLoading, nextPageToken, loadPlaylists, error]);

  if (isLoading && playlists.length === 0) {
    return <PlaylistGridSkeleton count={maxResultsPerPage} />;
  }

  if (error && playlists.length === 0) {
    return <p className="py-6 text-center text-destructive">Error: {error}</p>;
  }

  if (playlists.length === 0 && !isLoading && !hasMore) {
    return <p className="py-6 text-center text-muted-foreground">This channel has no public playlists.</p>;
  }

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {playlists.map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
      {hasMore && !error && (
        <div ref={loaderRef} className="flex justify-center items-center py-8">
          {isLoadingMore ? <PlaylistGridSkeleton count={3} /> : <Button variant="outline" onClick={() => loadPlaylists(false, nextPageToken)} disabled={isLoadingMore}>Load More Playlists</Button> }
        </div>
      )}
      {!hasMore && playlists.length > 0 && !error && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          You've reached the end of the playlists for this channel.
        </p>
      )}
    </div>
  );
}

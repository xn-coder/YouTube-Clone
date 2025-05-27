
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPlaylistDetails, getPlaylistItems } from '@/lib/data';
import type { Playlist, Video } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Layers, CalendarDays, ListVideo as ListVideoIcon, Link as LinkIcon } from 'lucide-react'; // Added icons
import { formatNumber, formatPublishedAt } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';


const PlaylistPageSkeleton = () => (
  <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 animate-pulse">
    <div className="flex flex-col md:flex-row gap-6 mb-8">
      <Skeleton className="w-full md:w-1/3 aspect-video rounded-xl bg-muted" />
      <div className="w-full md:w-2/3 space-y-3">
        <Skeleton className="h-8 w-3/4 rounded bg-muted" />
        <Skeleton className="h-5 w-1/2 rounded bg-muted" />
        <Skeleton className="h-5 w-1/4 rounded bg-muted" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-10 w-10 rounded-full bg-muted" />
          <Skeleton className="h-5 w-1/3 rounded bg-muted" />
        </div>
        <Skeleton className="h-12 w-full rounded bg-muted mt-2" /> {/* Description lines */}
        <Skeleton className="h-5 w-full rounded bg-muted" />
      </div>
    </div>
    <Skeleton className="h-px w-full my-6 bg-muted" />
    <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-[200px] w-full rounded-lg bg-muted" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full bg-muted" />
            <div className="flex-grow space-y-1">
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-3 w-1/2 bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = typeof params.playlistId === 'string' ? params.playlistId.trim() : null;

  const [playlistDetails, setPlaylistDetails] = useState<Playlist | null | undefined>(undefined); // undefined for loading, null for not found
  const [initialVideoFeed, setInitialVideoFeed] = useState<{ videos: Video[], nextPageToken?: string, totalResults?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) {
      notFound();
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const details = await getPlaylistDetails(playlistId);
        if (!details) {
          setError('Playlist not found.');
          setPlaylistDetails(null);
          setIsLoading(false);
          return;
        }
        setPlaylistDetails(details);
        document.title = `${details.title} - Playlist - Youtube Clone`;

        const items = await getPlaylistItems(playlistId, 20); // Fetch initial 20 items
        setInitialVideoFeed(items);

      } catch (err) {
        console.error("Error fetching playlist data:", err);
        setError(err instanceof Error ? err.message : "Failed to load playlist data.");
        setPlaylistDetails(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [playlistId]);

  const fetchPlaylistItemsFn = useCallback((maxResults: number, pageToken?: string) => {
    if (!playlistId) return Promise.resolve({ videos: [], nextPageToken: undefined, totalResults: 0 });
    return getPlaylistItems(playlistId, maxResults, pageToken);
  }, [playlistId]);

  if (isLoading && playlistDetails === undefined) {
    return <PlaylistPageSkeleton />;
  }

  if (playlistDetails === null || error) {
    // If playlistDetails is explicitly null (meaning not found from API) or error state
    notFound(); // Or display a more specific error message component
    return null;
  }
  
  // Should not be reached if notFound is called, but as a fallback.
  if (!playlistDetails) { 
    return <p className="text-center text-muted-foreground py-8">Playlist details could not be loaded.</p>;
  }


  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-1/3 md:sticky md:top-20 h-fit">
          <div className="bg-card p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted mb-4 relative">
              {playlistDetails.thumbnailUrl ? (
                <Image
                  src={playlistDetails.thumbnailUrl}
                  alt={playlistDetails.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  data-ai-hint="playlist thumbnail"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted-foreground/10">
                  <Layers className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1 line-clamp-3">{playlistDetails.title}</h1>
            <Link href={`/channel/${playlistDetails.channelId}`} className="group inline-flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
              <Avatar className="h-6 w-6">
                {/* Placeholder for channel avatar, assuming playlistDetails doesn't directly carry it */}
                <AvatarFallback><UserCircle className="h-full w-full text-muted-foreground group-hover:text-primary" /></AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">{playlistDetails.channelTitle}</p>
            </Link>
            
            <div className="text-xs text-muted-foreground space-y-1 mb-3">
              <div className="flex items-center gap-1.5">
                <ListVideoIcon className="w-3.5 h-3.5" />
                <span>{formatNumber(playlistDetails.videoCount)} video{playlistDetails.videoCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Updated {formatPublishedAt(playlistDetails.publishedAt)}</span>
              </div>
            </div>

            {playlistDetails.description && (
              <p className="text-sm text-muted-foreground line-clamp-4 mb-4">
                {playlistDetails.description}
              </p>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/watch/${initialVideoFeed?.videos[0]?.id}?list=${playlistId}`)} disabled={!initialVideoFeed?.videos[0]}>
              Play All
            </Button>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          {playlistDetails.videoCount === 0 && !isLoading ? (
            <p className="text-center text-muted-foreground py-8">This playlist is currently empty.</p>
          ) : initialVideoFeed ? (
            <ClientVideoFeed
              key={playlistId + '-items'} // Ensure re-render if playlistId changes
              initialVideos={initialVideoFeed.videos}
              initialNextPageToken={initialVideoFeed.nextPageToken}
              fetchVideosFunction={fetchPlaylistItemsFn}
              maxResultsPerPage={20}
              gridClassName="grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3" // More list-like for playlist items
              emptyMessage="No videos found in this playlist."
            />
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-[120px] w-full rounded-lg bg-muted" />
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-grow space-y-1">
                      <Skeleton className="h-4 w-3/4 bg-muted" />
                      <Skeleton className="h-3 w-1/2 bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

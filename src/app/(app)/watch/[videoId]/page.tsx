
'use client'; // Make this a client component to use useEffect and useRef

import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { CommentsList } from '@/components/video/CommentsList';
import { SubscriptionToggle } from '@/components/video/SubscriptionToggle';
import { RecommendedVideos } from '@/components/video/RecommendedVideos';
import { getVideoById, getCommentsByVideoId } from '@/lib/data';
import { ThumbsUp, ThumbsDown, Share2, ListPlus, UserCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { notFound, useRouter } from 'next/navigation'; // useRouter can be used client-side
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import type { Video, Comment as CommentType } from '@/types'; // Assuming Comment type is exported as CommentType
import { useAuth } from '@/contexts/AuthContext';
import { recordWatchEvent } from '@/app/actions/user';

// Note: generateMetadata should remain a separate export if used for server-side metadata generation.
// However, if this page is fully client-rendered for video details, metadata might need dynamic updates.
// For now, assuming metadata is handled or we'll address it if issues arise with client rendering.

export default function WatchPage({ params }: { params: { videoId: string } }) {
  const cleanVideoId = params.videoId?.trim();
  const router = useRouter(); // For potential client-side navigation if needed

  const [video, setVideo] = useState<Video | null | undefined>(undefined); // undefined for loading, null for not found
  const [initialCommentsData, setInitialCommentsData] = useState<{ comments: CommentType[]; nextPageToken?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const hasRecordedWatchEvent = useRef(false);

  useEffect(() => {
    if (!cleanVideoId) {
      notFound();
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const videoData = await getVideoById(cleanVideoId);
        if (!videoData) {
          setVideo(null); // Mark as not found
          // notFound(); // This would immediately terminate rendering, might be too abrupt if part of page should show
          setIsLoading(false);
          return;
        }
        setVideo(videoData);

        const comments = await getCommentsByVideoId(cleanVideoId, 20);
        setInitialCommentsData(comments);

      } catch (error) {
        console.error("Error fetching video or comments:", error);
        setVideo(null); // Treat error as not found for video display
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [cleanVideoId]);


  useEffect(() => {
    const recordView = async () => {
      if (!authLoading && user && video && video.id && !hasRecordedWatchEvent.current) {
        console.log("WatchPage: Attempting to record watch event for video:", video.id, "User:", user.uid);
        try {
          hasRecordedWatchEvent.current = true; // Set flag immediately

          const result = await recordWatchEvent(user.uid, {
            videoId: video.id,
            videoTitle: video.title,
            channelId: video.channel.id,
            channelName: video.channel.name,
            thumbnailUrl: video.thumbnailUrl,
          });

          if (result.success) {
            console.log("WatchPage: Watch event recorded successfully for video:", video.id);
          } else {
            console.error("WatchPage: Failed to record watch event:", result.message);
            // Optionally reset flag if you want to allow retries on failure.
            // hasRecordedWatchEvent.current = false;
          }
        } catch (error) {
          console.error("WatchPage: Error calling recordWatchEvent:", error);
          // hasRecordedWatchEvent.current = false;
        }
      } else {
        if (authLoading) console.log("WatchPage: Auth still loading, skipping watch event record attempt.");
        else if (!user) console.log("WatchPage: User not logged in, skipping watch event record attempt.");
        else if (!video || !video.id) console.log("WatchPage: Video details not yet available, skipping watch event record attempt.");
        else if (hasRecordedWatchEvent.current) console.log("WatchPage: Watch event already recorded for this video load.");
      }
    };

    if (video) { // Only attempt to record if video data is present
      recordView();
    }
  }, [user, authLoading, video]);


  if (isLoading || authLoading && video === undefined) { // Show loading if main data or auth is loading and video isn't determined yet
    return (
      <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 lg:px-6 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (video === null) { // Explicitly checking for null which we set on not found or error
    // This is a client-side notFound. If you want Next.js's standard 404 page,
    // you might need to throw notFound() earlier or handle routing differently.
    // For now, showing a message:
     notFound(); // Trigger Next.js 404 page
     return null;
  }
  
  // Ensure video is not undefined here before accessing its properties
  if (!video) {
      // This case should ideally be covered by isLoading or video === null
      // but as a fallback:
      notFound();
      return null;
  }


  return (
    <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content: Video player and details */}
        <div className="lg:w-2/3">
          <VideoPlayer
            youtubeVideoId={video.id}
            title={video.title}
            posterUrl={video.highQualityThumbnailUrl || video.thumbnailUrl}
          />

          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{video.title}</h1>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href={`/channel/${video.channel.id}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={video.channel.avatarUrl} alt={video.channel.name} data-ai-hint="channel avatar" />
                    <AvatarFallback><UserCircle className="h-full w-full text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/channel/${video.channel.id}`} className="text-sm font-medium text-foreground hover:text-primary line-clamp-1" title={video.channel.name}>
                    {video.channel.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatNumber(video.views)} views &bull; {video.uploadDate}</p>
                </div>
                <SubscriptionToggle channel={video.channel} />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm"><ThumbsUp className="mr-1.5 h-4 w-4" /> {video.likeCount !== undefined ? formatNumber(video.likeCount) : 'Like'}</Button>
                <Button variant="outline" size="sm"><ThumbsDown className="mr-1.5 h-4 w-4" /> Dislike</Button>
                <Button variant="outline" size="sm"><Share2 className="mr-1.5 h-4 w-4" /> Share</Button>
                <Button variant="outline" size="sm"><ListPlus className="mr-1.5 h-4 w-4" /> Save</Button>
              </div>
            </div>

            {video.description && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg max-h-60 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}

            <Separator className="my-6" />

            {initialCommentsData && cleanVideoId && (
              <CommentsList videoId={cleanVideoId} initialComments={initialCommentsData.comments} />
            )}
          </div>
        </div>

        {/* Sidebar: Recommended videos */}
        <div className="lg:w-1/3 lg:sticky lg:top-20 h-fit">
          {cleanVideoId && <RecommendedVideos videoId={cleanVideoId} />}
        </div>
      </div>
    </div>
  );
}

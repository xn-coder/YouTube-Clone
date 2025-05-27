
'use client'; 

import { useEffect, useRef, useState, use } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { SubscriptionToggle } from '@/components/video/SubscriptionToggle';
import { RecommendedVideos } from '@/components/video/RecommendedVideos';
import { getVideoById } from '@/lib/data';
import { ThumbsUp, ThumbsDown, Share2, ListPlus, UserCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { notFound, useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import type { Video } from '@/types'; 
import { useAuth } from '@/contexts/AuthContext';
import { recordWatchEvent } from '@/app/actions/user';
import { AppCommentsList } from '@/components/video/AppCommentsList'; 
import { toggleSaveVideo, isUserVideoSaved } from '@/app/actions/userInteractions';
import { useToast } from '@/hooks/use-toast';


export default function WatchPage({ params: paramsProp }: { params: { videoId: string } }) {
  const params = use(paramsProp);
  const cleanVideoId = params.videoId?.trim();
  const router = useRouter();
  const { toast } = useToast();

  const [video, setVideo] = useState<Video | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


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
          setVideo(null); 
          setIsLoading(false);
          notFound(); // Trigger notFound if videoData is null
          return;
        }
        setVideo(videoData);
        document.title = `${videoData.title} - Youtube Clone`;

        if (user && videoData) {
          const savedStatus = await isUserVideoSaved(user.uid, videoData.id);
          setIsSaved(savedStatus);
        }

      } catch (error) {
        console.error("Error fetching video details:", error);
        setVideo(null); 
        notFound(); // Trigger notFound on error as well
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [cleanVideoId, user]); 


  useEffect(() => {
    const recordView = async () => {
      if (!authLoading && user && video && video.id && !hasRecordedWatchEvent.current) {
        console.log("WatchPage: Attempting to record watch event for video:", video.id, "User:", user.uid);
        try {
          hasRecordedWatchEvent.current = true; 

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
            if (result.message && result.message.includes("PERMISSION_DENIED")) {
              console.warn(
                "WatchPage: This 'PERMISSION_DENIED' error usually means your Firestore security rules are not allowing this write. " +
                "Please ensure that an authenticated user (request.auth.uid == userId) has permission to write to their 'users/{userId}/watchHistory/{videoId}' path in Firestore. " +
                "Example rule for watchHistory: match /users/{userId}/watchHistory/{historyEntryId} { allow read, write: if request.auth != null && request.auth.uid == userId; }"
              );
            }
            // hasRecordedWatchEvent.current = false; // Decide if retries should be allowed
          }
        } catch (error) {
          console.error("WatchPage: Error calling recordWatchEvent:", error);
          // hasRecordedWatchEvent.current = false; // Decide if retries should be allowed
        }
      } else {
        if (authLoading) console.log("WatchPage: Auth still loading, skipping watch event record attempt.");
        else if (!user) console.log("WatchPage: User not logged in, skipping watch event record attempt.");
        else if (!video || !video.id) console.log("WatchPage: Video details not yet available, skipping watch event record attempt.");
        else if (hasRecordedWatchEvent.current) console.log("WatchPage: Watch event already recorded for this video load.");
      }
    };

    if (video && !authLoading) { 
      recordView();
    }
  }, [user, authLoading, video]);


  const handleToggleSave = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to save videos.", variant: "destructive" });
      return;
    }
    if (!video) return;

    setIsSaving(true);
    try {
      const result = await toggleSaveVideo(user.uid, {
        videoId: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        channelId: video.channel.id,
        channelName: video.channel.name,
      });
      if (result.success) {
        setIsSaved(result.isSaved);
        toast({ title: result.isSaved ? "Video Saved!" : "Video Unsaved", description: result.isSaved ? `"${video.title}" added to your saved videos.` : `"${video.title}" removed from your saved videos.` });
      } else {
        toast({ title: "Error", description: result.error || "Could not update saved status.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!video) return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({ title: "Link Copied!", description: "Video link copied to clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        toast({ title: "Copy Failed", description: "Could not copy link to clipboard.", variant: "destructive" });
      });
  };

  if (isLoading || (authLoading && video === undefined)) { 
    return (
      <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 lg:px-6 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // if video is explicitly null (meaning fetch attempt failed or returned no data), trigger notFound.
  // This ensures that notFound is called after the loading state.
  if (video === null) { 
     notFound();
     return null; // Keep this to satisfy TypeScript, though notFound will prevent further rendering.
  }

  // This check is a fallback, primary handling is now in fetchData.
  if (!video) { 
      notFound();
      return null;
  }


  return (
    <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col lg:flex-row gap-6">
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
                <Button variant="outline" size="sm" title="Like (UI Only)">
                    <ThumbsUp className="mr-1.5 h-4 w-4" /> {video.likeCount !== undefined ? formatNumber(video.likeCount) : 'Like'}
                </Button>
                <Button variant="outline" size="sm" title="Dislike (UI Only)">
                    <ThumbsDown className="mr-1.5 h-4 w-4" /> Dislike
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="mr-1.5 h-4 w-4" /> Share</Button>
                <Button variant="outline" size="sm" onClick={handleToggleSave} disabled={isSaving || authLoading}>
                  {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ListPlus className="mr-1.5 h-4 w-4" />}
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>

            {video.description && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg max-h-60 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}

            <Separator className="my-6" />

            {cleanVideoId && (
              <AppCommentsList 
                videoId={cleanVideoId} 
                currentUser={user ? { uid: user.uid, displayName: user.displayName || user.email?.split('@')[0] || 'User', photoURL: user.photoURL } : null}
              />
            )}
          </div>
        </div>

        <div className="lg:w-1/3 lg:sticky lg:top-20 h-fit">
          {cleanVideoId && <RecommendedVideos videoId={cleanVideoId} />}
        </div>
      </div>
    </div>
  );
}

    

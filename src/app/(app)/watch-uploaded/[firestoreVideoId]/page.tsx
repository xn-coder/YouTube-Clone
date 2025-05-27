
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { getUploadedVideoById } from '@/app/actions/user';
import type { UserUploadedVideo } from '@/types';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { Loader2, VideoOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { formatPublishedAt, formatNumber } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Blob as FirestoreBlob } from 'firebase/firestore'; // Import Firestore Blob type

const WatchUploadedVideoPageSkeleton = () => (
  <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 lg:px-6 animate-pulse">
    <div className="lg:w-2/3">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-2xl mb-4"></div>
      <div className="h-8 w-3/4 rounded bg-muted mb-2"></div>
      <div className="h-5 w-1/2 rounded bg-muted mb-4"></div>
      <div className="h-20 w-full rounded bg-muted"></div>
    </div>
  </div>
);


export default function WatchUploadedVideoPage() {
  const params = useParams();
  const router = useRouter();
  const firestoreVideoId = typeof params.firestoreVideoId === 'string' ? params.firestoreVideoId : null;
  
  const { user, loading: authLoading } = useAuth();
  const [video, setVideo] = useState<UserUploadedVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoDataB64, setVideoDataB64] = useState<string | null>(null);

  useEffect(() => {
    if (!firestoreVideoId) {
      notFound();
      return;
    }

    const fetchVideo = async () => {
      setIsLoading(true);
      setError(null);
      setVideoDataB64(null);
      try {
        const videoData = await getUploadedVideoById(firestoreVideoId);
        if (!videoData) {
          setError('Video not found.');
          setVideo(null);
          notFound();
          return;
        }
        setVideo(videoData);
        document.title = `${videoData.title} - Youtube Clone`;

        // Convert Firestore Blob to Base64 for the player
        if (videoData.videoDataBlob && typeof (videoData.videoDataBlob as any).toBase64 === 'function') {
          const firestoreBlob = videoData.videoDataBlob as FirestoreBlob; // Cast to FirestoreBlob
          setVideoDataB64(firestoreBlob.toBase64());
        } else if (videoData.videoDataBlob) {
          // Fallback if it's already a string (less likely with current upload logic)
           console.warn("videoDataBlob is not a Firestore Blob object, attempting to use as Base64 string directly.");
           setVideoDataB64(videoData.videoDataBlob as string);
        }

      } catch (err) {
        console.error('Error fetching uploaded video:', err);
        setError('Failed to load video data.');
        setVideo(null);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [firestoreVideoId]);

  if (isLoading || authLoading) {
    return <WatchUploadedVideoPageSkeleton />;
  }

  if (error || !video) {
    return (
      <div className="container mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <VideoOff className="h-24 w-24 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Video Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || "The video you are looking for does not exist or could not be loaded."}</p>
        <Button onClick={() => router.push('/')}>Go to Homepage</Button>
      </div>
    );
  }
  
  const isOwner = user && video.userId === user.uid;

  return (
    <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          {videoDataB64 && video.fileType ? (
            <VideoPlayer
              videoDataB64={videoDataB64}
              videoFileType={video.fileType}
              title={video.title}
              posterUrl={video.thumbnailUrl}
            />
          ) : (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-2xl flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-2">Loading video data...</p>
            </div>
          )}
          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{video.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              <span>Uploaded by: {isOwner ? "You" : `User ID ${video.userId.substring(0,6)}...`}</span>
              <span className="mx-1.5">&bull;</span>
              <span>Uploaded {formatPublishedAt(video.createdAt.toISOString())}</span>
              <span className="mx-1.5">&bull;</span>
              <span>{formatNumber(video.views)} views</span>
            </div>
            {video.description && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <h3 className="text-md font-semibold text-foreground mb-1">Description</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
            <Separator className="my-6" />
            <p className="text-muted-foreground text-center py-4">Comments for uploaded videos are not yet available.</p>
          </div>
        </div>
        <div className="lg:w-1/3 lg:sticky lg:top-20 h-fit">
           <div className="bg-card p-4 rounded-lg shadow">
             <h3 className="text-lg font-semibold text-card-foreground mb-3">More Videos</h3>
             <p className="text-sm text-muted-foreground">Recommendations for uploaded videos coming soon.</p>
           </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserUploadedVideos } from '@/app/actions/user';
import type { UserUploadedVideo } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserUploadedVideoCard } from '@/components/video/UserUploadedVideoCard';
import { Loader2, VideoOff } from 'lucide-react';

const MyUploadsPageSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex flex-col sm:flex-row gap-3 p-3 border rounded-lg">
        <Skeleton className="w-full sm:w-48 h-28 sm:h-24 rounded-md bg-muted" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-5 w-3/4 bg-muted" />
          <Skeleton className="h-4 w-1/2 bg-muted" />
          <Skeleton className="h-3 w-1/3 bg-muted" />
        </div>
      </div>
    ))}
  </div>
);

export default function MyUploadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [uploadedVideos, setUploadedVideos] = useState<UserUploadedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      // Handled by UI below
      return;
    }

    const fetchUploads = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userUploads = await getUserUploadedVideos(user.uid);
        setUploadedVideos(userUploads);
      } catch (err) {
        console.error("Error fetching uploaded videos:", err);
        setError(err instanceof Error ? err.message : "Failed to load your uploaded videos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploads();
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Uploads</h1>
          <Button onClick={() => router.push('/upload')}>Upload New Video</Button>
        </div>
        <MyUploadsPageSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center">
        <VideoOff className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">My Uploads</h1>
        <p className="text-muted-foreground mb-4">Please log in to view your uploaded videos.</p>
        <Button onClick={() => router.push('/login')}>Login</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">My Uploads</h1>
        <p className="text-destructive">Error loading uploaded videos: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Uploads</h1>
        <Button onClick={() => router.push('/upload')} size="lg">
          Upload New Video
        </Button>
      </div>

      {uploadedVideos.length === 0 ? (
        <div className="text-center py-10">
          <VideoOff className="mx-auto h-20 w-20 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">You haven't uploaded any videos yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Click the "Upload New Video" button to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {uploadedVideos.map((video) => (
            <UserUploadedVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

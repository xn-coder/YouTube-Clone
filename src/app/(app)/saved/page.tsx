
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSavedVideos } from '@/app/actions/userInteractions'; // Corrected import path
import type { SavedVideoItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SavedVideoCard } from '@/components/video/SavedVideoCard';
import { Separator } from '@/components/ui/separator';

const SavedPageSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-3 py-3">
        <Skeleton className="w-40 h-[90px] sm:w-48 sm:h-[108px] rounded-lg" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export default function SavedVideosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [savedVideos, setSavedVideos] = useState<SavedVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      // Optional: Redirect to login or show login prompt handled below
      return;
    }

    const fetchSaved = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userSavedVideos = await getSavedVideos(user.uid);
        setSavedVideos(userSavedVideos);
      } catch (err) {
        console.error("Error fetching saved videos:", err);
        setError(err instanceof Error ? err.message : "Failed to load saved videos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSaved();
  }, [user, authLoading]);


  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Saved Videos</h1>
        <SavedPageSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Saved Videos</h1>
        <p className="text-muted-foreground mb-4">Please log in to view your saved videos.</p>
        <Button onClick={() => router.push('/login')}>Login</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Saved Videos</h1>
        <p className="text-destructive">Error loading saved videos: {error}</p>
      </div>
    );
  }

  if (savedVideos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Saved Videos</h1>
        <p className="text-muted-foreground">You haven't saved any videos yet. Find videos you like and hit the "Save" button!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Saved Videos</h1>
      <div className="divide-y divide-border">
        {savedVideos.map((item) => (
          <SavedVideoCard key={item.videoId} item={item} />
        ))}
      </div>
    </div>
  );
}

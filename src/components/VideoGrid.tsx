import type { Video } from '@/types';
import { VideoCard } from '@/components/video/VideoCard';

interface VideoGridProps {
  videos: Video[];
  className?: string;
}

export function VideoGrid({ videos, className }: VideoGridProps) {
  if (!videos || videos.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No videos found.</p>;
  }

  return (
    <div className={`grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${className}`}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import type { Video } from '@/types';
import { formatNumber } from '@/lib/utils';

interface RecommendedVideosProps {
  videos: Video[];
}

export function RecommendedVideos({ videos }: RecommendedVideosProps) {
  if (!videos || videos.length === 0) {
    return <p className="text-muted-foreground">No recommendations available.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground mb-3">Recommended</h3>
      {videos.map((video) => (
        <Link href={`/watch/${video.id}`} key={video.id} className="flex gap-2.5 group">
          <div className="w-40 flex-shrink-0 relative">
            <Image
              src={video.thumbnailUrl || 'https://placehold.co/160x90.png'}
              alt={video.title}
              width={160} // Explicit width for fixed size
              height={90}  // Explicit height for fixed size
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
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import type { Video } from '@/types';

interface RecommendedVideosProps {
  videos: Video[];
}

export function RecommendedVideos({ videos }: RecommendedVideosProps) {
  if (!videos || videos.length === 0) {
    return <p className="text-muted-foreground">No recommendations available.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Recommended</h3>
      {videos.map((video) => (
        <Link href={`/watch/${video.id}`} key={video.id} className="flex gap-3 group">
          <div className="w-40 flex-shrink-0">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              width={160}
              height={90}
              className="rounded-md object-cover aspect-video group-hover:opacity-80 transition-opacity"
              data-ai-hint="video thumbnail small"
            />
          </div>
          <div className="flex-grow">
            <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary">{video.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground">{video.channel.name}</p>
            <p className="text-xs text-muted-foreground">{video.views} &bull; {video.uploadDate}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

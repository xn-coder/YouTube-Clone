
import Image from 'next/image';
import Link from 'next/link';
import type { UserUploadedVideo } from '@/types';
import { formatPublishedAt } from '@/lib/utils';
import { Eye, ThumbsUp as LikeIcon, PlayCircle } from 'lucide-react'; // PlayCircle as placeholder icon

interface UserUploadedVideoCardProps {
  video: UserUploadedVideo;
}

export function UserUploadedVideoCard({ video }: UserUploadedVideoCardProps) {
  return (
    <Link href={`/watch-uploaded/${video.id}`} className="group block hover:bg-card/50 p-3 rounded-lg transition-colors border">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48 sm:flex-shrink-0 h-28 sm:h-24 overflow-hidden rounded-md shadow-md relative bg-muted">
          {video.thumbnailUrl && video.thumbnailUrl !== 'https://placehold.co/320x180.png' ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="video thumbnail"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <PlayCircle size={48} />
            </div>
          )}
          {video.duration && (
            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1 py-0.5 rounded-sm">
              {video.duration}
            </span>
          )}
        </div>

        <div className="flex flex-col flex-grow min-w-0">
          <h3 className="text-base sm:text-lg font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-primary">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {video.description || "No description available."}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Uploaded: {formatPublishedAt(video.createdAt.toISOString())}</span>
            <span className="flex items-center gap-1"><Eye size={14} /> {video.views} views</span>
            {/* App-specific likes for uploaded videos could be implemented here if desired */}
            {/* <span className="flex items-center gap-1"><LikeIcon size={14} /> {video.likes}</span> */}
          </div>
        </div>
      </div>
    </Link>
  );
}

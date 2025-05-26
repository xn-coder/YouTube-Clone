import Image from 'next/image';
import Link from 'next/link';
import type { Video } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="group flex flex-col"> {/* Ensure flex column for structure */}
      {/* Link for the thumbnail image - navigates to video */}
      <Link href={`/watch/${video.id}`} className="block cursor-pointer mb-2">
        <div className="overflow-hidden rounded-lg shadow-md aspect-video relative">
          <Image
            src={video.thumbnailUrl || 'https://placehold.co/360x200.png'}
            alt={video.title}
            fill // Use fill for responsive aspect ratio
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="video thumbnail"
          />
          {video.duration && (
            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded-sm">
              {video.duration}
            </span>
          )}
        </div>
      </Link>

      <div className="flex gap-3">
        {/* Link for the avatar - navigates to channel */}
        <Link href={`/channel/${video.channel.id}`} className="flex-shrink-0 mt-1">
          <Avatar className="h-9 w-9">
            <AvatarImage src={video.channel.avatarUrl} alt={video.channel.name} data-ai-hint="channel avatar" />
            <AvatarFallback>
              <UserCircle className="h-full w-full text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex flex-col flex-grow min-w-0"> {/* Use flex-col and ensure it can shrink/grow */}
          {/* Link for the title - navigates to video */}
          <Link href={`/watch/${video.id}`} className="block cursor-pointer">
            <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
              {video.title}
            </h3>
          </Link>

          {/* Link for the channel name - navigates to channel */}
          <Link 
            href={`/channel/${video.channel.id}`} 
            className="mt-1 text-xs text-muted-foreground hover:text-primary hover:underline line-clamp-1"
            title={video.channel.name}
          >
            {video.channel.name}
          </Link>
          
          {/* Views and upload date - not a link */}
          <div className="mt-0.5 text-xs text-muted-foreground">
            <span>{formatNumber(video.views)} views</span> &bull; <span>{video.uploadDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

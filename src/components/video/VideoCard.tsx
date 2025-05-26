import Image from 'next/image';
import Link from 'next/link';
import type { Video } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/watch/${video.id}`} className="block group">
      <div className="mb-2 overflow-hidden rounded-lg shadow-md aspect-video">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          width={360}
          height={200}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint="video thumbnail"
        />
      </div>
      <div className="flex gap-3">
        <Link href={`/channel/${video.channel.id}`} className="flex-shrink-0 mt-1">
          <Avatar className="h-9 w-9">
            <AvatarImage src={video.channel.avatarUrl} alt={video.channel.name} data-ai-hint="channel avatar" />
            <AvatarFallback>
                <UserCircle className="h-full w-full text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground hover:text-foreground">
            {video.channel.name}
          </p>
          <div className="mt-0.5 text-xs text-muted-foreground">
            <span>{video.views}</span> &bull; <span>{video.uploadDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

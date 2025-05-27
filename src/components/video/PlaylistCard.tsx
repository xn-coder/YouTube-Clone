
import Image from 'next/image';
import Link from 'next/link';
import type { Playlist } from '@/types';
import { ListVideo, Layers } from 'lucide-react'; // Layers for playlist icon

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link href={`/playlist/${playlist.id}`} className="group block">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md bg-muted">
        {playlist.thumbnailUrl ? (
          <Image
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover transition-opacity duration-300 group-hover:opacity-80"
            data-ai-hint="playlist thumbnail"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-card">
            <Layers className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-0 right-0 flex h-full w-1/3 items-center justify-center bg-black/60 p-2 backdrop-blur-sm">
          <div className="text-center text-white">
            <Layers className="mx-auto mb-1 h-5 w-5 sm:h-6 sm:w-6" />
            <p className="text-xs font-semibold sm:text-sm">
              {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary sm:text-base">
          {playlist.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 group-hover:text-foreground">
          {playlist.channelTitle}
        </p>
      </div>
    </Link>
  );
}

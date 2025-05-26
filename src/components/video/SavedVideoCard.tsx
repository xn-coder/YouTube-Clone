
import Image from 'next/image';
import Link from 'next/link';
import type { SavedVideoItem } from '@/types';
import { formatPublishedAt } from '@/lib/utils'; // Re-using for watchedAt time formatting

interface SavedVideoCardProps {
  item: SavedVideoItem;
}

export function SavedVideoCard({ item }: SavedVideoCardProps) {
  return (
    <div className="group flex gap-3 py-3">
      <Link href={`/watch/${item.videoId}`} className="block cursor-pointer flex-shrink-0">
        <div className="w-40 h-[90px] sm:w-48 sm:h-[108px] overflow-hidden rounded-lg shadow-md relative">
          <Image
            src={item.thumbnailUrl || 'https://placehold.co/192x108.png'}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 160px, 192px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="video thumbnail"
          />
        </div>
      </Link>

      <div className="flex flex-col flex-grow min-w-0">
        <Link href={`/watch/${item.videoId}`} className="block cursor-pointer">
          <h3 className="text-sm sm:text-base font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary">
            {item.title}
          </h3>
        </Link>
        <Link 
          href={`/channel/${item.channelId}`} 
          className="mt-1 text-xs text-muted-foreground hover:text-primary hover:underline line-clamp-1"
          title={item.channelName}
        >
          {item.channelName}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Saved {formatPublishedAt(item.savedAt.toISOString())}
        </p>
        {/* Future: Add an "Unsave" button here if desired */}
      </div>
    </div>
  );
}

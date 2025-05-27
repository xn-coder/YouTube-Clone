
'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubscriptionToggle } from '@/components/video/SubscriptionToggle';
import { getChannelDetails, getChannelVideos } from '@/lib/data'; 
import type { Channel, Video } from '@/types'; // Added Video type
import { UserCircle } from 'lucide-react'; 
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useParams, notFound } from 'next/navigation'; 
import { formatNumber } from '@/lib/utils';
// Metadata generation is typically for Server Components.
// import type { Metadata } from 'next'; 
import { ClientVideoFeed } from '@/components/ClientVideoFeed';
import { useEffect, useState } from 'react'; 
import { Skeleton } from '@/components/ui/skeleton'; 

// Temporarily commenting out generateMetadata as it's for Server Components.
// export async function generateMetadata({ params }: { params: { channelId: string } }): Promise<Metadata> {
//   const channelData = await getChannelDetails(params.channelId); // Renamed to avoid conflict
//   if (!channelData) {
//     return { title: 'Channel Not Found' };
//   }
//   return { 
//     title: `${channelData.name} - Youtube Clone`,
//     description: channelData.description || `Videos from ${channelData.name} on Youtube Clone.`
//   };
// }

interface PaginatedVideosResponse {
  videos: Video[];
  nextPageToken?: string;
  totalResults?: number;
}

const ChannelPageSkeleton = () => (
  <div className="container mx-auto px-0 sm:px-4 lg:px-6 animate-pulse">
    <Skeleton className="h-32 sm:h-48 md:h-64 w-full bg-muted" />
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 py-6 -mt-12 sm:-mt-16 md:-mt-20 relative z-10">
        <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 rounded-full border-4 border-background shadow-lg bg-muted" />
        <div className="flex-grow pt-12 sm:pt-0 space-y-2">
          <Skeleton className="h-8 w-3/4 bg-muted" />
          <Skeleton className="h-5 w-1/2 bg-muted" />
          <Skeleton className="h-5 w-2/3 bg-muted" />
        </div>
        <Skeleton className="h-10 w-32 bg-muted rounded-md mt-4 sm:mt-0" />
      </div>
    </div>
    <Separator className="my-2" />
    <div className="px-4 sm:px-0 mt-4">
      <Skeleton className="h-10 w-48 mb-4 bg-muted" /> {/* TabsList skeleton */}
      <Skeleton className="h-[400px] w-full bg-muted" /> {/* TabsContent skeleton */}
    </div>
  </div>
);


export default function ChannelPage() {
  const routeParams = useParams();
  const channelId = typeof routeParams.channelId === 'string' ? routeParams.channelId.trim() : '';

  const [channel, setChannel] = useState<Channel | null | undefined>(undefined);
  const [initialVideoFeed, setInitialVideoFeed] = useState<PaginatedVideosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!channelId) {
      setChannel(null); 
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch channel details and initial videos in parallel for slightly better performance
        const [channelData, videoFeedData] = await Promise.all([
          getChannelDetails(channelId),
          getChannelVideos(channelId, 20)
        ]);
        
        setChannel(channelData);
        if (channelData) {
          setInitialVideoFeed(videoFeedData);
        } else {
          // If channelData is null/undefined, it means channel wasn't found
          setInitialVideoFeed(null); 
        }

      } catch (error) {
        console.error("Error fetching channel page data:", error);
        setChannel(null); 
        setInitialVideoFeed(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [channelId]);

  useEffect(() => {
    // Update document title if channel data is available
    if (channel && channel.name) {
      document.title = `${channel.name} - Youtube Clone`;
    } else if (channel === null && !isLoading) {
      document.title = 'Channel Not Found - Youtube Clone';
    }
  }, [channel, isLoading]);


  if (isLoading) {
    return <ChannelPageSkeleton />;
  }

  if (!channel) { 
    notFound(); 
    return null; 
  }

  const fetchChannelVideosFn = (maxResults: number, pageToken?: string) => {
    if (!channelId) return Promise.resolve({ videos: [], nextPageToken: undefined, totalResults: 0 });
    return getChannelVideos(channelId, maxResults, pageToken);
  };

  return (
    <div className="container mx-auto px-0 sm:px-4 lg:px-6">
      <div className="h-32 sm:h-48 md:h-64 bg-muted relative">
        {channel.bannerUrl ? (
          <Image 
            src={channel.bannerUrl} 
            alt={`${channel.name} banner`} 
            fill
            style={{ objectFit: 'cover' }}
            priority // Consider if priority is needed if loaded client-side after main shell
            data-ai-hint="channel banner"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-muted via-card to-muted-foreground/20" data-ai-hint="banner gradient"></div>
        )}
      </div>

      <div className="px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 py-6 -mt-12 sm:-mt-16 md:-mt-20 relative z-10">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={channel.avatarUrl} alt={channel.name} data-ai-hint="channel avatar" />
              <AvatarFallback>
                <UserCircle className="h-full w-full text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow pt-12 sm:pt-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{channel.name}</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatNumber(channel.subscribers)} subscribers &bull; {initialVideoFeed?.totalResults !== undefined ? `${formatNumber(initialVideoFeed.totalResults)} videos` : 'Loading videos...'} 
              </p>
              {channel.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {channel.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 mt-4 sm:mt-0">
              <SubscriptionToggle channel={channel} />
            </div>
        </div>
      </div>
      
      <Separator className="my-2" />

      <Tabs defaultValue="videos" className="w-full px-4 sm:px-0">
        <TabsList className="mb-4">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="videos">
          {initialVideoFeed ? (
            <ClientVideoFeed
              key={channelId} 
              initialVideos={initialVideoFeed.videos}
              initialNextPageToken={initialVideoFeed.nextPageToken}
              fetchVideosFunction={fetchChannelVideosFn}
              maxResultsPerPage={20}
              gridClassName="py-6"
            />
          ) : (
             <div className="py-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-[200px] w-full rounded-lg bg-muted" />
                    <div className="flex gap-3">
                      <Skeleton className="h-9 w-9 rounded-full bg-muted" />
                      <div className="flex-grow space-y-1">
                        <Skeleton className="h-4 w-3/4 bg-muted" />
                        <Skeleton className="h-3 w-1/2 bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="playlists">
          <div className="py-6 text-center text-muted-foreground">Playlists feature coming soon.</div>
        </TabsContent>
        <TabsContent value="community">
          <div className="py-6 text-center text-muted-foreground">Community feature coming soon.</div>
        </TabsContent>
        <TabsContent value="about">
          <div className="py-6 prose dark:prose-invert max-w-none prose-sm sm:prose-base">
            <h3 className="text-xl font-semibold">Description</h3>
            <p>{channel.description || `Welcome to the official channel of ${channel.name}.`}</p>
            
            <h3 className="text-xl font-semibold mt-4">Details</h3>
            <p>Subscribers: {formatNumber(channel.subscribers)}</p>
            <p>Total Videos: {initialVideoFeed?.totalResults !== undefined ? formatNumber(initialVideoFeed.totalResults) : 'N/A'}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

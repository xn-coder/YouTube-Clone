
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubscriptionToggle } from '@/components/video/SubscriptionToggle';
import { getChannelDetails, getChannelVideos } from '@/lib/data'; 
import type { Channel } from '@/types';
import { UserCircle, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notFound } from 'next/navigation';
import { formatNumber } from '@/lib/utils';
import type { Metadata } from 'next';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';

export async function generateMetadata({ params }: { params: { channelId: string } }): Promise<Metadata> {
  const channel = await getChannelDetails(params.channelId);
  if (!channel) {
    return { title: 'Channel Not Found' };
  }
  return { 
    title: `${channel.name} - Youtube Clone`,
    description: channel.description || `Videos from ${channel.name} on Youtube Clone.`
  };
}

export default async function ChannelPage({ params }: { params: { channelId: string } }) {
  const channel = await getChannelDetails(params.channelId);

  if (!channel) {
    notFound();
  }

  const initialVideoFeed = await getChannelVideos(params.channelId, 20);

  return (
    <div className="container mx-auto px-0 sm:px-4 lg:px-6">
      {/* Channel Banner */}
      <div className="h-32 sm:h-48 md:h-64 bg-muted relative">
        {channel.bannerUrl ? (
          <Image 
            src={channel.bannerUrl} 
            alt={`${channel.name} banner`} 
            fill
            style={{ objectFit: 'cover' }}
            priority
            data-ai-hint="channel banner"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-muted via-card to-muted-foreground/20" data-ai-hint="banner gradient"></div>
        )}
      </div>

      {/* Channel Info */}
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
                {/* Assuming verified status isn't directly available, can be added if API provides */}
                {/* <CheckCircle className="h-6 w-6 text-primary" /> */}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatNumber(channel.subscribers)} subscribers &bull; {initialVideoFeed.totalResults !== undefined ? `${formatNumber(initialVideoFeed.totalResults)} videos` : 'Loading videos...'} 
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
          <ClientVideoFeed
            key={params.channelId} // Ensure re-fetch if channelId changes (though unlikely on same page)
            initialVideos={initialVideoFeed.videos}
            initialNextPageToken={initialVideoFeed.nextPageToken}
            fetchVideosFunction={(maxResults, pageToken) => getChannelVideos(params.channelId, maxResults, pageToken)}
            maxResultsPerPage={20}
            gridClassName="py-6"
          />
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
            <p>Total Videos: {initialVideoFeed.totalResults !== undefined ? formatNumber(initialVideoFeed.totalResults) : 'N/A'}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

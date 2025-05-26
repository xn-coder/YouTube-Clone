
import { getSubscribedVideos } from '@/lib/data';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';

export default async function SubscriptionsPage() {
  const initialFeed = await getSubscribedVideos(20);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">My Subscriptions</h1>
      <ClientVideoFeed
        initialVideos={initialFeed.videos}
        initialNextPageToken={initialFeed.nextPageToken}
        // Note: getSubscribedVideos as implemented might not perfectly support pagination token for combined feed.
        // The ClientVideoFeed will attempt to use it, but data.ts function might ignore it.
        fetchVideosFunction={getSubscribedVideos}
        maxResultsPerPage={20}
        emptyMessage="No videos from your subscriptions yet, or you haven't subscribed to any channels."
      />
    </div>
  );
}

    
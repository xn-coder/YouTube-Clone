
import { getVideos } from '@/lib/data'; // Assuming trending uses the same "most popular" logic
import { ClientVideoFeed } from '@/components/ClientVideoFeed';

export default async function TrendingPage() {
  const initialFeed = await getVideos(20); // Using getVideos for trending for now

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Trending Videos</h1>
      <ClientVideoFeed
        initialVideos={initialFeed.videos}
        initialNextPageToken={initialFeed.nextPageToken}
        fetchVideosFunction={getVideos}
        maxResultsPerPage={20}
      />
    </div>
  );
}

    
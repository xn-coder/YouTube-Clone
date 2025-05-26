
import { getVideos } from '@/lib/data';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';

export default async function HomePage() {
  // Fetch initial set of videos on the server
  const initialFeed = await getVideos(20);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Trending Videos</h1>
      <ClientVideoFeed 
        initialVideos={initialFeed.videos}
        initialNextPageToken={initialFeed.nextPageToken}
        fetchVideosFunction={getVideos} // Pass the function itself
        maxResultsPerPage={20}
      />
    </div>
  );
}

    

import { searchVideos } from '@/lib/data';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';

// Fetching videos that are likely "Shorts" by searching for #shorts
// The YouTube API doesn't have a direct filter for Shorts,
// so this is an approximation.
const SHORTS_SEARCH_QUERY = '#shorts';

export default async function ShortsPage() {
  const initialFeed = await searchVideos(SHORTS_SEARCH_QUERY, 20);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Shorts</h1>
      <ClientVideoFeed
        // Keying the component by query ensures it re-fetches if query were dynamic
        key={SHORTS_SEARCH_QUERY} 
        initialVideos={initialFeed.videos}
        initialNextPageToken={initialFeed.nextPageToken}
        fetchVideosFunction={(maxResults, pageToken) => searchVideos(SHORTS_SEARCH_QUERY, maxResults, pageToken)}
        maxResultsPerPage={20}
        emptyMessage={`No videos found for "${SHORTS_SEARCH_QUERY}".`}
        // Consider a different grid layout for shorts if desired, e.g., fewer columns
        // gridClassName="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      />
    </div>
  );
}

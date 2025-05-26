
import { searchVideos } from '@/lib/data';
import { ClientVideoFeed } from '@/components/ClientVideoFeed';

interface ResultsPageProps {
  searchParams: {
    search_query?: string;
  };
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const query = searchParams.search_query || '';

  // Initial fetch can happen here, or ClientVideoFeed can fetch if query exists
  // For simplicity and to handle empty initial query state in ClientVideoFeed:
  const initialFeed = query 
    ? await searchVideos(query, 20) 
    : { videos: [], nextPageToken: undefined, totalResults: 0 };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        Search Results {query && `for "${query}"`}
      </h1>
      <ClientVideoFeed
        // Keying the component by query ensures it re-fetches when query changes
        key={query} 
        initialVideos={initialFeed.videos}
        initialNextPageToken={initialFeed.nextPageToken}
        fetchVideosFunction={(maxResults, pageToken) => searchVideos(query, maxResults, pageToken)}
        maxResultsPerPage={20}
        emptyMessage={query ? `No results found for "${query}".` : "Enter a search term to begin."}
      />
    </div>
  );
}

    

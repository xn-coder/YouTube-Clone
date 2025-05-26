import { Suspense } from 'react';
import { searchVideos } from '@/lib/data';
import { VideoGrid } from '@/components/VideoGrid';
import { Skeleton } from '@/components/ui/skeleton';

interface ResultsPageProps {
  searchParams: {
    search_query?: string;
  };
}

async function SearchResults({ query }: { query: string }) {
  const videos = await searchVideos(query);
  return <VideoGrid videos={videos} />;
}

function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-grow space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


export default function ResultsPage({ searchParams }: ResultsPageProps) {
  const query = searchParams.search_query || '';

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        Search Results {query && `for "${query}"`}
      </h1>
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}

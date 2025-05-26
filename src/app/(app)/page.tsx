import { getVideos } from '@/lib/data';
import { VideoGrid } from '@/components/VideoGrid';

export default async function HomePage() {
  const videos = await getVideos();

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Trending Videos</h1>
      <VideoGrid videos={videos} />
    </div>
  );
}

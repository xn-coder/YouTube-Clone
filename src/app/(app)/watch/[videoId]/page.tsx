import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { CommentsList } from '@/components/video/CommentsList';
import { SubscriptionToggle } from '@/components/video/SubscriptionToggle';
import { RecommendedVideos } from '@/components/video/RecommendedVideos';
import { getVideoById, getCommentsByVideoId, getRecommendedVideos } from '@/lib/data';
import { ThumbsUp, ThumbsDown, Share2, ListPlus, UserCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { videoId: string } }) {
  const video = await getVideoById(params.videoId);
  if (!video) {
    return { title: 'Video Not Found' };
  }
  return { title: `${video.title} - VideoVerse` };
}

export default async function WatchPage({ params }: { params: { videoId: string } }) {
  const video = await getVideoById(params.videoId);
  
  if (!video || !video.videoUrl) {
    notFound();
  }

  // Fetch comments and recommendations in parallel
  const [comments, recommendedVideos] = await Promise.all([
    getCommentsByVideoId(params.videoId),
    getRecommendedVideos(params.videoId)
  ]);

  return (
    <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content: Video player and details */}
        <div className="lg:w-2/3">
          <VideoPlayer videoUrl={video.videoUrl} title={video.title} />
          
          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{video.title}</h1>
            
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href={`/channel/${video.channel.id}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={video.channel.avatarUrl} alt={video.channel.name} data-ai-hint="channel avatar" />
                    <AvatarFallback><UserCircle className="h-full w-full text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/channel/${video.channel.id}`} className="text-sm font-medium text-foreground hover:text-primary">{video.channel.name}</Link>
                  <p className="text-xs text-muted-foreground">{video.views} &bull; {video.uploadDate}</p>
                </div>
                <SubscriptionToggle channel={video.channel} />
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><ThumbsUp className="mr-2 h-4 w-4" /> Like</Button>
                <Button variant="outline" size="sm"><ThumbsDown className="mr-2 h-4 w-4" /> Dislike</Button>
                <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                <Button variant="outline" size="sm"><ListPlus className="mr-2 h-4 w-4" /> Save</Button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground whitespace-pre-wrap">{video.description || "No description available."}</p>
            </div>
            
            <Separator className="my-6" />
            
            <CommentsList videoId={params.videoId} initialComments={comments} />
          </div>
        </div>
        
        {/* Sidebar: Recommended videos */}
        <div className="lg:w-1/3 lg:sticky lg:top-20 h-fit"> {/* Sticky top for desktop */}
          <RecommendedVideos videos={recommendedVideos} />
        </div>
      </div>
    </div>
  );
}

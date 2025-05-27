
interface VideoPlayerProps {
  youtubeVideoId?: string; // YouTube video ID for iframe embed
  title: string;
  posterUrl?: string; 
  videoUrl?: string; // For direct video URLs (e.g., from Firebase Storage)
  videoDataB64?: string; // Base64 encoded video data (previously for Firestore Blob) - Deprecated
  videoFileType?: string; // MIME type for videoDataB64 - Deprecated
}

export function VideoPlayer({ 
  youtubeVideoId, 
  title, 
  posterUrl, 
  videoUrl,
  // videoDataB64 and videoFileType are no longer primary for uploads
}: VideoPlayerProps) {
  
  // Priority: 1. Direct Video URL (Firebase Storage), 2. YouTube Embed
  if (videoUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
        <video
          src={videoUrl}
          title={title}
          controls
          autoPlay
          className="h-full w-full"
          poster={posterUrl || `https://placehold.co/1280x720.png`}
          data-ai-hint="video player"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (youtubeVideoId) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          data-ai-hint="video player"
        ></iframe>
      </div>
    );
  }

  // Fallback if no video source is available
  return (
     <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-2xl flex items-center justify-center">
        <img
            src={posterUrl || `https://placehold.co/1280x720.png`}
            alt={title}
            className="h-full w-full object-cover"
            data-ai-hint="video poster"
        />
        <p className="absolute text-center text-foreground p-4">Video not available</p>
      </div>
  )
}

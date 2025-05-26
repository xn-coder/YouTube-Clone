interface VideoPlayerProps {
  youtubeVideoId: string; // Use YouTube video ID for iframe embed
  title: string;
  posterUrl?: string; // Use high quality thumbnail as poster
  videoUrl?: string; // Fallback for direct video links (not used for YouTube embeds)
}

export function VideoPlayer({ youtubeVideoId, title, posterUrl, videoUrl }: VideoPlayerProps) {
  // Prefer YouTube iframe embed if youtubeVideoId is provided
  if (youtubeVideoId) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&rel=0`} // autoplay=0, rel=0 to hide related videos from other channels
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

  // Fallback to HTML5 video player if direct videoUrl is provided
  if (videoUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
        <video
          src={videoUrl}
          title={title}
          controls
          className="h-full w-full"
          poster={posterUrl || `https://placehold.co/1280x720.png`}
          data-ai-hint="video player"
        >
          Your browser does not support the video tag.
        </video>
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

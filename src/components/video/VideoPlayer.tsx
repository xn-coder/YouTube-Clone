interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
      <video
        src={videoUrl}
        title={title}
        controls
        className="h-full w-full"
        poster={`https://placehold.co/1280x720.png?text=${encodeURIComponent(title)}`}
        data-ai-hint="video player"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

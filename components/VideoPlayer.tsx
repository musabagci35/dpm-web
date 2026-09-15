"use client";

import type { VideoSource } from "@/lib/videoUrl";

export default function VideoPlayer({
  source,
  poster,
  title = "Vehicle video",
  className = "",
}: {
  source: VideoSource;
  poster?: string;
  title?: string;
  className?: string;
}) {
  if (source.type === "direct") {
    return (
      <video
        key={source.url}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        className={`h-full w-full bg-black object-contain ${className}`}
      >
        <source src={source.url} />
        Your browser does not support embedded video.
      </video>
    );
  }

  return (
    <iframe
      key={source.embedUrl}
      src={source.embedUrl}
      title={title}
      allow="encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className={`h-full w-full bg-black ${className}`}
    />
  );
}

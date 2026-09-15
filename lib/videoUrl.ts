export type VideoSource =
  | { type: "youtube"; embedUrl: string }
  | { type: "vimeo"; embedUrl: string }
  | { type: "direct"; url: string };

const YOUTUBE_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i;

export function parseVideoUrl(raw?: string | null): VideoSource | null {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.has(host)) {
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.replace("/embed/", "").split("/")[0];
    } else if (url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.replace("/shorts/", "").split("/")[0];
    } else {
      videoId = url.searchParams.get("v") || "";
    }

    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;

    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`,
    };
  }

  if (VIMEO_HOSTS.has(host)) {
    const match = url.pathname.match(/(\d{5,12})/);
    const videoId = match?.[1] || "";

    if (!videoId) return null;

    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
    };
  }

  const isCloudinary = host === "res.cloudinary.com";
  const hasVideoExtension = VIDEO_EXTENSIONS.test(url.pathname + url.search);

  if (url.protocol === "https:" && (isCloudinary || hasVideoExtension)) {
    return { type: "direct", url: url.toString() };
  }

  return null;
}

export function isSupportedVideoUrl(raw?: string | null): boolean {
  return parseVideoUrl(raw) !== null;
}

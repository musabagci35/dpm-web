import { useState } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ListingVideo } from "@/lib/marketplaceApi";

/**
 * Shows a static poster with a play button until the viewer explicitly taps
 * it — the video itself is never mounted, let alone played, before that, so
 * this can never autoplay.
 */
export default function VideoPlayerCard({
  video,
  posterUrl,
}: {
  video: ListingVideo;
  /** The listing's cover photo — used as the poster since no thumbnail is generated. */
  posterUrl?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <TouchableOpacity
        style={styles.posterWrap}
        onPress={() => setPlaying(true)}
        accessibilityRole="button"
        accessibilityLabel="Play vehicle video"
      >
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={styles.playButton}>
          <Text style={styles.playButtonText}>▶</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Video</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return <PlayingVideo url={video.url} />;
}

function PlayingVideo({ url }: { url: string }) {
  // Started only because the viewer just tapped the poster above — this is
  // the one and only place playback begins, and it is always user-initiated.
  const player = useVideoPlayer(url, (p) => {
    p.play();
  });

  return (
    <VideoView player={player} style={styles.poster} nativeControls contentFit="cover" />
  );
}

const styles = StyleSheet.create({
  posterWrap: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111827",
    position: "relative",
  },
  poster: { width: "100%", height: "100%" },
  posterFallback: { backgroundColor: "#111827" },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -28,
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(17,24,39,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonText: { color: "#fff", fontSize: 22, marginLeft: 3 },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(17,24,39,0.75)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});

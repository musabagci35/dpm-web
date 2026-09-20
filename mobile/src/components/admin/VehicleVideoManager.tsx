import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getCloudinarySignature } from "@/lib/api";
import { uploadVideoToCloudinary } from "@/lib/upload";

const VIDEO_FOLDER = "drive-prime-motors/vehicle-videos";

/** Records or picks one walkaround/feature video and uploads it to Cloudinary, saving only the plain videoUrl string the Car model stores. */
export default function VehicleVideoManager({
  videoUrl,
  onChange,
}: {
  videoUrl: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleAsset(asset: ImagePicker.ImagePickerAsset) {
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const signature = await getCloudinarySignature(VIDEO_FOLDER, "video");
      const uploaded = await uploadVideoToCloudinary(
        { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType },
        signature,
        setProgress
      );
      onChange(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRecord() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Enable camera access in Settings to record a video.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "videos",
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });

    if (!result.canceled && result.assets[0]) {
      await handleAsset(result.assets[0]);
    }
  }

  async function handlePick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo library access needed", "Enable photo library access in Settings to choose a video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "videos" });

    if (!result.canceled && result.assets[0]) {
      await handleAsset(result.assets[0]);
    }
  }

  function confirmRemove() {
    Alert.alert("Remove video", "Remove this video from the vehicle listing?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onChange("") },
    ]);
  }

  if (uploading) {
    return (
      <View style={styles.uploadingBox}>
        <ActivityIndicator color="#dc2626" />
        <Text style={styles.uploadingText}>Uploading video… {progress}%</Text>
      </View>
    );
  }

  if (videoUrl.trim()) {
    return (
      <View>
        <VideoPreview url={videoUrl.trim()} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRecord}>
            <Text style={styles.actionButtonText}>Replace (Record)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handlePick}>
            <Text style={styles.actionButtonText}>Replace (Library)</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.removeButton} onPress={confirmRemove}>
          <Text style={styles.removeButtonText}>Remove Video</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.hint}>Optional — a short walkaround or feature video.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleRecord}>
          <Text style={styles.actionButtonText}>Record Video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handlePick}>
          <Text style={styles.actionButtonText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** A muted-by-default preview with native controls — nothing here autoplays. */
function VideoPreview({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return <VideoView player={player} style={styles.preview} nativeControls contentFit="cover" />;
}

const styles = StyleSheet.create({
  hint: { color: "#6b7280", fontSize: 12, marginBottom: 8 },
  error: { color: "#b91c1c", fontSize: 12, fontWeight: "600", marginTop: 8, marginBottom: 4 },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionButton: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  removeButton: { marginTop: 10, alignItems: "center" },
  removeButtonText: { color: "#b91c1c", fontWeight: "800", fontSize: 12 },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#000",
    marginBottom: 10,
  },
  uploadingBox: {
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadingText: { color: "#6b7280", fontSize: 12, fontWeight: "700" },
});

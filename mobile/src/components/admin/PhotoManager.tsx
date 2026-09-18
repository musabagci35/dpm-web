import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CloudinarySignature, getCloudinarySignature, VehicleImage } from "@/lib/api";
import { uploadPhotoToCloudinary } from "@/lib/upload";

const CLOUDINARY_FOLDER = "drive-prime-motors/cars";

type UploadingItem = { id: string; progress: number };

export default function PhotoManager({
  images,
  onChange,
  getSignature,
}: {
  images: VehicleImage[];
  onChange: (images: VehicleImage[]) => void;
  /** Defaults to the dealer-inventory signer; the marketplace flow passes its own. */
  getSignature?: () => Promise<CloudinarySignature>;
}) {
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function uploadAssets(assets: ImagePicker.ImagePickerAsset[]) {
    setError(null);
    // Tracked locally (not via the `images` prop) so a fast multi-photo batch
    // doesn't lose earlier uploads to a stale closure once the parent re-renders.
    let current = images;

    for (const asset of assets) {
      const uploadId = `${Date.now()}-${Math.random()}`;
      setUploading((list) => [...list, { id: uploadId, progress: 0 }]);

      try {
        const signature = getSignature
          ? await getSignature()
          : await getCloudinarySignature(CLOUDINARY_FOLDER);
        const uploaded = await uploadPhotoToCloudinary(
          {
            uri: asset.uri,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
          },
          signature,
          (progress) =>
            setUploading((list) =>
              list.map((item) =>
                item.id === uploadId ? { ...item, progress } : item
              )
            )
        );

        current = [
          ...current,
          {
            url: uploaded.url,
            publicId: uploaded.publicId,
            isCover: current.length === 0,
          },
        ];
        onChange(current);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Photo upload failed."
        );
      } finally {
        setUploading((list) => list.filter((item) => item.id !== uploadId));
      }
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        "Enable camera access in Settings to take vehicle photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      await uploadAssets(result.assets);
    }
  }

  async function handlePickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Enable photo library access in Settings to add vehicle photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 0,
    });

    if (!result.canceled && result.assets.length > 0) {
      await uploadAssets(result.assets);
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    if (next.length > 0 && !next.some((image) => image.isCover)) {
      next[0] = { ...next[0], isCover: true };
    }
    onChange(next);
  }

  function setPrimary(index: number) {
    onChange(images.map((image, i) => ({ ...image, isCover: i === index })));
  }

  return (
    <View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
          <Text style={styles.actionButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handlePickPhotos}>
          <Text style={styles.actionButtonText}>Choose Photos</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {images.length === 0 && uploading.length === 0 ? (
        <Text style={styles.empty}>No photos added yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
          {images.map((image, index) => (
            <View key={`${image.url}-${index}`} style={styles.thumbWrap}>
              <Image source={{ uri: image.url }} style={styles.thumb} />

              {image.isCover ? (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Primary</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
                accessibilityRole="button"
                accessibilityLabel="Delete photo"
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.thumbControls}>
                <TouchableOpacity
                  style={[styles.thumbButton, index === 0 && styles.thumbButtonDisabled]}
                  disabled={index === 0}
                  onPress={() => moveImage(index, -1)}
                >
                  <Text style={styles.thumbButtonText}>◀</Text>
                </TouchableOpacity>

                {!image.isCover ? (
                  <TouchableOpacity
                    style={styles.thumbButton}
                    onPress={() => setPrimary(index)}
                  >
                    <Text style={styles.thumbButtonText}>★</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.thumbButton} />
                )}

                <TouchableOpacity
                  style={[
                    styles.thumbButton,
                    index === images.length - 1 && styles.thumbButtonDisabled,
                  ]}
                  disabled={index === images.length - 1}
                  onPress={() => moveImage(index, 1)}
                >
                  <Text style={styles.thumbButtonText}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {uploading.map((item) => (
            <View key={item.id} style={[styles.thumbWrap, styles.uploadingThumb]}>
              <ActivityIndicator color="#dc2626" />
              <Text style={styles.uploadingText}>{item.progress}%</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  actionButton: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  error: { color: "#b91c1c", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  empty: { color: "#9ca3af", fontSize: 13, fontStyle: "italic" },
  strip: { flexGrow: 0 },
  thumbWrap: {
    width: 110,
    height: 110,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 10,
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  uploadingThumb: { alignItems: "center", justifyContent: "center", gap: 6 },
  uploadingText: { color: "#6b7280", fontSize: 12, fontWeight: "700" },
  coverBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#dc2626",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  coverBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(17,24,39,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  thumbControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(17,24,39,0.6)",
  },
  thumbButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbButtonDisabled: { opacity: 0.35 },
  thumbButtonText: { color: "#fff", fontSize: 13, fontWeight: "900" },
});

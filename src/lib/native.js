"use client";

export function isNative() {
  return typeof window !== "undefined" && Boolean(window.Capacitor?.isNativePlatform?.());
}

export async function vibrate(kind = "move") {
  if (typeof window === "undefined" || window.localStorage.getItem("sortverse-setting-vibration") === "0") return;
  try {
    if (isNative()) {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (kind === "wrong") await Haptics.notification({ type: NotificationType.Warning });
      else if (kind === "win") await Haptics.notification({ type: NotificationType.Success });
      else await Haptics.impact({ style: kind === "complete" ? ImpactStyle.Medium : ImpactStyle.Light });
    } else if (navigator.vibrate) {
      navigator.vibrate(kind === "wrong" ? 90 : kind === "win" ? [50, 45, 90] : 20);
    }
  } catch { /* Haptics never block play. */ }
}

export async function pickNativePhoto(source) {
  if (!isNative()) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    quality: 90, allowEditing: false, saveToGallery: false,
    resultType: CameraResultType.DataUrl,
    source: source === "selfie" ? CameraSource.Camera : CameraSource.Photos,
    direction: source === "selfie" ? "FRONT" : undefined,
    correctOrientation: true,
  });
  return photo.dataUrl;
}

export async function shareNativeImage(blob, filename, title) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Image encoding failed"));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(blob);
  });
  await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache, recursive: true });
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
  await Share.share({ title, files: [uri], dialogTitle: "Share SortVerse 3D result" });
}

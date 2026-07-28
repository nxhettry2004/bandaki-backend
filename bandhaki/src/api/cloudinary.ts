import axios from 'axios';
import Constants from 'expo-constants';
import type { ImagePickerAsset } from 'expo-image-picker';

// Resolved from app.json `extra` first: `.env` is gitignored, so it is never
// uploaded to EAS Build and `process.env.EXPO_PUBLIC_*` inlines to undefined in
// preview/production bundles. `extra` ships with every build.
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const CLOUD_NAME =
  extra.cloudinaryCloudName || process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET =
  extra.cloudinaryUploadPreset || process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export interface UploadedImage {
  name: string;
  url: string;
}

// Uploads a locally-picked asset to Cloudinary and returns its hosted URL.
// RN's fetch/FormData needs the { uri, name, type } file-object shape instead of a raw File/Blob.
export async function uploadImageToCloudinary(asset: ImagePickerAsset): Promise<UploadedImage> {
  // Fail here rather than at import time — a module-scope throw takes down the
  // whole screen instead of just the upload.
  if (!isCloudinaryConfigured) {
    throw new Error('Image uploads are unavailable: Cloudinary is not configured for this build.');
  }

  const name = asset.fileName || `image_${Date.now()}.jpg`;

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name,
    type: asset.mimeType || 'image/jpeg',
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET as string);

  const response = await axios.post<{ secure_url: string }>(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return { name, url: response.data.secure_url };
}

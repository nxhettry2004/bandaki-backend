import axios from 'axios';
import type { ImagePickerAsset } from 'expo-image-picker';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  throw new Error('Cloudinary configuration is missing in environment variables');
}

export interface UploadedImage {
  name: string;
  url: string;
}

// Uploads a locally-picked asset to Cloudinary and returns its hosted URL.
// RN's fetch/FormData needs the { uri, name, type } file-object shape instead of a raw File/Blob.
export async function uploadImageToCloudinary(asset: ImagePickerAsset): Promise<UploadedImage> {
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

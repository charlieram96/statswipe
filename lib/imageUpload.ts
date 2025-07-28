import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Pick an image from the user's library or camera
 */
export const pickImage = async (): Promise<ImagePicker.ImagePickerResult> => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission to access camera roll is required!');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio for profile pics
    quality: 0.8,
    base64: false,
  });

  return result;
};

/**
 * Upload image to Supabase Storage
 */
export const uploadProfileImage = async (
  imageUri: string, 
  userId: string
): Promise<ImageUploadResult> => {
  try {
    // Create unique filename
    const fileExt = imageUri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Convert URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('player-profiles')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('player-profiles')
      .getPublicUrl(data.path);

    return { 
      success: true, 
      url: publicData.publicUrl 
    };

  } catch (error) {
    console.error('Image upload failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Delete profile image from Supabase Storage
 */
export const deleteProfileImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `profile-images/${fileName}`;

    const { error } = await supabase.storage
      .from('player-profiles')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Image deletion failed:', error);
    return false;
  }
};
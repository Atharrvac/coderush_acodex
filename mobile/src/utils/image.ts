/**
 * Image Utilities for NagrikSeva
 * Image compression, validation, and optimization
 */

import * as FileSystem from 'expo-file-system/legacy';

const ImageManipulator: any = {
  SaveFormat: { JPEG: 'jpeg' },
  manipulateAsync: async (uri: string) => ({ uri })
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;
const COMPRESSION_QUALITY = 0.7;

/**
 * Validate image size
 */
export const validateImageSize = async (uri: string): Promise<boolean> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) return false;
        return (fileInfo.size || 0) <= MAX_IMAGE_SIZE;
    } catch (error) {
        console.error('Error validating image size:', error);
        return false;
    }
};

/**
 * Get image file size in MB
 */
export const getImageSize = async (uri: string): Promise<number> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) return 0;
        return (fileInfo.size || 0) / (1024 * 1024); // Convert to MB
    } catch (error) {
        console.error('Error getting image size:', error);
        return 0;
    }
};

/**
 * Compress and resize image
 */
export const compressImage = async (
    uri: string,
    options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
    }
): Promise<string> => {
    try {
        const maxWidth = options?.maxWidth || MAX_IMAGE_WIDTH;
        const maxHeight = options?.maxHeight || MAX_IMAGE_HEIGHT;
        const quality = options?.quality || COMPRESSION_QUALITY;

        const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [
                {
                    resize: {
                        width: maxWidth,
                        height: maxHeight,
                    },
                },
            ],
            {
                compress: quality,
                format: ImageManipulator.SaveFormat.JPEG,
            }
        );

        return manipResult.uri;
    } catch (error) {
        console.error('Error compressing image:', error);
        return uri; // Return original if compression fails
    }
};

/**
 * Compress multiple images
 */
export const compressImages = async (
    uris: string[],
    options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
    }
): Promise<string[]> => {
    const compressed = await Promise.all(
        uris.map((uri) => compressImage(uri, options))
    );
    return compressed;
};

/**
 * Validate and compress image
 */
export const processImage = async (
    uri: string
): Promise<{ success: boolean; uri?: string; error?: string }> => {
    try {
        // Validate size
        const isValidSize = await validateImageSize(uri);
        if (!isValidSize) {
            // Try to compress if too large
            const compressed = await compressImage(uri);
            const compressedSize = await validateImageSize(compressed);

            if (!compressedSize) {
                return {
                    success: false,
                    error: 'Image is too large (max 5MB)',
                };
            }

            return { success: true, uri: compressed };
        }

        // Compress anyway for optimization
        const compressed = await compressImage(uri);
        return { success: true, uri: compressed };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to process image',
        };
    }
};

/**
 * Process multiple images
 */
export const processImages = async (
    uris: string[]
): Promise<{ success: boolean; uris?: string[]; errors?: string[] }> => {
    const results = await Promise.all(uris.map((uri) => processImage(uri)));

    const errors = results
        .filter((r) => !r.success)
        .map((r) => r.error || 'Unknown error');

    if (errors.length > 0) {
        return { success: false, errors };
    }

    const processedUris = results
        .filter((r) => r.success && r.uri)
        .map((r) => r.uri!);

    return { success: true, uris: processedUris };
};

/**
 * Generate thumbnail
 */
export const generateThumbnail = async (
    uri: string,
    size: number = 200
): Promise<string> => {
    try {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: size, height: size } }],
            {
                compress: 0.5,
                format: ImageManipulator.SaveFormat.JPEG,
            }
        );
        return result.uri;
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return uri;
    }
};

/**
 * Get image dimensions
 */
export const getImageDimensions = async (
    uri: string
): Promise<{ width: number; height: number } | null> => {
    try {
        const result = await ImageManipulator.manipulateAsync(uri, [], {});
        // Note: expo-image-manipulator doesn't return dimensions directly
        // You might need to use expo-image-picker's result or another method
        return null;
    } catch (error) {
        console.error('Error getting image dimensions:', error);
        return null;
    }
};

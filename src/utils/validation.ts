import type { ValidationWarning, PhoneModel } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ABSOLUTE_MIN_DIMENSION = 500;
const MIN_DPI = 150;
const RECOMMENDED_DPI = 300;

export function validateImageFile(file: File): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (file.size > MAX_FILE_SIZE) {
    warnings.push({
      type: 'file_too_large',
      message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit. Please compress or resize your image.`,
      severity: 'error'
    });
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    warnings.push({
      type: 'unsupported_format',
      message: 'Unsupported file format. Please use JPG, PNG, WebP, or SVG.',
      severity: 'error'
    });
  }

  return warnings;
}

export async function validateImageResolution(
  imageDataUrl: string,
  phoneModel: PhoneModel
): Promise<ValidationWarning[]> {
  return new Promise((resolve) => {
    const warnings: ValidationWarning[] = [];
    const img = new Image();

    img.onload = () => {
      // Check absolute minimum first (500x500px)
      if (img.width < ABSOLUTE_MIN_DIMENSION || img.height < ABSOLUTE_MIN_DIMENSION) {
        warnings.push({
          type: 'low_resolution',
          message: `Image is too small. Your image is ${img.width}x${img.height}px but must be at least ${ABSOLUTE_MIN_DIMENSION}x${ABSOLUTE_MIN_DIMENSION}px.`,
          severity: 'error'
        });
        resolve(warnings);
        return;
      }

      const { outputWidthPx, outputHeightPx, printDpi } = phoneModel;

      const requiredWidthForRecommendedDpi = (outputWidthPx * RECOMMENDED_DPI) / printDpi;
      const requiredHeightForRecommendedDpi = (outputHeightPx * RECOMMENDED_DPI) / printDpi;

      const requiredWidthForMinDpi = (outputWidthPx * MIN_DPI) / printDpi;
      const requiredHeightForMinDpi = (outputHeightPx * MIN_DPI) / printDpi;

      if (img.width < requiredWidthForMinDpi || img.height < requiredHeightForMinDpi) {
        warnings.push({
          type: 'low_resolution',
          message: `Image resolution is below minimum for good print quality. Your image is ${img.width}x${img.height}px. We recommend at least ${Math.round(requiredWidthForMinDpi)}x${Math.round(requiredHeightForMinDpi)}px for this phone model.`,
          severity: 'warning'
        });
      } else if (img.width < requiredWidthForRecommendedDpi || img.height < requiredHeightForRecommendedDpi) {
        warnings.push({
          type: 'low_resolution',
          message: `Image resolution is acceptable but below recommended. Your image is ${img.width}x${img.height}px. For best quality, use at least ${Math.round(requiredWidthForRecommendedDpi)}x${Math.round(requiredHeightForRecommendedDpi)}px.`,
          severity: 'info'
        });
      }

      resolve(warnings);
    };

    img.onerror = () => {
      warnings.push({
        type: 'unsupported_format',
        message: 'Failed to load image. Please try a different file.',
        severity: 'error'
      });
      resolve(warnings);
    };

    img.src = imageDataUrl;
  });
}

export function canProceed(warnings: ValidationWarning[]): boolean {
  return !warnings.some(w => w.severity === 'error');
}

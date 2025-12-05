import type { GenerateDesignRequest, GenerateDesignResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function generateDesign(request: GenerateDesignRequest): Promise<GenerateDesignResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-design`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate design');
    }

    return await response.json();
  } catch (error) {
    console.error('Design generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

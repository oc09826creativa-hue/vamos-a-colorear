/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColoringSheet {
  id: string;
  name: string;
  isCustom: boolean;
  thumbnailUrl?: string; // Custom upload or cache
  fileData?: File; // For custom uploads
  drawingType: string; // 'sun' | 'butterfly' | 'flower' | 'cat' | 'dog' | 'rocket' | 'castle' | 'dino' | 'fish' | 'elephant' | 'custom'
}

export type PaintTool = 'fill' | 'eraser';

export interface ColorPreset {
  name: string;
  hex: string;
}

export interface CanvasHistoryItem {
  imageData: ImageData;
}

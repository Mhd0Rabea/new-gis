export const PROCESSING_OPERATIONS = ['raster-info', 'raster-reproject', 'point-cloud-info', 'point-cloud-classification', 'hillshade', 'contours', 'point-cloud-dem', 'ai-point-classification'] as const;
export type ProcessingOperation = (typeof PROCESSING_OPERATIONS)[number];
export const PROCESSING_EXTENSIONS = new Set(['.tif', '.tiff', '.las', '.laz']);
export function isProcessingOperation(value: unknown): value is ProcessingOperation {
 return typeof value === 'string' && PROCESSING_OPERATIONS.includes(value as ProcessingOperation);
}


/**
 * Normalize image URLs for the survey walk.
 * - Local paths like "/images/survey/IMG_001.jpg" are returned as-is.
 * - Absolute URLs (S3/CloudFront) are returned unchanged.
 */
export function normalizeImageUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  // Local path: ensure leading slash
  return url.startsWith("/") ? url : `/${url}`
}

export function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}

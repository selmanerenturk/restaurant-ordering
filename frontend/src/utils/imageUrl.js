/**
 * Converts a stored imageurl to a fully-qualified URL.
 *
 * - Absolute URLs (http/https)  → returned as-is  (external / Supabase Storage URLs)
 * - Relative paths (/uploads/…) → prepended with the backend base URL
 */
const BACKEND_URL = import.meta.env.VITE_API_URL || '';

export function getImageUrl(imageurl) {
  if (!imageurl) return '';
  // Already an absolute URL
  if (imageurl.startsWith('http://') || imageurl.startsWith('https://')) {
    return imageurl;
  }
  // Relative path served by the backend static file server
  return `${BACKEND_URL}${imageurl}`;
}


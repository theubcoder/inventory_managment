import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Fix image paths for Next.js internationalization
export function getStaticAssetPath(path) {
  // Always return the path as-is for static assets
  // Next.js should handle static assets correctly
  return path
}

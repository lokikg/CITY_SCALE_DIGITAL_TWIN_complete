import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge.
 * This function first combines all class names with clsx, then merges
 * Tailwind CSS classes with tailwind-merge to avoid conflicts.
 *
 * @param {...(string|object|boolean|null|undefined)} inputs - Class names to combine.
 * @returns {string} - A string of combined class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

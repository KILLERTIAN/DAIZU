import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine multiple class names with clsx and merge tailwind classes with twMerge
 * @param inputs - The class names to combine and merge
 * @returns A combined and merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 
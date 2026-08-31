/**
 * Sanitizes text content to prevent XSS or unwanted code injection
 * when rendering text bubbles, dialogs, or pet speech.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

/**
 * Truncates text cleanly for speech bubble display
 */
export function truncateText(input: string, maxLength: number = 120): string {
  if (!input) return "";
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - 3) + "...";
}

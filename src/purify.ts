import DOMPurify from "dompurify";

export function sanitizeWithDOMPurify(input: string): string {
  return DOMPurify.sanitize(input);
}

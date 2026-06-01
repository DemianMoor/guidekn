// Article bodies come in two formats:
//   - Legacy/markdown: written by the AI draft route, CSV import, or the old
//     plain-textarea editor. Rendered with ReactMarkdown.
//   - HTML: written by the rich-text editor (TipTap). Rendered directly.
//
// We don't store a format flag — TipTap output always begins with a block-level
// HTML tag, while markdown begins with text, a "#" heading, "-"/"*" list, etc.
// This heuristic lets the two formats coexist (convert-on-edit) with no schema
// change. Keep this file dependency-free: it's imported by the public page.

const HTML_BODY_RE =
  /^\s*<(p|h[1-6]|ul|ol|li|blockquote|figure|img|div|hr|table|pre|strong|em|a|mark|u|s|br|span)\b/i;

export function isHtmlBody(body: string | null | undefined): boolean {
  if (!body) return false;
  return HTML_BODY_RE.test(body);
}

export function sanitizeItemCode(code: string | undefined | null): string {
  if (!code) return "";
  return code.replace(/[\r\n]+/g, "");
}

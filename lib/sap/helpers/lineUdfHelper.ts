/**
 * Extract the user-defined field (UDF) properties from a raw SAP document line.
 * Service Layer returns line UDFs as `U_*` keys directly on each DocumentLine;
 * the store line-mappers only cherry-pick known columns, so without this the
 * line UDF values are silently dropped when an existing document is loaded.
 */
export function pickLineUdfs(line: Record<string, any> | null | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  if (!line) return out;
  for (const key of Object.keys(line)) {
    if (key.length > 2 && key[0] === "U" && key[1] === "_") {
      out[key] = line[key];
    }
  }
  return out;
}

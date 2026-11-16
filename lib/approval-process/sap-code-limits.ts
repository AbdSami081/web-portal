/** SAP UDT Code / U_FmsCfgCode field limit used by approval template links. */
export const SAP_UDT_CODE_MAX_LENGTH = 20;

export function isLinkableSapCode(code: string | undefined | null): boolean {
  const trimmed = (code ?? "").trim();
  return trimmed.length > 0 && trimmed.length <= SAP_UDT_CODE_MAX_LENGTH;
}

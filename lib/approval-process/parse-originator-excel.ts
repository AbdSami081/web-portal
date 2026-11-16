import * as XLSX from "xlsx";

import type { SapUserOption } from "@/components/administration/wp-approval-process/SapUserCombobox";

const USER_CODE_HEADER = /^user[\s_-]*code$/i;
const EXCEL_ERROR = /^#(REF!|N\/A|VALUE!|DIV\/0!|NAME\?|NULL!|NUM!)$/i;
const MAX_USER_CODE_LENGTH = 50;

export type OriginatorExcelMatch = {
  added: SapUserOption[];
  unmatched: string[];
  duplicates: string[];
  invalid: string[];
  headerPresent: boolean;
  empty: boolean;
};

function cellToString(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).replace(/\u00a0/g, " ").trim();
  }
  return "";
}

function isInvalidUserCode(value: string): boolean {
  return (
    value.length > MAX_USER_CODE_LENGTH ||
    EXCEL_ERROR.test(value) ||
    /[\u0000-\u001f]/.test(value)
  );
}

/** Read the first column and match values to users already loaded in the page. */
export function matchOriginatorUserCodes(
  rows: unknown[][],
  users: SapUserOption[],
  selectedIds: Iterable<number>
): OriginatorExcelMatch {
  const byCode = new Map<string, SapUserOption>();
  for (const user of users) {
    const code = user.userCode?.trim();
    if (!code) continue;
    const key = code.toUpperCase();
    if (!byCode.has(key)) byCode.set(key, user);
  }

  const selected = new Set(selectedIds);
  const seen = new Set<string>();
  const added: SapUserOption[] = [];
  const unmatched: string[] = [];
  const duplicates: string[] = [];
  const invalid: string[] = [];

  const column = rows.map((row) => cellToString(Array.isArray(row) ? row[0] : ""));
  let index = column.findIndex((value) => value !== "");
  if (index === -1) {
    return { added, unmatched, duplicates, invalid, headerPresent: false, empty: true };
  }

  let headerPresent = USER_CODE_HEADER.test(column[index]);
  if (headerPresent) index += 1;

  for (let i = index; i < column.length; i += 1) {
    const raw = column[i];
    if (!raw) continue;
    if (USER_CODE_HEADER.test(raw)) {
      headerPresent = true;
      continue;
    }
    if (isInvalidUserCode(raw)) {
      invalid.push(raw);
      continue;
    }
    const key = raw.toUpperCase();
    if (seen.has(key)) {
      duplicates.push(raw);
      continue;
    }
    seen.add(key);
    const user = byCode.get(key);
    if (!user) {
      unmatched.push(raw);
      continue;
    }
    if (selected.has(user.userId)) {
      duplicates.push(raw);
      continue;
    }
    added.push(user);
  }

  const empty =
    added.length === 0 &&
    unmatched.length === 0 &&
    duplicates.length === 0 &&
    invalid.length === 0;

  return { added, unmatched, duplicates, invalid, headerPresent, empty };
}

export function readOriginatorExcelBuffer(data: ArrayBuffer, fileName: string): unknown[][] {
  const name = fileName.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    throw new Error("Upload an Excel file (.xlsx or .xls).");
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array" });
  } catch {
    throw new Error("This file could not be read. Use an .xlsx or .xls workbook.");
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("This workbook has no sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
}

export async function readOriginatorExcelFile(file: File): Promise<unknown[][]> {
  const data = await file.arrayBuffer();
  return readOriginatorExcelBuffer(data, file.name);
}

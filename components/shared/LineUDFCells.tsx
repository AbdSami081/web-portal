"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUDFStore } from "@/stores/useUDFStore";
import { FmsFieldButton } from "@/components/Custom/FmsFieldButton";
import { useFmsContext } from "@/hooks/useFMS";

/**
 * Inline FMS icon for a single line-table column cell. Renders nothing unless a
 * line-scoped (`U_FieldScope = 'L'`) FMS rule targets `field`. Place it next to
 * the column's input; clicking runs the query with the current row as context
 * and writes the result back into that row via `onPatch`.
 */
export function LineCellFms({
  field,
  line,
  onPatch,
  disabled = false,
}: {
  field: string;
  line: Record<string, any>;
  onPatch: (patch: Record<string, any>) => void;
  disabled?: boolean;
}) {
  const { fmsConfigs } = useFmsContext();
  const has = fmsConfigs.some(
    (c) => c.targetField === field && (c.fieldScope ?? "").toUpperCase() === "L"
  );
  if (disabled || !has) return null;

  const ctx = Object.fromEntries(
    Object.entries(line)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
      .map(([k, v]) => [k, String(v)])
  );

  return (
    <FmsFieldButton
      field={field}
      size={12}
      context={ctx}
      onApply={(v) => onPatch({ [field]: v })}
    />
  );
}

export interface LineUDFDef {
  Name: string;
  Description: string;
  FieldID: number;
  Type: string;
  SubType: string;
  ValidValuesMD?: { Value: string; Description: string }[];
}

/** Load + return the LINE-table UDF definitions for a document type. */
export function useLineUDFs(docType: number): LineUDFDef[] {
  const lineDefs = useUDFStore((s) => s.lineDefinitions[docType]);
  const fetchLineDefinitions = useUDFStore((s) => s.fetchLineDefinitions);

  useEffect(() => {
    fetchLineDefinitions(docType);
  }, [docType, fetchLineDefinitions]);

  return lineDefs ?? [];
}

/** Column descriptors (key/title/width) for the line UDFs, to append to a table's column list. */
export function lineUdfColumns(
  lineUdfs: LineUDFDef[]
): { key: string; title: string; width: number }[] {
  return lineUdfs.map((u) => ({
    key: `U_${u.Name}`,
    title: u.Description || `U_${u.Name}`,
    width: 170,
  }));
}

interface LineUDFCellsProps {
  docType: number;
  /** Current line object (values read by `U_<Name>` key). */
  line: Record<string, any>;
  /** Apply a partial patch to the line. */
  onPatch: (patch: Record<string, any>) => void;
  disabled?: boolean;
  /** Extra key/value context (the line row) passed to any FMS query on these fields. */
  fmsContext?: Record<string, string>;
  tdClassName?: string;
}

/**
 * Renders one `<td>` per line-table UDF. The order here MUST match the order of
 * `lineUdfColumns(...)` appended to the table's column list.
 */
export function LineUDFCells({
  docType,
  line,
  onPatch,
  disabled = false,
  fmsContext,
  tdClassName = "py-2 px-2",
}: LineUDFCellsProps) {
  const lineUdfs = useLineUDFs(docType);
  if (!lineUdfs.length) return null;

  return (
    <>
      {lineUdfs.map((u) => {
        const key = `U_${u.Name}`;
        const value = line?.[key] ?? "";
        const hasValidValues = (u.ValidValuesMD?.length ?? 0) > 0;
        const isNumeric = u.Type === "db_Numeric" || u.Type === "db_Float";

        return (
          <td key={u.FieldID ?? key} className={tdClassName}>
            <div className="flex items-center gap-1">
              {hasValidValues ? (
                <Select
                  value={String(value || "")}
                  onValueChange={(v) => onPatch({ [key]: v })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-6 w-full text-xs">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    {u.ValidValuesMD!.map((vv) => (
                      <SelectItem key={vv.Value} value={vv.Value}>
                        {vv.Description || vv.Value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-6 w-full text-xs"
                  type={isNumeric ? "number" : "text"}
                  step={isNumeric ? "any" : undefined}
                  value={value}
                  disabled={disabled}
                  onChange={(e) => onPatch({ [key]: e.target.value })}
                />
              )}
              {!disabled && (
                <FmsFieldButton
                  field={key}
                  size={12}
                  context={fmsContext}
                  onApply={(v) => onPatch({ [key]: v })}
                />
              )}
            </div>
          </td>
        );
      })}
    </>
  );
}

export default LineUDFCells;

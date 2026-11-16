"use client";

import { useEffect } from "react";

import { getAllFields } from "@/api+/sap/administration/administrationService";
import {
  allowedFieldNames,
  readFieldAccessCache,
  writeFieldAccessCache,
} from "@/lib/field-access/fieldAccessState";
import { findMenuItemByPath, resolveFieldAuthDocType } from "@/lib/menu-data";

export function useDocumentFieldAccess(
  userCode: string | undefined,
  pathname: string,
  fallbackDocType: string | number,
  setFieldAccess: (fields: string[]) => void
) {
  useEffect(() => {
    const code = userCode?.trim();
    if (!code) return;

    let cancelled = false;
    const menuItem = findMenuItemByPath(pathname);
    const docType = menuItem ? resolveFieldAuthDocType(menuItem) : String(fallbackDocType);
    const cached = readFieldAccessCache(code, docType);
    setFieldAccess(cached ?? []);

    const loadAccess = async () => {
      try {
        const fields = await getAllFields(code, docType);
        if (cancelled) return;
        const allowed = allowedFieldNames(fields);
        writeFieldAccessCache(code, docType, allowed);
        setFieldAccess(allowed);
      } catch (error) {
        console.error("Failed to load field access:", error);
      }
    };

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, [userCode, pathname, fallbackDocType, setFieldAccess]);
}

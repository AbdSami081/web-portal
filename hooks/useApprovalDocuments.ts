"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import {
  getCurrentUserApprovalTemplates,
  getApprovalDocumentType,
} from "@/api+/sap/Templates/approvalTemplate";

const cache = new Map<string, Promise<boolean>>();

function check(userId: number, docTypeStr: string, objectTypeCode: number | string): Promise<boolean> {
  const key = `${userId}:${docTypeStr}:${objectTypeCode}`;
  let entry = cache.get(key);
  if (!entry) {
    entry = getCurrentUserApprovalTemplates(userId, docTypeStr, objectTypeCode)
      .then((templates) => Array.isArray(templates) && templates.length > 0)
      .catch(() => false);
    cache.set(key, entry);
  }
  return entry;
}

export function useUserHasApprovalTemplate(docType: number | string, pathname = ""): boolean {
  const { user } = useAuth();
  const userId = Number(user?.sapUserId) || 0;
  const docTypeStr = getApprovalDocumentType(docType, pathname);
  const [hasTemplate, setHasTemplate] = useState(false);

  useEffect(() => {
    if (userId <= 0 || !docTypeStr) {
      setHasTemplate(false);
      return;
    }
    let active = true;
    check(userId, docTypeStr, docType).then((v) => {
      if (active) setHasTemplate(v);
    });
    return () => {
      active = false;
    };
  }, [userId, docTypeStr, docType]);

  return hasTemplate;
}

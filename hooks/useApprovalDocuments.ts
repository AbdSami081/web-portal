"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import {
  getCurrentUserApprovalTemplates,
  getApprovalDocumentType,
} from "@/api+/sap/Templates/approvalTemplate";

const cache = new Map<string, Promise<boolean>>();

function check(userId: number, docTypeStr: string): Promise<boolean> {
  const key = `${userId}:${docTypeStr}`;
  let entry = cache.get(key);
  if (!entry) {
    entry = getCurrentUserApprovalTemplates(userId, docTypeStr)
      .then((templates) => Array.isArray(templates) && templates.length > 0)
      .catch(() => false);
    cache.set(key, entry);
  }
  return entry;
}

export function useUserHasApprovalTemplate(docType: number | string): boolean {
  const { user } = useAuth();
  const userId = Number(user?.sapUserId) || 0;
  const docTypeStr = getApprovalDocumentType(docType);
  const [hasTemplate, setHasTemplate] = useState(false);

  useEffect(() => {
    if (userId <= 0 || !docTypeStr) {
      setHasTemplate(false);
      return;
    }
    let active = true;
    check(userId, docTypeStr).then((v) => {
      if (active) setHasTemplate(v);
    });
    return () => {
      active = false;
    };
  }, [userId, docTypeStr]);

  return hasTemplate;
}

"use client";

import { useEffect, useState } from "react";
import { getAdminSettings } from "@/api+/sap/administration/administrationService";

export interface ApprovalSettings {
  canUpdateApprovedDocument: boolean;
  canOriginatorUpdateDraft: boolean;
  canAuthorizerUpdateDraft: boolean;
  enableApprovalProcessInDI: boolean;
  loaded: boolean;
}

const PERMISSIVE: ApprovalSettings = {
  canUpdateApprovedDocument: true,
  canOriginatorUpdateDraft: true,
  canAuthorizerUpdateDraft: true,
  enableApprovalProcessInDI: true,
  loaded: false,
};

export function useApprovalSettings(): ApprovalSettings {
  const [settings, setSettings] = useState<ApprovalSettings>(PERMISSIVE);

  useEffect(() => {
    let active = true;
    getAdminSettings().then((data) => {
      if (!active || !data) return;
      setSettings({
        canUpdateApprovedDocument: data.CanUpdateApprovedDocument !== false,
        canOriginatorUpdateDraft: data.CanOriginatorUpdateDraft !== false,
        canAuthorizerUpdateDraft: data.CanAuthorizerUpdateDraft !== false,
        enableApprovalProcessInDI: data.EnableApprovalProcessInDI !== false,
        loaded: true,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return settings;
}

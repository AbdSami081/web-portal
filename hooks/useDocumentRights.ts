import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { findMenuItemByPath } from "@/lib/menu-data";
import { getMyDocumentRights } from "@/api+/sap/authorization/authorizationService";

export function useDocumentRights(docType: number | string | undefined | null) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [allowedActions, setAllowedActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const menuItem = findMenuItemByPath(pathname);
  const menuId = menuItem?.id ?? (docType != null ? String(docType) : null);

  useEffect(() => {
    if (!user?.empId || !menuId) {
      setAllowedActions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getMyDocumentRights(menuId)
      .then((actions) => {
        if (!cancelled) setAllowedActions(actions);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.empId, menuId]);

  return { allowedActions, loading, menuId };
}

export const GLOBAL_RIGHTS_MENU_ID = "global-rights";

export function useGlobalRights() {
  const { user } = useAuth();
  const [allowedActions, setAllowedActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.empId) {
      setAllowedActions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getMyDocumentRights(GLOBAL_RIGHTS_MENU_ID)
      .then((actions) => {
        if (!cancelled) setAllowedActions(actions);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.empId]);

  return { allowedActions, loading };
}

"use server";

import { SERVER_MENUS, MenuItem } from "@/lib/menu-data";

function parseJwtPart(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export async function getFilteredMenu(accessToken: string, allowedIds?: string[]): Promise<MenuItem[]> {
    if (!accessToken) return [];

    let allowed: string[] = [];

    if (allowedIds && allowedIds.length > 0) {
        allowed = allowedIds.map(id => id.toLowerCase());
    } else {
        const decoded = parseJwtPart(accessToken);
        const allowedModulesClaim = decoded?.AllowedModules || decoded?.allowedModules;
        if (!decoded || !allowedModulesClaim) return [];

        const allowedStr = allowedModulesClaim as string;
        allowed = allowedStr.split(',').map(m => m.trim().toLowerCase());
    }

    if (allowed.includes("all")) {
        return SERVER_MENUS;
    }

    const alwaysShowBranches = new Set(["reporting", "manage reports"]);

    const filterRecursive = (items: MenuItem[]): MenuItem[] => {
        return items
            .map((item) => {
                const cloned: MenuItem = { ...item };

                if (item.title && alwaysShowBranches.has(item.title.toLowerCase())) {
                    return cloned;
                }

                if (cloned.items?.length) {
                    cloned.items = filterRecursive(cloned.items);
                }

                return cloned;
            })
            .filter((item) => {
                if (item.id && allowed.includes(item.id.toLowerCase())) {
                    return true;
                }

                return !!item.items?.length;
            });
    };

    return filterRecursive(SERVER_MENUS);
}

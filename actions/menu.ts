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

export async function getFilteredMenu(accessToken: string): Promise<MenuItem[]> {
    if (!accessToken) return [];

    const decoded = parseJwtPart(accessToken);
    if (!decoded || !decoded.AllowedModules) return [];

    // Parse allowed modules string to array
    // Handle "all" case
    const allowedStr = decoded.AllowedModules as string;
    const allowed = allowedStr.split(',').map(m => m.trim().toLowerCase());

    // 1. If "all", show everything
    if (allowed.includes("all")) {
        return SERVER_MENUS;
    }

    // 2. Filter recursively
    const deepFiltered = SERVER_MENUS.map(item => {
        // Clone item
        const newItem = { ...item };

        if (newItem.items && newItem.items.length > 0) {
            newItem.items = newItem.items.filter(child =>
                child.id && allowed.includes(child.id.toLowerCase())
            );
        }
        return newItem;
    }).filter(item => {
        // Keep if:
        // 1. Explicitly Allowed (e.g. Dashboard)
        if (allowed.includes(item.id.toLowerCase())) return true;

        // 2. OR Has allowed children (e.g. Sales with only Delivery allowed)
        if (item.items && item.items.length > 0) return true;

        return false;
    });

    return deepFiltered;
}

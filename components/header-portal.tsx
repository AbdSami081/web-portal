"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const HeaderActionPortal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const container = document.getElementById("header-action-container");
    if (!container) return null;

    return createPortal(children, container);
};

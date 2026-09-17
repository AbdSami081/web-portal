"use client";

import { useAuth } from "@/context/authContext";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { SERVER_MENUS } from "@/lib/menu-data";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./ui/card";

export function RouteGuard({ children }: { children: ReactNode }) {
    const { user, isPermissionsLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (!user) return;

        if (isPermissionsLoading && (!user.allowedModules || user.allowedModules.length === 0)) {
            setIsAuthorized(null);
            return;
        }

        const allowed = (user.allowedModules || []).map(m => m.toLowerCase());
        const isAllAllowed = allowed.includes("all");

        if (isAllAllowed) {
            setIsAuthorized(true);
            return;
        }

        const flatMenus: { id: string, url: string }[] = [];
        const flattenMenus = (items: typeof SERVER_MENUS) => {
            items.forEach(item => {
                if (item.url !== "#" && item.url !== "/dashboard") flatMenus.push({ id: item.id, url: item.url });
                if (item.items && item.items.length > 0) {
                    flattenMenus(item.items);
                }
            });
        };
        flattenMenus(SERVER_MENUS);

        const matches = flatMenus.filter(item => pathname.startsWith(item.url));
        const bestMatch = matches.sort((a, b) => b.url.length - a.url.length)[0];

        const administrationMenu = SERVER_MENUS.find(item => item.title?.toLowerCase() === "administration");
        const isAdministrationRoute =
            !!bestMatch &&
            (bestMatch.id === administrationMenu?.id ||
                administrationMenu?.items?.some(child => child.id === bestMatch.id));

        if (user.isSuperAdmin === true && isAdministrationRoute) {
            setIsAuthorized(true);
            return;
        }

        if (pathname === "/dashboard") {
            const dashboardItem = SERVER_MENUS.find(item => item.url === "/dashboard");
            setIsAuthorized(!!dashboardItem && allowed.includes(dashboardItem.id.toLowerCase()));
            return;
        }

        if (!bestMatch) {
            setIsAuthorized(true);
        } else {
            let isAllowed = allowed.includes(bestMatch.id.toLowerCase());
            if (!isAllowed) {
                const parent = SERVER_MENUS.find(parentItem => 
                    parentItem.items?.some(child => child.id === bestMatch.id)
                );
                if (parent && parent.id) {
                    isAllowed = allowed.includes(parent.id.toLowerCase());
                }
            }
            setIsAuthorized(isAllowed);
        }
    }, [pathname, user, isPermissionsLoading]);

    if (!user) return null;

    if (isAuthorized === null) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthorized) {
        if (pathname === "/dashboard") {
            return (
                <div className="flex w-full justify-start p-6 lg:p-8 animate-in fade-in duration-500">
                    <div className="text-left leading-tight">
                        <p className="text-xl font-semibold text-slate-800">
                            Hi {user?.userName || "there"}, welcome back.
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            Choose a module from the sidebar to get started.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center min-h-[60vh] w-full p-4 animate-in fade-in duration-700">
                <Card className="w-full border-red-100 shadow-2xl shadow-red-200/40 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="text-center pb-2 bg-red-50/50">
                        <div className="mx-auto mb-4 bg-red-100 w-16 h-16 rounded-full flex items-center justify-center animate-pulse">
                            <ShieldAlert className="text-red-600 w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-red-950 leading-tight tracking-tight">Access Restricted</CardTitle>
                        <CardDescription className="text-red-600 font-semibold uppercase text-[10px] tracking-widest mt-1">Module Permission Required</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 text-center space-y-5 px-10">
                        <p className="text-zinc-600 leading-relaxed text-sm">
                            Your profile doesn't have the required permissions to view <span className="font-bold text-zinc-900 block mt-1 break-all underline decoration-red-200 decoration-2 underline-offset-4">{pathname}</span>.
                        </p>
                        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-500 leading-normal">
                            If you believe this is an error, please contact your IT administrator to request module clearance.
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 pb-10 px-10">
                        <Button
                            variant="outline"
                            className="w-full sm:flex-1 border-zinc-200 hover:bg-zinc-50 h-10 text-zinc-700 font-medium"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}

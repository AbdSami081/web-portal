"use client";

import { useAuth } from "@/context/authContext";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { SERVER_MENUS } from "@/lib/menu-data";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./ui/card";

export function RouteGuard({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (!user) return;

        if (!user.allowedModules) {
            setIsAuthorized(false);
            return;
        }

        const allowed = user.allowedModules.map(m => m.toLowerCase());
        const isAllAllowed = allowed.includes("all");

        if (isAllAllowed) {
            setIsAuthorized(true);
            return;
        }

        if (pathname === "/dashboard") {
            setIsAuthorized(true);
            return;
        }

        // Flatten menus to find the most specific match (longest URL)
        const flatMenus: { id: string, url: string }[] = [];
        SERVER_MENUS.forEach(menu => {
            if (menu.url !== "#") flatMenus.push({ id: menu.id, url: menu.url });
            if (menu.items) {
                menu.items.forEach(item => {
                    if (item.url !== "#") flatMenus.push({ id: item.id, url: item.url });
                });
            }
        });

        const matches = flatMenus.filter(item => pathname.startsWith(item.url));
        const bestMatch = matches.sort((a, b) => b.url.length - a.url.length)[0];

        if (!bestMatch) {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(allowed.includes(bestMatch.id.toLowerCase()));
        }
    }, [pathname, user]);

    if (isAuthorized === null) return null;

    if (!isAuthorized) {
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

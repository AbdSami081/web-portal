"use client";

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Database, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useAuthStore } from "@/stores/useAuthStore";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { usePathname } from "next/navigation";

export function SessionExpiredModal() {
    const { isSessionExpired, resetSession } = useAuthStore();
    const { login } = useAuth();
    const pathname = usePathname();
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [selectedDb, setSelectedDb] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const databases = useMemo(() => {
        try {
            return JSON.parse(process.env.NEXT_PUBLIC_SAP_DATABASES || "[]");
        } catch (e) {
            console.error("Failed to parse databases from env", e);
            return [];
        }
    }, []);

    const handleReLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        if (!username || !password || !selectedDb) {
            toast.info("Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            const dbParams = {
                companyDB: selectedDb,
            };

            await login(username, password, dbParams);
            toast.success("Session restored successfully!");
            resetSession();
        } catch (err: any) {
            toast.error(err.message || "Re-login failed");
        } finally {
            setLoading(false);
        }
    };

    if (pathname === "/") return null;

    return (
        <Dialog open={isSessionExpired} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none shadow-2xl">
                <div className="bg-slate-900 p-6 text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertCircle size={80} />
                    </div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-white" />
                            </span>
                            Session Expired
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Your security token has expired. Please sign in again to continue your work.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleReLogin} className="p-6 space-y-4 bg-white">
                    <div className="space-y-4">
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Environment</label>
                            <Select value={selectedDb} onValueChange={setSelectedDb}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select Database" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {databases.map((db: any) => (
                                        <SelectItem key={db.CompanyDB} value={db.CompanyDB}>
                                            <div className="flex items-center gap-2">
                                                <Database className="w-4 h-4 text-slate-400" />
                                                <span>{db.CompanyName}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Identity</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900" />
                                <Input
                                    type="text"
                                    placeholder="Employee ID"
                                    required
                                    value={username}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="h-11 pl-10 rounded-xl border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Security Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 pl-10 pr-10 rounded-xl border-slate-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 mt-2"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Restoring...
                            </div>
                        ) : (
                            "RESTORE SESSION"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

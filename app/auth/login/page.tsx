"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Database, User, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useAuth } from "@/context/authContext";
import Image from "next/image";
import logoImage from "@/public/assets/logo.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDb, setSelectedDb] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Typing Effect Logic
  const words = useMemo(() => ["Innovation", "Efficiency", "Security", "Agility", "Growth"], []);
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  const databases = useMemo(() => {
    try {
      return JSON.parse(process.env.NEXT_PUBLIC_SAP_DATABASES || "[]");
    } catch (e) {
      console.error("Failed to parse databases from env", e);
      return [];
    }
  }, []);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 50 : 150));

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!username || !password || !selectedDb) {
      toast.info("Please fill in all fields including database selection.");
      return;
    }

    setLoading(true);

    try {
      const dbParams = {
        companyDB: selectedDb,
      };

      await login(username, password, dbParams);
      toast.success("Logged in successfully!");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 font-sans overflow-hidden">
      {/* Visual Side (Left) - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#0f172a_0%,#020617_100%)]" />

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 p-12 flex flex-col justify-between w-full h-full text-white">
          <div className="animate-in fade-in slide-in-from-top duration-1000">
            <div className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:rotate-12">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter leading-none">SuperNova Solutions</span>
              </div>
            </div>
          </div>

          <div className="max-w-xl space-y-8">
            <div className="space-y-4 animate-in fade-in slide-in-from-left duration-1000 delay-300">
              <h1 className="text-5xl font-black leading-tight tracking-tighter min-h-[110px]">
                Drive <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-indigo-400 to-cyan-400">
                  {words[index].substring(0, subIndex)}
                  <span className="text-white animate-pulse">|</span>
                </span> <br />
                at Scale.
              </h1>
              <p className="text-lg text-slate-400 font-light leading-relaxed">
                The most advanced web portal for SAP Business One. Streamline your operations with real-time data and intelligent workflows.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 py-12 border-t border-white/10 animate-in fade-in slide-in-from-bottom duration-1000 delay-700 fill-mode-both">
              <div className="group space-y-1 hover:bg-white/5 p-3 rounded-xl transition-all cursor-default text-left">
                <h3 className="text-white font-bold text-xl group-hover:text-primary transition-colors">Real-time Analytics</h3>
                <p className="text-slate-400 text-sm">Monitor your KPIs with live data synchronization directly from SAP.</p>
              </div>
              <div className="group space-y-1 hover:bg-white/5 p-3 rounded-xl transition-all cursor-default text-left">
                <h3 className="text-white font-bold text-xl group-hover:text-primary transition-colors">Secure Access</h3>
                <p className="text-slate-400 text-sm">Enterprise-grade security with encrypted connection and session management.</p>
              </div>
              <div className="group space-y-1 hover:bg-white/5 p-3 rounded-xl transition-all cursor-default text-left">
                <h3 className="text-white font-bold text-xl group-hover:text-primary transition-colors">Smart Workflows</h3>
                <p className="text-slate-400 text-sm">Automate your sales and distribution cycles with ease.</p>
              </div>
              <div className="group space-y-1 hover:bg-white/5 p-3 rounded-xl transition-all cursor-default text-left">
                <h3 className="text-white font-bold text-xl group-hover:text-primary transition-colors">Cloud Ready</h3>
                <p className="text-slate-400 text-sm">Access your business data from anywhere, on any device, at any time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Form Side (Right) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-4 md:p-8 relative">
        <div className="w-full max-w-md">
          <div className="mb-4 lg:text-left space-y-1">
            <div className="flex justify-center mb-2">
              <Image src={logoImage} alt="Supernova" width={220} height={80} className="h-20 w-auto object-contain" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Sign In</h2>
            <p className="text-slate-500 text-sm font-medium">Access your web portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <FieldGroup className="space-y-3">
              <Field className="space-y-3">
                <FieldLabel htmlFor="database" className="text-slate-800 font-bold text-[10px] tracking-widest uppercase opacity-70">
                  Data Environment
                </FieldLabel>
                <Select value={selectedDb} onValueChange={setSelectedDb}>
                  <SelectTrigger
                    id="database"
                    className="w-full h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 hover:border-slate-300 transition-all text-base font-medium shadow-sm"
                  >

                    <SelectValue placeholder="Select Database" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl overflow-hidden border-slate-200">
                    {databases.length > 0 ? (
                      databases.map((db: any) => (
                        <SelectItem key={db.CompanyDB} value={db.CompanyDB} className="py-2 focus:bg-slate-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg group-data-[highlighted]:bg-white transition-colors">
                              <Database className="w-5 h-5 text-slate-600" />
                            </div>
                            <span className="text-base font-semibold text-slate-700">{db.CompanyName}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 italic text-sm">No databases configured</div>
                    )}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="space-y-3">
                <FieldLabel htmlFor="username" className="text-slate-800 font-bold text-[10px] tracking-widest uppercase opacity-70">
                  Employee Identity
                </FieldLabel>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors">
                    <User className="w-5 h-5 text-slate-400 group-focus-within:text-primary" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="EMP001"
                    required
                    value={username}
                    onChange={(e) => setUserName(e.target.value)}
                    className="h-12 pl-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 hover:border-slate-300 transition-all text-base font-medium shadow-sm w-full"
                  />
                </div>
              </Field>

              <Field className="space-y-3">
                <FieldLabel htmlFor="password" title="Password" className="text-slate-800 font-bold text-[10px] tracking-widest uppercase opacity-70">
                  Security Key
                </FieldLabel>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors">
                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-primary" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 pl-12 pr-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 hover:border-slate-300 transition-all text-base font-medium shadow-sm w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </Field>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-black bg-slate-900 hover:bg-black text-white rounded-xl transition-all shadow-xl shadow-slate-200 hover:shadow-slate-300 hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    VERIFYING...
                  </div>
                ) : (
                  "LOGIN TO PORTAL"
                )}
              </Button>
            </FieldGroup>
          </form>

        </div>
      </div>
    </div>
  );
}

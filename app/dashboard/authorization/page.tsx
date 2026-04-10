"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/authContext";
import { SERVER_MENUS, MenuItem } from "@/lib/menu-data";
import { 
  getUsers, 
  getUserAccess, 
  saveUserAccess, 
  OhemUser, 
  UserAccessEntry 
} from "@/api+/sap/authorization/authorizationService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, Save, Users, Shield, Database, 
  Search, ShieldCheck, ChevronRight, CheckCircle2,
  Settings, Info, Filter, X,
  LayoutDashboard,
  Package,
  Factory,
  FileText,
  BadgeDollarSign,
  LayoutDashboardIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DatabaseConfig {
  CompanyName: string;
  CompanyDB: string;
}

export default function AuthorizationPage() {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [users, setUsers] = useState<OhemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const databases = useMemo<DatabaseConfig[]>(() => {
    try {
      const dbStr = process.env.NEXT_PUBLIC_SAP_DATABASES || "[]";
      return JSON.parse(dbStr);
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_SAP_DATABASES", e);
      return [];
    }
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.empId.toString().includes(searchQuery)
    );
  }, [users, searchQuery]);

  // Fetch users when company changes
  useEffect(() => {
    if (selectedCompany) {
      loadUsers();
    } else {
      setUsers([]);
      setSelectedUsers([]);
    }
  }, [selectedCompany]);

  // Fetch access when a user is selected
  useEffect(() => {
    if (selectedUsers.length === 1 && selectedCompany) {
      loadUserAccess(selectedUsers[0]);
    } else if (selectedUsers.length === 0) {
      setSelectedPermissions({});
    }
  }, [selectedUsers, selectedCompany]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers(selectedCompany);
      setUsers(data);
    } catch (error: any) {
      toast.error("Failed to load users: " + error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserAccess = async (userId: string) => {
    setLoadingAccess(true);
    try {
      const access = await getUserAccess(userId, selectedCompany);
      const perms: Record<string, boolean> = {};
      access.forEach(entry => {
        if (entry.componentId) {
          perms[`${entry.moduleId}|${entry.componentId}`] = true;
        } else {
          perms[entry.moduleId] = true;
        }
      });
      setSelectedPermissions(perms);
    } catch (error: any) {
      toast.error("Error loading permissions: " + (error.response?.data?.message || error.message));
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handlePermissionToggle = (moduleId: string, componentId?: string) => {
    const key = componentId ? `${moduleId}|${componentId}` : moduleId;
    setSelectedPermissions(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      
      // Cascade off
      if (!componentId && !newState[key]) {
        Object.keys(newState).forEach(k => {
          if (k.startsWith(`${moduleId}|`)) newState[k] = false;
        });
      }
      
      // Cascade on
      if (componentId && newState[key]) {
        newState[moduleId] = true;
      }
      
      return newState;
    });
  };

  const handleSave = async () => {
    if (selectedUsers.length === 0 || !selectedCompany) {
      toast.error("Please select at least one user and an environment");
      return;
    }

    setSaving(true);
    try {
      const permissions: { moduleID: string; componentID: string }[] = [];
      Object.entries(selectedPermissions).forEach(([key, enabled]) => {
        if (enabled) {
          if (key.includes("|")) {
            const [m, c] = key.split("|");
            permissions.push({ moduleID: m, componentID: c });
          } else {
            permissions.push({ moduleID: key, componentID: "" });
          }
        }
      });

      // Save for each selected user
      console.log("Saving permissions for users:", selectedUsers);
      console.log("Permissions payload:", permissions);

      for (const userId of selectedUsers) {
        const payload = {
          userID: userId,
          companyDB: selectedCompany,
          permissions
        };
        
        console.log(`Sending payload for user ${userId}:`, payload);
        
        try {
          await saveUserAccess(payload);
        } catch (apiError: any) {
          console.error(`API Error for user ${userId}:`, apiError.response?.data || apiError.message);
          throw apiError; // Re-throw to catch in outer block
        }
      }

      // toast.success(...) - Removed in favor of modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Full Save Error:", error);
      const serverMessage = error.response?.data?.message || error.message;
      toast.error("Update failed: " + serverMessage);
    } finally {
      setSaving(false);
    }
  };

  // Map for icons
  const ICON_MAP: Record<string, any> = {
    "LayoutDashboardIcon": LayoutDashboardIcon,
    "BadgeDollarSign": BadgeDollarSign,
    "Package": Package,
    "Factory": Factory,
    "FileText": FileText,
    "Settings": Settings
  };

  if (user?.role?.toLowerCase() !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-full text-orange-600">
            <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold">Admin Only Access</h2>
        <p className="text-slate-500">Please contact your administrator to modify permissions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Professional Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <Settings className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900">Module Access Control</h1>
                <p className="text-xs text-slate-500 font-medium tracking-tight">Enterprise Permission Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedUsers.length > 0 && (
                <div className="hidden md:flex items-center border-l border-slate-200 pl-4 h-8 mr-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-3">Selected</span>
                    <div className="flex -space-x-2">
                        {selectedUsers.slice(0, 3).map(id => (
                            <div key={id} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {users.find(u => u.empId === id)?.fullName.charAt(0) || id}
                            </div>
                        ))}
                        {selectedUsers.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                                +{selectedUsers.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedUsers([])}
                disabled={selectedUsers.length === 0}
                className="h-9 px-4 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-600"
            >
                Clear
            </Button>
            
            <Button 
                onClick={handleSave} 
                disabled={saving || selectedUsers.length === 0 || !selectedCompany}
                className="h-9 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm disabled:opacity-50"
            >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Select Environment
              </label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 font-semibold text-slate-700">
                  <SelectValue placeholder="Select Database" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-lg">
                  {databases.map((db) => (
                    <SelectItem key={db.CompanyDB} value={db.CompanyDB} className="font-medium text-slate-800 py-2.5">
                      {db.CompanyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[580px]">
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Employee List
                    </label>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] py-0 px-2 font-bold">{filteredUsers.length}</Badge>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Find users..." 
                      className="pl-9 h-10 border-slate-200 bg-slate-50/50 shadow-none text-sm font-medium focus-visible:ring-slate-900"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={!selectedCompany}
                    />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {loadingUsers ? (
                    <div className="space-y-4 p-2 pt-4">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-100 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-2.5 bg-slate-100 rounded w-2/3 animate-pulse" />
                                    <div className="h-1.5 bg-slate-50 rounded w-1/3 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                        <Users className="w-8 h-8 mb-2" />
                        <p className="text-xs font-bold">No users selected.</p>
                    </div>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map((u) => (
                      <button 
                        key={u.empId} 
                        onClick={() => handleUserToggle(u.empId)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 group px-4",
                          selectedUsers.includes(u.empId) 
                            ? "bg-blue-50/80 border-blue-200 text-slate-900 shadow-sm" 
                            : "bg-transparent border-transparent text-slate-600 hover:bg-slate-100/70"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded flex items-center justify-center text-[10px] font-black shrink-0",
                          selectedUsers.includes(u.empId) ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 group-hover:bg-slate-200"
                        )}>
                           {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate leading-tight">{u.fullName}</p>
                            <p className={cn(
                                "text-[10px] font-medium tracking-tight mt-0.5",
                                selectedUsers.includes(u.empId) ? "text-blue-500" : "text-slate-400"
                            )}>ID: {u.empId}</p>
                        </div>
                        {selectedUsers.includes(u.empId) && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Detail Panel */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex items-center justify-between">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <Shield className="w-3.5 h-3.5" /> Permissions Hierarchy
                    </label>
                    <h2 className="text-sm font-bold text-slate-700">Assign Module Visibility</h2>
                </div>
                {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-green-600 px-2 py-0.5 bg-green-50 border border-green-100 rounded-full">Editing Mode</span>
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 relative">
              {loadingAccess && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-12">
                   <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
                        <span className="text-xs font-bold text-slate-500">Retrieving Access List...</span>
                   </div>
                </div>
              )}

              {!selectedUsers.length ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
                        <Filter className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Select a user to begin</p>
                    <p className="text-xs mt-2 font-medium max-w-[240px]">Access configurations are loaded in real-time for each individual user.</p>
                </div>
              ) : (
                <div className="columns-1 md:columns-2 gap-12 space-y-10 opacity-100 transition-opacity duration-300">
                    {SERVER_MENUS.map((menu) => {
                        const Icon = ICON_MAP[menu.iconName || ""] || LayoutDashboard;
                        return (
                          <div key={menu.id} className="break-inside-avoid space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-2.5">
                                      <div className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                          selectedPermissions[menu.id] ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                                      )}>
                                          <Icon className="w-4 h-4" />
                                      </div>
                                      <span className={cn(
                                          "text-sm font-bold",
                                          selectedPermissions[menu.id] ? "text-slate-900" : "text-slate-500"
                                      )}>{menu.title}</span>
                                  </div>
                                  <Checkbox 
                                      className="h-5 w-5 border-slate-200 data-[state=checked]:bg-slate-900 border-2 rounded"
                                      checked={selectedPermissions[menu.id] || false}
                                      onCheckedChange={() => handlePermissionToggle(menu.id)}
                                  />
                              </div>

                              {menu.items && menu.items.length > 0 && (
                                  <div className="grid grid-cols-1 gap-1.5">
                                      {menu.items.map((item) => (
                                          <label 
                                              key={item.id} 
                                              className={cn(
                                                  "flex items-center justify-between p-2.5 px-3 rounded-lg group transition-colors cursor-pointer border border-transparent",
                                                  selectedPermissions[`${menu.id}|${item.id}`] ? "bg-white border-slate-100 shadow-sm" : "hover:bg-slate-50"
                                              )}
                                          >
                                              <div className="flex items-center gap-2">
                                                  <ChevronRight className={cn(
                                                      "w-3.5 h-3.5 transition-colors",
                                                      selectedPermissions[`${menu.id}|${item.id}`] ? "text-slate-900" : "text-slate-300"
                                                  )} />
                                                  <span className={cn(
                                                      "text-xs font-medium",
                                                      selectedPermissions[`${menu.id}|${item.id}`] ? "text-slate-900 font-bold" : "text-slate-500"
                                                  )}>{item.title}</span>
                                              </div>
                                              <Checkbox 
                                                  className="h-4 w-4 border-slate-200 data-[state=checked]:bg-slate-900 rounded"
                                                  checked={selectedPermissions[`${menu.id}|${item.id}`] || false}
                                                  onCheckedChange={() => handlePermissionToggle(menu.id, item.id)}
                                                  onClick={(e) => e.stopPropagation()}
                                              />
                                          </label>
                                      ))}
                                  </div>
                              )}
                          </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent className="bg-white border-zinc-200 shadow-2xl rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <div className="bg-emerald-100 p-2 rounded-full">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              Success!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 font-medium pt-4 space-y-3 leading-relaxed">
              <p>User permissions have been updated successfully in the system.</p>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm font-semibold flex items-start gap-2 shadow-sm">
                <Info className="w-5 h-5 shrink-0" />
                <span>IMPORTANT: The updated users must log out and sign back in to apply these changes to their session.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogAction
              onClick={() => setShowSuccessModal(false)}
              className="bg-black hover:bg-zinc-800 text-white font-bold px-8 py-2 rounded-xl transition-all shadow-xl shadow-zinc-200 active:scale-95"
            >
              Ok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/authContext";
import { SERVER_MENUS, MenuItem } from "@/lib/menu-data";
import { 
  getUsers, 
  getUserAccess, 
  saveUserAccess, 
  getModules,
  OhemUser, 
  UserAccessEntry,
  WebPortalConfigEntry
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
  Settings, Info, Filter, X, Copy,
  LayoutDashboard,
  Package,
  Factory,
  FileText,
  BadgeDollarSign,
  ShoppingCart,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DatabaseConfig {
  CompanyName: string;
  CompanyDB: string;
}

type AuthMenuItem = MenuItem & {
  icon?: any;
};

const getPermissionKey = (rootId: string, nodeId: string) =>
  rootId === nodeId ? rootId : `${rootId}|${nodeId}`;

const collectDescendantKeys = (rootId: string, node: AuthMenuItem): string[] => {
  if (!node.items?.length) return [];

  return node.items.flatMap((child) => {
    const childKey = getPermissionKey(rootId, child.id);
    return [childKey, ...collectDescendantKeys(rootId, child)];
  });
};

const isNodeChecked = (
  rootId: string,
  node: AuthMenuItem,
  permissions: Record<string, boolean>
) => {
  const nodeKey = getPermissionKey(rootId, node.id);
  if (permissions[nodeKey]) return true;

  return collectDescendantKeys(rootId, node).some((key) => permissions[key]);
};

export default function AuthorizationPage() {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [users, setUsers] = useState<OhemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Copy Authorization Modal state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySearchQuery, setCopySearchQuery] = useState("");
  const [selectedCopyUsers, setSelectedCopyUsers] = useState<string[]>([]);
  const [savingCopy, setSavingCopy] = useState(false);

  const [portalConfig, setPortalConfig] = useState<WebPortalConfigEntry[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const sourceUser = useMemo(() => {
    return users.find(u => u.empId === selectedUser);
  }, [users, selectedUser]);

  const copyFilteredUsers = useMemo(() => {
    return users.filter(u => 
      u.empId !== selectedUser && 
      (u.fullName.toLowerCase().includes(copySearchQuery.toLowerCase()) || 
       u.empId.toString().includes(copySearchQuery))
    );
  }, [users, copySearchQuery, selectedUser]);

  const configuredModuleIds = useMemo(() => {
    const ids = new Set<string>();
    portalConfig.forEach(cfg => {
      const mid = cfg.modules || cfg.Code || cfg.code;
      if (mid) {
        mid.split(',').forEach(m => {
          const trimmed = m.trim().toLowerCase();
          if (trimmed) ids.add(trimmed);
        });
      }
    });
    return ids;
  }, [portalConfig]);

  const filteredMenus = useMemo(() => {
    if (portalConfig.length === 0) return [];

    const filterRecursive = (items: AuthMenuItem[]): AuthMenuItem[] => {
      return items
        .map((menu) => {
          const cloned: AuthMenuItem = { ...menu };
          if (cloned.items?.length) {
            cloned.items = filterRecursive(cloned.items as AuthMenuItem[]);
          }
          return cloned;
        })
        .filter((menu) => {
          return (
            configuredModuleIds.has(menu.id.toLowerCase()) ||
            Boolean(menu.items?.length)
          );
        });
    };

    return filterRecursive(SERVER_MENUS as AuthMenuItem[]);
  }, [configuredModuleIds, portalConfig]);

  useEffect(() => {
    if (user?.companyDB) {
      setSelectedCompany(user.companyDB);
    }
  }, [user]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.empId.toString().includes(searchQuery)
    );
  }, [users, searchQuery]);
  
  const loadPortalConfig = async () => {
    setLoadingConfig(true);
    try {
      const data = await getModules(selectedCompany);
      setPortalConfig(data);
    } catch (error: any) {
      console.error("Failed to load portal config:", error);
      setPortalConfig([]);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      loadUsers();
      loadPortalConfig();
    } else {
      setUsers([]);
      setSelectedUser("");
      setPortalConfig([]);
    }
  }, [selectedCompany]);

  // Fetch access when a user is selected
  useEffect(() => {
    if (selectedUser && selectedCompany) {
      loadUserAccess(selectedUser);
    } else {
      setSelectedPermissions({});
    }
  }, [selectedUser, selectedCompany]);

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

  const handleUserSelect = (userId: string) => {
    setSelectedUser(prev => (prev === userId ? "" : userId));
  };

  const handleCopyUserToggle = (userId: string) => {
    setSelectedCopyUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllCopyUsers = (checked: boolean) => {
    if (checked) {
      setSelectedCopyUsers(copyFilteredUsers.map(u => u.empId));
    } else {
      setSelectedCopyUsers([]);
    }
  };

  const handlePermissionToggle = (
    rootId: string,
    node: AuthMenuItem,
    ancestorKeys: string[] = []
  ) => {
    const nodeKey = getPermissionKey(rootId, node.id);
    const nodeChecked = isNodeChecked(rootId, node, selectedPermissions);
    const nextState = !nodeChecked;
    const descendantKeys = collectDescendantKeys(rootId, node);

    setSelectedPermissions((prev) => {
      const updated = { ...prev };
      [...ancestorKeys, nodeKey].forEach((key) => {
        updated[key] = nextState;
      });
      descendantKeys.forEach((key) => {
        updated[key] = nextState;
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedUser || !selectedCompany) {
      toast.error("Please select a user and an environment");
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

      const payload = {
        userID: selectedUser,
        companyDB: selectedCompany,
        permissions
      };
      
      console.log(`Sending payload for user ${selectedUser}:`, payload);
      
      try {
        await saveUserAccess(payload);
      } catch (apiError: any) {
        console.error(`API Error for user ${selectedUser}:`, apiError.response?.data || apiError.message);
        throw apiError; 
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Full Save Error:", error);
      const serverMessage = error.response?.data?.message || error.message;
      toast.error("Update failed: " + serverMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCopyAuthorization = async () => {
    if (selectedCopyUsers.length === 0 || !selectedCompany) {
      toast.error("Please select at least one target user");
      return;
    }

    setSavingCopy(true);
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

      for (const targetUserId of selectedCopyUsers) {
        const payload = {
          userID: targetUserId,
          companyDB: selectedCompany,
          permissions
        };
        await saveUserAccess(payload);
      }

      setShowCopyModal(false);
      const count = selectedCopyUsers.length;
      setSelectedCopyUsers([]);
      setShowSuccessModal(true);
      toast.success(`Authorizations copied to ${count} user(s) successfully.`);
    } catch (error: any) {
      console.error("Copy Save Error:", error);
      const serverMessage = error.response?.data?.message || error.message;
      toast.error("Copy failed: " + serverMessage);
    } finally {
      setSavingCopy(false);
    }
  };

  const ICON_MAP: Record<string, any> = {
    "LayoutDashboardIcon": LayoutDashboardIcon,
    "BadgeDollarSign": BadgeDollarSign,
    "Package": Package,
    "Factory": Factory,
    "FileText": FileText,
    "ShoppingCart": ShoppingCart,
    "Settings": Settings
  };

  const renderPermissionNode = (
    rootMenu: AuthMenuItem,
    node: AuthMenuItem,
    depth = 0,
    ancestorKeys: string[] = []
  ) => {
    const nodeKey = getPermissionKey(rootMenu.id, node.id);
    const checked = isNodeChecked(rootMenu.id, node, selectedPermissions);
    const hasChildren = !!node.items?.length;
    const baseIndent = depth * 18;
    const Icon = depth === 0
      ? (ICON_MAP[rootMenu.iconName || ""] || LayoutDashboard)
      : ChevronRight;

    return (
      <div key={nodeKey} className="space-y-1">
        <div
          className={cn(
            "flex items-center justify-between p-2.5 px-3 rounded-lg group transition-colors cursor-pointer border border-transparent",
            depth === 0
              ? "border-slate-100 bg-white shadow-sm hover:bg-slate-50"
              : checked
                ? "bg-white border-slate-100 shadow-sm"
                : "hover:bg-slate-50"
          )}
          style={{ marginLeft: depth > 0 ? baseIndent : 0 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
              checked ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={cn(
              "text-sm font-bold truncate",
              checked ? "text-slate-900" : "text-slate-500"
            )}>
              {node.title}
            </span>
            {depth > 0 && hasChildren && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Parent
              </span>
            )}
          </div>

          <Checkbox
            className="h-4 w-4 border-slate-400 data-[state=checked]:bg-slate-900 border-2 rounded transition-colors"
            checked={checked}
            onCheckedChange={() =>
              handlePermissionToggle(rootMenu.id, node, ancestorKeys)
            }
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {hasChildren && (
          <div className="grid grid-cols-1 gap-1.5">
            {node.items!.map((child) =>
              renderPermissionNode(rootMenu, child as AuthMenuItem, depth + 1, [
                ...ancestorKeys,
                nodeKey,
              ])
            )}
          </div>
        )}
      </div>
    );
  };

  const hasAdminAccess = useMemo(() => {
    if (!user) return false;
    if (user.isSuperAdmin === true || user.role?.toLowerCase() === "admin") return true;

    const userAllowedLower = (user.allowedModules || []).map((m: string) => m.toLowerCase());
    if (userAllowedLower.includes("all")) return true;

    let moduleAccessItem: MenuItem | undefined;
    let parentItem: MenuItem | undefined;

    for (const parent of SERVER_MENUS) {
      const foundChild = parent.items?.find(child => child.url === "/dashboard/authorization");
      if (foundChild) {
        moduleAccessItem = foundChild;
        parentItem = parent;
        break;
      }
    }

    if (moduleAccessItem && moduleAccessItem.id && userAllowedLower.includes(moduleAccessItem.id.toLowerCase())) {
      return true;
    }
    if (parentItem && parentItem.id && userAllowedLower.includes(parentItem.id.toLowerCase())) {
      return true;
    }

    return false;
  }, [user]);

  if (!hasAdminAccess) {
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
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <Settings className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900">Module Access Control</h1>
                <p className="text-xs text-slate-500 font-medium tracking-tight">Manage user access to modules</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedUser && (
              <div className="hidden md:flex items-center border-l border-slate-200 pl-4 h-8 mr-2 px-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-3">Source User</span>
                <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                    {sourceUser?.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{sourceUser?.fullName}</span>
                </div>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedUser("")}
              disabled={!selectedUser}
              className="h-9 px-4 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Clear
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedCopyUsers([]);
                setCopySearchQuery("");
                setShowCopyModal(true);
              }}
              disabled={!selectedUser || loadingAccess}
              className="h-9 px-4 text-xs font-bold border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 shadow-sm disabled:opacity-50"
            >
              <Copy className="mr-2 h-4 w-4 text-blue-600" />
              Copy Authorization
            </Button>
            
            <Button 
              onClick={handleSave} 
              disabled={saving || !selectedUser || !selectedCompany}
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
                        <p className="text-xs font-bold">No users available.</p>
                    </div>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedUser === u.empId;
                      return (
                        <button 
                          key={u.empId} 
                          onClick={() => handleUserSelect(u.empId)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 group px-4",
                            isSelected 
                              ? "bg-blue-50/80 border-blue-200 text-slate-900 shadow-sm" 
                              : "bg-transparent border-transparent text-slate-600 hover:bg-slate-100/70"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded flex items-center justify-center text-[10px] font-black shrink-0",
                            isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 group-hover:bg-slate-200"
                          )}>
                             {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-bold truncate leading-tight">{u.fullName}</p>
                              <p className={cn(
                                  "text-[10px] font-medium tracking-tight mt-0.5",
                                  isSelected ? "text-blue-500" : "text-slate-400"
                              )}>ID: {u.empId}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
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
                {selectedUser && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-green-600 px-2 py-0.5 bg-green-50 border border-green-100 rounded-full">Editing Mode</span>
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 relative">
              {(loadingAccess || loadingConfig) && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-12">
                   <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
                        <span className="text-xs font-bold text-slate-500">
                          {loadingConfig ? "Loading configurations..." : "Retrieving Access List..."}
                        </span>
                   </div>
                </div>
              )}

              {!selectedUser ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
                        <Filter className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Select a user to begin</p>
                    <p className="text-xs mt-2 font-medium max-w-[240px]">Access configurations are loaded in real-time for the selected user.</p>
                </div>
              ) : filteredMenus.length === 0 ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100 mb-4 text-red-500 animate-pulse">
                        <X className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest text-red-500">No Modules Found</p>
                    <p className="text-xs mt-2 font-medium max-w-[320px] text-slate-500 leading-relaxed">
                      No active modules found.
                    </p>
                </div>
              ) : (
                <div className="columns-1 md:columns-2 gap-12 space-y-10 opacity-100 transition-opacity duration-300">
                  {filteredMenus.map((menu) => (
                    <div key={menu.id} className="break-inside-avoid space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2.5">
                          {(() => {
                            const MenuIcon = ICON_MAP[menu.iconName || ""] || LayoutDashboard;
                            return (
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                selectedPermissions[menu.id] ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                              )}>
                                <MenuIcon className="w-4 h-4" />
                              </div>
                            );
                          })()}
                          <span className={cn(
                            "text-sm font-bold",
                            isNodeChecked(menu.id, menu as AuthMenuItem, selectedPermissions) ? "text-slate-900" : "text-slate-500"
                          )}>
                            {menu.title}
                          </span>
                        </div>
                        <Checkbox 
                          className="h-5 w-5 border-slate-400 data-[state=checked]:bg-slate-900 border-2 rounded transition-colors"
                          checked={isNodeChecked(menu.id, menu as AuthMenuItem, selectedPermissions)}
                          onCheckedChange={() => handlePermissionToggle(menu.id, menu as AuthMenuItem)}
                        />
                      </div>

                      {menu.items && menu.items.length > 0 && (
                        <div className="grid grid-cols-1 gap-1.5">
                          {menu.items.map((item) =>
                            renderPermissionNode(menu as AuthMenuItem, item as AuthMenuItem, 1, [menu.id])
                          )}
                        </div>
                      )}
                    </div>
                  ))}
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

      {/* Copy Authorization Modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="bg-white border-zinc-200 shadow-2xl rounded-2xl max-w-lg p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Copy className="w-5 h-5" />
              </div>
              Copy Authorization
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Copy rights from <span className="font-bold text-slate-900">{sourceUser?.fullName}</span> (ID: {selectedUser}) to target users below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Search and Select All header */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search target users..." 
                  className="pl-9 h-10 border-slate-200 bg-slate-50/50 shadow-none text-sm font-medium focus-visible:ring-slate-900"
                  value={copySearchQuery}
                  onChange={(e) => setCopySearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between px-1 py-1 border-b border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-bold hover:text-slate-900">
                  <Checkbox 
                    checked={copyFilteredUsers.length > 0 && selectedCopyUsers.length === copyFilteredUsers.length}
                    onCheckedChange={(checked) => handleSelectAllCopyUsers(!!checked)}
                    className="h-4 w-4 border-slate-400 data-[state=checked]:bg-slate-900 rounded"
                  />
                  <span>Select All ({copyFilteredUsers.length})</span>
                </label>
                <span className="text-slate-400 text-[11px]">
                  {selectedCopyUsers.length} user(s) selected
                </span>
              </div>
            </div>

            {/* Users List with Checkboxes */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {copyFilteredUsers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No matching target users found.
                </div>
              ) : (
                copyFilteredUsers.map((u) => {
                  const isChecked = selectedCopyUsers.includes(u.empId);
                  return (
                    <label 
                      key={u.empId} 
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer",
                        isChecked ? "bg-blue-50/70 border-blue-200 text-slate-900" : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox 
                          checked={isChecked}
                          onCheckedChange={() => handleCopyUserToggle(u.empId)}
                          className="h-4 w-4 border-slate-400 data-[state=checked]:bg-slate-900 border-2 rounded shrink-0"
                        />
                        <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate leading-tight">{u.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">ID: {u.empId}</p>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCopyModal(false)}
              disabled={savingCopy}
              className="h-9 px-4 text-xs font-bold border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCopyAuthorization}
              disabled={savingCopy || selectedCopyUsers.length === 0}
              className="h-9 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm disabled:opacity-50"
            >
              {savingCopy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Save & Copy ({selectedCopyUsers.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div>User permissions have been updated successfully in the system.</div>
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

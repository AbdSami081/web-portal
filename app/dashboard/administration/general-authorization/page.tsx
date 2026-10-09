"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Search } from "lucide-react";

import { getUsers, OhemUser, GLOBAL_RIGHTS_ACTIONS } from "@/api+/sap/authorization/authorizationService";
import { GLOBAL_RIGHTS_MENU_ID } from "@/hooks/useDocumentRights";
import { DocumentRightsChecklist } from "@/components/shared/DocumentRightsChecklist";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";

export default function GeneralAuthorizationPage() {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [users, setUsers] = useState<OhemUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");

  useEffect(() => {
    if (user?.companyDB) setSelectedCompany(user.companyDB);
  }, [user]);

  useEffect(() => {
    if (!selectedCompany) return;
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const data = await getUsers(selectedCompany);
        setUsers(data);
      } catch (error: any) {
        toast.error("Failed to load users: " + error.message);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, [selectedCompany]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.empId.toString().includes(userSearch)
    );
  }, [users, userSearch]);

  const sourceUser = useMemo(
    () => users.find((u) => String(u.empId) === selectedUser),
    [users, selectedUser]
  );

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      <header className="flex h-14 items-center justify-between border-b px-6 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            General Authorization
          </h2>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r flex flex-col bg-slate-50/30">
          <div className="p-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search users..."
                className="pl-9 h-9 text-[11px] border-slate-200"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingUsers ? (
              <div className="p-6 text-center text-[11px] text-slate-400">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-slate-400">
                No users found.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const userCode = String(u.empId ?? "");
                const isSelected = selectedUser === userCode;

                return (
                  <button
                    key={userCode}
                    onClick={() => setSelectedUser(userCode)}
                    className={cn(
                      "w-full px-6 py-4 text-left transition-all border-b last:border-0",
                      isSelected
                        ? "bg-white border-l-4 border-l-blue-600 shadow-sm"
                        : "hover:bg-slate-100/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        )}
                      >
                        {u.fullName?.charAt(0) ?? "?"}
                      </div>

                      <div>
                        <p
                          className={cn(
                            "text-xs font-bold",
                            isSelected ? "text-blue-700" : "text-slate-700"
                          )}
                        >
                          {u.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Employee ID: {userCode}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {!selectedUser ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 text-slate-400">
              <ShieldCheck className="h-10 w-10 mb-3 text-slate-300" />
              <p className="text-xs font-bold text-slate-500">
                Select a user to manage their General Authorization.
              </p>
            </div>
          ) : (
            <div className="p-8 max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {sourceUser?.fullName?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{sourceUser?.fullName}</p>
                  <p className="text-[11px] text-slate-400">Employee ID: {selectedUser}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-5 bg-slate-50/50">
                <p className="text-xs text-slate-500 mb-4">
                  Controls global, app-wide permissions for this user — not tied to any single
                  document (approval rights, viewing BP balances, etc).
                </p>
                <DocumentRightsChecklist
                  key={selectedUser}
                  menuId={GLOBAL_RIGHTS_MENU_ID}
                  user={{ empId: selectedUser, fullName: sourceUser?.fullName || selectedUser }}
                  actions={GLOBAL_RIGHTS_ACTIONS}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

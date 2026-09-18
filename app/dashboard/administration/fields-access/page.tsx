"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  FileText,
  Save,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  getUsers,
  OhemUser,
} from "@/api+/sap/authorization/authorizationService";

import {
  getAllFields,
  assignUserFields,
} from "@/api+/sap/administration/administrationService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { SERVER_MENUS, resolveFieldAuthDocType, filterMenusByAllowedModules } from "@/lib/menu-data";
import { cn } from "@/lib/utils";

import { useAuth } from "@/context/authContext";
import { toast } from "sonner";


type Field = {
  FieldId: number;
  FieldName: string;
  FieldTitle?: string;
  ObjectId?: string | number;
  U_FieldType?: string;
  U_DocType?: string | number;
  U_Active?: string;
};


type FieldGroup = {
  type: string;
  title: string;
  fields: Field[];
};


const normalizeField = (field: any): Field => ({
  FieldId: Number(field.FieldId ?? field.Code ?? 0),

  FieldName:
    field.FieldName ??
    field.U_FieldName ??
    field.Name ??
    "",

  FieldTitle:
    field.U_FieldTitle ??
    field.FieldTitle ??
    field.FieldName ??
    field.U_FieldName ??
    "",

  ObjectId:
    field.ObjectId ??
    field.U_ObjectId ??
    "",

  U_FieldType:
    field.U_FieldType ??
    field.FieldType ??
    "",

  U_DocType:
    field.U_DocType ??
    field.DocType ??
    "",

  U_Active:
    field.U_Active ??
    "Y",
});


export default function FieldAccessManagement() {
  const { user } = useAuth();

  const [allFields, setAllFields] = useState<Field[]>([]);

  const [users, setUsers] = useState<OhemUser[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>("");

  const [selectedCompany, setSelectedCompany] = useState<string>("");

  const [selectedDocument, setSelectedDocument] = useState<string>("");

  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  const [userSearch, setUserSearch] = useState("");

  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const [isLoadingFields, setIsLoadingFields] = useState(false);

  const [isLoadingAssignments, setIsLoadingAssignments] =
    useState(false);

  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    const company =
      (user as any)?.companyDB ??
      (user as any)?.CompanyDB ??
      "";

    setSelectedCompany(company);
  }, [user]);


  /*
   * Load users
   */
  useEffect(() => {
    if (!selectedCompany) {
      setUsers([]);
      return;
    }

    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);

        const response = await getUsers(selectedCompany);

        setUsers(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Failed to load users:", error);
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [selectedCompany]);


  /*
   * Load fields
   */
  useEffect(() => {
  if (!selectedUser || !selectedDocument) {
    setAllFields([]);
    setSelectedFields([]);
    setHasChanges(false);
    return;
  }

  const loadFields = async () => {
    try {
      setIsLoadingFields(true);
      setIsLoadingAssignments(true);
      setHasChanges(false);

      const response = await getAllFields(
        selectedUser,
        selectedDocument
      );

      const data = Array.isArray(response) ? response : [];

      // All fields
      setAllFields(data.map(normalizeField));

      // Only enabled/allowed fields
      const assignedKeys = data
        .filter(
          (item: any) =>
            String(
              item.Enabled ??
              item.U_IsAllowed ??
              "N"
            ).toUpperCase() === "Y"
        )
        .map(
          (item: any) =>
            item.U_FieldName ??
            item.FieldName ??
            ""
        )
        .filter(
          (key: string) => key.trim() !== ""
        );

      setSelectedFields(
        Array.from(new Set(assignedKeys))
      );
    } catch (error) {
      console.error("Failed to load fields:", error);
      setAllFields([]);
      setSelectedFields([]);
    } finally {
      setIsLoadingFields(false);
      setIsLoadingAssignments(false);
    }
  };

  loadFields();
}, [selectedUser, selectedDocument]);


  /*
   * Load assignments whenever
   * user + document changes
   */
  useEffect(() => {
    if (!selectedUser || !selectedDocument) {
      setSelectedFields([]);
      setHasChanges(false);
      return;
    }

    loadUserFields(
      selectedUser,
      selectedDocument
    );
  }, [selectedUser, selectedDocument]);


  /*
   * Load user's existing fields
   */
  const loadUserFields = async (
    userCode: string,
    docType: string
  ) => {
    try {
      setIsLoadingAssignments(true);
      setHasChanges(false);

      const response =
        await getAllFields(
          userCode,
          docType
        );

      const data = Array.isArray(response)
        ? response
        : [];

      /*
       * Only Y permissions are enabled
       *
       * U_FieldKey = actual field name
       */
      const assignedKeys = data
        .filter((item: any) => {
          const allowed =
            item.U_IsAllowed ??
            item.IsAllowed ??
            item.Enabled ??
            item.enabled;

          return (
            String(allowed).toUpperCase() === "Y" ||
            allowed === true
          );
        })
        .map((item: any) => {
          return (
            item.U_FieldKey ??
            item.FieldKey ??
            item.FieldName ??
            ""
          );
        })
        .filter(
          (key: string) => key.trim() !== ""
        );

      setSelectedFields(
        Array.from(new Set(assignedKeys))
      );
    } catch (error) {
      console.error(
        "Failed to load user field assignments:",
        error
      );

      setSelectedFields([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };


  const accessibleMenus = filterMenusByAllowedModules(
    SERVER_MENUS,
    (user as any)?.allowedModules
  );

  const filteredMenus = accessibleMenus
  .map((menu) => ({
    ...menu,
    items: menu.items?.filter(
      (item) => item.allowFieldsAuth === true
    ),
  }))
  .filter(
    (menu) =>
      menu.items && menu.items.length > 0
  );

  const documents = useMemo(() => {
  return filteredMenus.flatMap(
    (menu) =>
      menu.items?.filter(
        (item) => item.allowFieldsAuth === true
      ) ?? []
  );
}, [filteredMenus]);


  const selectedDocumentTitle = useMemo(() => {
    const item = documents.find(
      (item) => selectedDocument === resolveFieldAuthDocType(item)
    );

    return item?.title ?? "";
  }, [documents, selectedDocument]);

  const filteredUsers = useMemo(() => {
    const value = userSearch.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(value) ||
        String(u.empId ?? "").toLowerCase().includes(value)
    );
  }, [users, userSearch]);


  const selectedUserName = useMemo(() => {
    const found = users.find(
      (u) => String(u.empId ?? "") === selectedUser
    );

    return found?.fullName ?? selectedUser;
  }, [users, selectedUser]);


  /*
   * Selected document fields
   */
  const documentFields = useMemo(() => {
    if (!selectedDocument) {
      return [];
    }

    return allFields.filter((field) => {
      const fieldDocType =
        String(field.U_DocType ?? "");

      return (
        fieldDocType ===
        String(selectedDocument)
      );
    });
  }, [
    allFields,
    selectedDocument,
  ]);


  /*
   * Search
   */
  const filteredFields = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return documentFields;
    }

    return documentFields.filter(
      (field) =>
        field.FieldName
          .toLowerCase()
          .includes(value) ||
        field.FieldTitle
          ?.toLowerCase()
          .includes(value)
    );
  }, [
    documentFields,
    search,
  ]);


  /*
   * Group fields
   */
  const fieldGroups = useMemo(() => {
    const groups: Record<
      string,
      FieldGroup
    > = {
      H: {
        type: "H",
        title: "Header Fields",
        fields: [],
      },

      L: {
        type: "L",
        title: "Line Fields",
        fields: [],
      },

      F: {
        type: "F",
        title: "Footer Fields",
        fields: [],
      },
    };

    filteredFields.forEach((field) => {
      const type =
        String(field.U_FieldType ?? "")
          .toUpperCase();

      if (type === "H") {
        groups.H.fields.push(field);
      } else if (type === "L") {
        groups.L.fields.push(field);
      } else if (type === "F") {
        groups.F.fields.push(field);
      }
    });

    return Object.values(groups).filter(
      (group) =>
        group.fields.length > 0
    );
  }, [filteredFields]);


  /*
   * Field enabled
   */
  const isFieldEnabled = (
    fieldKey: string
  ) => {
    return selectedFields.includes(
      fieldKey
    );
  };


  /*
   * Toggle single field
   */
  const toggleField = (
    fieldKey: string
  ) => {
    setHasChanges(true);

    setSelectedFields((current) => {
      if (
        current.includes(fieldKey)
      ) {
        return current.filter(
          (key) => key !== fieldKey
        );
      }

      return [
        ...current,
        fieldKey,
      ];
    });
  };


  /*
   * Group status
   */
  const getGroupStatus = (
    group: FieldGroup
  ) => {
    if (
      group.fields.length === 0
    ) {
      return {
        enabled: false,
        partial: false,
      };
    }

    const enabledCount =
      group.fields.filter((field) =>
        isFieldEnabled(
          field.FieldName
        )
      ).length;

    return {
      enabled:
        enabledCount ===
        group.fields.length,

      partial:
        enabledCount > 0 &&
        enabledCount <
          group.fields.length,
    };
  };


  /*
   * Toggle whole group
   */
  const toggleGroup = (
    group: FieldGroup,
    enabled: boolean
  ) => {
    setHasChanges(true);

    const groupKeys =
      group.fields.map(
        (field) =>
          field.FieldName
      );

    setSelectedFields(
      (current) => {
        if (enabled) {
          return Array.from(
            new Set([
              ...current,
              ...groupKeys,
            ])
          );
        }

        return current.filter(
          (key) =>
            !groupKeys.includes(key)
        );
      }
    );
  };


  /*
   * Enabled fields count
   */
  const enabledFields =
    allFields.filter((field) =>
      selectedFields.includes(
        field.FieldName
      )
    );


  /*
   * Save
   */
const handleSave = async () => {
  if (!selectedUser || !selectedDocument) {
    toast.error("Please select a user and document.");
    return;
  }

  try {
    setIsSaving(true);

    const payload = {
      UserCode: selectedUser,
      DocType: selectedDocument,
      FieldKeys: selectedFields,
    };

    console.log("Saving field permissions:", payload);

    await assignUserFields(
      selectedUser,
      selectedDocument,
      selectedFields
    );

    setHasChanges(false);

    toast.success("Field permissions saved successfully.");
  } catch (error: any) {
    console.error("Failed to assign fields:", error);

    toast.error(
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Failed to assign fields."
    );
  } finally {
    setIsSaving(false);
  }
};


  /*
   * Reset
   */
  const handleReset = () => {
    if (
      !selectedUser ||
      !selectedDocument
    ) {
      return;
    }

    loadUserFields(
      selectedUser,
      selectedDocument
    );
  };


  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      <header className="flex h-14 items-center justify-between border-b px-6 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Field Access
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500">
            Enabled Fields
            <span className="ml-1.5 text-slate-900">
              {enabledFields.length}
            </span>
          </div>

          <Button
            onClick={handleSave}
            disabled={
              !selectedUser ||
              !selectedDocument ||
              !hasChanges ||
              isSaving
            }
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-md px-6 shadow-sm"
          >
            <Save className="h-3.5 w-3.5 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
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
                    onClick={() => {
                      setSelectedUser(userCode);
                      setSelectedFields([]);
                      setHasChanges(false);
                    }}
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

        <main className="flex-1 bg-white flex flex-col overflow-hidden">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Users className="h-12 w-12 text-slate-100 mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Select an Identity
              </p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">
                    Field Access for {selectedUserName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select a document, then enable or disable its fields.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Popover open={isDocPickerOpen} onOpenChange={setIsDocPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-64 justify-between h-9 text-xs border-slate-200 font-medium"
                      >
                        <span className="truncate">
                          {selectedDocumentTitle || "Select document..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-72 p-0" align="end">
                      <Command>
                        <CommandInput
                          placeholder="Search documents..."
                          className="text-xs"
                        />
                        <CommandList>
                          <CommandEmpty className="py-4 text-center text-xs text-slate-400">
                            No documents found.
                          </CommandEmpty>

                          {filteredMenus.map((menu) => (
                            <CommandGroup key={menu.id} heading={menu.title}>
                              {menu.items?.map((item) => {
                                const docType = resolveFieldAuthDocType(item);

                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={item.title}
                                    onSelect={() => {
                                      setSelectedDocument(docType);
                                      setSelectedFields([]);
                                      setHasChanges(false);
                                      setIsDocPickerOpen(false);
                                    }}
                                  >
                                    {selectedDocument === docType && (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    {item.title}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="relative w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search fields..."
                      className="pl-9 h-9 text-xs border-slate-200"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {!selectedDocument ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <FileText className="h-10 w-10 text-slate-100 mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Select a Document
                    </p>
                  </div>
                ) : isLoadingFields || isLoadingAssignments ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Loading fields...
                    </p>
                  </div>
                ) : documentFields.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <FileText className="h-10 w-10 text-slate-100 mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      No Fields Found
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      No fields are configured for this document.
                    </p>
                  </div>
                ) : fieldGroups.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      No Matches
                    </p>
                  </div>
                ) : (
                  <div className="max-w-5xl mx-auto space-y-4">
                    {fieldGroups.map((group) => {
                      const status = getGroupStatus(group);

                      return (
                        <div
                          key={group.type}
                          className="border rounded-xl overflow-hidden bg-white"
                        >
                          <div className="flex items-center justify-between border-b bg-slate-50/30 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center">
                                <FileText className="h-4 w-4 text-slate-400" />
                              </div>

                              <div>
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                  {group.title}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {group.fields.length} fields
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                {status.enabled
                                  ? "All enabled"
                                  : status.partial
                                  ? "Partially enabled"
                                  : "Disabled"}
                              </span>

                              <Switch
                                checked={status.enabled}
                                onCheckedChange={(checked) =>
                                  toggleGroup(group, checked)
                                }
                              />
                            </div>
                          </div>

                          <div className="divide-y">
                            {group.fields.map((field) => {
                              const fieldEnabled = isFieldEnabled(
                                field.FieldName
                              );

                              return (
                                <div
                                  key={field.FieldName}
                                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="truncate text-xs font-bold text-slate-700">
                                        {field.FieldTitle || field.FieldName}
                                      </p>

                                      {fieldEnabled && (
                                        <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                      )}
                                    </div>

                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                      {field.FieldName}
                                    </p>
                                  </div>

                                  <Switch
                                    checked={fieldEnabled}
                                    onCheckedChange={() =>
                                      toggleField(field.FieldName)
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedUser && selectedDocument && hasChanges && (
                <div className="border-t bg-slate-50/50 px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Unsaved changes
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Save your changes to update field permissions.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSaving}
                    className="h-8 text-xs"
                  >
                    Reset
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Search,
  ShieldCheck,
  User,
  Save,
  FileText,
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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {SERVER_MENUS} from "@/lib/menu-data";
import { Switch } from "@/components/ui/switch";

import {
  DocumentType,
} from "@/types/master/DocumentType";

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

  const [hasChanges, setHasChanges] = useState(false);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const [isLoadingFields, setIsLoadingFields] = useState(false);

  const [isLoadingAssignments, setIsLoadingAssignments] =
    useState(false);

  const [isSaving, setIsSaving] = useState(false);


  /*
   * Company
   */
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
  // useEffect(() => {
  //   const loadFields = async () => {
  //     try {
  //       setIsLoadingFields(true);

  //       const response = await getAllFields(selectedUser, selectedDocument);

  //       const data = Array.isArray(response)
  //         ? response.map(normalizeField)
  //         : [];

  //       setAllFields(data);
  //     } catch (error) {
  //       console.error("Failed to load fields:", error);
  //       setAllFields([]);
  //     } finally {
  //       setIsLoadingFields(false);
  //     }
  //   };

  //   loadFields();
  // }, []);
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


  /*
   * Documents
   */
  console.log("SERVER_MENUS:", SERVER_MENUS);
  const filteredMenus = SERVER_MENUS
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
  console.log("Filtered Menus:", filteredMenus);
  // const documents = useMemo(() => {
  //   return Object.entries(filteredMenus).filter(
  //     ([key, value]) =>
  //       typeof value === "number" ||
  //       !isNaN(Number(value))
  //   );
  // }, []);
  const documents = useMemo(() => {
  return filteredMenus.flatMap(
    (menu) =>
      menu.items?.filter(
        (item) => item.allowFieldsAuth === true
      ) ?? []
  );
}, [filteredMenus]);

console.log("Documents:", documents);


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
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D0D0D]">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold">
                  Field Access Management
                </h1>

                <p className="text-sm text-muted-foreground">
                  Manage user access to document fields
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border px-3 py-2 text-sm">
              Enabled Fields:
              <span className="ml-2 font-semibold">
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
              className="bg-[#0D0D0D] text-white hover:bg-[#0D0D0D]/90"
            >
              <Save className="mr-2 h-4 w-4" />

              {isSaving
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </div>


        {/* Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              Access Configuration
            </CardTitle>

            <CardDescription>
              Select a user and document to manage field permissions.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">

              {/* User */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  User
                </label>

                <Select
                  value={selectedUser}
                  onValueChange={(value) => {
                    setSelectedUser(value);
                    setSelectedFields([]);
                    setHasChanges(false);
                  }}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />

                      <SelectValue
                        placeholder={
                          isLoadingUsers
                            ? "Loading users..."
                            : "Select user"
                        }
                      />
                    </div>
                  </SelectTrigger>

                  <SelectContent>
                    {users.map((u: any) => {

                      /*
                       * Actual SAP user code.
                       *
                       * Prefer UserCode / userCode.
                       * Fallback to empId if your API
                       * already returns Dev01 there.
                       */
                      const userCode = String(
                        u.userCode ??
                        u.UserCode ??
                        u.empId ??
                        u.EmpId ??
                        ""
                      );

                      const fullName =
                        u.fullName ??
                        u.FullName ??
                        u.userName ??
                        u.UserName ??
                        userCode;

                      if (!userCode) {
                        return null;
                      }

                      return (
                        <SelectItem
                          key={userCode}
                          value={userCode}
                        >
                          <div className="flex flex-col">
                            <span>
                              {fullName}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {userCode}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>


              {/* Document */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Document
                </label>

                <Select
                  value={selectedDocument}
                  onValueChange={(value) => {
                    setSelectedDocument(value);
                    setSelectedFields([]);
                    setHasChanges(false);
                  }}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />

                      <SelectValue placeholder="Select document" />
                    </div>
                  </SelectTrigger>

                  <SelectContent>
                    {documents.map((item) => (
    <SelectItem
      key={item.id}
      value={String(item.objectCode)}
    >
      {item.title}
    </SelectItem>
  ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>


        {/* Fields */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <CardTitle>
                  Document Fields
                </CardTitle>

                <CardDescription>
                  Enable or disable individual fields for the selected user.
                </CardDescription>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search fields..."
                  className="pl-9"
                />
              </div>

            </div>
          </CardHeader>


          <CardContent>

            {!selectedUser ||
            !selectedDocument ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

                  <p className="font-medium">
                    Select user and document
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a user and document to view available fields.
                  </p>
                </div>
              </div>
            ) : isLoadingFields ||
              isLoadingAssignments ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-sm text-muted-foreground">
                  Loading fields...
                </div>
              </div>
            ) : documentFields.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

                  <p className="font-medium">
                    No fields found
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    No fields are configured for this document.
                  </p>
                </div>
              </div>
            ) : fieldGroups.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No fields match your search.
                </p>
              </div>
            ) : (
              <div className="space-y-6">

                {fieldGroups.map(
                  (group) => {
                    const status =
                      getGroupStatus(group);

                    return (
                      <div
                        key={group.type}
                        className="overflow-hidden rounded-lg border"
                      >

                        {/* Group Header */}
                        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">

                          <div className="flex items-center gap-3">

                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background border">
                              <FileText className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="font-medium">
                                {group.title}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {group.fields.length} fields
                              </p>
                            </div>

                          </div>


                          <div className="flex items-center gap-3">

                            <span className="text-xs text-muted-foreground">
                              {status.enabled
                                ? "All enabled"
                                : status.partial
                                ? "Partially enabled"
                                : "Disabled"}
                            </span>

                            <Switch
                              checked={
                                status.enabled
                              }
                              onCheckedChange={(
                                checked
                              ) =>
                                toggleGroup(
                                  group,
                                  checked
                                )
                              }
                            />

                          </div>
                        </div>


                        {/* Fields */}
                        <div className="divide-y">

                          {group.fields.map(
                            (field) => {
                              const fieldEnabled =
                                isFieldEnabled(
                                  field.FieldName
                                );

                              return (
                                <div
                                  key={
                                    field.FieldName
                                  }
                                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"
                                >

                                  <div className="min-w-0">

                                    <div className="flex items-center gap-2">

                                      <p className="truncate text-sm font-medium">
                                        {field.FieldTitle ||
                                          field.FieldName}
                                      </p>

                                      {fieldEnabled && (
                                        <Check className="h-4 w-4 shrink-0" />
                                      )}

                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {field.FieldName}
                                    </p>

                                  </div>


                                  <Switch
                                    checked={
                                      fieldEnabled
                                    }
                                    onCheckedChange={() =>
                                      toggleField(
                                        field.FieldName
                                      )
                                    }
                                  />

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </CardContent>
        </Card>


        {/* Footer */}
        {selectedUser &&
          selectedDocument &&
          hasChanges && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">

              <div>
                <p className="text-sm font-medium">
                  Unsaved changes
                </p>

                <p className="text-xs text-muted-foreground">
                  Save your changes to update field permissions.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                Reset
              </Button>

            </div>
          )}

      </div>
    </div>
  );
}


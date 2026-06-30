"use client";

import { useEffect, useState } from "react";
import { Trash2, Check, Settings2, Folder, FileText, Save, File, Edit3Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext"; 

import { 
  getReports, 
  getLayouts, 
  updateComponent,
  deleteComponent,
  ReportData 
} from "@/api+/sap/reporting/reportingService"; 

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getModules } from "@/api+/sap/authorization/authorizationService";
import { SERVER_MENUS } from "@/lib/menu-data";
import { toast } from "sonner";
import { ConfirmationModal } from "@/modals/ConfirmationModal";

const toDocType = (value?: string): "Layout" | "Report" =>
  String(value ?? "").trim().toLowerCase() === "layout" ? "Layout" : "Report";

export default function ReportManagementPage() {
  const { user } = useAuth(); 
  const [activeTab, setActiveTab] = useState<"layout" | "report">("layout");
  
  const [modules, setModules] = useState<any[]>([]); 
  const [selectedObjectCode, setSelectedObjectCode] = useState<string>("");
  const [layouts, setLayouts] = useState<ReportData[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<{
    id: string; 
    title: string;
    type: "Layout" | "Report";
    docType: "Layout" | "Report";
    isDefault?: boolean;
    objectCode?: string;
  } | null>(null);

  const [modalObjectCode, setModalObjectCode] = useState<string>("");
  const [modalDocType, setModalDocType] = useState<"Layout" | "Report">("Layout");
  const [modalIsDefault, setModalIsDefault] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    async function fetchModules() {
      try {
        setLoading(true);
        const response = await getModules(user?.companyDB || "");
        
        if (Array.isArray(response)) {
          const reportingMenus: any[] = [];
          
          const extractReportingItems = (items: any[]) => {
            items.forEach((item) => {
              if (item.isReporting) {
                reportingMenus.push(item);
              }
              if (item.items) {
                extractReportingItems(item.items);
              }
            });
          };
          
          extractReportingItems(SERVER_MENUS);

          const filtered = reportingMenus.filter((menuItem) =>
            response.some((res: any) => String(res.modules) === String(menuItem.id))
          );

          setModules(filtered);
        } else {
          setModules([]);
        }
      } catch (error) {
        console.error("Error fetching authorization modules:", error);
        setModules([]);
      } finally {
        setLoading(false);
      }
    }
    fetchModules();
  }, [user?.companyDB]);

  useEffect(() => {
    async function fetchImportedReports() {
      if (!user?.empId) return;
      try {
        setLoading(true);
        const data = await getReports(user.empId);
        
        if (Array.isArray(data)) {
          const filteredReports = data.filter(
            item => String(item.U_DocType ?? "").toLowerCase() === "report"
          );
          setReports(filteredReports);
        } else {
          setReports([]);
        }
      } catch (error) {
        console.error("Error fetching reports from API:", error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }

    if (activeTab === "report") {
      fetchImportedReports();
    }
  }, [user?.empId, activeTab]);

  useEffect(() => {
    if (!selectedObjectCode || activeTab !== "layout") return;

    async function fetchImportedLayouts() {
      setLoading(true);
      try {
        const data = await getLayouts(selectedObjectCode);
        setLayouts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching layouts from API:", error);
        setLayouts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchImportedLayouts();
  }, [selectedObjectCode, activeTab]);

  const refreshCurrentList = async () => {
    if (activeTab === "layout" && selectedObjectCode) {
      const data = await getLayouts(selectedObjectCode);
      setLayouts(Array.isArray(data) ? data : []);
    } else if (activeTab === "report" && user?.empId) {
      const data = await getReports(user.empId);
      if (Array.isArray(data)) {
        setReports(data.filter(item => String(item.U_DocType ?? "").toLowerCase() === "report"));
      } else {
        setReports([]);
      }
    }
  };

  const handleUpdateComponent = async () => {
    if (!editingItem) return;
    try {
      setUpdating(true);
      
      const targetObjectCode = modalDocType === "Report" ? "" : modalObjectCode;
      const targetIsDefault = modalDocType === "Report" ? "N" : (modalIsDefault ? "Y" : "N");

      await updateComponent({
        Code: editingItem.id,
        Type: modalDocType,
        ObjectCode: targetObjectCode,
        IsDefault: targetIsDefault,
        CompanyDB: user?.companyDB || ""
      });
      
      if (editingItem.type !== modalDocType) {
        if (editingItem.type === "Layout") {
          setLayouts(prev => prev.filter(l => l.Code !== editingItem.id && l.U_ReportCode !== editingItem.id));
        } else {
          setReports(prev => prev.filter(r => r.Code !== editingItem.id && r.U_ReportCode !== editingItem.id));
        }
      } else {
        if (modalDocType === "Layout") {
          if (targetObjectCode !== selectedObjectCode) {
            setLayouts(prev => prev.filter(l => l.Code !== editingItem.id && l.U_ReportCode !== editingItem.id));
          } else {
            setLayouts(prev => prev.map(l => {
              const isTarget = l.Code === editingItem.id || l.U_ReportCode === editingItem.id;
              return {
                ...l,
                U_IsDefault: isTarget ? targetIsDefault : (targetIsDefault === "Y" ? "N" : l.U_IsDefault)
              };
            }));
          }
        } else {
          setReports(prev => prev.map(r => {
            const isTarget = r.Code === editingItem.id || r.U_ReportCode === editingItem.id;
            return isTarget ? { ...r, U_ObjectCode: targetObjectCode } : r;
          }));
        }
      }
      
      toast.success("Configuration Updated");
      setIsModalOpen(false);

      await refreshCurrentList();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update component settings.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;

    const itemCode = editingItem.id;
    const deleteType = editingItem.docType;
    if (!itemCode) return;

    try {
      setDeleting(true);
      await deleteComponent(itemCode, deleteType, user?.companyDB || "");
      setDeleteConfirmOpen(false);
      setIsModalOpen(false);
      setEditingItem(null);
      toast.success(`${deleteType} deleted successfully`);
      await refreshCurrentList();
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error(error instanceof Error ? error.message : `Failed to delete ${deleteType}.`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen text-zinc-900 font-sans antialiased">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Import Configuration Panel</h1>
          <p className="text-sm text-zinc-500">Manage live system setups for imported templates and components.</p>
        </div>

        <div className="flex border-b border-zinc-200 gap-4">
          <button
            onClick={() => setActiveTab("layout")}
            className={cn(
              "pb-3 text-sm font-medium transition-all relative px-1 flex items-center gap-2 border-b-2",
              activeTab === "layout" ? "text-zinc-900 border-zinc-900 font-semibold" : "text-zinc-500 border-transparent hover:text-zinc-900"
            )}
          >
            <File size={16} /> Imported Layouts
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={cn(
              "pb-3 text-sm font-medium transition-all relative px-1 flex items-center gap-2 border-b-2",
              activeTab === "report" ? "text-zinc-900 border-zinc-900 font-semibold" : "text-zinc-500 border-transparent hover:text-zinc-900"
            )}
          >
            <FileText size={16} /> Imported Reports
          </button>
        </div>

        {activeTab === "layout" ? (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <label className="text-sm font-medium text-zinc-700 shrink-0">Select Target Module:</label>
              <div className="w-full sm:w-72">
                <Select value={selectedObjectCode} onValueChange={setSelectedObjectCode}>
                  <SelectTrigger className="w-full bg-white border-zinc-200 text-zinc-900 focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400">
                    <SelectValue placeholder="Select a module..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                    {Array.isArray(modules) && modules.map((m, index) => {
                      const value = String(m.objectCode || m.code || m.Code || "");
                      const label = String(m.name || m.title || m.Name || "Unnamed Module");
                      return (
                        <SelectItem key={value || index} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!selectedObjectCode ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 rounded-lg text-zinc-400 text-sm bg-zinc-50/50">
                Please select a target module object code from the dropdown above to fetch its layouts.
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-zinc-500 text-sm animate-pulse">Fetching system layouts...</div>
            ) : layouts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-lg bg-zinc-50/20">
                No imported layouts found matching this object module.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {layouts.map((layout, index) => {
                  const itemUniqueId = String(layout.Code ?? layout.U_ReportCode ?? `layout-${index}`);
                  const isItemDefault = layout.U_IsDefault === "Y";

                  return (
                    <div key={itemUniqueId} className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between hover:border-zinc-300 shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 rounded-md text-zinc-600">
                          <File size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900">{layout.U_FileName || layout.Name || "Unnamed Layout"}</h4>
                          {isItemDefault && (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-zinc-900 text-white font-medium px-2 py-0.5 rounded-md mt-1">
                              <Check size={10} /> Default Layout
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingItem({ 
                            id: itemUniqueId, 
                            title: layout.U_FileName || layout.Name || "Untitled Layout", 
                            type: "Layout",
                            docType: "Layout",
                            isDefault: isItemDefault,
                            objectCode: selectedObjectCode
                          });
                          setModalObjectCode(selectedObjectCode);
                          setModalDocType("Layout");
                          setModalIsDefault(isItemDefault);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-md border border-transparent hover:border-zinc-200 transition-all"
                      >
                        <Edit3Icon size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-zinc-500 text-sm animate-pulse">Fetching global reports records...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 rounded-lg text-zinc-400 text-sm bg-zinc-50/50">
                No imported dashboard analytical reports available at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reports.map((report, index) => {
                  const reportUniqueId = String(report.Code ?? report.U_ReportCode ?? `report-${index}`);

                  return (
                    <div key={reportUniqueId} className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between hover:border-zinc-300 shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 rounded-md text-zinc-600">
                          <FileText size={18} />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-900">{report.U_FileName || report.Name || "Unnamed Report"}</h4>
                      </div>
                      <button
                        onClick={() => {
                          const currentObjCode = (report as any).U_ObjectCode || "";
                          setEditingItem({ 
                            id: reportUniqueId, 
                            title: report.U_FileName || report.Name || "Untitled Report", 
                            type: "Report",
                            docType: toDocType(report.U_DocType as string),
                            isDefault: false,
                            objectCode: currentObjCode
                          });
                          setModalObjectCode(currentObjCode);
                          setModalDocType("Report");
                          setModalIsDefault(false);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-md border border-transparent hover:border-zinc-200 transition-all"
                      >
                        <Settings2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {isModalOpen && editingItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white border border-zinc-200 rounded-lg w-full max-w-md overflow-hidden shadow-lg animate-in zoom-in-95 duration-150">
              
              <div className="p-5 border-b border-zinc-100 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400">
                    Configuration Actions
                  </span>
                  <h3 className="text-base font-semibold text-zinc-900 break-words">{editingItem.title}</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 text-sm transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-5">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Modify the target schema layout parameters or permanently delete this configuration module.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Document Type:</label>
                  <Select value={modalDocType} onValueChange={(val: "Layout" | "Report") => setModalDocType(val)}>
                    <SelectTrigger className="w-full bg-white border-zinc-200 text-zinc-900 focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 text-xs h-9">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                      <SelectItem value="Layout" className="text-xs">Layout</SelectItem>
                      <SelectItem value="Report" className="text-xs">Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {modalDocType === "Layout" && (
                  <>
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-xs font-semibold text-zinc-700 block">Change Target Document / Module:</label>
                      <Select value={modalObjectCode} onValueChange={setModalObjectCode}>
                        <SelectTrigger className="w-full bg-white border-zinc-200 text-zinc-900 focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 text-xs h-9">
                          <SelectValue placeholder="Select a new document module..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                          {Array.isArray(modules) && modules.map((m, index) => {
                            const value = String(m.objectCode || m.code || m.Code || "");
                            const label = String(m.name || m.title || m.Name || "Unnamed Module");
                            return (
                              <SelectItem key={value || index} value={value} className="text-xs">
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
                      <input 
                        type="checkbox" 
                        id="modalDefaultCheckbox"
                        checked={modalIsDefault}
                        onChange={(e) => setModalIsDefault(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 accent-zinc-900 cursor-pointer"
                      />
                      <label htmlFor="modalDefaultCheckbox" className="text-xs font-medium text-zinc-700 cursor-pointer select-none">
                        Set as Module Default Layout
                      </label>
                    </div>
                  </>
                )}

                <div className="border-t border-zinc-100 pt-3">
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={deleting}
                    className="w-full flex items-center justify-center gap-2 text-xs font-medium h-9 px-4 rounded-md bg-white text-red-600 hover:bg-red-50 border border-red-200 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Delete {editingItem.docType}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  disabled={updating}
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 bg-white rounded-md hover:bg-zinc-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={updating}
                  onClick={handleUpdateComponent}
                  className="h-9 px-4 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Save size={14} />
                  {updating ? "Updating..." : "Update Settings"}
                </button>
              </div>

            </div>
          </div>
        )}

        {editingItem && (
          <ConfirmationModal
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title={`Delete ${editingItem.docType}?`}
            description={`Are you sure you want to permanently delete "${editingItem.title}"? This action cannot be undone.`}
            cancelText="Cancel"
            confirmText={deleting ? "Deleting..." : "Delete"}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirmOpen(false)}
          />
        )}

      </div>
    </div>
  );
}
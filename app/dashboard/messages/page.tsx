"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { SAPMessage, getMyAlerts, PAGE_SIZE } from "@/api+/sap/notification";
import apiClient from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail, MailOpen, AlertOctagon, Info, Paperclip,
  Trash2, CornerUpRight, Reply, CheckCircle, RefreshCw,
  FolderOpen, ArrowRight, ArrowUpRight, XCircle, Clock, ThumbsUp, User2, FileText, Calendar
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { DRAFT_OBJECT_TYPES } from "@/types/master/DocumentType";
import { buildDocumentUrl, getMenuInfoByObjectCode } from "@/lib/menu-lookup";
import { stageDocNavParams } from "@/lib/docNavParams";

interface PendingApproval {
  ApprovalRequestCode: number;
  ObjectType: string;
  ObjectEntry: number;
  DraftEntry: number;
  Status: string;
  Remarks: string;
  ApprovalCreationDate: string;
  OriginatorID: number;
  CurrentStage: number;
}

const getPendingApprovals = async (): Promise<PendingApproval[]> => {
  try {
    const res = await apiClient.get("api/Notifications/GetPendingApprovals");
    const data = res.data as any;
    if (data?.value && Array.isArray(data.value)) return data.value;
    if (Array.isArray(data)) return data;
    if (data?.ApprovalRequests && Array.isArray(data.ApprovalRequests)) return data.ApprovalRequests;
    return [];
  } catch {
    return [];
  }
};

export default function MessagesOverviewPage() {
  const { messages: contextMessages, isLoading, refreshNotifications, clearUnread } = useNotifications();
  const [messages, setMessages] = useState<SAPMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SAPMessage | null>(null);
  const [activeTab, setActiveTab] = useState<string>("inbox");
  const [hasMore, setHasMore] = useState(false);
  const [nextSkip, setNextSkip] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const router = useRouter();

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const timeA = a.ApprovalCreationDate ? new Date(a.ApprovalCreationDate).getTime() : 0;
      const timeB = b.ApprovalCreationDate ? new Date(b.ApprovalCreationDate).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      const codeA = Number(a.MessageCode || a.ApprovalRequestCode || 0);
      const codeB = Number(b.MessageCode || b.ApprovalRequestCode || 0);
      return codeB - codeA;
    });
  }, [messages]);

  const sortedPendingApprovals = useMemo(() => {
    return [...pendingApprovals].sort((a, b) => {
      const timeA = a.ApprovalCreationDate ? new Date(a.ApprovalCreationDate).getTime() : 0;
      const timeB = b.ApprovalCreationDate ? new Date(b.ApprovalCreationDate).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      const codeA = Number(a.ApprovalRequestCode || 0);
      const codeB = Number(b.ApprovalRequestCode || 0);
      return codeB - codeA;
    });
  }, [pendingApprovals]);

  useEffect(() => {
    setMessages(contextMessages);
    setHasMore(contextMessages.length === PAGE_SIZE);
    setNextSkip(PAGE_SIZE);
  }, [contextMessages]);

  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  useEffect(() => {
    if (sortedMessages.length > 0 && !selectedMessage) {
      setSelectedMessage(sortedMessages[0]);
    }
  }, [sortedMessages, selectedMessage]);

  const fetchPendingApprovals = async () => {
    setIsLoadingApprovals(true);
    try {
      const data = await getPendingApprovals();
      setPendingApprovals(data);
    } catch {
      toast.error("Failed to load pending approvals");
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  useEffect(() => {
    void fetchPendingApprovals();
  }, []);

  const handleRefresh = async () => {
    const ok = await refreshNotifications();
    await fetchPendingApprovals();
    if (ok) {
      toast.success("Messages refreshed successfully");
    } else {
      toast.error("Failed to refresh messages. Please try again.");
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    setIsApproving(true);
    try {
      await apiClient.patch(`api/Approval/ApprovalRequests/${selectedApproval.ApprovalRequestCode}/approve`, {
        Remarks: approveRemarks || "Approved"
      });
      toast.success(`Approval request #${selectedApproval.ApprovalRequestCode} approved successfully!`);
      setApproveDialogOpen(false);
      setApproveRemarks("");
      setSelectedApproval(null);
      await fetchPendingApprovals();
    } catch (err: any) {
      toast.error(err?.response?.data?.Message || "Failed to approve request");
    } finally {
      setIsApproving(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await getMyAlerts(nextSkip);
      setMessages(prev => [...prev, ...page.messages]);
      setHasMore(page.hasMore);
      setNextSkip(page.nextSkip);
    } catch {
      toast.error("Failed to load more messages");
    } finally {
      setLoadingMore(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "pr_High":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5">
            <AlertOctagon className="h-3 w-3" /> High
          </Badge>
        );
      case "pr_Low":
        return (
          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 flex items-center gap-1 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5">
            <Info className="h-3 w-3" /> Low
          </Badge>
        );
      case "pr_Normal":
      default:
        return (
          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200/50 flex items-center gap-1 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5">
            <CheckCircle className="h-3 w-3" /> Normal
          </Badge>
        );
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "pr_High":
        return <AlertOctagon className="h-4 w-4 text-red-500 shrink-0" />;
      case "pr_Low":
        return <Info className="h-4 w-4 text-slate-400 shrink-0" />;
      case "pr_Normal":
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case "arsApproved":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200/50 flex items-center gap-1 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5">
            <CheckCircle className="h-3 w-3" /> Approved
          </Badge>
        );
      case "arsRejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case "arsPending":
        return (
          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200/50 flex items-center gap-1 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const getObjectName = (type: string) => {
      const menuInfo = getMenuInfoByObjectCode(type);
      return menuInfo?.title || `Draft (${type})`;
    };

  const documentLink = useMemo(() => {
    if (!selectedMessage) return null;

    const objectEntry = selectedMessage.ObjectEntry?.toString().trim();
    const draftEntry = selectedMessage.DraftEntry?.toString().trim();
    const objectType = selectedMessage.ObjectType;
    const sourceDraftNumber = selectedMessage.SourceDraftNumber;
    const approvalRequestCode = selectedMessage.ApprovalRequestCode;

    if (objectEntry) {
      return { objectType, objectEntry, draftEntry: undefined, isDraft: false, sourceDraftNumber, approvalRequestCode };
    }
    if (draftEntry) {
      return { objectType, objectEntry: undefined, draftEntry, isDraft: true, sourceDraftNumber, approvalRequestCode };
    }

    return null;

  }, [selectedMessage]);

  const handleDocumentLinkClick = (link: {
    objectType: string;
    objectEntry?: string;
    draftEntry?: string;
    isDraft: boolean;
    sourceDraftNumber?: number | null;
    approvalRequestCode?: number ; 
  }) => {
    const key = (link.isDraft ? link.draftEntry : link.objectEntry)?.toString().trim().split(/\s+/)[0];

    if (!key) {
      toast.error("Invalid SAP document key");
      return;
    }

    const menuInfo = getMenuInfoByObjectCode(link.objectType);
    if (!menuInfo) {
      toast.warning(`${getObjectName(link.objectType)} route not configured`);
      return;
    }

    const url = buildDocumentUrl(menuInfo.url, {
      objectType: link.objectType,
      objectEntry: link.isDraft
        ? undefined
        : (link.sourceDraftNumber ? String(link.sourceDraftNumber) : link.objectEntry),
      draftEntry: link.draftEntry,
      isDraft: link.isDraft,
      approvalRequestCode: link.approvalRequestCode,
      approvalStatus: selectedMessage?.ApprovalStatus
    });

    // Keep the document params out of the browser URL - they are carried internally
    // via sessionStorage and re-joined on the target page (also survives a refresh).
    const cleanPath = url.split("?")[0];
    stageDocNavParams(cleanPath, {
      draftEntry: link.draftEntry,
      docEntry: link.isDraft
        ? undefined
        : (link.sourceDraftNumber ? String(link.sourceDraftNumber) : link.objectEntry),
      docType: link.isDraft ? String(link.objectType) : undefined,
      draft: link.isDraft ? "1" : undefined,
      approvalRequestCode: link.approvalRequestCode ? String(link.approvalRequestCode) : undefined,
      approvalStatus: selectedMessage?.ApprovalStatus,
    });

    router.push(cleanPath);
  };
  
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd.MM.yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Messages & Alerts</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time messages and notifications from SAP Business One Workflow & Approvals.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9 rounded-lg"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Side: Tabs + Table List */}
        <Card className="lg:col-span-7 flex flex-col min-h-0 bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-4 pt-4 border-b border-slate-100 flex items-center justify-between">
              <TabsList className="bg-neutral-900 p-1 gap-1 rounded-lg h-9 border border-neutral-800">
                <TabsTrigger
                  value="inbox"
                  className="rounded-md font-bold text-[10px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400 data-[state=active]:shadow-sm"
                >
                  Inbox
                  {messages.length > 0 && (
                    <span className="ml-1.5 text-[9px] bg-neutral-800 text-neutral-200 rounded-full px-1.5 py-0.5 font-bold">
                      {messages.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="approvals"
                  className="rounded-md font-bold text-[10px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400 data-[state=active]:shadow-sm"
                >
                  Pending Approvals
                  {pendingApprovals.length > 0 && (
                    <span className="ml-1.5 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-1.5 py-0.5 font-bold">
                      {pendingApprovals.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="inbox" className="flex-1 flex flex-col min-h-0 m-0 border-0 outline-none">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Mail className="h-6 w-6 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">No notifications found</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Your inbox is clear. New messages and system approval alerts will appear here in real-time.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 w-full">
                    <div className="overflow-x-auto">
                    <Table className="w-full table-fixed">
                      <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[36px] text-center font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">!</TableHead>
                          <TableHead className="w-[45%] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Subject</TableHead>
                          <TableHead className="w-[22%] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Document</TableHead>
                          <TableHead className="w-[18%] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Status</TableHead>
                          <TableHead className="w-[15%] text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3 pr-4">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedMessages.map((msg) => {
                          const isSelected = selectedMessage?.MessageCode === msg.MessageCode;
                          const hasLinkedDoc = !!(msg.ObjectEntry?.toString().trim() || msg.DraftEntry?.toString().trim());
                          const isDraft = !!(msg.DraftEntry?.toString().trim() || !msg.ObjectEntry?.toString().trim());
                          let code = msg.ObjectType;
                          if (!code || String(code) === "112") {
                            code = msg.DraftType;
                          }
                          if (!code || String(code) === "112") {
                            code = msg.ObjectType;
                          }
                          const menuInfo = code ? getMenuInfoByObjectCode(code) : undefined;
                          const docName = menuInfo?.title || (String(code) === "112" ? "Document" : `Document (${code || '112'})`);
                          return (
                            <TableRow
                              key={msg.MessageCode}
                              onClick={() => setSelectedMessage(msg)}
                              className={`cursor-pointer transition-colors border-b border-slate-100 hover:bg-slate-50/50 ${isSelected ? "bg-slate-50 font-medium" : ""}`}
                            >
                              <TableCell className="text-center py-3.5 pl-2 align-top">
                                <div className="flex justify-center">
                                  {getPriorityIcon(msg.Priority)}
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5 align-top">
                                <span className={`text-sm text-slate-900 leading-snug break-words whitespace-normal ${isSelected ? "font-semibold" : "font-normal"}`}>
                                  {msg.Subject}
                                </span>
                              </TableCell>
                              <TableCell className="py-3.5 align-top">
                                {hasLinkedDoc ? (
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                      <Paperclip className="h-3 w-3 shrink-0 text-orange-600" />
                                      {docName}
                                    </span>
                                    {isDraft && (
                                      <span className="text-[10px] text-slate-400 font-medium pl-4">
                                        Draft
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="py-3.5 align-top whitespace-nowrap">
                                {getApprovalStatusBadge(msg.ApprovalStatus)}
                              </TableCell>
                              <TableCell className="py-3.5 text-right text-[11px] text-slate-400 font-bold whitespace-nowrap pr-4 align-top">
                                {formatDate(msg.ApprovalCreationDate)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  </ScrollArea>
                  {hasMore && (
                    <div className="flex justify-center py-3 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 text-xs font-medium"
                      >
                        {loadingMore ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" />
                        )}
                        {loadingMore ? "Loading..." : "Load More"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="approvals" className="flex-1 flex flex-col min-h-0 m-0 border-0 outline-none">
              {isLoadingApprovals ? (
                <div className="flex-1 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <CheckCircle className="h-6 w-6 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">No pending approvals</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      All approval requests have been processed. New pending approvals will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 w-full overflow-x-auto">
                  <Table className="min-w-[580px]">
                    <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[80px] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Request #</TableHead>
                        <TableHead className="min-w-[120px] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Remarks</TableHead>
                        <TableHead className="w-[160px] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Document</TableHead>
                        <TableHead className="w-[100px] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Status</TableHead>
                        <TableHead className="w-[85px] text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3 pr-4">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPendingApprovals.map((ap) => {
                        const isSelected = selectedApproval?.ApprovalRequestCode === ap.ApprovalRequestCode;
                        const docTitle = getMenuInfoByObjectCode(ap.ObjectType)?.title || `Document (${ap.ObjectType})`;
                        return (
                          <TableRow
                            key={ap.ApprovalRequestCode}
                            onClick={() => setSelectedApproval(ap)}
                            className={`cursor-pointer transition-colors border-b border-slate-100 hover:bg-amber-50/40 ${isSelected ? "bg-amber-50" : ""}`}
                          >
                            <TableCell className="py-3 font-mono text-sm font-bold text-slate-700">#{ap.ApprovalRequestCode}</TableCell>
                            <TableCell className="py-3 text-xs text-slate-500 truncate max-w-[120px]">{ap.Remarks || "—"}</TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700">
                                  {docTitle}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Draft
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 whitespace-nowrap">
                              <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200/50 flex items-center gap-1 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5 w-fit">
                                <Clock className="h-3 w-3" /> Pending
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-right text-[11px] text-slate-400 font-bold whitespace-nowrap pr-4">
                              {ap.ApprovalCreationDate ? formatDate(ap.ApprovalCreationDate) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="lg:col-span-5 flex flex-col min-h-0 bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
          {activeTab === "approvals" ? (
            selectedApproval ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Approval Detail Header */}
                <div className="p-5 border-b border-slate-100 bg-amber-50/30 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-black text-slate-900 leading-tight">
                      Approval Request
                      <span className="ml-2 font-mono text-amber-600">#{selectedApproval.ApprovalRequestCode}</span>
                    </h2>
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center gap-1 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-400">Object Type:</span>
                      <span className="text-slate-800 font-bold">
                        {getMenuInfoByObjectCode(selectedApproval.ObjectType)?.title || `Type ${selectedApproval.ObjectType}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-right justify-end">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-400">Date:</span>
                      <span className="text-slate-800 font-bold">
                        {selectedApproval.ApprovalCreationDate ? formatDate(selectedApproval.ApprovalCreationDate) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-400">Originator:</span>
                      <span className="text-slate-800 font-bold">User #{selectedApproval.OriginatorID}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-right justify-end">
                      <span className="text-slate-400">Stage:</span>
                      <span className="text-slate-800 font-bold">#{selectedApproval.CurrentStage}</span>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <ScrollArea className="flex-1 p-5">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Request Remarks</h4>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        {selectedApproval.Remarks || "No remarks provided."}
                      </p>
                    </div>
                  </div>
                </ScrollArea>

                {/* Approve Action */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                  <Button
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-lg transition-colors shadow-sm"
                    onClick={() => { setApproveRemarks(""); setApproveDialogOpen(true); }}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Approve Request
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                  <ThumbsUp className="h-6 w-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Select a pending approval</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Click on any pending approval request to review details and take action.
                  </p>
                </div>
              </div>
            )
          ) : selectedMessage ? (
            <div className="flex-1 flex flex-col min-h-0">

              <div className="p-5 border-b border-slate-100 bg-slate-50/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedMessage.Subject}
                  </h2>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {getPriorityBadge(selectedMessage.Priority)}
                    {getApprovalStatusBadge(selectedMessage.ApprovalStatus)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs font-medium text-slate-500">
                  <div>
                    <span className="text-slate-400">Raised By:</span>{" "}
                    <span className="text-slate-900 font-bold">User #{selectedMessage.User}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Date:</span>{" "}
                    <span className="text-slate-900 font-bold">
                      {formatDate(selectedMessage.ApprovalCreationDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Code:</span>{" "}
                    <span className="text-slate-800 font-mono">#{selectedMessage.MessageCode}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Request:</span>{" "}
                    <span className="text-slate-800 font-mono">#{selectedMessage.ApprovalRequestCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Source Document #:</span>{" "}
                    <span className="text-slate-900 font-bold">
                      {selectedMessage.SourceDraftNumber ? `#${selectedMessage.SourceDraftNumber}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
                  <div className="text-sm leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                    {selectedMessage.Text || selectedMessage.ApprovalRemarks}
                  </div>

                  {/* Linked Document */}
                  {documentLink && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" /> Linked Document
                      </h4>
                      <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                        <Table>
                          <TableBody>
                            <TableRow className="hover:bg-slate-50/50">
                              <TableCell className="py-3">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">
                                    {getObjectName(documentLink.objectType)}
                                    {documentLink.isDraft && (
                                      <span className="ml-1.5 text-[9px] font-semibold text-amber-600 uppercase tracking-wide">
                                        (Draft)
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">
                                    Key: {documentLink.isDraft ? documentLink.draftEntry : documentLink.objectEntry}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-3 w-[80px]">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDocumentLinkClick(documentLink)}
                                  className="h-7 w-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                                  title="Open Document in SAP"
                                >
                                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <FolderOpen className="h-6 w-6 text-slate-300" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Select a message</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Click on any alert in the list to view its complete description and associated draft documents.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-emerald-600" />
              Approve Request #{selectedApproval?.ApprovalRequestCode}
            </DialogTitle>
            <DialogDescription>
              Add optional remarks before approving this request. This action will notify the originator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Approval Remarks</label>
            <Textarea
              placeholder="e.g. Approved by Manager — all conditions met."
              value={approveRemarks}
              onChange={(e) => setApproveRemarks(e.target.value)}
              className="resize-none min-h-[90px] text-sm"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={isApproving}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
            >
              {isApproving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
              {isApproving ? "Approving..." : "Confirm Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
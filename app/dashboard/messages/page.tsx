"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { SAPMessage, getMyAlerts, PAGE_SIZE } from "@/api+/sap/notification";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, MailOpen, AlertCircle, AlertOctagon, Info, Paperclip, 
  Trash2, CornerUpRight, Reply, LogOut, CheckCircle, RefreshCw,
  FolderOpen, ArrowRight, ArrowUpRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function MessagesOverviewPage() {
  const { messages: contextMessages, isLoading, refreshNotifications, clearUnread } = useNotifications();
  const [messages, setMessages] = useState<SAPMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SAPMessage | null>(null);
  const [activeTab, setActiveTab] = useState<string>("inbox");
  const [hasMore, setHasMore] = useState(false);
  const [nextSkip, setNextSkip] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  // Sync from context (first page)
  useEffect(() => {
    setMessages(contextMessages);
    setHasMore(contextMessages.length === PAGE_SIZE);
    setNextSkip(PAGE_SIZE);
  }, [contextMessages]);

  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  useEffect(() => {
    if (messages.length > 0 && !selectedMessage) {
      setSelectedMessage(messages[0]);
    }
  }, [messages, selectedMessage]);

  const handleRefresh = async () => {
    await refreshNotifications();
    toast.success("Messages refreshed successfully");
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

  // Parsing message links/documents for display
  const parsedLinks = useMemo(() => {
    if (!selectedMessage || !selectedMessage.MessageDataColumns) return [];
    
    const links: Array<{
      index: number;
      columnName: string;
      value: string;
      objectType: string;
      objectKey: string;
    }> = [];

    let idx = 1;
    selectedMessage.MessageDataColumns.forEach(col => {
      if (col.MessageDataLines) {
        col.MessageDataLines.forEach(line => {
          links.push({
            index: idx++,
            columnName: col.ColumnName,
            value: line.Value,
            objectType: line.Object,
            objectKey: line.ObjectKey
          });
        });
      }
    });

    return links;
  }, [selectedMessage]);

  const handleDocumentLinkClick = (link: any) => {
    // Determine the route if it's a draft or sales document
    // Object "122" is Drafts, Value often says e.g. "Sales Quotation based on draft no. 788"
    const isQuotation = link.value.toLowerCase().includes("quotation");
    const isOrder = link.value.toLowerCase().includes("order");
    const isDelivery = link.value.toLowerCase().includes("delivery");
    const isInvoice = link.value.toLowerCase().includes("invoice");

    const cleanKey = link.objectKey.trim().split(/\s+/)[0]; // Extract first key segment (DocEntry)

    if (link.objectType === "122") {
      // Drafts
      toast.info(`Opening Draft #${cleanKey} (Type: ${link.value})`, {
        description: "Draft view detail loading..."
      });
      // Route placeholders
      if (isQuotation) {
        // Quotation draft
        router.push(`/dashboard/sales/quotation?draft=${cleanKey}`);
      } else if (isOrder) {
        router.push(`/dashboard/sales/order?draft=${cleanKey}`);
      } else {
        toast.warning("Routing for this draft type is under construction.");
      }
    } else {
      // Direct SAP object
      if (isQuotation) {
        router.push(`/dashboard/sales/quotation/${cleanKey}`);
      } else if (isOrder) {
        router.push(`/dashboard/sales/order/${cleanKey}`);
      } else if (isDelivery) {
        router.push(`/dashboard/sales/delivery/${cleanKey}`);
      } else if (isInvoice) {
        router.push(`/dashboard/sales/invoice/${cleanKey}`);
      } else {
        toast.warning(`Routing for SAP Object ${link.objectType} is not implemented.`);
      }
    }
  };

  const handleDeleteMessage = (code: number) => {
    toast.success(`Message #${code} deleted locally`);
    // Local simulation of deleting a message
    if (selectedMessage?.Code === code) {
      setSelectedMessage(null);
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
              <TabsList className="bg-slate-100/80 p-0.5 gap-1 rounded-lg h-9">
                <TabsTrigger value="inbox" className="text-xs font-semibold rounded-md h-8 px-4 data-[state=active]:bg-white data-[state=active]:text-slate-950">
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="outbox" className="text-xs font-semibold rounded-md h-8 px-4 data-[state=active]:bg-white data-[state=active]:text-slate-950">
                  Outbox
                </TabsTrigger>
                <TabsTrigger value="sent" className="text-xs font-semibold rounded-md h-8 px-4 data-[state=active]:bg-white data-[state=active]:text-slate-950">
                  Sent
                </TabsTrigger>
              </TabsList>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total: {messages.length} alerts
              </div>
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
                  <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[45px] text-center font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">!</TableHead>
                        <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Subject</TableHead>
                        <TableHead className="w-[100px] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">From</TableHead>
                        {/* <TableHead className="w-[140px] text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider py-3">Date/Time</TableHead> */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((msg) => {
                        const isSelected = selectedMessage?.Code === msg.Code;
                        return (
                          <TableRow 
                            key={msg.Code}
                            onClick={() => setSelectedMessage(msg)}
                            className={`cursor-pointer transition-colors border-b border-slate-100 hover:bg-slate-50/50 ${isSelected ? "bg-slate-50 font-medium" : ""}`}
                          >
                            <TableCell className="text-center py-3.5">
                              <div className="flex justify-center">
                                {getPriorityIcon(msg.Priority)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <div className="flex flex-col gap-1 pr-4">
                                <span className={`text-sm text-slate-900 leading-snug truncate max-w-sm ${isSelected ? "font-semibold" : "font-normal"}`}>
                                  {msg.Subject}
                                </span>
                                {msg.MessageDataColumns?.length > 0 && (
                                  <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                                    <Paperclip className="h-3 w-3 shrink-0" /> Linked Document
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 text-slate-600 text-xs font-semibold">
                              {msg.RecipientCollection?.[0]?.NameTo || "SAP System"}
                            </TableCell>
                            {/* <TableCell className="py-3.5 text-right text-[11px] text-slate-400 font-bold whitespace-nowrap">
                              09.07.26 11:39
                            </TableCell> */}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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

            <TabsContent value="outbox" className="flex-1 flex flex-col min-h-0 m-0 border-0 outline-none">
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <FolderOpen className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Outbox is empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    No pending messages waiting to be sent to the SAP system.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sent" className="flex-1 flex flex-col min-h-0 m-0 border-0 outline-none">
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <MailOpen className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">No sent messages</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Alerts and replies you send to other SAP Business One users will appear here.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Right Side: Message Detail Panel */}
        <Card className="lg:col-span-5 flex flex-col min-h-0 bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Detail Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedMessage.Subject}
                  </h2>
                  <div className="shrink-0">
                    {getPriorityBadge(selectedMessage.Priority)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs font-medium text-slate-500">
                  <div>
                    <span className="text-slate-400">From:</span>{" "}
                    <span className="text-slate-900 font-bold">
                      {selectedMessage.RecipientCollection?.[0]?.NameTo || "SAP System"}
                    </span>
                  </div>
                  {/* <div className="text-right">
                    <span className="text-slate-400">Date:</span>{" "}
                    <span className="text-slate-900 font-bold">09.07.2026 11:39</span>
                  </div> */}
                  <div>
                    <span className="text-slate-400">Code:</span>{" "}
                    <span className="text-slate-800 font-mono">#{selectedMessage.Code}</span>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
                  <div className="text-sm leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                    {selectedMessage.Text}
                  </div>

                  {/* Documents Link Grid */}
                  {parsedLinks.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" /> Attached Documents
                      </h4>
                      <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-[45px] font-bold text-slate-500 uppercase text-[9px] tracking-wider py-2">#</TableHead>
                              <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-wider py-2">Document Details</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-slate-500 uppercase text-[9px] tracking-wider py-2">Link</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedLinks.map((link) => (
                              <TableRow key={link.index} className="hover:bg-slate-50/50">
                                <TableCell className="text-slate-500 text-xs font-semibold py-2.5">
                                  {link.index}
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800">
                                      {link.value}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">
                                      Obj: {link.objectType} | Key: {link.objectKey.trim()}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center py-2.5">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDocumentLinkClick(link)}
                                    className="h-7 w-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                                    title="Open Document in SAP"
                                  >
                                    <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Action Buttons Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5 rounded-lg border-slate-200 text-slate-700 bg-white">
                    <Reply className="h-4 w-4" /> Reply
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5 rounded-lg border-slate-200 text-slate-700 bg-white">
                    <CornerUpRight className="h-4 w-4" /> Forward
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDeleteMessage(selectedMessage.Code)}
                  className="h-9 px-3 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
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
    </div>
  );
}

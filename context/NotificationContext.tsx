"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useRouter } from "next/navigation";
import { HubConnection, HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel } from "@microsoft/signalr";
import { useAuth } from "./authContext";
import { toast } from "sonner";
import { SAPMessage, getMyAlerts, getMyAlertsCount } from "@/api+/sap/notification";
import apiClient from "@/lib/apiClient";

export interface ApprovalRemarksEntry {
  Stage?: string | null;
  ApproverUserID?: string | null;
  Status?: string | null;
  Remarks?: string | null;
  DecisionDate?: string | null;
}

export interface PendingApproval {
  ApprovalRequestCode: number;
  ObjectType: string;
  ObjectEntry: number;
  DraftEntry: number;
  Status?: string;
  ApprovalStatus?: string;
  Remarks: string;
  RemarksHistory?: ApprovalRemarksEntry[];
  ApprovalCreationDate: string;
  OriginatorID?: number;
  CurrentStage?: number;
}

interface NotificationContextType {
  messages: SAPMessage[];
  unreadCount: number;
  isLoading: boolean;
  pendingApprovals: PendingApproval[];
  pendingApprovalsTotalCount: number;
  pendingApprovalsHasMore: boolean;
  isLoadingApprovals: boolean;
  isLoadingMoreApprovals: boolean;
    refreshNotifications: () => Promise<boolean>;refreshPendingApprovals: (silent?: boolean) => Promise<boolean>;
  loadMorePendingApprovals: () => Promise<boolean>;
  clearUnread: () => void;
  optimisticRemoveApproval: (requestCode: number) => void;
}

const PENDING_APPROVALS_PAGE_SIZE = 20;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<SAPMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [pendingApprovalsTotalCount, setPendingApprovalsTotalCount] = useState(0);
  const [pendingApprovalsHasMore, setPendingApprovalsHasMore] = useState(false);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [isLoadingMoreApprovals, setIsLoadingMoreApprovals] = useState(false);
  const router = useRouter();
  const connectionRef = useRef<HubConnection | null>(null);

  const refreshNotifications = async (): Promise<boolean> => {
    if (!accessToken) return false;
    setIsLoading(true);
    try {
      const [page, count] = await Promise.all([getMyAlerts(0), getMyAlertsCount()]);
      setMessages(page.messages || []);
      setUnreadCount(count);
      return true;
    } catch (error) {
      console.error("Failed to fetch messages", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const extractApprovalsPage = (data: any): { approvals: PendingApproval[]; totalCount: number; hasMore: boolean } => {
    if (data?.items && Array.isArray(data.items)) {
      return {
        approvals: data.items,
        totalCount: typeof data.totalCount === "number" ? data.totalCount : data.items.length,
        hasMore: !!data.hasMore,
      };
    }
    let approvals: PendingApproval[] = [];
    if (data?.value && Array.isArray(data.value)) approvals = data.value;
    else if (Array.isArray(data)) approvals = data;
    else if (data?.ApprovalRequests && Array.isArray(data.ApprovalRequests)) approvals = data.ApprovalRequests;
    return { approvals, totalCount: approvals.length, hasMore: false };
  };

  const refreshPendingApprovals = async (silent = false): Promise<boolean> => {
    if (!accessToken) return false;
    if (!silent) setIsLoadingApprovals(true);
    try {
      const res = await apiClient.get("api/Notifications/GetPendingApprovals", {
        params: { skip: 0, top: PENDING_APPROVALS_PAGE_SIZE },
      });
      const { approvals, totalCount, hasMore } = extractApprovalsPage(res.data);
      setPendingApprovals(approvals);
      setPendingApprovalsTotalCount(totalCount);
      setPendingApprovalsHasMore(hasMore);
      return true;
    } catch (error) {
      console.error("Failed to fetch pending approvals", error);
      return false;
    } finally {
      if (!silent) setIsLoadingApprovals(false);
    }
  };

  const loadMorePendingApprovals = async (): Promise<boolean> => {
    if (!accessToken || isLoadingMoreApprovals) return false;
    setIsLoadingMoreApprovals(true);
    try {
      const res = await apiClient.get("api/Notifications/GetPendingApprovals", {
        params: { skip: pendingApprovals.length, top: PENDING_APPROVALS_PAGE_SIZE },
      });
      const { approvals, totalCount, hasMore } = extractApprovalsPage(res.data);
      setPendingApprovals((prev) => [...prev, ...approvals]);
      setPendingApprovalsTotalCount(totalCount);
      setPendingApprovalsHasMore(hasMore);
      return true;
    } catch (error) {
      console.error("Failed to load more pending approvals", error);
      return false;
    } finally {
      setIsLoadingMoreApprovals(false);
    }
  };

  const optimisticRemoveApproval = (requestCode: number) => {
    setPendingApprovals((prev) => prev.filter((a) => a.ApprovalRequestCode !== requestCode));
    setPendingApprovalsTotalCount((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (accessToken) {
      void Promise.all([refreshNotifications(), refreshPendingApprovals()]);
    } else {
      setMessages([]);
      setPendingApprovals([]);
      setUnreadCount(0);
    }
  }, [accessToken]);

  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (!accessToken) {
      if (connectionRef.current) {
        void connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    // Resolve API URL and build Hub Connection
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }
    const hubUrl = `${baseUrl}/hubs/notifications`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken || "",
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connectionRef.current = connection;

    const startHubConnection = async () => {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
          console.log("SignalR Notification Hub connected successfully.");
        }
      } catch (err: any) {
        const errMsg = err?.message || err?.toString() || "";
        if (
          errMsg.includes("stopped during negotiation") ||
          errMsg.includes("No Connection with that ID")
        ) {
          console.log("SignalR connection attempt aborted or stale session cleaned up.");
          return;
        }
        console.error("SignalR Notification Hub connection failed: ", err);
        setTimeout(() => {
          if (accessToken && connectionRef.current?.state === HubConnectionState.Disconnected) {
            void startHubConnection();
          }
        }, 5000);
      }
    };

    connection.onreconnecting((error) => {
      console.warn("[SignalR] Connection lost, reconnecting...", error?.message);
    });

    connection.onreconnected(async (connectionId) => {
      console.log("[SignalR] Connection re-established. Connection ID:", connectionId);
      await Promise.all([refreshNotifications(), refreshPendingApprovals(true)]);
    });

    connection.onclose((error) => {
      console.warn("[SignalR] Connection closed:", error?.message);
      setTimeout(() => {
        if (accessToken && connectionRef.current?.state === HubConnectionState.Disconnected) {
          void startHubConnection();
        }
      }, 5000);
    });

    connection.on("ReceiveNotification", (msg: SAPMessage) => {
      console.log("Real-time notification received: ", msg);
      setMessages((prev) => [msg, ...prev]);
      setUnreadCount((c) => c + 1);

      // Sync pending approvals in background when new alerts arrive
      void refreshPendingApprovals(true);

      toast.info(`New SAP Alert: ${msg.Subject}`, {
        description: msg.Text || "",
        duration: 8000,
        action: {
          label: "View Inbox",
          onClick: () => routerRef.current.push("/dashboard/messages"),
        },
      });
    });

    void startHubConnection();

    return () => {
      if (connectionRef.current) {
        void connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [accessToken]);

  const clearUnread = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        messages,
        unreadCount,
        isLoading,
        pendingApprovals,
        pendingApprovalsTotalCount,
        pendingApprovalsHasMore,
        isLoadingApprovals,
        isLoadingMoreApprovals,
        refreshNotifications,
        refreshPendingApprovals,
        loadMorePendingApprovals,
        clearUnread,
        optimisticRemoveApproval,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

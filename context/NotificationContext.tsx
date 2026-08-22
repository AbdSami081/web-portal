"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useRouter } from "next/navigation";
import { HubConnection, HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel } from "@microsoft/signalr";
import { useAuth } from "./authContext";
import { toast } from "sonner";
import { SAPMessage, getMyAlerts, getMyAlertsCount } from "@/api+/sap/notification";

interface NotificationContextType {
  messages: SAPMessage[];
  unreadCount: number;
  isLoading: boolean;
  /** Re-fetches the user's alerts. Resolves true on success, false on failure (never throws). */
  refreshNotifications: () => Promise<boolean>;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<SAPMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (accessToken) {
      void refreshNotifications();
    } else {
      setMessages([]);
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
      await refreshNotifications();
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
        refreshNotifications,
        clearUnread,
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

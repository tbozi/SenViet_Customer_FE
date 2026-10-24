import { io, type Socket } from "socket.io-client";
import { store } from "@/store";
import { baseApi } from "@/services/baseApi";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8085";

let socket: Socket | null = null;

export interface CustomerChatPayload {
  msgId?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  hotelId?: number | string | null;
  branchName?: string;
  message: string;
  timestamp?: string;
}

export interface StaffReplyPayload {
  msgId?: string;
  customerId: string;
  staffId?: string;
  staffName?: string;
  hotelId?: number | string | null;
  branchName?: string;
  message: string;
  timestamp?: string;
}

type SocketHandlers = {
  onRoomMatrixUpdated?: (data: unknown) => void;
  onNewBookingNotification?: (data: unknown) => void;
  onCustomerBookingUpdated?: (data: unknown) => void;
  onStaffReply?: (data: StaffReplyPayload) => void;
};

let handlers: SocketHandlers = {};

export function getCustomerSocket(): Socket | null {
  return socket;
}

export function bindCustomerSocketEvents(nextHandlers: SocketHandlers = {}) {
  handlers = { ...handlers, ...nextHandlers };
  if (!socket) return;

  socket.off("room_matrix_updated");
  socket.off("new_booking_notification");
  socket.off("customer_booking_updated");
  socket.off("notification_created");
  socket.off("staff_customer_chat_reply");

  socket.on("room_matrix_updated", (data) => {
    store.dispatch(baseApi.util.invalidateTags(["Room", "Booking"]));
    handlers.onRoomMatrixUpdated?.(data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("senviet_socket_room_matrix", { detail: data }));
    }
  });

  socket.on("new_booking_notification", (data) => {
    store.dispatch(baseApi.util.invalidateTags(["Booking", "Room"]));
    handlers.onNewBookingNotification?.(data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("senviet_socket_new_booking", { detail: data }));
    }
  });

  socket.on("customer_booking_updated", (data) => {
    store.dispatch(baseApi.util.invalidateTags(["Booking", "Room"]));
    handlers.onCustomerBookingUpdated?.(data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("senviet_socket_booking_updated", { detail: data }));
    }
  });

  socket.on("notification_created", (data) => {
    store.dispatch(baseApi.util.invalidateTags(["Booking", "Room"]));
    handlers.onCustomerBookingUpdated?.(data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("senviet_socket_notification", { detail: data }));
    }
  });

  socket.on("staff_customer_chat_reply", (data: StaffReplyPayload) => {
    if (import.meta.env.DEV) console.log("💬 [Customer Socket] Nhận tin nhắn từ nhân viên:", data);
    handlers.onStaffReply?.(data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("senviet_staff_chat_reply", { detail: data }));
    }
  });
}

export function initCustomerSocket(
  token: string | null = null,
  userId?: number | string,
  accountId?: number | string,
  email?: string
) {
  const effectiveToken = token || localStorage.getItem("senviet_token") || localStorage.getItem("accessToken") || "";

  const joinRooms = (sock: Socket) => {
    if (userId) {
      sock.emit("join_user_room", String(userId));
    }
    if (accountId) {
      sock.emit("join_user_room", String(accountId));
    }
    if (email) {
      sock.emit("join_user_room", String(email));
    }
  };

  if (socket?.connected) {
    joinRooms(socket);
    return socket;
  }

  socket?.disconnect();
  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    query: effectiveToken ? { token: effectiveToken } : {},
    reconnection: true,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => {
    if (import.meta.env.DEV) console.log("[Customer Socket] connected:", socket?.id);
    if (socket) joinRooms(socket);
  });
  socket.on("connect_error", (error) => console.error("[Customer Socket] connect error:", error.message));
  socket.on("disconnect", (reason) => { if (import.meta.env.DEV) console.log("[Customer Socket] disconnected:", reason); });

  bindCustomerSocketEvents(handlers);
  return socket;
}

export function sendCustomerChatMessage(payload: CustomerChatPayload) {
  if (!socket || !socket.connected) {
    if (import.meta.env.DEV) console.log("[Customer Socket] Connecting socket before sending chat...");
    initCustomerSocket(null, payload.customerId);
  }
  if (socket) {
    socket.emit("customer_send_staff_chat", payload);
  }
}

export function disconnectCustomerSocket() {
  socket?.disconnect();
  socket = null;
}

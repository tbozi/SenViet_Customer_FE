import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8085";

let socket: Socket | null = null;

type SocketHandlers = {
  onRoomMatrixUpdated?: (data: unknown) => void;
  onNewBookingNotification?: (data: unknown) => void;
  onCustomerBookingUpdated?: (data: unknown) => void;
};

let handlers: SocketHandlers = {};

export function bindCustomerSocketEvents(nextHandlers: SocketHandlers = {}) {
  handlers = nextHandlers;
  if (!socket) return;

  socket.off("room_matrix_updated");
  socket.off("new_booking_notification");
  socket.off("customer_booking_updated");

  if (handlers.onRoomMatrixUpdated) socket.on("room_matrix_updated", handlers.onRoomMatrixUpdated);
  if (handlers.onNewBookingNotification) socket.on("new_booking_notification", handlers.onNewBookingNotification);
  if (handlers.onCustomerBookingUpdated) socket.on("customer_booking_updated", handlers.onCustomerBookingUpdated);
}

export function initCustomerSocket(token: string | null, userId?: number | string) {
  if (!token) return null;
  if (socket?.connected) return socket;

  socket?.disconnect();
  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    query: { token },
    reconnection: true,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("[Customer Socket] connected:", socket?.id);
    if (userId) socket?.emit("join_user_room", String(userId));
  });
  socket.on("connect_error", (error) => console.error("[Customer Socket] connect error:", error.message));
  socket.on("disconnect", (reason) => console.log("[Customer Socket] disconnected:", reason));

  bindCustomerSocketEvents(handlers);
  return socket;
}

export function disconnectCustomerSocket() {
  socket?.disconnect();
  socket = null;
}

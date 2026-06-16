import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, "") ?? "http://localhost:4000";

let socket: Socket | null = null;
let currentToken: string | null = null;
let refCount = 0;

function ensureSocket(token: string): Socket {
  if (socket && currentToken === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentToken = token;
  socket = io(SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  return socket;
}

export function connectRealtime(token: string): Socket {
  const s = ensureSocket(token);
  refCount += 1;
  return s;
}

export function releaseRealtime() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

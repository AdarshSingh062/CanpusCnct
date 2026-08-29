import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [latestNotification, setLatestNotification] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (!user || !token) return undefined;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, { auth: { token }, withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('presence:list', ({ onlineUserIds: ids }) => setOnlineUserIds(new Set(ids)));
    socket.on('presence:online', ({ userId }) => setOnlineUserIds((prev) => new Set(prev).add(userId)));
    socket.on('presence:offline', ({ userId }) =>
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      })
    );

    socket.on('notification:new', (notification) => {
      setLatestNotification(notification);
      toast(notification.message, { icon: '🔔' });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUserIds, latestNotification }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

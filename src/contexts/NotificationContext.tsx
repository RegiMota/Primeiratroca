import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { notificationsAPI } from '../lib/api';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface Notification {
  id: number;
  userId: number;
  type: 'order' | 'stock' | 'system' | 'coupon';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const refreshNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const [notificationsData, unreadData] = await Promise.all([
        notificationsAPI.getAll({ limit: 50 }),
        notificationsAPI.getUnreadCount(),
      ]);
      setNotifications(notificationsData);
      setUnreadCount(unreadData.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationsAPI.delete(id);
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Cleanup socket if user is not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Try to connect via WebSocket (Socket.io)
    // Only if enabled in backend (SOCKET_IO_ENABLED=true)
    const getSocketUrl = async () => {
      if (import.meta.env.VITE_WEBSOCKET_URL) {
        return import.meta.env.VITE_WEBSOCKET_URL;
      }
      // Usar a função helper do api.ts para detectar a URL correta
      const { getServerUrl } = await import('../lib/api');
      return getServerUrl('5000');
    };
    
    getSocketUrl().then(socketUrl => {
      try {
        // Try to connect via Socket.io
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
          console.log('✅ Conectado ao WebSocket para notificações');
          
          // Subscribe to user's notification room
          if (user.id) {
            socket.emit('subscribe', user.id);
          }
        });

        socket.on('disconnect', () => {
          console.log('⚠️ Desconectado do WebSocket');
        });

        socket.on('connect_error', (error) => {
          console.log('⚠️ Erro ao conectar WebSocket, usando polling:', error.message);
          // Fallback to polling if WebSocket fails
        });

        // Listen for notifications
        socket.on('notification', (notification: Notification) => {
        console.log('📬 Nova notificação recebida via WebSocket:', notification);
        
        // Add notification to state
        setNotifications((prev) => {
          // Check if notification already exists
          if (prev.some((n) => n.id === notification.id)) {
            return prev;
          }
          return [notification, ...prev];
        });

        // Update unread count
        if (!notification.isRead) {
          setUnreadCount((prev) => prev + 1);
        }

        // Display toast notification based on type
        // Notificações de pedido (atualização de status) devem aparecer como sucesso/info
        if (notification.type === 'order') {
          // Se for atualização de status para "Entregue", usar success
          if (notification.message.includes('Entregue') || notification.message.includes('entregue')) {
            toast.success(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          } else {
            // Outras atualizações de status aparecem como info
            toast.info(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          }
        } else if (notification.type === 'coupon') {
          toast.success(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        } else if (notification.type === 'stock') {
          toast.warning(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        } else {
          // Notificações do sistema aparecem como info
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        }

        // Refresh notifications to ensure consistency
        refreshNotifications();
      });

        // Initial fetch
        refreshNotifications();
      } catch (error) {
        console.log('⚠️ Erro ao inicializar WebSocket, usando polling:', error);
        
        // Fallback to polling if WebSocket fails
        refreshNotifications();
        
        const interval = setInterval(() => {
          refreshNotifications();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
      }
      
      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }).catch(error => {
      console.log('⚠️ Erro ao obter URL do WebSocket, usando polling:', error);
      refreshNotifications();
      
      const interval = setInterval(() => {
        refreshNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    });
  }, [isAuthenticated, user?.id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}


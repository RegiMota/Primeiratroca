import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, ShoppingCart, Package, AlertCircle, Tag, X } from 'lucide-react';
import { Button } from './ui/button';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { useLocation } from 'wouter';

const typeIcons: Record<string, any> = {
  order: ShoppingCart,
  stock: Package,
  system: AlertCircle,
  coupon: Tag,
};

const typeColors: Record<string, string> = {
  order: 'text-blue-600',
  stock: 'text-orange-600',
  system: 'text-purple-600',
  coupon: 'text-green-600',
};

// Componente compartilhado para o conteúdo das notificações
function NotificationContent({ 
  onNotificationClick, 
  onMarkAllAsRead, 
  onDeleteNotification 
}: {
  onNotificationClick: (notification: any) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: number) => void;
}) {
  const { notifications, unreadCount, loading } = useNotifications();
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'agora';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m atrás`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d atrás`;
    }
  };

  const NotificationItem = ({ notification, isRead }: { notification: any; isRead: boolean }) => {
    const Icon = typeIcons[notification.type] || Bell;
    const color = typeColors[notification.type] || 'text-gray-600';
    
    // Abreviar mensagem se for muito longa
    const truncateMessage = (message: string, maxLength: number = 50) => {
      if (message.length <= maxLength) return message;
      return message.substring(0, maxLength) + '...';
    };

    return (
      <div
        className={`flex flex-col items-start gap-1 p-1.5 sm:p-2 cursor-pointer ${isRead ? 'opacity-70' : ''} hover:bg-gray-50 transition-colors border-b border-gray-100`}
        onClick={() => onNotificationClick(notification)}
      >
        <div className="flex w-full items-start gap-1.5">
          <div className={`mt-0.5 flex-shrink-0 ${color}`}>
            <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <p className="text-[10px] sm:text-xs font-semibold leading-tight line-clamp-1">{notification.title}</p>
              {!isRead && (
                <Badge variant="default" className="flex-shrink-0 bg-red-500 text-white text-[8px] px-1 py-0">
                  Nova
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-gray-600 line-clamp-2 leading-tight">{truncateMessage(notification.message, 45)}</p>
            <p className="mt-0.5 text-[8px] sm:text-[9px] text-gray-400">{formatDate(notification.createdAt)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-gray-400 hover:text-red-500"
            onClick={async (e) => {
              e.stopPropagation();
              await onDeleteNotification(notification.id);
            }}
          >
            <X className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-2 text-center text-gray-500 text-[10px] sm:text-xs">
        Carregando...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Bell className="mx-auto mb-1 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
        <p className="text-[10px] sm:text-xs">Nenhuma notificação</p>
      </div>
    );
  }

  return (
    <>
      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <>
          {unreadNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} isRead={false} />
          ))}
          {readNotifications.length > 0 && <div className="border-t border-gray-200 my-1" />}
        </>
      )}

      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <>
          {readNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} isRead={true} />
          ))}
        </>
      )}
    </>
  );
}

export function NotificationDropdown() {
  const { unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    if (notification.type === 'order' && notification.data?.orderId) {
      if (user?.isAdmin) {
        setLocation('/admin/orders');
      } else {
        setLocation('/orders');
      }
      setIsOpen(false);
    } else if (notification.type === 'stock' && notification.data?.productId) {
      setLocation('/admin');
      setIsOpen(false);
    } else if (notification.type === 'coupon' && notification.data?.couponId) {
      setLocation('/admin');
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (id: number) => {
    await deleteNotification(id);
  };

  const triggerButton = (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-red-500 hover:bg-red-50"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-6 w-6" />
      </Button>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white" style={{ fontSize: '11px', fontWeight: 700 }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[calc(100vw-2rem)] sm:w-80 max-w-[400px] max-h-[70vh] sm:max-h-[500px] overflow-y-auto p-0"
        sideOffset={8}
        side="bottom"
        alignOffset={-50}
      >
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-bold">Notificações</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-auto p-1 text-[10px] sm:text-xs text-sky-500 hover:text-sky-600"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Marcar todas como lidas</span>
                  <span className="sm:hidden">Todas</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="px-2 py-1">
          <NotificationContent
            onNotificationClick={handleNotificationClick}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

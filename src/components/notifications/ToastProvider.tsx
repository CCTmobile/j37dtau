// Toast Notification Component
// Provides immediate visual feedback for notifications

import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { NotificationData } from '../../utils/supabase/notificationService';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
}

const ToastIcons = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const ToastColors = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800'
};

const ToastIconColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600'
};

function Toast({ notification, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const IconComponent = ToastIcons[notification.type];
  
  useEffect(() => {
    // Trigger enter animation
    setIsVisible(true);
    
    // Auto-dismiss after duration
    const duration = notification.duration || 5000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 200);
  };

  return (
    <Card 
      className={`
        ${ToastColors[notification.type]}
        border shadow-lg transition-all duration-200 mb-2
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isExiting ? 'translate-x-full opacity-0' : ''}
      `}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <IconComponent className={`h-5 w-5 mt-0.5 ${ToastIconColors[notification.type]}`} />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <p className="text-sm opacity-90 mt-1">{notification.message}</p>
            
            {notification.action && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-8 px-2 text-xs"
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </Button>
            )}
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  showSuccess: (title: string, message?: string, action?: ToastNotification['action']) => void;
  showError: (title: string, message?: string, action?: ToastNotification['action']) => void;
  showWarning: (title: string, message?: string, action?: ToastNotification['action']) => void;
  showInfo: (title: string, message?: string, action?: ToastNotification['action']) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ 
  children, 
  position = 'top-right', 
  maxToasts = 5 
}: { 
  children: React.ReactNode;
  position?: ToastContainerProps['position'];
  maxToasts?: number;
}) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const showToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = generateId();
    const newToast: ToastNotification = { ...toast, id };
    
    setToasts(prev => {
      const newToasts = [newToast, ...prev];
      // Limit number of toasts
      return newToasts.slice(0, maxToasts);
    });
  };

  const showSuccess = (title: string, message = '', action?: ToastNotification['action']) => {
    showToast({ title, message, type: 'success', action });
  };

  const showError = (title: string, message = '', action?: ToastNotification['action']) => {
    showToast({ title, message, type: 'error', action, duration: 8000 });
  };

  const showWarning = (title: string, message = '', action?: ToastNotification['action']) => {
    showToast({ title, message, type: 'warning', action, duration: 6000 });
  };

  const showInfo = (title: string, message = '', action?: ToastNotification['action']) => {
    showToast({ title, message, type: 'info', action });
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const contextValue: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    dismissAll
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div 
        className={`fixed z-50 ${getPositionClasses()} w-80 max-w-sm pointer-events-none`}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="space-y-2 pointer-events-auto">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              notification={toast}
              onClose={dismissToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Utility function to create notification toasts from NotificationData
export function createNotificationToast(notification: NotificationData): ToastNotification {
  let type: ToastNotification['type'] = 'info';
  
  // Map notification types to toast types
  switch (notification.type) {
    case 'order':
      type = 'success';
      break;
    case 'security':
      type = 'warning';
      break;
    case 'system':
      type = notification.priority >= 3 ? 'error' : 'info';
      break;
    default:
      type = 'info';
  }

  const action = notification.action_url ? {
    label: notification.action_text || 'View',
    onClick: () => window.open(notification.action_url, '_blank')
  } : undefined;

  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type,
    action,
    duration: type === 'error' ? 8000 : 5000
  };
}

export default ToastProvider;
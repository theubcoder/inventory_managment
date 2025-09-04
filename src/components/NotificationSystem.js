'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const NotificationContext = createContext();

// Use a counter instead of Date.now() to avoid hydration issues
let notificationIdCounter = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info', duration = 4000) => {
    const id = ++notificationIdCounter;
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message) => showNotification(message, 'success');
  const showError = (message) => showNotification(message, 'error');
  const showWarning = (message) => showNotification(message, 'warning');
  const showInfo = (message) => showNotification(message, 'info');

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo,
      removeNotification 
    }}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

function NotificationContainer({ notifications, removeNotification }) {
  return (
    <div className="notification-container">
      <style jsx>{`
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-width: 420px;
        }

        .notification {
          min-width: 350px;
          padding: 18px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          animation: slideInRight 0.3s ease-out;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
          background: white;
          border-left: 4px solid;
          transition: all 0.3s ease;
        }

        .notification:hover {
          transform: translateX(-5px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
        }
        
        .notification.removing {
          animation: slideOutRight 0.3s ease-out forwards;
        }

        .notification.success {
          background: linear-gradient(to right, #ffffff, #f0fdf4);
          border-left-color: #10b981;
        }

        .notification.error {
          background: linear-gradient(to right, #ffffff, #fef2f2);
          border-left-color: #ef4444;
        }

        .notification.warning {
          background: linear-gradient(to right, #ffffff, #fffbeb);
          border-left-color: #f59e0b;
        }

        .notification.info {
          background: linear-gradient(to right, #ffffff, #eff6ff);
          border-left-color: #3b82f6;
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .notification-icon {
          font-size: 24px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }
        
        .notification.success .notification-icon {
          background: #dcfce7;
          color: #10b981;
        }
        
        .notification.error .notification-icon {
          background: #fee2e2;
          color: #ef4444;
        }
        
        .notification.warning .notification-icon {
          background: #fef3c7;
          color: #f59e0b;
        }
        
        .notification.info .notification-icon {
          background: #dbeafe;
          color: #3b82f6;
        }

        .notification-message {
          flex: 1;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.4;
          color: #1f2937;
        }

        .notification-close {
          background: transparent;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 20px;
          color: #6b7280;
          flex-shrink: 0;
        }

        .notification-close:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #1f2937;
          transform: rotate(90deg);
        }

        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(0, 0, 0, 0.05);
        }

        .notification-progress-bar {
          height: 100%;
          animation: progress 4s linear forwards;
        }

        .notification.success .notification-progress-bar {
          background: #10b981;
        }

        .notification.error .notification-progress-bar {
          background: #ef4444;
        }

        .notification.warning .notification-progress-bar {
          background: #f59e0b;
        }

        .notification.info .notification-progress-bar {
          background: #3b82f6;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @media (max-width: 640px) {
          .notification-container {
            left: 10px;
            right: 10px;
            top: 10px;
          }

          .notification {
            min-width: auto;
          }
        }
      `}</style>
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function Notification({ id, message, type, onClose }) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className={`notification ${type} ${isRemoving ? 'removing' : ''}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {icons[type]}
        </div>
        <div className="notification-message">
          {message}
        </div>
      </div>
      <button 
        className="notification-close" 
        onClick={handleClose}
        aria-label="Close notification"
      >
        ✕
      </button>
      <div className="notification-progress">
        <div className="notification-progress-bar" />
      </div>
    </div>
  );
}

// Confirm Dialog Component
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'default' }) {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      onConfirm();
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className={`confirm-overlay ${isClosing ? 'closing' : ''}`} onClick={handleOverlayClick}>
      <style jsx>{`
        .confirm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }

        .confirm-overlay.closing {
          animation: fadeOut 0.2s ease forwards;
        }

        .confirm-dialog {
          background: white;
          border-radius: 16px;
          padding: 28px;
          max-width: 440px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: scaleIn 0.3s ease;
          position: relative;
        }

        .confirm-overlay.closing .confirm-dialog {
          animation: scaleOut 0.2s ease forwards;
        }

        .confirm-close-x {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 20px;
          color: #6b7280;
        }

        .confirm-close-x:hover {
          background: #f3f4f6;
          color: #1f2937;
          transform: rotate(90deg);
        }

        .confirm-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 20px;
        }

        .confirm-icon.delete {
          background: #fee2e2;
          color: #ef4444;
        }

        .confirm-icon.warning {
          background: #fef3c7;
          color: #f59e0b;
        }

        .confirm-icon.success {
          background: #dcfce7;
          color: #10b981;
        }

        .confirm-icon.info {
          background: #dbeafe;
          color: #3b82f6;
        }

        .confirm-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
          text-align: center;
        }

        .confirm-message {
          font-size: 15px;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 24px;
          text-align: center;
        }

        .confirm-buttons {
          display: flex;
          gap: 12px;
        }

        .confirm-btn {
          flex: 1;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .confirm-btn-cancel {
          background: #f3f4f6;
          color: #374151;
        }

        .confirm-btn-cancel:hover {
          background: #e5e7eb;
        }

        .confirm-btn-confirm {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .confirm-btn-confirm.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .confirm-btn-confirm:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
      `}</style>
      <div className="confirm-dialog">
        <button 
          className="confirm-close-x" 
          onClick={handleClose}
          aria-label="Close dialog"
        >
          ✕
        </button>
        
        {type !== 'default' && (
          <div className={`confirm-icon ${type}`}>
            {type === 'delete' && '🗑️'}
            {type === 'warning' && '⚠️'}
            {type === 'success' && '✓'}
            {type === 'info' && 'ℹ'}
          </div>
        )}
        
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-buttons">
          <button className="confirm-btn confirm-btn-cancel" onClick={handleClose}>
            {cancelText}
          </button>
          <button 
            className={`confirm-btn confirm-btn-confirm ${type === 'delete' ? 'danger' : ''}`} 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for confirm dialog
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});
  const [resolver, setResolver] = useState(null);

  const confirm = (options) => {
    return new Promise((resolve) => {
      setConfig(options);
      setIsOpen(true);
      setResolver(() => resolve);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    resolver && resolver(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolver && resolver(true);
  };

  const ConfirmComponent = () => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...config}
    />
  );

  return { confirm, ConfirmComponent };
}
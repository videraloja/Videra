'use client';

import React, { useEffect, useState, useRef } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'warning', duration = 4000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#dcfce7', border: '#22c55e', text: '#166534', iconBg: '#22c55e' };
      case 'error':
        return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', iconBg: '#ef4444' };
      case 'warning':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', iconBg: '#f59e0b' };
      case 'info':
        return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', iconBg: '#3b82f6' };
      default:
        return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', iconBg: '#f59e0b' };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 10000,
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div
        style={{
          background: colors.bg,
          borderLeft: `4px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          minWidth: '280px',
          maxWidth: '400px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            background: colors.iconBg,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          {getIcon()}
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: colors.text, lineHeight: 1.4 }}>
          {message}
        </p>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: colors.text,
            opacity: 0.6,
            marginLeft: 'auto',
            padding: '0 0 0 0.5rem',
          }}
        >
          ✕
        </button>
      </div>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'warning' | 'info' }[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'warning') => {
    // Limpa o timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Remove automaticamente após 4 segundos
    timeoutRef.current = setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
      timeoutRef.current = null;
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};